import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET resource catalogs
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN', 'STUDENT']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const { role, studentId, instituteId } = authResult.user;

    let materials;
    if (role === 'ADMIN') {
      materials = await prisma.studyMaterial.findMany({
        where: { instituteId },
        orderBy: { uploadedAt: 'desc' }
      });
    } else {
      if (!studentId) {
        return NextResponse.json({ error: 'Student record not linked' }, { status: 400 });
      }

      const student = await prisma.student.findFirst({
        where: { id: studentId, instituteId }
      });

      if (!student) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
      }

      materials = await prisma.studyMaterial.findMany({
        where: {
          instituteId,
          OR: [
            { batch: student.batch },
            { batch: 'All Batches' }
          ]
        },
        orderBy: { uploadedAt: 'desc' }
      });
    }

    return NextResponse.json(materials);

  } catch (e: any) {
    console.error('GET Materials error:', e);
    return NextResponse.json({ error: 'Failed to retrieve materials vault' }, { status: 500 });
  }
}

// POST upload resource reference
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const body = await req.json();
    const { title, description, fileType, fileUrl, content, subject, batch } = body;
    const instituteId = authResult.user.instituteId;

    if (!title || !fileType || !subject || !batch) {
      return NextResponse.json({ error: 'Missing required catalog parameters' }, { status: 400 });
    }

    // A resource must have either an attached file/link OR written content.
    if (!fileUrl && !content) {
      return NextResponse.json({ error: 'Provide a file/link or written content' }, { status: 400 });
    }

    const material = await prisma.studyMaterial.create({
      data: {
        title,
        description,
        fileType,
        fileUrl: fileUrl || null,
        content: content || null,
        subject,
        batch,
        instituteId
      }
    });

    // Notify students
    const students = await prisma.student.findMany({
      where: {
        instituteId,
        OR: [
          { batch },
          { batch: 'All Batches' }
        ]
      }
    });

    for (const student of students) {
      await prisma.notification.create({
        data: {
          studentId: student.id,
          title: `Study Material Uploaded`,
          message: `New ${fileType} titled "${title}" is available for ${subject}.`,
          type: 'SYSTEM',
          instituteId
        }
      });
    }

    return NextResponse.json({ success: true, material });

  } catch (e: any) {
    console.error('POST Materials error:', e);
    return NextResponse.json({ error: 'Failed to catalog material reference' }, { status: 500 });
  }
}

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

    const deleted = await prisma.studyMaterial.deleteMany({
      where: { id, instituteId: authResult.user.instituteId }
    });
    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });

  } catch (e: any) {
    console.error('DELETE Material error:', e);
    return NextResponse.json({ error: 'Failed to delete material record' }, { status: 500 });
  }
}
