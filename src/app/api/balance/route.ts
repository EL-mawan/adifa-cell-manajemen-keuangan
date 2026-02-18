import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth-api';
import { db } from '@/lib/db';

// GET /api/balance - Get balance logs
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (auth.error) {
    return auth.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');

    const skip = (page - 1) * limit;

    const isAdmin = requireRole(['ADMIN'])(auth.user);
    const where: any = {};
    
    // Admin sees everything, Kasir only sees their own
    if (!isAdmin) {
      where.userId = auth.user.userId;
    }

    if (type) {
      where.type = type;
    }

    // Today's range for count
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    const todayCount = await db.balanceLog.count({
      where: {
        ...where,
        createdAt: { gte: todayStart, lte: todayEnd }
      }
    });

    const [logs, total] = await Promise.all([
      db.balanceLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      db.balanceLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      todayCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get balance logs error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data mutasi saldo' },
      { status: 500 }
    );
  }
}

// POST /api/balance - Top up balance
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (auth.error) {
    return auth.error;
  }

  try {
    const { amount, description, targetUserId, date } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Jumlah top up harus lebih dari 0' },
        { status: 400 }
      );
    }

    // Determine target user (default to current user unless admin specifies someone else)
    const isAdmin = requireRole(['ADMIN'])(auth.user);
    const userId = (isAdmin && targetUserId) ? targetUserId : auth.user.userId;

    // Get target user
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    const newBalance = user.balance + amount;
    const createdAt = date ? new Date(date) : new Date();

    // Update user balance
    await db.user.update({
      where: { id: user.id },
      data: { balance: newBalance },
    });

    // Create balance log
    const balanceLog = await db.balanceLog.create({
      data: {
        userId: user.id,
        type: 'TOP_UP',
        amount,
        balanceBefore: user.balance,
        balanceAfter: newBalance,
        description: description || `Top up saldo Rp ${amount.toLocaleString('id-ID')}`,
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
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: auth.user.userId,
        action: 'TOP_UP',
        module: 'BALANCE',
        details: `Top up saldo Rp ${amount.toLocaleString('id-ID')} untuk ${user.name}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        createdAt,
      },
    });

    return NextResponse.json({
      balanceLog,
      newBalance: newBalance, // Return newBalance so the requester knows the result
    });
  } catch (error) {
    console.error('Top up balance error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat melakukan top up saldo' },
      { status: 500 }
    );
  }
}

// DELETE /api/balance - Clear or delete balance logs
export async function DELETE(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (auth.error) {
    return auth.error;
  }

  // Check if user has access (Admin only)
  const hasAccess = requireRole(['ADMIN'])(auth.user);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Anda tidak memiliki akses' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get the log first to know the amount and type
      const log = await db.balanceLog.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!log) return NextResponse.json({ error: 'Log tidak ditemukan' }, { status: 404 });

      // Calculate balance reversal
      let balanceAdjustment = 0;
      if (log.type === 'TOP_UP' || log.type === 'REFUND') {
        balanceAdjustment = -log.amount; // Remove the added amount
      } else if (log.type === 'TRANSACTION' || log.type === 'WITHDRAWAL' || log.type === 'ADJUSTMENT') {
        balanceAdjustment = log.amount; // Add back the removed amount (since log.amount is usually positive in the records)
      }

      // Update user balance
      await db.user.update({
        where: { id: log.userId },
        data: { balance: { increment: balanceAdjustment } }
      });

      // Delete single log
      await db.balanceLog.delete({
        where: { id }
      });

      // Log activity
      await db.activityLog.create({
        data: {
          userId: auth.user.userId,
          action: 'DELETE_BALANCE_LOG',
          module: 'BALANCE',
          details: `Menghapus log ${log.type} senilai ${log.amount} untuk ${log.user.name}. Saldo disesuaikan.`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });

      return NextResponse.json({ message: 'Log mutasi berhasil dihapus dan saldo disesuaikan' });
    } else {
      // Clear all logs
      await db.balanceLog.deleteMany({});
      
      // Log activity
      await db.activityLog.create({
        data: {
          userId: auth.user.userId,
          action: 'CLEAR_BALANCE_LOGS',
          module: 'BALANCE',
          details: 'Menghapus seluruh riwayat mutasi saldo',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
      return NextResponse.json({ message: 'Riwayat mutasi berhasil dibersihkan' });
    }
  } catch (error) {
    console.error('Delete balance logs error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus data' },
      { status: 500 }
    );
  }
}

// PUT /api/balance - Update balance log
export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (auth.error) {
    return auth.error;
  }

  const hasAccess = requireRole(['ADMIN'])(auth.user);
  if (!hasAccess) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  try {
    const { id, amount, description, date } = await request.json();

    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });

    // Get the old log first
    const oldLog = await db.balanceLog.findUnique({
      where: { id },
    });

    if (!oldLog) return NextResponse.json({ error: 'Log tidak ditemukan' }, { status: 404 });

    // Calculate balance difference
    let adjustment = 0;
    if (amount !== undefined && amount !== oldLog.amount) {
      const diff = amount - oldLog.amount;
      
      if (oldLog.type === 'TOP_UP' || oldLog.type === 'REFUND') {
        adjustment = diff;
      } else if (oldLog.type === 'TRANSACTION' || oldLog.type === 'WITHDRAWAL' || oldLog.type === 'ADJUSTMENT') {
        adjustment = -diff; // If transaction amount increased, balance should decrease
      }

      // Update user balance
      await db.user.update({
        where: { id: oldLog.userId },
        data: { balance: { increment: adjustment } }
      });
    }

    const log = await db.balanceLog.update({
      where: { id },
      data: {
        amount: amount !== undefined ? amount : undefined,
        description: description !== undefined ? description : undefined,
        createdAt: date ? new Date(date) : undefined,
        // Also update balanceAfter for this log item specifically
        balanceAfter: (amount !== undefined) ? oldLog.balanceAfter + adjustment : undefined,
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: auth.user.userId,
        action: 'UPDATE_BALANCE_LOG',
        module: 'BALANCE',
        details: `Memperbarui log ${oldLog.type}. Perubahan saldo: ${adjustment}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ message: 'Log berhasil diperbarui dan saldo disesuaikan', log });
  } catch (error) {
    console.error('Update balance log error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui log' }, { status: 500 });
  }
}
