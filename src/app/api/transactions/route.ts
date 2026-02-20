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

    // Look up category type (INCOME or EXPENSE)
    const category = await db.category.findFirst({
      where: { name: product.category },
    });
    const categoryType = category?.type || 'EXPENSE'; // Default to EXPENSE if category not found
    const isIncome = categoryType === 'INCOME';

    // Check balance only for EXPENSE transactions
    if (!isIncome && user.balance < product.basePrice) {
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

    // Verify user balance again from DB fresh (only for EXPENSE)
    if (!isIncome) {
      const freshUser = await db.user.findUnique({ where: { id: user.id } });
      if (!freshUser || freshUser.balance < product.basePrice) {
        return NextResponse.json({ error: 'Saldo tidak mencukupi' }, { status: 400 });
      }
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

    // Update balance based on category type
    // INCOME (e.g. Setor Tunai) -> saldo bertambah (increment)
    // EXPENSE (e.g. Pulsa, Listrik) -> saldo berkurang (decrement)
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        balance: isIncome
          ? { increment: product.basePrice }
          : { decrement: product.basePrice },
      },
    });

    const newBalance = updatedUser.balance;
    const balanceBefore = isIncome
      ? newBalance - product.basePrice
      : newBalance + product.basePrice;

    // Create balance log
    await db.balanceLog.create({
      data: {
        userId: user.id,
        type: isIncome ? 'DEPOSIT' : 'TRANSACTION',
        amount: product.basePrice,
        balanceBefore,
        balanceAfter: newBalance,
        description: isIncome
          ? `Setor Tunai ${product.name} - ${customerNumber}`
          : `Transaksi ${product.name} - ${customerNumber}`,
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
      // Look up the product to determine the category type
      const product = await db.product.findUnique({
        where: { id: transaction.productId },
      });
      const category = product ? await db.category.findFirst({
        where: { name: product.category },
      }) : null;
      const isIncome = category?.type === 'INCOME';

      // Reverse the balance change:
      // - EXPENSE transactions had decremented balance, so we increment (refund)
      // - INCOME transactions had incremented balance, so we decrement (reverse)
      const updatedUser = await db.user.update({
        where: { id: transaction.userId },
        data: {
          balance: isIncome
            ? { decrement: transaction.basePrice }
            : { increment: transaction.basePrice },
        },
      });

      // Create a reversal log
      await db.balanceLog.create({
        data: {
          userId: transaction.userId,
          type: 'REFUND',
          amount: transaction.basePrice,
          balanceBefore: isIncome
            ? updatedUser.balance + transaction.basePrice
            : updatedUser.balance - transaction.basePrice,
          balanceAfter: updatedUser.balance,
          description: isIncome
            ? `Pembatalan Setor Tunai: ${transaction.transactionCode}`
            : `Refund: Penghapusan transaksi ${transaction.transactionCode}`,
          referenceId: id,
        }
      });
      
      // Delete the old balance log
      await db.balanceLog.deleteMany({
        where: { referenceId: id, type: { in: ['TRANSACTION', 'DEPOSIT'] } }
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
