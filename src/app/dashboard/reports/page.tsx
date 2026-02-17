'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store/auth';
import { toast } from '@/hooks/use-toast';
import { FileDown, RefreshCw, Calendar, TrendingUp, DollarSign, Package, Users, ArrowUpRight, BarChart3, PieChart } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ReportData {
  type: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
    totalModal: number;
    totalPenjualan: number;
    totalFee: number;
    totalProfit: number;
    totalDeposit: number;
    successRate: string;
  };
  byCategory: Record<string, { count: number; total: number; profit: number }>;
  byUser: Array<{ name: string; email: string; count: number; total: number; profit: number }>;
  transactions: any[];
  deposits: any[];
}

export default function ReportsPage() {
  const { token } = useAuthStore();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      
      const response = await fetch(`/api/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil laporan');
      }

      const data = await response.json();
      setReportData(data);
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
    fetchReport();
  }, [token, startDate, endDate]);

  const exportToPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const brandColor: [number, number, number] = [79, 70, 229]; // indigo-600

    // --- HEADER SECTION ---
    doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ADIFA CELL', 20, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const reportTitle = startDate === endDate ? 'LAPORAN KEUANGAN HARIAN' : 'LAPORAN KEUANGAN PERIODE';
    doc.text(reportTitle, 20, 32);
    
    const periodText = `Periode: ${new Date(reportData.period.start).toLocaleDateString('id-ID')} - ${new Date(reportData.period.end).toLocaleDateString('id-ID')}`;
    doc.text(periodText, pageWidth - 20, 32, { align: 'right' });

    // --- 1. RINGKASAN TRANSAKSI ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('I. RINGKASAN TRANSAKSI', 20, 55);

    autoTable(doc, {
      startY: 60,
      head: [['Parameter', 'Nilai']],
      body: [
        ['Total Seluruh Transaksi', `${reportData.summary.totalTransactions} Transaksi`],
        ['Transaksi Berhasil (Success)', `${reportData.summary.successfulTransactions} Transaksi`],
        ['Transaksi Gagal (Failed)', `${reportData.summary.failedTransactions} Transaksi`],
        ['Persentase Keberhasilan', `${reportData.summary.successRate}%`],
      ],
      theme: 'striped',
      headStyles: { fillColor: brandColor, cellPadding: 5 },
      styles: { cellPadding: 4, fontSize: 10 },
      margin: { left: 20, right: 20 }
    });

    // --- 2. ANALISIS KEUANGAN ---
    const financialStartY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('II. ANALISIS KEUANGAN', 20, financialStartY);

    autoTable(doc, {
      startY: financialStartY + 5,
      head: [['Keterangan', 'Jumlah (IDR)']],
      body: [
        ['Total Modal (HPP)', formatCurrency(reportData.summary.totalModal)],
        ['Total Penjualan (Gross)', formatCurrency(reportData.summary.totalPenjualan)],
        ['Total Fee Adm', formatCurrency(reportData.summary.totalFee)],
        ['TOTAL KEUNTUNGAN (NET PROFIT)', formatCurrency(reportData.summary.totalProfit)],
        ['TOTAL MASUK (TOP UP SALDO)', formatCurrency(reportData.summary.totalDeposit)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }, // emerald-600
      styles: { cellPadding: 4, fontSize: 10 },
      columnStyles: { 
        0: { fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold' } 
      },
      margin: { left: 20, right: 20 }
    });

    // --- 3. DETAIL TOP UP ---
    const depositStartY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('III. DETAIL MUTASI MASUK (TOP UP)', 20, depositStartY);

    autoTable(doc, {
      startY: depositStartY + 5,
      head: [['Waktu', 'Nama Akun', 'Keterangan', 'Jumlah']],
      body: reportData.deposits.map(d => [
        new Date(d.createdAt).toLocaleString('id-ID'),
         d.user.name,
         d.description || '-',
         formatCurrency(d.amount)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }, // blue-500
      styles: { fontSize: 8 },
      columnStyles: { 3: { halign: 'right' } },
      margin: { left: 20, right: 20 }
    });

    // --- 4. DETAIL PER KATEGORI ---
    const categoryStartY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('IV. PERFORMA KATEGORI PRODUK', 20, categoryStartY);

    autoTable(doc, {
      startY: categoryStartY + 5,
      head: [['Kategori', 'Volume', 'Profit']],
      body: Object.entries(reportData.byCategory).map(([cat, data]) => [
        cat,
        `${data.count} Trx`,
        formatCurrency(data.profit)
      ]),
      theme: 'striped',
      headStyles: { fillColor: brandColor },
      styles: { fontSize: 9 },
      columnStyles: { 
        1: { halign: 'center' },
        2: { halign: 'right' } 
      },
      margin: { left: 20, right: 20 }
    });

    // --- FOOTER ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        const footerText = `Dicetak pada: ${new Date().toLocaleString('id-ID')} | Halaman ${i} dari ${pageCount}`;
        doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`laporan-${new Date().toISOString().split('T')[0]}.pdf`); // Removed reportType dependency
  };

  const exportToExcel = () => {
    if (!reportData) return;
    const wb = XLSX.utils.book_new();
    const summaryData = [
      ['Keterangan', 'Nilai'],
      ['Total Transaksi', reportData.summary.totalTransactions],
      ['Total Penjualan', reportData.summary.totalPenjualan],
      ['Total Profit', reportData.summary.totalProfit],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');
    XLSX.writeFile(wb, `laporan-${Date.now()}.xlsx`); // Removed reportType dependency
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Helper Stats Card
  const StatCard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
    <Card className="rounded-2xl lg:rounded-3xl border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden relative group hover:shadow-lg transition-all duration-300 cursor-default outline outline-zinc-100 dark:outline-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-1 lg:pb-2 space-y-0 p-3 lg:p-5">
        <CardTitle className="text-[8px] lg:text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 truncate mr-1">{title}</CardTitle>
        <div className={`h-7 w-7 lg:h-10 lg:w-10 rounded-lg lg:rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 shadow-xs lg:shadow-sm shrink-0 ${colorClass}`}>
            <Icon className="h-3.5 w-3.5 lg:h-5 lg:w-5" />
        </div>
      </CardHeader>
      <CardContent className="px-3 lg:px-5 pb-4 lg:pb-6">
        <div className="text-sm lg:text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-0.5 lg:mb-2 tracking-tight truncate">{value}</div>
        <p className="text-[8px] lg:text-xs text-zinc-500 dark:text-zinc-400 font-bold truncate">{subtext}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="px-1 lg:px-0">
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Laporan Keuangan</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-xs lg:text-sm">
            Analisis dan rekapitulasi keuangan bisnis Anda
          </p>
        </div>
         <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto px-1 lg:px-0">
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1 sm:w-40">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <Input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 rounded-2xl h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm font-bold text-sm"
              />
            </div>
            <span className="text-zinc-400 font-bold text-xs uppercase">s.d</span>
            <div className="relative flex-1 sm:w-40">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <Input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 rounded-2xl h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm font-bold text-sm"
              />
            </div>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchReport} 
            className="hidden sm:flex rounded-2xl h-11 w-11 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

       {/* Period Header */}
       {reportData && (
        <Card className="rounded-3xl border-none bg-linear-to-br from-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-100 dark:shadow-none overflow-hidden relative">
            <CardContent className="p-5 lg:p-8 relative z-10">
                <div className="flex items-center gap-4 lg:gap-6">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl lg:rounded-3xl bg-white/20 flex items-center justify-center backdrop-blur-xl border border-white/10 shrink-0">
                        <Calendar className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                    </div>
                    <div>
                        <p className="text-indigo-100 text-[8px] lg:text-xs font-black uppercase tracking-[0.2em]">Periode Aktif</p>
                        <div className="flex flex-wrap items-baseline gap-x-2 mt-0.5 lg:mt-1">
                            <span className="text-sm lg:text-2xl font-black tracking-tight whitespace-nowrap">
                                {new Date(reportData.period.start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-[10px] lg:text-sm font-normal italic opacity-50">s.d</span>
                            <span className="text-sm lg:text-2xl font-black tracking-tight whitespace-nowrap">
                                {new Date(reportData.period.end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
            {/* Decorative elements */}
            <div className="absolute top-[-20%] right-[-5%] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl"></div>
        </Card>
      )}

      {/* Summary Cards - 2X2 GRID ON MOBILE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 px-1 lg:px-0">
            <StatCard 
                title="Total Transaksi" 
                value={reportData?.summary.totalTransactions || 0}
                subtext={`${reportData?.summary.successfulTransactions || 0} Berhasil`}
                icon={BarChart3}
                colorClass="border-blue-100 text-blue-600 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800"
            />
            <StatCard 
                title="Total Penjualan" 
                value={formatCurrency(reportData?.summary.totalPenjualan || 0).replace('Rp', 'Rp ')}
                subtext={`Mdl: ${formatCurrency(reportData?.summary.totalModal || 0).replace('Rp', 'Rp ')}`}
                icon={DollarSign}
                colorClass="border-emerald-100 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800"
            />
            <StatCard 
                title="Total Profit" 
                value={formatCurrency(reportData?.summary.totalProfit || 0).replace('Rp', 'Rp ')}
                subtext={`Fee: ${formatCurrency(reportData?.summary.totalFee || 0).replace('Rp', 'Rp ')}`}
                icon={TrendingUp}
                colorClass="border-purple-100 text-purple-600 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800"
            />
            <StatCard 
                title="Success Rate" 
                value={(reportData?.summary.successRate || '0') + '%'}
                subtext={`${reportData?.summary.failedTransactions || 0} Gagal`}
                icon={PieChart}
                colorClass="border-orange-100 text-orange-600 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800"
            />
      </div>

      {/* Export & Actions Section */}
       <div className="grid gap-6 md:grid-cols-3">
          <Card className="rounded-3xl border-none shadow-sm md:col-span-1 bg-white dark:bg-zinc-900 overflow-hidden outline outline-zinc-100 dark:outline-zinc-800">
                <CardHeader className="p-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-xl">
                            <FileDown className="h-5 w-5 text-red-600" />
                        </div>
                        <CardTitle className="text-base font-black">Export Laporan</CardTitle>
                    </div>
                    <CardDescription className="text-xs font-medium">Download data periode ini</CardDescription>
                </CardHeader>
                <CardContent className="p-6 flex flex-col gap-3">
                    <Button 
                        onClick={exportToPDF} 
                        className="w-full rounded-2xl bg-red-600 hover:bg-red-700 h-12 shadow-lg shadow-red-100 dark:shadow-none cursor-pointer font-black transition-all active:scale-95 gap-2" 
                        disabled={!reportData || isLoading}
                    >
                        <FileDown className="h-4 w-4" /> PDF Report
                    </Button>
                    <Button 
                        onClick={exportToExcel} 
                        className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 h-12 shadow-lg shadow-emerald-100 dark:shadow-none cursor-pointer font-black transition-all active:scale-95 gap-2" 
                        disabled={!reportData || isLoading}
                    >
                        <FileDown className="h-4 w-4" /> Excel Sheet
                    </Button>
                </CardContent>
          </Card>

          {/* By Category */}
          <Card className="rounded-3xl border-none shadow-sm md:col-span-2 bg-white dark:bg-zinc-900 overflow-hidden outline outline-zinc-100 dark:outline-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between p-6">
                    <div>
                        <CardTitle className="text-base font-black">Analisis Produk</CardTitle>
                        <CardDescription className="text-xs font-medium">Statistik berdasarkan kategori produk</CardDescription>
                    </div>
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                        <Package className="h-5 w-5 text-zinc-400" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="hidden sm:block">
                        <Table>
                            <TableHeader className="bg-zinc-50 dark:bg-zinc-950">
                                <TableRow>
                                    <TableHead className="pl-6">Kategori</TableHead>
                                    <TableHead className="text-right">Jumlah</TableHead>
                                    <TableHead className="text-right pr-6">Profit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData && Object.entries(reportData.byCategory).map(([cat, data]) => (
                                    <TableRow key={cat} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                        <TableCell className="pl-6 font-medium">{cat}</TableCell>
                                        <TableCell className="text-right">{data.count}</TableCell>
                                        <TableCell className="text-right pr-6 text-emerald-600 font-bold">{formatCurrency(data.profit)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Mobile Category List */}
                    <div className="sm:hidden px-4 pb-4 space-y-2">
                        {reportData && Object.entries(reportData.byCategory).map(([cat, data]) => (
                            <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                                <div>
                                    <p className="font-semibold text-sm">{cat}</p>
                                    <p className="text-[10px] text-zinc-500">{data.count} Transaksi</p>
                                </div>
                                <span className="text-sm font-bold text-emerald-600">{formatCurrency(data.profit)}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
          </Card>
      </div>

      {/* Top Up History Table */}
      <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden outline outline-zinc-100 dark:outline-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between p-6">
              <div>
                  <CardTitle className="text-base font-black">Riwayat Top Up (Pemasukan)</CardTitle>
                  <CardDescription className="text-xs font-medium">Daftar saldo masuk pada periode ini</CardDescription>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
          </CardHeader>
          <CardContent className="p-0">
              <div className="hidden md:block overflow-x-auto">
                  <Table>
                      <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50">
                          <TableRow className="border-zinc-100 dark:border-zinc-800">
                              <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest pl-6">Waktu</TableHead>
                              <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest">Akun</TableHead>
                              <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest">Keterangan</TableHead>
                              <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest text-right pr-6">Jumlah</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {reportData?.deposits && reportData.deposits.length > 0 ? (
                              reportData.deposits.map((d, i) => (
                                  <TableRow key={i} className="border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                                      <TableCell className="pl-6 py-4">
                                          <div className="flex flex-col">
                                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{new Date(d.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                              <span className="text-[10px] text-zinc-400 font-medium">{new Date(d.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                          </div>
                                      </TableCell>
                                      <TableCell>
                                          <div className="flex items-center gap-2">
                                              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                                                  {d.user.name.charAt(0)}
                                              </div>
                                              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{d.user.name}</span>
                                          </div>
                                      </TableCell>
                                      <TableCell>
                                          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 max-w-[200px] truncate">
                                              {d.description || 'Top Up Saldo'}
                                          </p>
                                      </TableCell>
                                      <TableCell className="text-right pr-6 text-emerald-500 font-black">
                                          <div className="flex flex-col items-end">
                                              <span className="text-sm">
                                                  + {formatCurrency(d.amount).replace('Rp', '')}
                                              </span>
                                              <span className="text-[10px] text-zinc-300 dark:text-zinc-600 uppercase font-bold tracking-tighter">IDR</span>
                                          </div>
                                      </TableCell>
                                  </TableRow>
                              ))
                          ) : (
                              <TableRow>
                                  <TableCell colSpan={4} className="text-center py-16 text-zinc-400 italic font-medium">
                                      <div className="flex flex-col items-center gap-2">
                                          <TrendingUp className="h-8 w-8 opacity-10" />
                                          <p>Tidak ada data top up pada periode ini</p>
                                      </div>
                                  </TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </div>

              {/* Mobile Deposit List */}
              <div className="md:hidden px-4 pb-6 space-y-3">
                  {reportData?.deposits && reportData.deposits.length > 0 ? (
                      reportData.deposits.map((d, i) => (
                          <div key={i} className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-indigo-600 font-black shadow-sm">
                                      {d.user.name.charAt(0)}
                                  </div>
                                  <div className="flex flex-col">
                                      <span className="text-xs font-black text-zinc-900 dark:text-zinc-50">{d.user.name}</span>
                                      <span className="text-[9px] text-indigo-500 font-bold">{new Date(d.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} • {new Date(d.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                      <p className="text-[9px] text-zinc-400 font-medium mt-0.5 truncate max-w-[120px]">{d.description || 'Top Up Saldo'}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="text-sm font-black text-emerald-500">+ {formatCurrency(d.amount).replace('Rp', '')}</p>
                                  <span className="text-[8px] font-bold text-zinc-300">IDR</span>
                              </div>
                          </div>
                      ))
                  ) : (
                    <div className="py-10 text-center text-zinc-400 italic text-xs">Belum ada mutasi masuk.</div>
                  )}
              </div>
          </CardContent>
      </Card>

      {/* Per Kasir */}
      <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base">Performa Kasir</CardTitle>
                    <CardDescription className="text-xs">Kontribusi transaksi tiap admin</CardDescription>
                </div>
                <Users className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent className="p-0">
                <div className="hidden sm:block">
                    <Table>
                        <TableHeader className="bg-zinc-50 dark:bg-zinc-950">
                            <TableRow>
                                <TableHead className="pl-6">Nama Kasir</TableHead>
                                <TableHead className="text-right">Transaksi</TableHead>
                                <TableHead className="text-right">Total Penjualan</TableHead>
                                <TableHead className="text-right pr-6">Total Profit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData?.byUser.map((user, i) => (
                                <TableRow key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <span className="font-medium">{user.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{user.count}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(user.total)}</TableCell>
                                    <TableCell className="text-right pr-6 text-emerald-600 font-bold">{formatCurrency(user.profit)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {/* Mobile User List */}
                <div className="sm:hidden px-4 pb-4 space-y-3">
                     {reportData?.byUser.map((user, i) => (
                        <div key={i} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                    <p className="font-bold text-sm">{user.name}</p>
                                </div>
                                <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 shadow-none text-[10px]">{user.count} Trx</Badge>
                            </div>
                            <div className="flex justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-700">
                                <span className="text-zinc-500">Omset: {formatCurrency(user.total)}</span>
                                <span className="font-bold text-emerald-600">Profit: {formatCurrency(user.profit)}</span>
                            </div>
                        </div>
                     ))}
                </div>
            </CardContent>
      </Card>
    </div>
  );
}
