'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  FileText,
  History,
  Settings,
  ChevronRight,
  Bell,
  Truck,
  Users,
  Calendar
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { toast } from '@/hooks/use-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DashboardStats {
  totalBalance: { value: number; growth: number };
  todayTransactions: { value: number; growth: number };
  todayProfit: { value: number; growth: number };
  todayAvg: { value: number; growth: number };
  chartData: Array<{
    date: string;
    transactions: number;
    profit: number;
  }>;
  topProducts: Array<{
    name: string;
    category: string;
    count: number;
  }>;
  isLowBalance: boolean;
  minBalance: number;
}

export default function DashboardPage() {
  const { token, user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Month filter state
  const currentMonth = new Date().getMonth(); // 0-11
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());

  const months = [
    { value: '0', label: 'Januari' },
    { value: '1', label: 'Februari' },
    { value: '2', label: 'Maret' },
    { value: '3', label: 'April' },
    { value: '4', label: 'Mei' },
    { value: '5', label: 'Juni' },
    { value: '6', label: 'Juli' },
    { value: '7', label: 'Agustus' },
    { value: '8', label: 'September' },
    { value: '9', label: 'Oktober' },
    { value: '10', label: 'November' },
    { value: '11', label: 'Desember' },
  ];

  const fetchStats = async (customMonth?: string) => {
    try {
      const month = customMonth !== undefined ? customMonth : selectedMonth;
      const year = currentYear;
      
      // Calculate start and end date for the selected month
      const startDate = new Date(year, parseInt(month), 1);
      const endDate = new Date(year, parseInt(month) + 1, 0);
      
      const response = await fetch(
        `/api/dashboard/stats?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Gagal mengambil data dashboard');

      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh on focus
    const handleFocus = () => fetchStats();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, selectedMonth]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Quick Links (Mobile Only)
  const quickLinks = [
    { title: "Laporan", icon: FileText, href: "/dashboard/reports", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    { title: "Supplier", icon: Truck, href: "/dashboard/master-data/suppliers", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { title: "Pengaturan", icon: Settings, href: "/dashboard/settings", color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
    { title: "Admin", icon: Users, href: "/dashboard/users", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
  ];

  // Helper Component for Stats Card with styling flexible for horizontal scroll
  const StatCard = ({ title, value, icon: Icon, trend, trendValue, colorClass, href }: any) => {
    const InnerContent = (
      <Card className={`min-w-0 flex-1 rounded-3xl border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden relative group hover:shadow-md transition-all duration-300 h-full ${href ? 'cursor-pointer' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-4 pt-4">
          <CardTitle className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight truncate">{title}</CardTitle>
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${colorClass || 'bg-zinc-50 dark:bg-zinc-800'}`}>
              <Icon className="h-3.5 w-3.5" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-base font-black text-zinc-900 dark:text-zinc-50 mb-0.5 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{value}</div>
          <div className="flex items-center gap-1">
              {href && <span className="text-[8px] text-zinc-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Lihat rincian &rarr;</span>}
          </div>
        </CardContent>
      </Card>
    );

    if (href) {
      return (
        <Link href={href} className="block h-full">
          {InnerContent}
        </Link>
      );
    }

    return InnerContent;
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Welcome Section (Desktop) / Summary (Mobile) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="hidden md:block">
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            Dashboard
          </h1>
          <p className="text-zinc-500 font-medium">Monitoring performa bisnismu hari ini.</p>
        </div>
      </div>

      {/* Low Balance Alert */}
      {stats?.isLowBalance && (
        <Alert variant="destructive" className="border-none bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-400 rounded-3xl p-4 shadow-sm flex items-center gap-4">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="flex flex-col">
            <AlertTitle className="text-sm font-black p-0 m-0 leading-none">Saldo Sangat Rendah!</AlertTitle>
            <AlertDescription className="text-xs font-medium opacity-70 leading-relaxed mt-1">
              Saldo Anda ({formatCurrency(stats.totalBalance.value)}) berada di bawah ambang batas ({formatCurrency(stats.minBalance)}). 
              Segera lakukan pengisian saldo untuk kelancaran transaksi.
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
            title="Total Saldo" 
            value={formatCurrency(stats?.totalBalance.value || 0)}
            icon={Wallet}
            colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20"
            href="/dashboard/balance"
            trend={stats?.totalBalance.growth && stats.totalBalance.growth > 0 ? 'up' : 'down'}
            trendValue={stats?.totalBalance.growth ? `${Math.abs(stats.totalBalance.growth).toFixed(1)}%` : '0%'}
        />
        <StatCard 
            title="Profit Hari Ini" 
            value={formatCurrency(stats?.todayProfit.value || 0)} 
            icon={DollarSign}
            colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
            trend={stats?.todayProfit.growth && stats.todayProfit.growth > 0 ? 'up' : 'down'}
            trendValue={stats?.todayProfit.growth ? `${Math.abs(stats.todayProfit.growth).toFixed(1)}%` : '0%'}
        />
        <StatCard 
            title="Transaksi" 
            value={stats?.todayTransactions.value || 0}
            icon={ShoppingCart}
            colorClass="bg-amber-50 text-amber-600 dark:bg-amber-900/20"
            trend={stats?.todayTransactions.growth && stats.todayTransactions.growth > 0 ? 'up' : 'down'}
            trendValue={stats?.todayTransactions.growth ? `${Math.abs(stats.todayTransactions.growth).toFixed(1)}%` : '0%'}
        />
        <StatCard 
            title="Rata-rata Trx" 
            value={formatCurrency(stats?.todayAvg.value || 0)}
            icon={TrendingUp}
            colorClass="bg-rose-50 text-rose-600 dark:bg-rose-900/20"
            trend={stats?.todayAvg.growth && stats.todayAvg.growth > 0 ? 'up' : 'down'}
            trendValue={stats?.todayAvg.growth ? `${Math.abs(stats.todayAvg.growth).toFixed(1)}%` : '0%'}
        />
      </div>

      {/* Quick Menu Card (Moved above Performance) */}
      <Card className="md:hidden rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-zinc-900 p-4 outline outline-zinc-100 dark:outline-zinc-800">
        <div className="grid grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link 
              href={link.href} 
              key={link.title} 
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform group"
            >
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center ${link.color} shadow-sm border border-black/5 transition-all group-hover:scale-105`}>
                <link.icon className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <span className="text-[10px] md:text-xs font-bold text-zinc-600 dark:text-zinc-400 text-center">{link.title}</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-zinc-900 p-4 overflow-hidden outline outline-zinc-100 dark:outline-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between px-2 pt-2">
                <div>
                  <CardTitle className="text-lg font-black tracking-tight">Performance</CardTitle>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">Statistik transaksi periode pilihan</p>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                     <div className="flex items-center gap-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        <span>Profit</span>
                     </div>
                     <div className="flex items-center gap-1.5 text-xs font-bold bg-zinc-50 text-zinc-400 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-zinc-200"></span>
                        <span>Settle</span>
                     </div>
                </div>
            </CardHeader>
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="cursor-pointer rounded-full h-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm font-bold text-xs ring-offset-white focus:ring-2 focus:ring-indigo-500 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value} className="cursor-pointer font-bold">
                        {month.label} {currentYear}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardContent className="px-0 pb-2">
                <div className="h-[280px] w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.chartData || []}>
                            <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f4f4f5" />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false} 
                              tickLine={false} 
                              className="text-[10px] text-zinc-400 font-bold" 
                              dy={15} 
                            />
                            <Tooltip 
                                cursor={{fill: '#f8fafc', radius: 12}}
                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.1)', padding: '16px' }}
                            />
                            <Bar dataKey="profit" fill="#4f46e5" radius={[8, 8, 8, 8]} barSize={28} />
                            <Bar dataKey="transactions" fill="#e0e7ff" radius={[8, 8, 8, 8]} barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* Top Product - Premium Look */}
        <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-indigo-100/50 dark:shadow-none bg-indigo-600 text-white p-4 relative overflow-hidden">
             {/* Abstract background blobs */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full -ml-16 -mb-16 blur-3xl"></div>
             
             <CardHeader className="flex flex-row items-center justify-between text-white relative z-10">
                <div>
                  <CardTitle className="text-lg font-black tracking-tight">Top Choice</CardTitle>
                  <p className="text-[10px] text-indigo-100/80 font-medium">Berdasarkan volume penjualan</p>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20">
                    <TrendingUp className="h-5 w-5" />
                </div>
             </CardHeader>
             <CardContent className="relative z-10 px-2 pb-4">
                <div className="space-y-4 mt-6">
                    {stats?.topProducts?.slice(0, 4).map((prod, i) => (
                        <Link href="/dashboard/products" key={i} className="block group">
                            <div className="flex items-center justify-between p-4 bg-white/10 rounded-3xl backdrop-blur-md border border-white/5 hover:bg-white/20 transition-all cursor-pointer group-hover:translate-x-1 duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-white text-indigo-600 flex items-center justify-center text-sm font-black shadow-lg">
                                        {i + 1}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-black text-sm truncate w-24 sm:w-32 group-hover:text-white transition-colors uppercase tracking-tighter leading-none mb-1">{prod.name}</p>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                            <p className="text-[9px] text-indigo-200 font-bold uppercase tracking-widest">{prod.category}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[11px] font-black bg-indigo-400/30 text-white px-3 py-1.5 rounded-full border border-white/10">
                                        {prod.count}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {(!stats?.topProducts || stats.topProducts.length === 0) && (
                        <div className="text-center py-12 text-indigo-100 text-sm font-medium italic opacity-60">Belum ada data...</div>
                    )}
                </div>
             </CardContent>
        </Card>
      </div>
    </div>
  );
}
