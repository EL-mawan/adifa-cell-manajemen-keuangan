'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/lib/store/auth';
import { toast } from '@/hooks/use-toast';
import { Plus, RefreshCw, Search, Package, Edit, Trash2, Smartphone, Zap, FileText, Wallet, TrendingUp } from 'lucide-react';

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  basePrice: number;
  sellingPrice: number;
  fee: number;
  profit: number;
  minBalance: number;
  isActive: boolean;
  supplier: {
    id: string;
    name: string;
    code: string;
  };
}

interface Supplier {
  id: string;
  name: string;
  code: string;
}

const CATEGORIES = [
  { value: 'PULSA', label: 'Pulsa', icon: Smartphone },
  { value: 'PAKET_DATA', label: 'Paket Data', icon: Smartphone },
  { value: 'PLN_TOKEN', label: 'PLN Token', icon: Zap },
  { value: 'PLN_NONTOKEN', label: 'PLN Non-Token', icon: Zap },
  { value: 'PDAM', label: 'PDAM', icon: FileText },
  { value: 'BPJS', label: 'BPJS', icon: FileText },
  { value: 'E_WALLET', label: 'E-Wallet', icon: Wallet },
  { value: 'PULSA_TRANSFER', label: 'Pulsa Transfer', icon: Smartphone },
  { value: 'VOUCHER_GAME', label: 'Voucher Game', icon: FileText },
];

export default function ProductsPage() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    supplierId: '',
    basePrice: '',
    sellingPrice: '',
    fee: '',
    minBalance: '',
  });

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data produk',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data supplier',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchProducts, 30000);
    return () => clearInterval(interval);
  }, [token, categoryFilter, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const basePrice = parseFloat(formData.basePrice);
      const sellingPrice = parseFloat(formData.sellingPrice);
      const fee = parseFloat(formData.fee) || 0;
      const minBalance = parseFloat(formData.minBalance) || 0;

      const url = editingId 
        ? `/api/products/${editingId}`
        : '/api/products';
      
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: formData.code,
          name: formData.name,
          category: formData.category,
          supplierId: formData.supplierId,
          basePrice,
          sellingPrice,
          fee,
          minBalance,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Gagal ${editingId ? 'mengupdate' : 'membuat'} produk`);
      }

      toast({
        title: editingId ? 'Produk Diperbarui' : 'Produk Ditambahkan',
        description: `${formData.name} telah ${editingId ? 'diperbarui' : 'ditambahkan'}`,
      });

      // Reset form
      resetForm();
      setIsDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: `Gagal ${editingId ? 'Update' : 'Tambah'} Produk`,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      category: '',
      supplierId: '',
      basePrice: '',
      sellingPrice: '',
      fee: '',
      minBalance: '',
    });
    setEditingId(null);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      code: product.code,
      name: product.name,
      category: product.category,
      supplierId: product.supplier.id,
      basePrice: product.basePrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      fee: product.fee.toString(),
      minBalance: product.minBalance.toString(),
    });
    setEditingId(product.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk ${name}?`)) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Gagal menghapus produk');

      toast({
        title: 'Produk Dihapus',
        description: `${name} berhasil dihapus`,
      });
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    const Icon = cat?.icon || Package;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Produk PPOB</h1>
        <p className="text-muted-foreground mt-1 text-sm hidden md:block">
          Kelola produk PPOB yang tersedia
        </p>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Action Button - Large on Mobile, Above Search */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto h-12 sm:h-auto gap-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none font-bold text-base sm:text-sm order-first sm:order-last px-6">
                  <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span>Tambah Produk Baru</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
                  <DialogDescription>
                    Masukkan detail produk PPOB baru
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Kode Produk *</Label>
                      <Input
                        className="rounded-xl"
                        id="code"
                        placeholder="Contoh: TSEL10"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Kategori *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                        required
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="category" className="rounded-xl">
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <div className="flex items-center gap-2">
                                <cat.icon className="h-4 w-4" />
                                {cat.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Produk *</Label>
                    <Input
                      className="rounded-xl"
                      id="name"
                      placeholder="Contoh: Telkomsel 10.000"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier *</Label>
                    <Select
                      value={formData.supplierId}
                      onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
                      required
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="supplier" className="rounded-xl">
                        <SelectValue placeholder="Pilih supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name} ({supplier.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="basePrice">Harga Modal (Rp) *</Label>
                      <Input
                        className="rounded-xl"
                        id="basePrice"
                        type="number"
                        placeholder="10000"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                        min="0"
                        step="any"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sellingPrice">Harga Jual (Rp) *</Label>
                      <Input
                        className="rounded-xl"
                        id="sellingPrice"
                        type="number"
                        placeholder="10500"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                        min="0"
                        step="any"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  {formData.basePrice && formData.sellingPrice && (
                    <div className="bg-muted p-4 rounded-xl space-y-2 text-sm border shadow-sm dark:bg-zinc-800/40">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        Preview Profit & Total
                      </p>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Harga Modal:</span>
                        <span className="font-mono">{formatCurrency(parseFloat(formData.basePrice) || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Harga Jual Dasar:</span>
                        <span className="font-mono">{formatCurrency(parseFloat(formData.sellingPrice) || 0)}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Fee Adm:</span>
                        <span className="font-mono text-indigo-600 font-bold">+ {formatCurrency(parseFloat(formData.fee) || 0)}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="font-bold">Total Pembayaran:</span>
                        <span className="font-black text-blue-600">
                            {formatCurrency((parseFloat(formData.sellingPrice) || 0) + (parseFloat(formData.fee) || 0))}
                        </span>
                      </div>
                      <div className="flex justify-between font-black text-emerald-600 border-t pt-2 mt-2 bg-emerald-50 dark:bg-emerald-950/20 px-2 rounded-lg py-1">
                        <span>Net Profit:</span>
                        <span>
                          {formatCurrency(
                            ((parseFloat(formData.sellingPrice) || 0) + (parseFloat(formData.fee) || 0)) - (parseFloat(formData.basePrice) || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      type="submit"
                      className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 h-11 font-bold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Simpan Produk')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full rounded-xl h-11 font-bold text-zinc-400 hover:text-zinc-600"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <div className="flex-1 relative order-2 sm:order-first">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau kode produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 sm:h-10 pl-10 rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                />
            </div>
            <div className="flex gap-2 order-3 sm:order-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-12 sm:h-10 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                    <SelectItem value="ALL">Semua Kategori</SelectItem>
                    {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                            <cat.icon className="h-4 w-4" />
                            {cat.label}
                        </div>
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
          </div>


          {/* Desktop Table View */}
          <div className="hidden md:block rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-950">
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Modal</TableHead>
                  <TableHead>Jual Dasar</TableHead>
                  <TableHead className="text-indigo-600">Fee Adm</TableHead>
                  <TableHead>Net Profit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Tidak ada produk ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      <TableCell className="font-mono text-xs font-medium">{product.code}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {getCategoryIcon(product.category)}
                          <span className="capitalize">{product.category.toLowerCase().replace(/_/g, ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{product.supplier.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatCurrency(product.basePrice)}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(product.sellingPrice)}</TableCell>
                      <TableCell className="text-xs font-black text-indigo-600">+{formatCurrency(product.fee)}</TableCell>
                      <TableCell className="font-black text-emerald-600">
                        {formatCurrency(product.profit)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-[10px] ${product.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                          {product.isActive ? 'Aktif' : 'Non-aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(product.id, product.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile List View */}
          <div className="md:hidden space-y-3">
             {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
             ) : products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Tidak ada produk</div>
             ) : (
                 products.map((product) => (
                    <div key={product.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                     {getCategoryIcon(product.category)}
                                 </div>
                                 <div className="overflow-hidden">
                                     <h3 className="font-bold text-zinc-800 dark:text-zinc-100 truncate w-40">{product.name}</h3>
                                     <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <span className="font-mono bg-zinc-100 px-1 rounded">{product.code}</span>
                                        <span>• {product.category}</span>
                                     </div>
                                 </div>
                             </div>
                             <Badge variant="outline" className={`rounded-full text-[10px] ${product.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                {product.isActive ? 'Aktif' : 'Off'}
                             </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-zinc-50 dark:border-zinc-800 mt-1">
                            <div>
                                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Total Jual</p>
                                <p className="font-black text-indigo-600">{formatCurrency(product.sellingPrice + product.fee).replace('Rp', 'Rp ')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Net Profit</p>
                                <p className="font-black text-emerald-600">{formatCurrency(product.profit).replace('Rp', 'Rp ')}</p>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-1">
                            <Button size="sm" variant="outline" className="flex-1 rounded-xl h-9 text-xs" onClick={() => handleEdit(product)}>
                                Edit
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 rounded-xl h-9 text-xs text-red-600 border-red-100 bg-red-50 hover:bg-red-100 hover:text-red-700" onClick={() => handleDelete(product.id, product.name)}>
                                Hapus
                            </Button>
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
