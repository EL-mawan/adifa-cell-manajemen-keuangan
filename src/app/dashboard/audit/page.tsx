'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store/auth';
import { toast } from '@/hooks/use-toast';
import { Search, RefreshCw, Filter, Shield, User as UserIcon, Clock, Activity, Monitor, Globe } from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  module: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function AuditPage() {
  const { token } = useAuthStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (moduleFilter !== 'ALL') params.append('module', moduleFilter);
      if (actionFilter !== 'ALL') params.append('action', actionFilter);

      const response = await fetch(`/api/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data audit log',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token, moduleFilter, actionFilter]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
  };

  const getActionBadge = (action: string) => {
    const config: Record<string, { variant: any; bg: string; color: string }> = {
      LOGIN: { variant: 'default', bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-700 dark:text-blue-400' },
      LOGOUT: { variant: 'secondary', bg: 'bg-zinc-100 dark:bg-zinc-800', color: 'text-zinc-700 dark:text-zinc-400' },
      CREATE_TRANSACTION: { variant: 'outline', bg: 'bg-indigo-50 dark:bg-indigo-950/30', color: 'text-indigo-700 dark:text-indigo-400' },
      TOP_UP: { variant: 'outline', bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-700 dark:text-emerald-400' },
      DELETE_USER: { variant: 'destructive', bg: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-700 dark:text-red-400' },
    };

    const { bg, color } = config[action] || { bg: 'bg-zinc-100', color: 'text-zinc-600' };

    return (
      <Badge variant="secondary" className={`rounded-full px-2 py-0.5 font-normal border-none ${bg} ${color}`}>
        {action.replace(/_/g, ' ').toLowerCase()}
      </Badge>
    );
  };

  const getModuleIcon = (module: string) => {
    const icons: Record<string, any> = {
      AUTH: Shield,
      TRANSACTION: Activity,
      BALANCE: Activity,
      USER: UserIcon,
      PRODUCT: Activity,
    };

    const Icon = icons[module] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground mt-1 text-sm hidden md:block">
            Pantau dan lacak aktivitas sistem terbaru
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
             <Button 
               variant="outline" 
               onClick={fetchLogs} 
               className="rounded-xl border-zinc-200 dark:border-zinc-800 px-4 h-10 shadow-sm bg-white dark:bg-zinc-900"
             >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button 
               variant="destructive" 
               onClick={async () => {
                 if (confirm('Apakah Anda yakin ingin menghapus seluruh log aktivitas? Tindakan ini tidak dapat dibatalkan.')) {
                   setIsLoading(true);
                   try {
                     const response = await fetch('/api/audit', {
                       method: 'DELETE',
                       headers: { Authorization: `Bearer ${token}` }
                     });
                     if (response.ok) {
                       toast({ title: 'Berhasil', description: 'Log aktivitas telah dibersihkan' });
                       fetchLogs();
                     } else {
                       throw new Error('Gagal membersihkan log');
                     }
                   } catch (error: any) {
                     toast({ title: 'Error', description: error.message, variant: 'destructive' });
                   } finally {
                     setIsLoading(false);
                   }
                 }
               }} 
               className="rounded-xl px-4 h-10 shadow-sm font-bold"
               disabled={isLoading}
             >
                <Activity className="h-4 w-4 mr-2" />
                <span>Bersihkan Log</span>
            </Button>
        </div>
      </div>

       {/* Filters Section (Always Visible) */}
       <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-zinc-900">
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-600" />
            Penyaringan Data
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="module" className="text-xs text-zinc-500">Modul Sistem</Label>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger id="module" className="rounded-xl bg-zinc-50 border-transparent dark:bg-zinc-800 h-10">
                  <SelectValue placeholder="Pilih modul" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Modul</SelectItem>
                  <SelectItem value="AUTH">Auth</SelectItem>
                  <SelectItem value="TRANSACTION">Transaksi</SelectItem>
                  <SelectItem value="BALANCE">Saldo</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="PRODUCT">Produk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="action" className="text-xs text-zinc-500">Jenis Aksi</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger id="action" className="rounded-xl bg-zinc-50 border-transparent dark:bg-zinc-800 h-10">
                  <SelectValue placeholder="Pilih aksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Aksi</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="CREATE_TRANSACTION">Buat Transaksi</SelectItem>
                  <SelectItem value="TOP_UP">Top Up</SelectItem>
                  <SelectItem value="CREATE_USER">Buat User</SelectItem>
                  <SelectItem value="UPDATE_USER">Update User</SelectItem>
                  <SelectItem value="DELETE_USER">Hapus User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Content */}
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold">Log Aktivitas</h2>
              <Badge variant="outline" className="rounded-full bg-white dark:bg-zinc-900 border-zinc-200">{logs.length}</Badge>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-950">
                <TableRow>
                  <TableHead className="pl-6">Waktu</TableHead>
                  <TableHead>User / Email</TableHead>
                  <TableHead>Modul</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Detail Aktivitas</TableHead>
                  <TableHead className="pr-6">IP / Perangkat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10">Memuat data...</TableCell></TableRow>
                ) : logs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Tidak ada aktivitas ditemukan</TableCell></TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                      <TableCell className="pl-6 text-xs text-muted-foreground font-medium">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold ring-1 ring-indigo-100">
                                {log.user.name.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-semibold">{log.user.name}</p>
                                <p className="text-[10px] text-muted-foreground">{log.user.email}</p>
                             </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                            {getModuleIcon(log.module)}
                          </div>
                          <span className="capitalize">{log.module.toLowerCase()}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="max-w-[200px] truncate-2-lines text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {log.details || '-'}
                      </TableCell>
                      <TableCell className="pr-6">
                         <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-[11px] text-zinc-500 underline underline-offset-2">
                                <Globe className="h-3 w-3" /> {log.ipAddress || '-'}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-zinc-400 italic truncate max-w-[120px]">
                                <Monitor className="h-3 w-3" /> {log.userAgent?.split(' ')[0] || 'Unknown'}
                            </div>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
             {isLoading ? (
                  <div className="text-center py-10 text-muted-foreground">Memuat data...</div>
             ) : logs.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">Tidak ada aktivitas</div>
             ) : (
                  logs.map((log) => (
                    <div key={log.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                             <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                    {log.user.name.charAt(0)}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{log.user.name}</p>
                                    <span className="text-[10px] text-zinc-400 block">{formatDate(log.createdAt)}</span>
                                </div>
                             </div>
                             {getActionBadge(log.action)}
                        </div>
                        
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border-l-2 border-indigo-200">
                            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                {log.details || 'Aksi sistem tanpa keterangan tambahan'}
                            </p>
                            <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-400">
                                <div className="flex items-center gap-1">
                                    <Globe className="h-3 w-3" /> {log.ipAddress || '-'}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Activity className="h-3 w-3" /> {log.module}
                                </div>
                            </div>
                        </div>
                    </div>
                  ))
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
