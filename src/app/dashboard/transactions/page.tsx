'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/lib/store/auth';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, Search, Edit, Trash2, Calendar, FileText, Smartphone, DollarSign, Wallet, Plus, ChevronRight } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface Transaction {
  id: string;
  transactionCode: string;
  customerNumber: string;
  amount: number;
  basePrice: number;
  fee: number;
  profit: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  errorMessage?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
  product: {
    id: string;
    name: string;
    category: string;
  };
}

interface Product {
    id: string;
    name: string;
    code: string;
    category: string;
    sellingPrice: number;
}
  
export default function TransactionsPage() {
  const { token, user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Edit State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrx, setEditingTrx] = useState<Transaction | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editErrorMessage, setEditErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [newTrx, setNewTrx] = useState({ 
    productId: '', 
    customerNumber: '', 
    date: new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Gagal mengambil data transaksi');
      
      setTransactions(data.transactions || []);
      setTotalPages(data.pagination?.totalPages || 1);
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

  const fetchProducts = async () => {
    try {
      // Fetch all products
      const response = await fetch('/api/products?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
       console.error("Gagal load produk", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  useEffect(() => {
    fetchTransactions();
  }, [token, page, statusFilter]);

  const handleEdit = (trx: Transaction) => {
    setEditingTrx(trx);
    setEditStatus(trx.status);
    setEditErrorMessage(trx.errorMessage || '');
    setIsDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrx) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/transactions/${editingTrx.id}`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
            status: editStatus,
            errorMessage: editErrorMessage,
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal update transaksi');
      }

      toast({ title: 'Berhasil', description: 'Transaksi diperbarui' });
      setIsDialogOpen(false);
      fetchTransactions();
    } catch (error: any) {
        toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrx.productId || !newTrx.customerNumber) {
        toast({ title: 'Error', description: 'Mohon lengkapi data', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);

    try {
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify(newTrx)
        });

        const data = await response.json();
        if(!response.ok) throw new Error(data.error || 'Gagal membuat transaksi');

        toast({ title: 'Berhasil', description: 'Transaksi berhasil dibuat' });
        setIsCreateDialogOpen(false);
        setNewTrx({ productId: '', customerNumber: '', date: new Date().toISOString().split('T')[0] });
        setSelectedProduct(null);
        fetchTransactions();
    } catch (error: any) {
        toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };  

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Hapus transaksi ${code}? \nPERINGATAN: Jika status SUKSES, saldo user akan dikembalikan (Refund).`)) return;

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Gagal menghapus transaksi');

      toast({ title: 'Terhapus', description: `Transaksi ${code} dihapus` });
      fetchTransactions();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('id-ID');

  const getStatusBadge = (status: string) => {
      switch (status) {
          case 'SUCCESS': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">Sukses</Badge>;
          case 'PENDING': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
          case 'FAILED': return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">Gagal</Badge>;
          default: return <Badge variant="outline">{status}</Badge>;
      }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-sans tracking-tight">Transaksi</h1>
        <p className="text-muted-foreground mt-1 text-sm hidden md:block">
          Pantau dan kelola semua transaksi
        </p>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0">
            {/* Edit Transaction Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Transaksi {editingTrx?.transactionCode}</DialogTitle>
                        <DialogDescription>
                            Ubah status transaksi. Hati-hati, perubahan status akan mempengaruhi saldo user.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                             <Label>Status</Label>
                             <Select value={editStatus} onValueChange={setEditStatus}>
                                 <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                                 <SelectContent>
                                     <SelectItem value="PENDING">Pending</SelectItem>
                                     <SelectItem value="SUCCESS">Sukses</SelectItem>
                                     <SelectItem value="FAILED">Gagal</SelectItem>
                                 </SelectContent>
                             </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Pesan Error (Opsional)</Label>
                            <Textarea 
                              className="rounded-xl"
                              placeholder="Contoh: Nomor pelanggan salah"
                              value={editErrorMessage}
                              onChange={(e) => setEditErrorMessage(e.target.value)}
                            />
                        </div>
                        <div className="pt-4 flex flex-col gap-2">
                            <Button type="submit" className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 h-11 font-bold" disabled={isSubmitting}>
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                            <Button variant="outline" className="w-full rounded-xl h-11 font-bold" type="button" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {/* Action Button - Large on Mobile, Above Search */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto h-12 sm:h-auto gap-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none font-bold text-base sm:text-sm order-first sm:order-last px-6">
                            <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                            <span>Buat Transaksi Baru</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>Buat Transaksi Baru</DialogTitle>
                            <DialogDescription>Input manual transaksi PPOB</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label>Tanggal Transaksi</Label>
                                <Input 
                                    type="date"
                                    className="rounded-xl h-11"
                                    value={newTrx.date}
                                    onChange={(e) => setNewTrx({...newTrx, date: e.target.value})} 
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                 <Label>Produk</Label>
                                 <Select 
                                    value={newTrx.productId} 
                                    onValueChange={(val) => {
                                        setNewTrx({...newTrx, productId: val});
                                        const prod = products.find(p => p.id === val);
                                        setSelectedProduct(prod || null);
                                    }}
                                 >
                                    <SelectTrigger className="rounded-xl h-11">
                                        <SelectValue placeholder="Pilih Produk..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {products.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.category} - {p.name} ({p.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                 </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Nomor Pelanggan (HP / ID Pel)</Label>
                                <Input 
                                    className="rounded-xl h-11"
                                    placeholder="0812xxxx / 1234xxxx"
                                    value={newTrx.customerNumber}
                                    onChange={(e) => setNewTrx({...newTrx, customerNumber: e.target.value})} 
                                />
                            </div>

                            {selectedProduct && (
                                 <div className="bg-slate-50 p-4 rounded-xl space-y-1 text-sm border dark:bg-zinc-800/40 dark:border-zinc-800">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Harga Jual:</span>
                                        <span className="font-semibold text-indigo-600">{formatCurrency(selectedProduct.sellingPrice)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Kode:</span>
                                        <span className="font-mono">{selectedProduct.code}</span>
                                    </div>
                                 </div>
                            )}

                            <div className="pt-4 flex flex-col gap-2">
                                <Button type="submit" className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 h-11 font-bold" disabled={isSubmitting}>
                                    {isSubmitting ? 'Memproses...' : 'Kirim Transaksi'}
                                </Button>
                                <Button type="button" variant="ghost" className="w-full rounded-xl h-11 font-bold text-zinc-400" onClick={() => setIsCreateDialogOpen(false)}>Batal</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                <div className="flex-1 relative order-2 sm:order-first">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Cari Kode TRX atau No HP..." 
                        className="pl-10 h-12 sm:h-10 rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchTransactions()} 
                    />
                </div>
                <div className="flex gap-2 order-3 sm:order-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="flex-1 sm:w-[140px] h-12 sm:h-10 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            <SelectItem value="ALL">Semua Status</SelectItem>
                            <SelectItem value="SUCCESS">Sukses</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="FAILED">Gagal</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchTransactions} className="h-12 sm:h-10 w-12 sm:w-10 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 shrink-0 shadow-sm transition-all active:scale-95">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>


            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="hidden md:block rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-950">
                        <TableRow>
                            <TableHead>Kode TRX</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Produk</TableHead>
                            <TableHead>Pelanggan</TableHead>
                            <TableHead>Nominal</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={8} className="text-center py-8">Memuat...</TableCell></TableRow>
                        ) : transactions.length === 0 ? (
                            <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Tidak ada transaksi</TableCell></TableRow>
                        ) : (
                            transactions.map((trx) => (
                                <TableRow key={trx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                    <TableCell className="font-mono text-xs font-medium">{trx.transactionCode}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{formatDate(trx.createdAt)}</TableCell>
                                    <TableCell className="text-sm">{trx.user.name}</TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">{trx.product.name}</div>
                                        <div className="text-xs text-muted-foreground">{trx.product.category}</div>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">{trx.customerNumber}</TableCell>
                                    <TableCell className="font-medium">{formatCurrency(trx.amount)}</TableCell>
                                    <TableCell>{getStatusBadge(trx.status)}</TableCell>
                                    <TableCell className="text-right">
                                        {user?.role === 'ADMIN' && (
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEdit(trx)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(trx.id, trx.transactionCode)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile List View (Hidden on Desktop) */}
            <div className="md:hidden space-y-3">
                {isLoading ? (
                     <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
                ) : transactions.length === 0 ? (
                     <div className="text-center py-8 text-muted-foreground">Tidak ada transaksi</div>
                ) : (
                    transactions.map((trx) => (
                        <div key={trx.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-xs text-zinc-400">#{trx.transactionCode}</span>
                                        <span className="text-xs text-zinc-400">• {formatDate(trx.createdAt)}</span>
                                    </div>
                                    <h3 className="font-bold text-zinc-800 dark:text-zinc-100">{trx.product.name}</h3>
                                    <p className="text-sm text-zinc-500">{trx.customerNumber}</p>
                                </div>
                                {getStatusBadge(trx.status)}
                            </div>
                            
                            <div className="flex justify-between items-center pt-2 border-t border-zinc-50 dark:border-zinc-800 mt-1">
                                <div className="flex flex-col">
                                    <span className="text-xs text-zinc-400">Total</span>
                                    <span className="font-bold text-indigo-600">{formatCurrency(trx.amount)}</span>
                                </div>
                                {user?.role === 'ADMIN' && (
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full" onClick={() => handleEdit(trx)}>
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full text-red-600 hover:text-red-700 border-red-100 bg-red-50" onClick={() => handleDelete(trx.id, trx.transactionCode)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination settings need to stay */}
            <div className="flex items-center justify-end space-x-2 py-4 mt-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >Previous</Button>
                <div className="text-sm text-zinc-500">Hal {page} / {totalPages}</div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                >Next</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
