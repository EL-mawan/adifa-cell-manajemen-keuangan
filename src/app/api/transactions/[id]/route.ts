import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth-api';
import { db } from '@/lib/db';

// Helper to handle balance updates based on status change
async function handleBalanceAdjustment(transaction: any, oldStatus: string, newStatus: string) {
    if (oldStatus === newStatus) return;

    const user = await db.user.findUnique({ where: { id: transaction.userId } });
    if (!user) return;

    // SCENARIO 1: SUCCESS/PENDING -> FAILED (Refund)
    if ((oldStatus === 'SUCCESS' || oldStatus === 'PENDING') && newStatus === 'FAILED') {
        const refundAmount = transaction.basePrice; // Refund modal/base price
        await db.user.update({
            where: { id: user.id },
            data: { balance: { increment: refundAmount } }
        });
        
        // Log Balance
        await db.balanceLog.create({
            data: {
                userId: user.id,
                type: 'REFUND',
                amount: refundAmount,
                balanceBefore: user.balance,
                balanceAfter: user.balance + refundAmount,
                description: `Refund Transaksi Gagal ${transaction.transactionCode}`,
                referenceId: transaction.id
            }
        });
    }

    // SCENARIO 2: FAILED/PENDING -> SUCCESS (Deduct)
    // Only if it wasn't already deducted? 
    // Usually PENDING transactions already deducted balance in create logic?
    // Let's check the CREATE logic. 
    // In POST route, it deducts immediately (line 202). 
    // So PENDING -> SUCCESS actually DOES NOTHING to balance (already deducted).
    // But FAILED -> SUCCESS means we need to DEDUCT again (because FAILED implies verified failure/refunded?)
    
    // Wait, if we change FAILED -> SUCCESS manually, we must assume the money was refunded previously or never deducted?
    // Let's stick to safe assumption: 
    // If we mark as SUCCESS, we assume the transaction is valid and money is taken.
    // If previous state was FAILED, we assume money was safe (refunded). So we deduct now.
    
    if (oldStatus === 'FAILED' && newStatus === 'SUCCESS') {
         const deductAmount = transaction.basePrice;
         if (user.balance < deductAmount) throw new Error("Saldo user tidak cukup untuk set ke SUCCESS");
         
         await db.user.update({
            where: { id: user.id },
            data: { balance: { decrement: deductAmount } }
        });

        // Log Balance
        await db.balanceLog.create({
            data: {
                userId: user.id,
                type: 'TRANSACTION',
                amount: deductAmount,
                balanceBefore: user.balance,
                balanceAfter: user.balance - deductAmount,
                description: `Manual Success ${transaction.transactionCode}`,
                referenceId: transaction.id
            }
        });
    }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);

  if (auth.error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only Admin can edit transactions
  const hasAccess = requireRole(['ADMIN'])(auth.user);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, errorMessage } = body;

    const transaction = await db.transaction.findUnique({
        where: { id },
        include: { user: true, product: true }
    });

    if (!transaction) {
        return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    // Handle Balance Logic if status changes
    if (status && status !== transaction.status) {
        try {
            await handleBalanceAdjustment(transaction, transaction.status, status);
        } catch (e: any) {
            return NextResponse.json({ error: e.message }, { status: 400 });
        }
    }

    const updatedTransaction = await db.transaction.update({
        where: { id },
        data: {
            status: status || undefined,
            errorMessage: errorMessage || undefined
        },
        include: {
            user: { select: { name: true, email: true } },
            product: { select: { name: true, code: true } }
        }
    });

    // Log Activity
    await db.activityLog.create({
      data: {
        userId: auth.user.userId,
        action: 'UPDATE_TRANSACTION',
        module: 'TRANSACTION',
        details: `Update TRX ${transaction.transactionCode}: ${transaction.status} -> ${status}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);

  if (auth.error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasAccess = requireRole(['ADMIN'])(auth.user);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;

    const transaction = await db.transaction.findUnique({
        where: { id },
        include: { user: true }
    });

    if (!transaction) {
        return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    // If deleting a SUCCESS transaction, we must REFUND the user first!
    if (transaction.status === 'SUCCESS') {
        const user = await db.user.findUnique({ where: { id: transaction.userId } });
        if (user) {
             const refundAmount = transaction.basePrice;
             await db.user.update({
                where: { id: user.id },
                data: { balance: { increment: refundAmount } }
            });

             // Log Balance
            await db.balanceLog.create({
                data: {
                    userId: user.id,
                    type: 'REFUND',
                    amount: refundAmount,
                    balanceBefore: user.balance,
                    balanceAfter: user.balance + refundAmount,
                    description: `Refund Hapus Transaksi ${transaction.transactionCode}`,
                    referenceId: transaction.id
                }
            });
        }
    }

    await db.transaction.delete({ where: { id } });

    // Log Activity
    await db.activityLog.create({
      data: {
        userId: auth.user.userId,
        action: 'DELETE_TRANSACTION',
        module: 'TRANSACTION',
        details: `Hapus TRX ${transaction.transactionCode}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ message: 'Transaksi berhasil dihapus' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
