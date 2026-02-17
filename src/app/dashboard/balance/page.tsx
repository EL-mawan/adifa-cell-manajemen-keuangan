'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuthStore } from '@/lib/store/auth';
import { toast } from '@/hooks/use-toast';
import { Plus, RefreshCw, Wallet, ArrowUp, ArrowDown, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight, History, MoreHorizontal } from 'lucide-react';

import Link from 'next/link';

interface BalanceLog {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function BalancePage() {
  const { token, user, updateUser } = useAuthStore();
  const [balanceLogs, setBalanceLogs] = useState<BalanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [editingLog, setEditingLog] = useState<BalanceLog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpDescription, setTopUpDescription] = useState('');
  const [topUpDate, setTopUpDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [targetUserId, setTargetUserId] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLowBalance, setIsLowBalance] = useState(false);
  const [minBalance, setMinBalance] = useState(500000);

  const fetchBalanceLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'ALL') params.append('type', typeFilter);

      const response = await fetch(`/api/balance?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setBalanceLogs(data.logs || []);
      setTodayCount(data.todayCount || 0);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data mutasi saldo',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.user) {
        updateUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user balance:', error);
    }
  };

  const fetchUsers = async () => {
    if (user?.role !== 'ADMIN') return;
    try {
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUsersList(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  useEffect(() => {
    if (user) {
      setIsLowBalance(user.balance < minBalance);
    }
  }, [user?.balance, minBalance]);

  const fetchBalanceSettings = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.minBalance !== undefined) {
        setMinBalance(data.minBalance);
      }
    } catch (error) {
      console.error('Failed to fetch balance settings:', error);
    }
  };

  useEffect(() => {
    fetchBalanceLogs();
    fetchUsers();
    fetchBalanceSettings();
  }, [token, typeFilter, user?.role]);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const amount = parseFloat(topUpAmount);
      const response = await fetch('/api/balance', {
        method: editingLog ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingLog?.id,
          amount,
          description: topUpDescription || undefined,
          targetUserId: targetUserId || undefined,
          date: topUpDate ? new Date(topUpDate).toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal melakukan top up');
      }

      const data = await response.json();
      toast({
        title: editingLog ? 'Update Berhasil' : 'Top Up Berhasil',
        description: `Saldo sekarang: Rp ${data.newBalance.toLocaleString('id-ID')}`,
      });

      // Reset form
      setTopUpAmount('');
      setTopUpDescription('');
      setTopUpDate(new Date().toLocaleDateString('en-CA'));
      setTargetUserId('');
      setEditingLog(null);
      setIsDialogOpen(false);
      
      // Refresh data
      fetchBalanceLogs();
      fetchUserBalance();
    } catch (error: any) {
      toast({
        title: 'Operasi Gagal',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Hapus log mutasi ini? Saldo tidak akan berubah, hanya riwayat yang dihapus.')) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/balance?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Gagal menghapus log');
      
      toast({ title: 'Berhasil', description: 'Log mutasi telah dihapus' });
      fetchBalanceLogs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { icon: any; color: string; label: string; bg: string }> = {
      TOP_UP: { icon: ArrowUp, color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Top Up' },
      TRANSACTION: { icon: ArrowDown, color: 'text-blue-700', bg: 'bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400', label: 'Transaksi' },
      REFUND: { icon: TrendingUp, color: 'text-indigo-700', bg: 'bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400', label: 'Refund' },
      ADJUSTMENT: { icon: History, color: 'text-orange-700', bg: 'bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400', label: 'Penyesuaian' },
      WITHDRAWAL: { icon: ArrowDown, color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30 dark:text-red-400', label: 'Tarik Dana' },
    };

    const { icon: Icon, color, bg, label } = config[type] || { icon: TrendingUp, color: 'text-gray-600', bg: 'bg-gray-100', label: type };

    return (
      <Badge variant="secondary" className={`rounded-full px-2 py-0.5 font-normal ${bg} ${color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  // Helper Stats Card (Same as Dashboard for consistency)
  const StatCard = ({ title, value, icon: Icon, colorClass, href, onClick }: any) => {
    const InnerContent = (
      <Card className="min-w-0 flex-1 rounded-3xl border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden relative group hover:shadow-md transition-all duration-300 cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-4 pt-4">
          <CardTitle className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight truncate">{title}</CardTitle>
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${colorClass || 'bg-zinc-50 dark:bg-zinc-800'}`}>
              <Icon className="h-3.5 w-3.5" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-base font-black text-zinc-900 dark:text-zinc-50 mb-0.5 truncate group-hover:text-indigo-600 transition-colors">{value}</div>
          <div className="flex items-center gap-1">
              <div className={`px-1.5 py-0.5 rounded-full text-[8px] font-black flex items-center gap-0.5 bg-zinc-50 text-zinc-400 dark:bg-zinc-800`}>
                  <History className="h-2 w-2" />
                  Lihat Detail
              </div>
          </div>
        </CardContent>
      </Card>
    );

    if (href) return <Link href={href} className="block h-full">{InnerContent}</Link>;
    if (onClick) return <div onClick={onClick} className="h-full">{InnerContent}</div>;
    return InnerContent;
  };

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Manajemen Saldo</h1>
          <p className="text-zinc-500 mt-1 text-xs hidden md:block font-medium">
            Kelola saldo dan lihat riwayat mutasi aktif Anda
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingLog(null);
              setTopUpAmount('');
              setTopUpDescription('');
            }
         }}>
            <DialogTrigger asChild>
                <Button className="h-10 px-4 md:h-12 md:px-6 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none font-bold transition-all active:scale-95">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">Top Up</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl">
                <DialogHeader>
                    <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                      <Wallet className="w-8 h-8" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-center">Top Up Saldo</DialogTitle>
                    <DialogDescription className="text-center">Tambah saldo ke akun Anda untuk kelancaran transaksi</DialogDescription>
                </DialogHeader>
                 <form onSubmit={handleTopUp} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Tanggal</Label>
                            <Input
                                id="date"
                                type="date"
                                className="h-12 rounded-2xl bg-zinc-50 border-none font-bold focus-visible:ring-indigo-500"
                                value={topUpDate}
                                onChange={(e) => setTopUpDate(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        {user?.role === 'ADMIN' && (
                            <div className="space-y-2">
                                <Label htmlFor="user" className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Nama / Akun</Label>
                                <Select value={targetUserId} onValueChange={setTargetUserId}>
                                    <SelectTrigger className="h-12 rounded-2xl bg-zinc-50 border-none font-bold focus-visible:ring-indigo-500 shadow-none">
                                        <SelectValue placeholder="Pilih User" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-zinc-100 shadow-xl">
                                        {usersList.map((u) => (
                                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Jumlah Top Up (Rp)</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">Rp</span>
                          <Input
                              id="amount"
                              type="number"
                              className="h-12 pl-12 rounded-2xl bg-zinc-50 border-none font-bold text-lg focus-visible:ring-indigo-500"
                              placeholder="0"
                              value={topUpAmount}
                              onChange={(e) => setTopUpAmount(e.target.value)}
                              min="1000"
                              step="1000"
                              required
                              disabled={isSubmitting}
                          />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Keterangan (Opsional)</Label>
                        <Textarea
                            id="description"
                            className="rounded-2xl bg-zinc-50 border-none resize-none focus-visible:ring-indigo-500"
                            placeholder="Contoh: Saldo harian"
                            value={topUpDescription}
                            onChange={(e) => setTopUpDescription(e.target.value)}
                            disabled={isSubmitting}
                            rows={3}
                        />
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                        <Button
                            type="submit"
                            className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Memproses...' : editingLog ? 'Simpan Perubahan' : 'Konfirmasi Top Up'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full h-12 rounded-2xl font-bold text-zinc-400 hover:text-zinc-600"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
      </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
                title="Saldo Saat Ini" 
                value={formatCurrency(user?.balance || 0)}
                icon={Wallet}
                colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20"
                onClick={() => setIsDialogOpen(true)}
            />
            <StatCard 
                title="Mutasi Hari Ini" 
                value={todayCount + " Transaksi"}
                icon={TrendingUp}
                colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                href="/dashboard/reports"
            />
       </div>
 
       {/* Low Balance Alert */}
        {isLowBalance && (
          <Alert variant="destructive" className="border-none bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-400 rounded-3xl p-4 shadow-sm flex items-center gap-4">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div className="flex flex-col">
              <AlertTitle className="text-sm font-black p-0 m-0 leading-none">Saldo Sangat Rendah!</AlertTitle>
              <AlertDescription className="text-xs font-medium opacity-70 leading-relaxed mt-1">
                Saldo Anda di bawah minimum ({formatCurrency(minBalance)}). Segera top up.
              </AlertDescription>
            </div>
          </Alert>
        )}
 
       {/* Balance History History */}
       <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Riwayat Mutasi</h2>
              <Badge variant="secondary" className="rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 font-bold px-3">{balanceLogs.length}</Badge>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="flex-1 md:w-[200px] h-11 rounded-xl bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 shadow-sm font-medium">
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                  <SelectItem value="ALL">Semua Tipe</SelectItem>
                  <SelectItem value="TOP_UP">Top Up</SelectItem>
                  <SelectItem value="TRANSACTION">Transaksi</SelectItem>
                  <SelectItem value="REFUND">Refund</SelectItem>
                  <SelectItem value="ADJUSTMENT">Penyesuaian</SelectItem>
                  <SelectItem value="WITHDRAWAL">Tarik Dana</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchBalanceLogs} 
                className={`h-11 w-11 rounded-xl bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 shadow-sm ${isLoading ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="h-4 w-4 text-zinc-500" />
              </Button>
              <Button 
                variant="destructive" 
                size="icon" 
                onClick={async () => {
                  if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat mutasi saldo? Tindakan ini tidak dapat dibatalkan.')) {
                    setIsLoading(true);
                    try {
                      const response = await fetch('/api/balance', {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      if (response.ok) {
                        toast({ title: 'Berhasil', description: 'Riwayat mutasi telah dibersihkan' });
                        fetchBalanceLogs();
                        fetchUserBalance();
                      } else {
                        throw new Error('Gagal membersihkan riwayat');
                      }
                    } catch (error: any) {
                      toast({ title: 'Error', description: error.message, variant: 'destructive' });
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }} 
                className="h-11 w-11 rounded-xl shadow-sm"
                disabled={isLoading}
              >
                <History className="h-4 w-4" />
              </Button>
            </div>
          </div>
 
          {/* Desktop Table */}
          <Card className="hidden md:block rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden outline outline-zinc-100 dark:outline-zinc-800">
            <Table>
              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50">
                <TableRow className="border-zinc-100 dark:border-zinc-800">
                  <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest pl-6">Tanggal & Waktu</TableHead>
                  <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest">Aktivitas</TableHead>
                  {user?.role === 'ADMIN' && <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest">Akun</TableHead>}
                  <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest text-right">Debit / Kredit</TableHead>
                  <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest text-right pr-6">Saldo Akhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-zinc-400 font-medium">Memproses data...</TableCell></TableRow>
                ) : balanceLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-zinc-400 font-medium italic">Belum ada riwayat transaksi</TableCell></TableRow>
                ) : (
                   balanceLogs.map((log) => (
                    <TableRow key={log.id} className="border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{formatDate(log.createdAt).split(',')[0]}</span>
                          <span className="text-[10px] text-zinc-400 font-medium">{formatDate(log.createdAt).split(',')[1]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getTypeBadge(log.type)}
                          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 max-w-[150px] truncate">{log.description || '-'}</p>
                        </div>
                      </TableCell>
                      {user?.role === 'ADMIN' && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                               {log.user.name.charAt(0)}
                             </div>
                             <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{log.user.name}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className={`text-right font-black`}>
                        <div className="flex flex-col items-end">
                          <span className={`text-sm ${
                            log.type === 'TOP_UP' || log.type === 'REFUND' 
                              ? 'text-emerald-500' 
                              : 'text-red-500'
                          }`}>
                            {log.type === 'TOP_UP' || log.type === 'REFUND' ? '+' : '-'} {formatCurrency(log.amount).replace('Rp', '')}
                          </span>
                          <span className="text-[9px] text-zinc-300 dark:text-zinc-600 uppercase font-medium">Awal: {formatCurrency(log.balanceBefore).replace('Rp', '')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">{formatCurrency(log.balanceAfter)}</span>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 bg-zinc-100 dark:bg-zinc-800"
                                onClick={() => {
                                  setEditingLog(log);
                                  setTopUpAmount(log.amount.toString());
                                  setTopUpDescription(log.description || '');
                                  setTopUpDate(new Date(log.createdAt).toISOString().split('T')[0]);
                                  setTargetUserId(log.user.id);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <MoreHorizontal className="h-3.5 w-3.5 text-zinc-500" />
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 text-zinc-400"
                            onClick={() => handleDeleteLog(log.id)}
                          >
                            <Plus className="h-3.5 w-3.5 rotate-45" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
 
          {/* Mobile List View - Improved */}
          <div className="md:hidden space-y-3">
             {isLoading ? (
                  <div className="text-center py-12 text-zinc-400 font-medium bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-20" />
                    Memproses data...
                  </div>
             ) : balanceLogs.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 font-medium italic bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                    Tidak ada riwayat mutasi
                  </div>
             ) : (
                  balanceLogs.map((log) => (
                    <div key={log.id} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group active:scale-[0.98] transition-all">
                        <div className="flex justify-between items-start relative z-10">
                             <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {getTypeBadge(log.type)}
                                  <span className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 tracking-widest">#{log.id.slice(-4).toUpperCase()}</span>
                                </div>
                                <div className="space-y-0.5">
                                   <p className="text-sm font-black text-zinc-800 dark:text-zinc-100 tracking-tight leading-none uppercase">{log.description || 'Transaksi Sistem'}</p>
                                   <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{formatDate(log.createdAt)}</span>
                                </div>
                             </div>
                             <div className="text-right space-y-1">
                                <div className={`flex flex-col items-end ${log.type === 'TOP_UP' || log.type === 'REFUND' ? 'text-emerald-500' : 'text-indigo-600'}`}>
                                    <span className="text-base font-black">
                                        {log.type === 'TOP_UP' || log.type === 'REFUND' ? '+' : '-'}
                                        {formatCurrency(log.amount)}
                                    </span>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded-lg inline-block">
                                  <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Saldo: <span className="text-zinc-800 dark:text-zinc-200">{formatCurrency(log.balanceAfter)}</span></p>
                                </div>
                             </div>
                        </div>
                         <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-zinc-50 dark:border-zinc-800">
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 px-4 rounded-xl text-blue-600 font-bold hover:bg-blue-50"
                                onClick={() => {
                                  setEditingLog(log);
                                  setTopUpAmount(log.amount.toString());
                                  setTopUpDescription(log.description || '');
                                  setTopUpDate(new Date(log.createdAt).toISOString().split('T')[0]);
                                  setTargetUserId(log.user.id);
                                  setIsDialogOpen(true);
                                }}
                             >
                                Edit
                             </Button>
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 px-4 rounded-xl text-red-600 font-bold hover:bg-red-50"
                                onClick={() => handleDeleteLog(log.id)}
                             >
                                Hapus
                             </Button>
                         </div>
                         {/* Subtle background detail */}
                         <div className={`absolute top-0 right-0 w-1 h-full ${log.type === 'TOP_UP' || log.type === 'REFUND' ? 'bg-emerald-500' : 'bg-indigo-500'} opacity-20`}></div>
                     </div>
                  ))
             )}
          </div>
       </div>
    </div>
  );
}
