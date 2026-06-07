import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { GeminiService } from '@/lib/aiService';
import { QuizType, Prisma } from '@prisma/client';
import { recalculateStudentRanks } from '../students/route';

// Helper to generate a student's diagnostic AI report based on their quiz histories
async function generateStudentAIReport(studentId: string) {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { studentId },
      include: { quiz: true }
    });

    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) return;

    const weakTopicsSet = new Set<string>();
    const strongTopicsSet = new Set<string>();

    attempts.forEach(a => {
      if (a.accuracyPct < 70) {
        weakTopicsSet.add(`${a.quiz.subject} (${a.quiz.title.split(' ')[0]})`);
      } else {
        strongTopicsSet.add(`${a.quiz.subject} (${a.quiz.title.split(' ')[0]})`);
      }
    });

    // Defaults
    if (weakTopicsSet.size === 0) {
      if (student.accuracyPct < 70) weakTopicsSet.add('Stoichiometry Mole Ratios');
      else weakTopicsSet.add('Advanced Rotational Balance');
    }
    if (strongTopicsSet.size === 0) {
      strongTopicsSet.add('Kinematics Equations');
      strongTopicsSet.add('Chemical Formulations');
    }

    const weakTopics = Array.from(weakTopicsSet);
    const strongTopics = Array.from(strongTopicsSet).filter(t => !weakTopics.includes(t));

    const suggestions = [
      `Review lecture videos for ${weakTopics[0] || 'your core subjects'}.`,
      `Practice 5 extra MCQs to strengthen topics with under 70% accuracy.`,
      student.quizStreak > 2 
        ? `Superb! Keep up your ${student.quizStreak}-day streak!` 
        : `Take at least 1 quick test daily to unlock the "Constancy" badge.`
    ];

    const existingReport = await prisma.aIReport.findFirst({
      where: { studentId },
      orderBy: { generatedAt: 'desc' }
    });

    if (existingReport) {
      await prisma.aIReport.update({
        where: { id: existingReport.id },
        data: {
          weakTopics,
          strongTopics,
          suggestions,
          generatedAt: new Date()
        }
      });
    } else {
      await prisma.aIReport.create({
        data: {
          studentId,
          weakTopics,
          strongTopics,
          suggestions
        }
      });
    }
  } catch (e) {
    console.error('Failed to generate AI report in DB:', e);
  }
}

// GET quizzes
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN', 'STUDENT']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const { role, studentId } = authResult.user;
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('id');
    const loadAttempts = searchParams.get('attempts');

    // 1. Fetch specific quiz details
    if (quizId) {
      const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
      if (!quiz) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      }
      return NextResponse.json(quiz);
    }

    // 2. Fetch student attempts log
    if (loadAttempts === 'true') {
      if (role === 'ADMIN') {
        const attempts = await prisma.quizAttempt.findMany({
          include: {
            quiz: {
              select: {
                title: true,
                subject: true
              }
            }
          },
          orderBy: { completedAt: 'desc' }
        });
        return NextResponse.json(attempts);
      } else {
        if (!studentId) return NextResponse.json({ error: 'Student not linked' }, { status: 400 });
        const attempts = await prisma.quizAttempt.findMany({
          where: { studentId },
          include: {
            quiz: {
              select: {
                title: true,
                subject: true
              }
            }
          },
          orderBy: { completedAt: 'desc' }
        });
        return NextResponse.json(attempts);
      }
    }

    // 3. Fetch quizzes list
    let quizzes;
    if (role === 'ADMIN') {
      quizzes = await prisma.quiz.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } else {
      if (!studentId) return NextResponse.json({ error: 'Student not linked' }, { status: 400 });
      const studentObj = await prisma.student.findUnique({ where: { id: studentId } });
      if (!studentObj) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

      // Fetch completed quiz IDs to exclude
      const completedAttempts = await prisma.quizAttempt.findMany({
        where: { studentId },
        select: { quizId: true }
      });
      const completedIds = completedAttempts.map(c => c.quizId);

      quizzes = await prisma.quiz.findMany({
        where: {
          OR: [
            { studentId: studentId },
            {
              AND: [
                { studentId: null },
                { batch: { in: [studentObj.batch, 'All Batches'] } }
              ]
            }
          ],
          id: { notIn: completedIds }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json(quizzes);

  } catch (e: any) {
    console.error('GET Quizzes error:', e);
    return NextResponse.json({ error: 'Failed to retrieve quizzes' }, { status: 500 });
  }
}

// POST quiz actions
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN', 'STUDENT']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const body = await req.json();
    const { action } = body;

    // A. AI Quiz Generation (Admin only)
    if (action === 'generate_ai') {
      if (authResult.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }

      const { title, subject, batch, difficulty, fileName, targetStudentId, numQuestions } = body;

      if (!title || !subject || !batch || !difficulty || !fileName) {
        return NextResponse.json({ error: 'Missing generation parameters' }, { status: 400 });
      }

      // Clamp requested question count to a sane range (default 30).
      const questionCount = Math.min(Math.max(parseInt(numQuestions, 10) || 30, 1), 50);

      let performanceLog = '';
      let activeDifficulty = difficulty;

      try {
        if (difficulty === 'ADAPTIVE' && targetStudentId) {
          const student = await prisma.student.findUnique({
            where: { id: targetStudentId },
            include: { aiReports: true }
          });

          if (student) {
            if (student.accuracyPct >= 85) activeDifficulty = 'HARD';
            else if (student.accuracyPct < 70) activeDifficulty = 'EASY';
            else activeDifficulty = 'MEDIUM';

            const report = student.aiReports[0];
            if (report) {
              performanceLog = `Student has weaknesses in: ${report.weakTopics.join(', ')}. Target questions to help review these concepts.`;
            }
          }
        } else if (difficulty === 'ADAPTIVE') {
          activeDifficulty = 'MEDIUM';
        }
      } catch (dbErr) {
        console.warn('Prisma student fetch failed, using default difficulty settings:', dbErr);
        if (difficulty === 'ADAPTIVE') activeDifficulty = 'MEDIUM';
      }

      // Generate Questions list via Gemini Service
      const genQuestions = await GeminiService.generateQuiz({
        title,
        subject,
        difficulty: activeDifficulty,
        fileName,
        numQuestions: questionCount,
        studentPerformanceLog: performanceLog
      });

      const quizData = {
        title: `${title} [AI ${activeDifficulty}]`,
        description: `Personalized AI generated quiz compiled from reference "${fileName}". Target batch: ${batch}.`,
        type: genQuestions[0]?.type || QuizType.MCQ,
        batch,
        subject,
        durationMin: genQuestions.length * 5,
        questions: genQuestions as any,
        difficulty: activeDifficulty,
        isAiGenerated: true,
        sourceFile: fileName,
        studentId: targetStudentId || null
      };

      const quiz = await prisma.quiz.create({
        data: quizData
      });

      // Dispatch Notifications to target student profiles
      if (targetStudentId) {
        await prisma.notification.create({
          data: {
            studentId: targetStudentId,
            title: `New AI Quiz Assigned`,
            message: `A personalized AI Quiz "${quiz.title}" has been assigned to you.`,
            type: 'QUIZ'
          }
        });
      } else {
        const targetStudents = await prisma.student.findMany({
          where: {
            OR: [
              { batch },
              { batch: 'All Batches' }
            ]
          }
        });

        for (const student of targetStudents) {
          await prisma.notification.create({
            data: {
              studentId: student.id,
              title: `New AI Quiz Assigned`,
              message: `Quiz "${quiz.title}" has been assigned to your batch for subject ${subject}.`,
              type: 'QUIZ'
            }
          });
        }
      }

      return NextResponse.json({ success: true, quiz });
    }

    // A2. Manual Quiz Creation (Admin only)
    if (action === 'create_manual') {
      if (authResult.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }

      const { title, subject, batch, durationMin, difficulty, questions, targetStudentId } = body;

      if (!title || !subject || !batch || !Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json({ error: 'Provide a title, subject, batch, and at least one question' }, { status: 400 });
      }

      // Light validation of each question
      for (const q of questions) {
        if (!q.question || !q.type || q.correctAnswer === undefined || q.correctAnswer === '') {
          return NextResponse.json({ error: 'Every question needs text, a type, and a correct answer' }, { status: 400 });
        }
      }

      const quizData = {
        title,
        description: `Manually created quiz for ${batch}.`,
        type: (questions[0].type || QuizType.MCQ) as QuizType,
        batch,
        subject,
        durationMin: durationMin || questions.length * 2,
        questions: questions as any,
        difficulty: difficulty || 'MEDIUM',
        isAiGenerated: false,
        studentId: targetStudentId || null
      };

      const quiz = await prisma.quiz.create({ data: quizData });

      // Notify the target student or the whole batch
      if (targetStudentId) {
        await prisma.notification.create({
          data: {
            studentId: targetStudentId,
            title: 'New Quiz Assigned',
            message: `A new quiz "${quiz.title}" has been assigned to you.`,
            type: 'QUIZ'
          }
        });
      } else {
        const targetStudents = await prisma.student.findMany({
          where: { OR: [{ batch }, { batch: 'All Batches' }] }
        });
        for (const student of targetStudents) {
          await prisma.notification.create({
            data: {
              studentId: student.id,
              title: 'New Quiz Assigned',
              message: `Quiz "${quiz.title}" has been assigned to your batch for ${subject}.`,
              type: 'QUIZ'
            }
          });
        }
      }

      return NextResponse.json({ success: true, quiz });
    }

    // B. Submit Quiz attempt (Student only)
    if (action === 'submit_attempt') {
      if (authResult.user.role !== 'STUDENT') {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }

      const { quizId, score, totalQuestions, correctAnswers, accuracyPct, xpGained, answers } = body;
      const studentId = authResult.user.studentId;

      if (!studentId || !quizId) {
        return NextResponse.json({ error: 'Missing attempt parameters' }, { status: 400 });
      }

      const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });

      // Save Attempt record
      const attempt = await prisma.quizAttempt.create({
          data: {
            studentId,
            quizId,
            score,
            totalQuestions,
            correctAnswers,
            accuracyPct,
            xpGained,
            answers: answers as any
          }
        });

        // Update Student XP, streaks, and accuracy averages
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          include: { quizAttempts: true }
        });

        if (student) {
          const totalXp = student.xpPoints + xpGained;
          const newStreak = student.quizStreak + 1;

          // Calculate average accuracy
          const allAttempts = student.quizAttempts;
          const totalAccuracy = allAttempts.reduce((sum, curr) => sum + curr.accuracyPct, 0) + accuracyPct;
          const avgAccuracy = Math.round(totalAccuracy / (allAttempts.length + 1));

          // Unlocked Badges Check
          const badges = [...student.badges];
          if (newStreak === 3 && !badges.includes('Constancy')) badges.push('Constancy');
          if (newStreak === 5 && !badges.includes('Perfect Week')) badges.push('Perfect Week');
          if (accuracyPct === 100 && !badges.includes('Sharp Shooter')) badges.push('Sharp Shooter');
          if (quiz && quiz.isAiGenerated && !badges.includes('AI Solver')) badges.push('AI Solver');

          await prisma.student.update({
            where: { id: studentId },
            data: {
              xpPoints: totalXp,
              quizStreak: newStreak,
              accuracyPct: avgAccuracy,
              badges
            }
          });

          await recalculateStudentRanks();
          await generateStudentAIReport(studentId);
        }

        return NextResponse.json({ success: true, attempt });
    }

    return NextResponse.json({ error: 'Invalid quiz operation action' }, { status: 400 });

  } catch (e: any) {
    console.error('POST Quizzes error:', e);
    return NextResponse.json({ error: 'Failed to execute quiz operation' }, { status: 500 });
  }
}

// DELETE quiz
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID param' }, { status: 400 });
    }

    await prisma.quiz.delete({ where: { id } });
    return NextResponse.json({ success: true });

  } catch (e: any) {
    console.error('DELETE Quiz error:', e);
    return NextResponse.json({ error: 'Failed to purge quiz' }, { status: 500 });
  }
}
