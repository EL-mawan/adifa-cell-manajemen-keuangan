import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth-api';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
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
    const type = searchParams.get('type') || 'daily'; // daily or monthly
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'daily') {
      // Today's range
      const today = new Date();
      start = new Date(today.setHours(0, 0, 0, 0));
      end = new Date(today.setHours(23, 59, 59, 999));
    } else {
      // This month
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Get transactions in date range
    const transactions = await db.transaction.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter out transactions with missing relations to prevent crashes
    const validTransactions = transactions.filter(t => t.product && t.user);

    // Calculate totals based on valid transactions only
    const totalTransactions = validTransactions.length;
    const successfulTransactions = validTransactions.filter(t => t.status === 'SUCCESS');
    const totalModal = successfulTransactions.reduce((sum, t) => sum + (t.basePrice || 0), 0);
    const totalPenjualan = successfulTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalFee = successfulTransactions.reduce((sum, t) => sum + (t.fee || 0), 0);
    const totalProfit = successfulTransactions.reduce((sum, t) => sum + (t.profit || 0), 0);

    // Group by product category
    const byCategory = validTransactions.reduce((acc, tx) => {
      const category = tx.product?.category || 'Umum';
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          total: 0,
          profit: 0,
        };
      }
      acc[category].count += 1;
      acc[category].total += tx.amount || 0;
      acc[category].profit += tx.profit || 0;
      return acc;
    }, {} as Record<string, { count: number; total: number; profit: number }>);

    // Group by user (cashier)
    const byUser = validTransactions.reduce((acc, tx) => {
      const userId = tx.user?.id || 'unknown';
      if (!acc[userId]) {
        acc[userId] = {
          name: tx.user?.name || 'User Terhapus',
          email: tx.user?.email || '-',
          count: 0,
          total: 0,
          profit: 0,
        };
      }
      acc[userId].count += 1;
      acc[userId].total += tx.amount || 0;
      acc[userId].profit += tx.profit || 0;
      return acc;
    }, {} as Record<string, { name: string; email: string; count: number; total: number; profit: number }>);

    // Get balance mutations (top-ups) in date range
    let deposits: any[] = [];
    try {
      deposits = await db.balanceLog.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
          type: 'TOP_UP',
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (dbError) {
      console.error('Error fetching deposits:', dbError);
    }

    const totalDeposit = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);

    return NextResponse.json({
      type,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: {
        totalTransactions,
        successfulTransactions: successfulTransactions.length,
        failedTransactions: validTransactions.filter(t => t.status === 'FAILED').length,
        pendingTransactions: validTransactions.filter(t => t.status === 'PENDING').length,
        totalModal,
        totalPenjualan,
        totalFee,
        totalProfit,
        totalDeposit,
        successRate: totalTransactions > 0 
          ? ((successfulTransactions.length / totalTransactions) * 100).toFixed(2) 
          : '0.00',
      },
      byCategory,
      byUser: Object.values(byUser),
      transactions: validTransactions,
      deposits: deposits.map(d => ({
        ...d,
        user: { name: d.user?.name || 'User Terhapus' }
      })),
    });
  } catch (error: any) {
    console.error('Get reports error detail:', error);
    return NextResponse.json(
      { error: `Gagal mengambil laporan: ${error.message || 'Error internal server'}` },
      { status: 500 }
    );
  }
}
