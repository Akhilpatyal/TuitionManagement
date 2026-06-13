import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET — list doubts visible to the current user (same batch for students)
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['STUDENT', 'ADMIN']);
    if (!authResult.authenticated) return authResult.response;

    const { role, studentId, instituteId } = authResult.user;

    let where: any = { instituteId };
    if (role === 'STUDENT') {
      if (!studentId) return NextResponse.json([]);
      const student = await prisma.student.findFirst({ where: { id: studentId, instituteId } });
      if (!student) return NextResponse.json([]);
      where = { instituteId, batch: { in: [student.batch, 'All Batches'] } };
    }

    const doubts = await prisma.doubtPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { replies: { orderBy: { createdAt: 'asc' } } }
    });

    return NextResponse.json(
      doubts.map((d) => ({
        id: d.id,
        title: d.title,
        body: d.body,
        subject: d.subject,
        batch: d.batch,
        authorName: d.authorName,
        studentId: d.studentId,
        resolved: d.resolved,
        createdAt: d.createdAt,
        replies: d.replies.map((r) => ({
          id: r.id,
          authorName: r.authorName,
          authorRole: r.authorRole,
          body: r.body,
          createdAt: r.createdAt
        }))
      }))
    );
  } catch (e: any) {
    console.error('GET Doubts error:', e);
    return NextResponse.json({ error: 'Failed to load doubts' }, { status: 500 });
  }
}

// POST — create a doubt, reply to one, or mark resolved
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['STUDENT', 'ADMIN']);
    if (!authResult.authenticated) return authResult.response;

    const { role, studentId, instituteId, name } = authResult.user as any;
    const body = await req.json();
    const { action } = body;

    // --- Create a new doubt (students only) ---
    if (action === 'create') {
      if (role !== 'STUDENT' || !studentId) {
        return NextResponse.json({ error: 'Only students can post doubts' }, { status: 403 });
      }
      const { title, body: text, subject } = body;
      if (!title?.trim() || !text?.trim()) {
        return NextResponse.json({ error: 'Title and details are required' }, { status: 400 });
      }
      const student = await prisma.student.findFirst({ where: { id: studentId, instituteId } });
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

      const doubt = await prisma.doubtPost.create({
        data: {
          instituteId,
          studentId,
          authorName: name || 'Student',
          title: title.trim(),
          body: text.trim(),
          subject: subject || 'General',
          batch: student.batch
        }
      });
      return NextResponse.json({ success: true, doubt });
    }

    // --- Reply to a doubt (same-batch students or admin) ---
    if (action === 'reply') {
      const { doubtId, body: text } = body;
      if (!doubtId || !text?.trim()) {
        return NextResponse.json({ error: 'A reply message is required' }, { status: 400 });
      }
      const doubt = await prisma.doubtPost.findFirst({ where: { id: doubtId, instituteId } });
      if (!doubt) return NextResponse.json({ error: 'Doubt not found' }, { status: 404 });

      if (role === 'STUDENT') {
        const student = await prisma.student.findFirst({ where: { id: studentId, instituteId } });
        if (!student || (doubt.batch !== student.batch && doubt.batch !== 'All Batches')) {
          return NextResponse.json({ error: 'You can only answer doubts from your class' }, { status: 403 });
        }
      }

      const reply = await prisma.doubtReply.create({
        data: {
          doubtId,
          instituteId,
          authorName: name || (role === 'ADMIN' ? 'Teacher' : 'Student'),
          authorRole: role,
          body: text.trim()
        }
      });
      return NextResponse.json({ success: true, reply });
    }

    // --- Mark a doubt as resolved (author or admin) ---
    if (action === 'resolve') {
      const { doubtId } = body;
      const doubt = await prisma.doubtPost.findFirst({ where: { id: doubtId, instituteId } });
      if (!doubt) return NextResponse.json({ error: 'Doubt not found' }, { status: 404 });
      if (role !== 'ADMIN' && doubt.studentId !== studentId) {
        return NextResponse.json({ error: 'Only the author or a teacher can resolve this' }, { status: 403 });
      }
      await prisma.doubtPost.update({ where: { id: doubtId }, data: { resolved: true } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    console.error('POST Doubts error:', e);
    return NextResponse.json({ error: 'Failed to process doubt action' }, { status: 500 });
  }
}
