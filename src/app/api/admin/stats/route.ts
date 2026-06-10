import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { FeeStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const instituteId = authResult.user.instituteId;

    // 1. Total Students count
    const totalStudents = await prisma.student.count({ where: { instituteId } });

      // 2. Total Revenue: sum of PAID fees
      const revenueAgg = await prisma.feeHistory.aggregate({
        where: { status: FeeStatus.PAID, instituteId },
        _sum: { amount: true }
      });
      const totalRevenue = revenueAgg._sum.amount || 0;

      // 3. Average Attendance: average student attendancePct
      const attendanceAgg = await prisma.student.aggregate({
        where: { instituteId },
        _avg: { attendancePct: true }
      });
      const avgAttendance = Math.round(attendanceAgg._avg.attendancePct || 0);

      // 4. Pending Fees: sum of UNPAID and PENDING fees
      const pendingAgg = await prisma.feeHistory.aggregate({
        where: {
          status: { in: [FeeStatus.UNPAID, FeeStatus.PENDING] },
          instituteId
        },
        _sum: { amount: true }
      });
      const pendingFees = pendingAgg._sum.amount || 0;

      // 5. Active Quizzes count
      const activeQuizzes = await prisma.quiz.count({ where: { instituteId } });

    return NextResponse.json({
      totalStudents,
      totalRevenue,
      avgAttendance,
      pendingFees,
      activeQuizzes
    });

  } catch (e: any) {
    console.error('GET Admin Stats error:', e);
    return NextResponse.json({ error: 'Failed to compile stats metrics' }, { status: 500 });
  }
}
