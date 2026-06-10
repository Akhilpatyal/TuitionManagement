import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role } from '@prisma/client';

// Recalculates student ranks within an institute based on accuracy and XP points
export async function recalculateStudentRanks(instituteId: string) {
  const students = await prisma.student.findMany({
    where: { instituteId },
    orderBy: [
      { accuracyPct: 'desc' },
      { xpPoints: 'desc' }
    ]
  });

  for (let i = 0; i < students.length; i++) {
    await prisma.student.update({
      where: { id: students[i].id },
      data: { rank: i + 1 }
    });
  }
}

// GET all students
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const students = await prisma.student.findMany({
      where: { instituteId: authResult.user.instituteId },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        }
      },
      orderBy: { rank: 'asc' }
    });

    const formatted = students.map(s => ({
      id: s.id, userId: s.userId,
      name: s.user.name, email: s.user.email,
      rollNumber: s.rollNumber, class: s.class, batch: s.batch,
      subjects: s.subjects, parentContact: s.parentContact,
      attendancePct: s.attendancePct, feeStatus: s.feeStatus, monthlyFee: s.monthlyFee, rank: s.rank,
      accuracyPct: s.accuracyPct, xpPoints: s.xpPoints,
      quizStreak: s.quizStreak, badges: s.badges
    }));

    return NextResponse.json(formatted);

  } catch (e: any) {
    console.error('GET Students error:', e);
    return NextResponse.json({ error: 'Failed to retrieve students' }, { status: 500 });
  }
}

// POST create student
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const body = await req.json();
    const { name, email, rollNumber, class: className, batch, subjects, parentContact, monthlyFee } = body;

    if (!name || !email || !rollNumber || !parentContact) {
      return NextResponse.json({ error: 'Missing mandatory fields' }, { status: 400 });
    }

    const instituteId = authResult.user.instituteId;

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) {
      return NextResponse.json({ error: 'User email already exists' }, { status: 409 });
    }

    const hashedPassword = bcrypt.hashSync('password', 10);

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: email.toLowerCase(), password: hashedPassword, name, role: Role.STUDENT, instituteId }
      });
      const count = await tx.student.count({ where: { instituteId } });
      return await tx.student.create({
        data: {
          userId: user.id, rollNumber, class: className, batch, subjects, parentContact,
          monthlyFee: Number(monthlyFee) || 0,
          attendancePct: 100.0, rank: count + 1, accuracyPct: 0.0,
          xpPoints: 100, quizStreak: 0, badges: ['Quick Starter'],
          instituteId
        }
      });
    });

    await recalculateStudentRanks(instituteId);

    await prisma.notification.create({
      data: {
        studentId: student.id,
        title: 'Welcome to AcuMind!',
        message: 'Your student dashboard is active. Start practicing quizzes to gain XP.',
        type: 'SYSTEM',
        instituteId
      }
    });

    return NextResponse.json({ success: true, student });

  } catch (e: any) {
    console.error('POST Student error:', e);
    return NextResponse.json({ error: 'Failed to enroll student' }, { status: 500 });
  }
}
