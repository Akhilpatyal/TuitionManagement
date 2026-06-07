import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN', 'STUDENT']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const { role, studentId } = authResult.user;

    let targetStudentId = studentId;

    // Admins can request with query param
    if (role === 'ADMIN') {
      const { searchParams } = new URL(req.url);
      targetStudentId = searchParams.get('studentId');
    }

    if (!targetStudentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
    }

    const report = await prisma.aIReport.findFirst({
      where: { studentId: targetStudentId },
      orderBy: { generatedAt: 'desc' }
    });

    return NextResponse.json(report || null);

  } catch (e: any) {
    console.error('GET AIReport error:', e);
    return NextResponse.json({ error: 'Failed to retrieve AI analysis report' }, { status: 500 });
  }
}
