import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET alerts
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN', 'STUDENT']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const { role, studentId } = authResult.user;

    let alerts;
    if (role === 'ADMIN') {
      alerts = await prisma.notification.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } else {
      if (!studentId) {
        return NextResponse.json([]);
      }
      alerts = await prisma.notification.findMany({
        where: {
          OR: [
            { studentId },
            { studentId: null }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    return NextResponse.json(alerts);

  } catch (e: any) {
    console.error('GET Notifications error:', e);
    return NextResponse.json([]);
  }
}

// PUT mark notification as read
export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN', 'STUDENT']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Notification id is required' }, { status: 400 });
    }

    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });

    if (authResult.user.role === 'STUDENT' && notif.studentId !== null && notif.studentId !== authResult.user.studentId) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    return NextResponse.json({ success: true });

  } catch (e: any) {
    console.error('PUT Notification error:', e);
    return NextResponse.json({ error: 'Failed to clear alert status' }, { status: 500 });
  }
}

// POST create notification (Admin only)
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const body = await req.json();
    const { studentId, title, message, type } = body;

    if (!title || !message || !type) {
      return NextResponse.json({ error: 'Missing title, message, or type' }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        studentId: studentId || null,
        title,
        message,
        type
      }
    });
    return NextResponse.json({ success: true, notification });

  } catch (e: any) {
    console.error('POST Notification error:', e);
    return NextResponse.json({ error: 'Failed to dispatch alert notification' }, { status: 500 });
  }
}
