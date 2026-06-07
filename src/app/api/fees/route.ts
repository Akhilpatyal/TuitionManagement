import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { FeeStatus } from '@prisma/client';

// Helper to update a student's composite feeStatus
async function updateStudentCompositeFeeStatus(studentId: string) {
  try {
    const invoices = await prisma.feeHistory.findMany({
      where: { studentId }
    });

    const hasUnpaid = invoices.some(i => i.status === FeeStatus.UNPAID);
    const hasPending = invoices.some(i => i.status === FeeStatus.PENDING);

    let status: FeeStatus = FeeStatus.PAID;
    if (hasUnpaid) status = FeeStatus.UNPAID;
    else if (hasPending) status = FeeStatus.PENDING;

    await prisma.student.update({
      where: { id: studentId },
      data: { feeStatus: status }
    });
  } catch (e) {
    console.error('Failed to update student fee status in DB:', e);
  }
}

// GET billing records
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN', 'STUDENT']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const { role, studentId } = authResult.user;

    let records;
    if (role === 'ADMIN') {
      records = await prisma.feeHistory.findMany({
        orderBy: { dueDate: 'desc' }
      });
    } else {
      if (!studentId) {
        return NextResponse.json({ error: 'Student record not linked' }, { status: 400 });
      }
      records = await prisma.feeHistory.findMany({
        where: { studentId },
        orderBy: { dueDate: 'desc' }
      });
    }

    return NextResponse.json(records);

  } catch (e: any) {
    console.error('GET Fees error:', e);
    return NextResponse.json({ error: 'Failed to retrieve billing records' }, { status: 500 });
  }
}

// POST billing operations
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['ADMIN', 'STUDENT']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const body = await req.json();
    const { action } = body;

    // 1. Distribute new invoices (Admin only)
    if (action === 'invoice_all') {
      if (authResult.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }

      const { month, dueDate } = body;
      if (!month || !dueDate) {
        return NextResponse.json({ error: 'Month and dueDate are required' }, { status: 400 });
      }

      const activeStudents = await prisma.student.findMany();
      let createdCount = 0;

      for (const student of activeStudents) {
        // Verify invoice duplicates
        const exists = await prisma.feeHistory.findFirst({
          where: {
            studentId: student.id,
            month
          }
        });

        if (!exists) {
          const amount = student.batch === 'Alpha Batch' ? 150.0 : 120.0;
          const invoiceId = `f-${student.id}-${month.replace(/\s+/g, '').toLowerCase()}`;

          await prisma.feeHistory.create({
            data: {
              id: invoiceId,
              studentId: student.id,
              amount,
              month,
              dueDate: new Date(dueDate),
              status: FeeStatus.UNPAID
            }
          });

          await updateStudentCompositeFeeStatus(student.id);

          await prisma.notification.create({
            data: {
              studentId: student.id,
              title: `New Invoice Issued: ${month}`,
              message: `Tuition fee of $${amount} is issued. Due date is ${new Date(dueDate).toLocaleDateString()}.`,
              type: 'FEE'
            }
          });

          createdCount++;
        }
      }

      return NextResponse.json({ success: true, count: createdCount });
    }

    // 2. Clear outstanding invoice (Admin or linked Student)
    if (action === 'pay_fee') {
      const { feeId } = body;
      if (!feeId) {
        return NextResponse.json({ error: 'feeId is required' }, { status: 400 });
      }

      const invoice = await prisma.feeHistory.findUnique({
        where: { id: feeId }
      });

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Permissions check
      if (authResult.user.role === 'STUDENT' && authResult.user.studentId !== invoice.studentId) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }

      // Mark PAID
      await prisma.feeHistory.update({
        where: { id: feeId },
        data: {
          status: FeeStatus.PAID,
          paidDate: new Date(),
          receiptUrl: `/receipts/${feeId}.pdf`
        }
      });

      await updateStudentCompositeFeeStatus(invoice.studentId);

      // Create notification
      await prisma.notification.create({
        data: {
          studentId: invoice.studentId,
          title: 'Payment Confirmed',
          message: `Your payment of $${invoice.amount} has been processed successfully. Receipt is available.`,
          type: 'FEE'
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid invoice operation action' }, { status: 400 });

  } catch (e: any) {
    console.error('POST Fees error:', e);
    return NextResponse.json({ error: 'Billing transaction processing failed' }, { status: 500 });
  }
}
