import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-api';
import { db } from '@/lib/db';

// GET /api/transactions - List transactions
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (auth.error) {
    return auth.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { transactionCode: { contains: search } },
        { customerNumber: { contains: search } },
      ];
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              category: true,
            },
          },
        },
      }),
      db.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data transaksi' },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create transaction
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (auth.error) {
    return auth.error;
  }

  try {
    const { productId, customerNumber, date } = await request.json();

    if (!productId || !customerNumber) {
      return NextResponse.json(
        { error: 'Produk dan nomor pelanggan wajib diisi' },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: auth.user.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get product
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { supplier: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      );
    }

    if (!product.isActive) {
      return NextResponse.json(
        { error: 'Produk tidak aktif' },
        { status: 400 }
      );
    }

    // Check balance
    if (user.balance < product.basePrice) {
      return NextResponse.json(
        { error: 'Saldo tidak mencukupi' },
        { status: 400 }
      );
    }

    // Calculate profit
    const profit = product.sellingPrice - product.basePrice;

    // Generate transaction code
    const transactionCode = `TRX${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const createdAt = date ? new Date(date) : new Date();

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        transactionCode,
        userId: user.id,
        productId: product.id,
        customerNumber,
        amount: product.sellingPrice,
        basePrice: product.basePrice,
        fee: product.fee,
        profit,
        status: 'PENDING',
        createdAt,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
          },
        },
      },
    });

    // In a real application, here you would integrate with the PPOB provider
    // For demo purposes, we'll simulate success
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify user balance again from DB fresh
    const freshUser = await db.user.findUnique({ where: { id: user.id } });
    if (!freshUser || freshUser.balance < product.basePrice) {
      return NextResponse.json({ error: 'Saldo tidak mencukupi' }, { status: 400 });
    }

    // Update transaction status to SUCCESS
    const updatedTransaction = await db.transaction.update({
      where: { id: transaction.id },
      data: { status: 'SUCCESS' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, code: true, category: true } },
      },
    });

    // Deduct balance atomically
    const deductedUser = await db.user.update({
      where: { id: user.id },
      data: { balance: { decrement: product.basePrice } },
    });

    const newBalance = deductedUser.balance;

    // Create balance log
    await db.balanceLog.create({
      data: {
        userId: user.id,
        type: 'TRANSACTION',
        amount: product.basePrice,
        balanceBefore: newBalance + product.basePrice,
        balanceAfter: newBalance,
        description: `Transaksi ${product.name} - ${customerNumber}`,
        referenceId: transaction.id,
        createdAt,
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_TRANSACTION',
        module: 'TRANSACTION',
        details: `Transaksi ${transactionCode} - ${product.name}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        createdAt,
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat transaksi' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions - Delete transaction and refund balance
export async function DELETE(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });

  try {
    const transaction = await db.transaction.findUnique({
      where: { id },
    });

    if (!transaction) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });

    // Refund user balance if transaction was success
    if (transaction.status === 'SUCCESS') {
      const updatedUser = await db.user.update({
        where: { id: transaction.userId },
        data: { balance: { increment: transaction.basePrice } },
      });

      // Create a REFUND log instead of just deleting the TRANSACTION log
      // This provides better traceability
      await db.balanceLog.create({
        data: {
          userId: transaction.userId,
          type: 'REFUND',
          amount: transaction.basePrice,
          balanceBefore: updatedUser.balance - transaction.basePrice,
          balanceAfter: updatedUser.balance,
          description: `Refund: Penghapusan transaksi ${transaction.transactionCode}`,
          referenceId: id,
        }
      });
      
      // Optionally delete the old TRANSACTION log to avoid double count in some reports
      // but keeping it with a reference is usually better for audit.
      // For now, we follow the user's request to "relate" it, often meaning "reverse" it.
      await db.balanceLog.deleteMany({
        where: { referenceId: id, type: 'TRANSACTION' }
      });
    }

    // Delete transaction
    await db.transaction.delete({
      where: { id },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: auth.user.userId,
        action: 'DELETE_TRANSACTION',
        module: 'TRANSACTION',
        details: `Menghapus transaksi ${transaction.transactionCode}. Dana Rp ${transaction.basePrice} dikembalikan ke user.`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ message: 'Transaksi berhasil dihapus dan saldo dikembalikan' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json({ error: 'Gagal menghapus transaksi' }, { status: 500 });
  }
}
