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

    // Determine Date Range for Stats (Defaults to Today if no params)
    let statsStart: Date;
    let statsEnd: Date;
    let prevStart: Date;
    let prevEnd: Date;

    if (startDateParam && endDateParam) {
      statsStart = new Date(startDateParam);
      statsEnd = new Date(endDateParam);
      statsEnd.setHours(23, 59, 59, 999);
      
      // Calculate previous period (same duration)
      const duration = statsEnd.getTime() - statsStart.getTime();
      prevEnd = new Date(statsStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - duration);
    } else {
      statsStart = new Date();
      statsStart.setHours(0, 0, 0, 0);
      statsEnd = new Date();
      statsEnd.setHours(23, 59, 59, 999);
      
      prevStart = new Date(statsStart);
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = new Date(statsEnd);
      prevEnd.setDate(prevEnd.getDate() - 1);
    }

    const isKasir = auth.user.role === 'KASIR';
    const userId = auth.user.userId;

    // Balance Stats (Current Balance is always absolute, not ranged)
    let currentTotalBalance = 0;
    
    // Calculate Net Mutation for the Period (optional if we just want current balance)
    // For specific period stats, we usually show Profit and Transaction Count
    
    if (isKasir) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { balance: true }
      });
      currentTotalBalance = user?.balance || 0;
    } else {
      const users = await db.user.findMany({ select: { balance: true } });
      currentTotalBalance = users.reduce((sum, u) => sum + u.balance, 0);
    }

    // Fetch Transactions for Current Period and Previous Period
    const [currentPeriodTxs, prevPeriodTxs] = await Promise.all([
      db.transaction.findMany({ 
        where: { 
          createdAt: { gte: statsStart, lte: statsEnd },
          status: 'SUCCESS', // Only count success transactions
          ...(isKasir ? { userId } : {})
        } 
      }),
      db.transaction.findMany({ 
        where: { 
          createdAt: { gte: prevStart, lte: prevEnd },
          status: 'SUCCESS', // Only count success transactions
          ...(isKasir ? { userId } : {})
        } 
      })
    ]);

    const currentProfit = currentPeriodTxs.reduce((sum, tx) => sum + tx.profit, 0);
    const prevProfit = prevPeriodTxs.reduce((sum, tx) => sum + tx.profit, 0);
    
    const currentCount = currentPeriodTxs.length;
    const prevCount = prevPeriodTxs.length;

    const currentAvg = currentCount > 0 ? currentProfit / currentCount : 0;
    const prevAvg = prevCount > 0 ? prevProfit / prevCount : 0;

    // Helper to calculate percentage growth
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Calculate growth percentages
    const stats = {
      totalBalance: {
        value: currentTotalBalance,
        growth: 0 // Balance growth logic is complex without daily snapshots, simpler to omit or use diff logic if needed
      },
      todayTransactions: { // Keeping key name for frontend compatibility, but it represents period
        value: currentCount,
        growth: calculateGrowth(currentCount, prevCount)
      },
      todayProfit: { // Keeping key name for frontend compatibility, but it represents period
        value: currentProfit,
        growth: calculateGrowth(currentProfit, prevProfit)
      },
      todayAvg: { // Keeping key name for frontend compatibility, but it represents period
        value: currentAvg,
        growth: calculateGrowth(currentAvg, prevAvg)
      }
    };

    // Chart data setup (reusing logic below)

    // Chart data - use custom date range if provided, otherwise last 7 days
    let chartStartDate: Date;
    let chartEndDate: Date;
    
    if (startDateParam && endDateParam) {
      chartStartDate = new Date(startDateParam);
      chartEndDate = new Date(endDateParam);
    } else {
      chartStartDate = new Date();
      chartStartDate.setDate(chartStartDate.getDate() - 6);
      chartEndDate = new Date();
    }
    
    // Normalize dates
    chartStartDate.setHours(0, 0, 0, 0);
    chartEndDate.setHours(23, 59, 59, 999);

    const daysDiff = Math.ceil((chartEndDate.getTime() - chartStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Fetch ALL transactions in range with ONE query
    const allTransactionsInRange = await db.transaction.findMany({
      where: { 
        createdAt: { gte: chartStartDate, lte: chartEndDate },
        ...(isKasir ? { userId } : {})
      },
      select: {
        createdAt: true,
        profit: true
      }
    });

    const chartData: any[] = [];
    
    // Aggregate data in JS
    for (let i = 0; i <= daysDiff; i++) {
        const date = new Date(chartStartDate);
        date.setDate(chartStartDate.getDate() + i);
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayDateString = dayStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        // Filter transactions for this day from the pre-fetched array
        const dayTransactions = allTransactionsInRange.filter(t => {
            const tDate = new Date(t.createdAt);
            return tDate >= dayStart && tDate <= dayEnd;
        });

        chartData.push({
            date: dayDateString,
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
