import { PrismaClient, Role, FeeStatus, QuizType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { join } from 'path';

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envFile = readFileSync(join(process.cwd(), '.env'), 'utf8');
  const match = envFile.match(/^DATABASE_URL=(?:"([^"]+)"|([^\r\n]+))/m);
  return match?.[1] || match?.[2] || '';
}

const databaseUrl = readDatabaseUrl().replace('@localhost:', '@127.0.0.1:');
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing existing database records...');
  await prisma.aIReport.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.studyMaterial.deleteMany({});
  await prisma.quizAttempt.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.feeHistory.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding user nodes...');
  const hashedPassword = bcrypt.hashSync('password', 10);

  // Admin Account
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@tuition.com',
      password: hashedPassword,
      role: Role.ADMIN,
      name: 'Dr. Sarah Jenkins',
    },
  });

  // Students Accounts
  const studentSeeds = [
    {
      email: 'alex@tuition.com',
      name: 'Alex Rivera',
      rollNumber: 'T26-101',
      class: 'Grade 12',
      batch: 'Alpha Batch',
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      parentContact: '+1 (555) 019-2834',
      attendancePct: 98,
      feeStatus: FeeStatus.PAID,
      rank: 1,
      accuracyPct: 94,
      xpPoints: 1240,
      quizStreak: 5,
      badges: ['Speed Demon', 'Perfect Week', 'AI Solver'],
    },
    {
      email: 'sofia@tuition.com',
      name: 'Sofia Chen',
      rollNumber: 'T26-102',
      class: 'Grade 12',
      batch: 'Alpha Batch',
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      parentContact: '+1 (555) 014-9921',
      attendancePct: 95,
      feeStatus: FeeStatus.PAID,
      rank: 2,
      accuracyPct: 88,
      xpPoints: 1050,
      quizStreak: 3,
      badges: ['Sharp Shooter', 'Constancy'],
    },
    {
      email: 'marcus@tuition.com',
      name: 'Marcus Vance',
      rollNumber: 'T26-103',
      class: 'Grade 12',
      batch: 'Beta Batch',
      subjects: ['Physics', 'Mathematics'],
      parentContact: '+1 (555) 012-4411',
      attendancePct: 72,
      feeStatus: FeeStatus.PENDING,
      rank: 3,
      accuracyPct: 82,
      xpPoints: 890,
      quizStreak: 1,
      badges: ['First Blood'],
    },
    {
      email: 'emily@tuition.com',
      name: 'Emily Watson',
      rollNumber: 'T26-104',
      class: 'Grade 11',
      batch: 'Gamma Batch',
      subjects: ['Chemistry', 'Mathematics'],
      parentContact: '+1 (555) 015-8833',
      attendancePct: 85,
      feeStatus: FeeStatus.UNPAID,
      rank: 4,
      accuracyPct: 64,
      xpPoints: 540,
      quizStreak: 0,
      badges: ['Quick Starter'],
    },
    {
      email: 'ryan@tuition.com',
      name: 'Ryan Kaelen',
      rollNumber: 'T26-105',
      class: 'Grade 12',
      batch: 'Beta Batch',
      subjects: ['Physics', 'Chemistry'],
      parentContact: '+1 (555) 019-9944',
      attendancePct: 61,
      feeStatus: FeeStatus.UNPAID,
      rank: 5,
      accuracyPct: 58,
      xpPoints: 410,
      quizStreak: 0,
      badges: [],
    },
  ];

  const studentsMap: Record<string, string> = {};

  for (const s of studentSeeds) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        password: hashedPassword,
        role: Role.STUDENT,
        name: s.name,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        rollNumber: s.rollNumber,
        class: s.class,
        batch: s.batch,
        subjects: s.subjects,
        parentContact: s.parentContact,
        attendancePct: s.attendancePct,
        feeStatus: s.feeStatus,
        rank: s.rank,
        accuracyPct: s.accuracyPct,
        xpPoints: s.xpPoints,
        quizStreak: s.quizStreak,
        badges: s.badges,
      },
    });

    studentsMap[s.email] = student.id;
  }

  console.log('Seeding attendance registry...');
  // Past 5 days attendance
  const pastDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i - 1);
    return new Date(d.toISOString().split('T')[0]);
  });

  for (const email of Object.keys(studentsMap)) {
    const studentId = studentsMap[email];
    for (const date of pastDates) {
      let status = true;
      if (email === 'ryan@tuition.com' && Math.random() < 0.4) status = false;
      if (email === 'marcus@tuition.com' && Math.random() < 0.3) status = false;

      await prisma.attendance.create({
        data: {
          studentId,
          date,
          status,
        },
      });
    }
  }

  console.log('Seeding invoice ledger...');
  await prisma.feeHistory.createMany({
    data: [
      { studentId: studentsMap['alex@tuition.com'], amount: 150, month: 'May 2026', dueDate: new Date('2026-05-10'), paidDate: new Date('2026-05-08'), status: FeeStatus.PAID, receiptUrl: '/receipts/f1.pdf' },
      { studentId: studentsMap['sofia@tuition.com'], amount: 150, month: 'May 2026', dueDate: new Date('2026-05-10'), paidDate: new Date('2026-05-09'), status: FeeStatus.PAID, receiptUrl: '/receipts/f2.pdf' },
      { studentId: studentsMap['marcus@tuition.com'], amount: 120, month: 'May 2026', dueDate: new Date('2026-05-10'), status: FeeStatus.PENDING },
      { studentId: studentsMap['emily@tuition.com'], amount: 120, month: 'May 2026', dueDate: new Date('2026-05-10'), status: FeeStatus.UNPAID },
      { studentId: studentsMap['ryan@tuition.com'], amount: 120, month: 'May 2026', dueDate: new Date('2026-05-10'), status: FeeStatus.UNPAID },
      { studentId: studentsMap['alex@tuition.com'], amount: 150, month: 'April 2026', dueDate: new Date('2026-04-10'), paidDate: new Date('2026-04-09'), status: FeeStatus.PAID, receiptUrl: '/receipts/f6.pdf' },
      { studentId: studentsMap['sofia@tuition.com'], amount: 150, month: 'April 2026', dueDate: new Date('2026-04-10'), paidDate: new Date('2026-04-10'), status: FeeStatus.PAID, receiptUrl: '/receipts/f7.pdf' },
    ],
  });

  console.log('Seeding quizzes...');
  const quiz1 = await prisma.quiz.create({
    data: {
      title: 'Kinematics Mastery Quiz',
      description: 'Covers projectile motion, relative velocity, and equations of acceleration.',
      type: QuizType.MCQ,
      batch: 'Alpha Batch',
      subject: 'Physics',
      durationMin: 15,
      difficulty: 'MEDIUM',
      isAiGenerated: false,
      questions: [
        {
          id: 'q1_1',
          type: 'MCQ',
          question: 'A projectile is launched at an angle of 45 degrees to the horizontal. If the initial velocity is doubled, how does the range change?',
          options: ['It remains the same', 'It doubles', 'It triples', 'It quadruples'],
          correctAnswer: '3',
          explanation: 'The range is proportional to the square of initial velocity (u^2), so doubling velocity quadruples range.',
        },
        {
          id: 'q1_2',
          type: 'MCQ',
          question: 'What is the acceleration of a body thrown vertically upwards at its highest point?',
          options: ['Zero', 'g (downwards)', 'g (upwards)', 'Depends on the mass'],
          correctAnswer: '1',
          explanation: 'Even at zero velocity, the acceleration due to gravity (g) remains constant and downwards.',
        },
      ],
    },
  });

  console.log('Seeding quiz attempts...');
  await prisma.quizAttempt.create({
    data: {
      studentId: studentsMap['alex@tuition.com'],
      quizId: quiz1.id,
      score: 100,
      totalQuestions: 2,
      correctAnswers: 2,
      accuracyPct: 100,
      xpGained: 120,
      answers: { q1_1: '3', q1_2: '1' },
    },
  });

  console.log('Seeding resources materials...');
  await prisma.studyMaterial.createMany({
    data: [
      { title: 'Electrostatics Formula Sheet', description: 'Formulas for Electric fields, potential, and capacitance.', fileType: 'PDF', fileUrl: '/materials/electrostatics_formulas.pdf', subject: 'Physics', batch: 'Alpha Batch' },
      { title: 'Calculus Integration Cheat Sheet', description: 'Quick guides on standard integration formats.', fileType: 'Notes', fileUrl: '/materials/calculus_integration.pdf', subject: 'Mathematics', batch: 'Alpha Batch' },
    ],
  });

  console.log('Seeding AI diagnostic reports...');
  await prisma.aIReport.createMany({
    data: [
      {
        studentId: studentsMap['alex@tuition.com'],
        weakTopics: ['Rotational Dynamics', 'Advanced Calculus Integration'],
        strongTopics: ['Kinematics', 'Electrostatics'],
        suggestions: [
          'Focus on moment of inertia calculations. Solve 5 rotational equilibrium MCQs.',
          'Maintain consistency: excellent work holding a 5-day quiz streak!',
        ],
      },
    ],
  });

  console.log('Database seeding successfully concluded!');
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
