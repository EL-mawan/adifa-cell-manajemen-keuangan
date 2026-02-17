import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth-api';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (auth.error) {
    return auth.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Check if user has access
    const hasAccess = requireRole(['ADMIN', 'KASIR'])(auth.user);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses' },
        { status: 403 }
      );
    }

    // Today and Yesterday date ranges
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const isKasir = auth.user.role === 'KASIR';
    const userId = auth.user.userId;

    // Balance Stats
    let currentTotalBalance = 0;
    let todayNetMutation = 0;

    if (isKasir) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { balance: true }
      });
      currentTotalBalance = user?.balance || 0;

      const balanceLogsToday = await db.balanceLog.findMany({
        where: { 
          createdAt: { gte: todayStart },
          userId: userId
        }
      });
      balanceLogsToday.forEach(log => {
        if (log.type === 'TOP_UP' || log.type === 'REFUND') todayNetMutation += log.amount;
        else todayNetMutation -= log.amount;
      });
    } else {
      // Admin sees aggregate
      const users = await db.user.findMany({ select: { balance: true } });
      currentTotalBalance = users.reduce((sum, u) => sum + u.balance, 0);

      const balanceLogsToday = await db.balanceLog.findMany({
        where: { createdAt: { gte: todayStart } }
      });
      balanceLogsToday.forEach(log => {
        if (log.type === 'TOP_UP' || log.type === 'REFUND') todayNetMutation += log.amount;
        else todayNetMutation -= log.amount;
      });
    }

    const yesterdayTotalBalance = currentTotalBalance - todayNetMutation;

    // Today's and Yesterday's transactions
    const [todayTxs, yesterdayTxs] = await Promise.all([
      db.transaction.findMany({ 
        where: { 
          createdAt: { gte: todayStart, lte: todayEnd },
          ...(isKasir ? { userId } : {})
        } 
      }),
      db.transaction.findMany({ 
        where: { 
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
          ...(isKasir ? { userId } : {})
        } 
      })
    ]);

    const todayProfit = todayTxs.reduce((sum, tx) => sum + tx.profit, 0);
    const yesterdayProfit = yesterdayTxs.reduce((sum, tx) => sum + tx.profit, 0);
    
    const todayCount = todayTxs.length;
    const yesterdayCount = yesterdayTxs.length;

    const todayAvg = todayCount > 0 ? todayProfit / todayCount : 0;
    const yesterdayAvg = yesterdayCount > 0 ? yesterdayProfit / yesterdayCount : 0;

    // Helper to calculate percentage growth
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Calculate growth percentages
    const stats = {
      totalBalance: {
        value: currentTotalBalance,
        growth: calculateGrowth(currentTotalBalance, yesterdayTotalBalance)
      },
      todayTransactions: {
        value: todayCount,
        growth: calculateGrowth(todayCount, yesterdayCount)
      },
      todayProfit: {
        value: todayProfit,
        growth: calculateGrowth(todayProfit, yesterdayProfit)
      },
      todayAvg: {
        value: todayAvg,
        growth: calculateGrowth(todayAvg, yesterdayAvg)
      }
    };

    // Chart data - use custom date range if provided, otherwise last 7 days
    const chartData: any[] = [];
    let chartStartDate: Date;
    let chartEndDate: Date;
    
    if (startDateParam && endDateParam) {
      chartStartDate = new Date(startDateParam);
      chartEndDate = new Date(endDateParam);
      chartEndDate.setHours(23, 59, 59, 999);
    } else {
      chartStartDate = new Date();
      chartStartDate.setDate(chartStartDate.getDate() - 6);
      chartStartDate.setHours(0, 0, 0, 0);
      chartEndDate = new Date();
      chartEndDate.setHours(23, 59, 59, 999);
    }

    const daysDiff = Math.ceil((chartEndDate.getTime() - chartStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(chartStartDate);
      date.setDate(chartStartDate.getDate() + i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayTransactions = await db.transaction.findMany({
        where: { 
          createdAt: { gte: dayStart, lte: dayEnd },
          ...(isKasir ? { userId } : {})
        },
      });

      chartData.push({
        date: dayStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        transactions: dayTransactions.length,
        profit: dayTransactions.reduce((sum, tx) => sum + tx.profit, 0),
      });
    }

    // Top products
    const topProducts = await db.transaction.groupBy({
      by: ['productId'],
      where: { 
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, 
        status: 'SUCCESS',
        ...(isKasir ? { userId } : {})
      },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 5,
    });

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          select: { name: true, category: true },
        });
        return {
          name: product?.name || 'Unknown',
          category: product?.category || 'Unknown',
          count: item._count.productId,
        };
      })
    );

    const minBalanceSetting = await db.systemSetting.findUnique({ where: { key: 'MIN_BALANCE_ALERT' } });
    const minBalance = minBalanceSetting ? parseFloat(minBalanceSetting.value) : 1000000;

    return NextResponse.json({
      ...stats,
      chartData,
      topProducts: topProductsWithDetails,
      isLowBalance: currentTotalBalance < minBalance,
      minBalance,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data dashboard' },
      { status: 500 }
    );
  }
}
