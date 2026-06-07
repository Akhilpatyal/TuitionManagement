import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// Helper to recalculate a student's cumulative attendance % and trigger warnings
async function recalculateStudentAttendance(studentId: string) {
  try {
    const records = await prisma.attendance.findMany({
      where: { studentId }
    });

    if (records.length === 0) return;

    const presents = records.filter(r => r.status).length;
    const pct = Math.round((presents / records.length) * 100);

    await prisma.student.update({
      where: { id: studentId },
      data: { attendancePct: pct }
    });

    // Alert triggers for low attendance (< 75%)
    if (pct < 75) {
      const existingAlert = await prisma.notification.findFirst({
        where: {
          studentId,
          type: 'ATTENDANCE',
          message: { contains: `${pct}%` }
        }
      });

      if (!existingAlert) {
        await prisma.notification.create({
          data: {
            studentId,
            title: 'Attendance Critical Alert',
            message: `Your overall attendance has fallen to ${pct}%. Please maintain attendance above 75% to stay eligible for quizzes.`,
            type: 'ATTENDANCE'
          }
        });
      }
    }
  } catch (e) {
    console.error('Failed to recalculate attendance in DB:', e);
  }
}

// GET attendance records
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN', 'STUDENT']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const { role, studentId } = authResult.user;

    let records;
    if (role === 'ADMIN') {
      records = await prisma.attendance.findMany({
        orderBy: { date: 'desc' }
      });
    } else {
      if (!studentId) {
        return NextResponse.json({ error: 'Student record not linked' }, { status: 400 });
      }
      records = await prisma.attendance.findMany({
        where: { studentId },
        orderBy: { date: 'desc' }
      });
    }

    return NextResponse.json(records);

  } catch (e: any) {
    console.error('GET Attendance error:', e);
    return NextResponse.json({ error: 'Failed to retrieve attendance logs' }, { status: 500 });
  }
}

// POST mark attendance
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const body = await req.json();
    const { studentId, date, status } = body; // status: boolean

    if (!studentId || !date) {
      return NextResponse.json({ error: 'Missing studentId or date' }, { status: 400 });
    }

    const targetDate = new Date(date);

    // Upsert record
    await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId,
          date: targetDate
        }
      },
      update: { status },
      create: {
        studentId,
        date: targetDate,
        status
      }
    });

    await recalculateStudentAttendance(studentId);

    return NextResponse.json({ success: true });

  } catch (e: any) {
    console.error('POST Attendance error:', e);
    return NextResponse.json({ error: 'Failed to record attendance mark' }, { status: 500 });
  }
}
