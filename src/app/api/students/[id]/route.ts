import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { recalculateStudentRanks } from '../route';

// PUT update student
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(req, ['ADMIN']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const { id } = await params;
    const body = await req.json();
    const { name, email, class: className, batch, parentContact, subjects, monthlyFee } = body;

    const student = await prisma.student.findFirst({
      where: { id, instituteId: authResult.user.instituteId },
      include: { user: true }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Update User & Student in transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: student.userId },
        data: {
          name,
          email: email.toLowerCase()
        }
      });

      await tx.student.update({
        where: { id },
        data: {
          class: className,
          batch,
          parentContact,
          subjects,
          ...(monthlyFee !== undefined ? { monthlyFee: Number(monthlyFee) || 0 } : {})
        }
      });
    });

    return NextResponse.json({ success: true });

  } catch (e: any) {
    console.error('PUT Student error:', e);
    return NextResponse.json({ error: 'Failed to update student details' }, { status: 500 });
  }
}

// DELETE student
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(req, ['ADMIN']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const { id } = await params;
    const instituteId = authResult.user.instituteId;

    const student = await prisma.student.findFirst({
      where: { id, instituteId }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Deleting the user will cascade delete the student record
    await prisma.user.delete({
      where: { id: student.userId }
    });

    await recalculateStudentRanks(instituteId);

    return NextResponse.json({ success: true });

  } catch (e: any) {
    console.error('DELETE Student error:', e);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
