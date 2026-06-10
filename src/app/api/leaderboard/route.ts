import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN', 'STUDENT']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get('sortBy') || 'XP'; // XP or ACCURACY

    const students = await prisma.student.findMany({
      where: { instituteId: authResult.user.instituteId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    let formatted = students.map(s => ({
      id: s.id,
      name: s.user.name,
      email: s.user.email,
      rollNumber: s.rollNumber,
      class: s.class,
      batch: s.batch,
      attendancePct: s.attendancePct,
      feeStatus: s.feeStatus,
      rank: s.rank,
      accuracyPct: s.accuracyPct,
      xpPoints: s.xpPoints,
      quizStreak: s.quizStreak,
      badges: s.badges
    }));

    // Sort dynamically
    if (sortBy === 'XP') {
      formatted.sort((a, b) => b.xpPoints - a.xpPoints);
    } else {
      formatted.sort((a, b) => b.accuracyPct - a.accuracyPct);
    }

    // Re-assign ranks based on sorting order
    formatted = formatted.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));

    return NextResponse.json(formatted);

  } catch (e: any) {
    console.error('GET Leaderboard error:', e);
    return NextResponse.json({ error: 'Failed to compute scoreboard' }, { status: 500 });
  }
}
