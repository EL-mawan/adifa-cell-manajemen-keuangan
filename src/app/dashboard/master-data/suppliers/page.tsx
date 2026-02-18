'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/lib/store/auth';
import { toast } from '@/hooks/use-toast';
import { Plus, RefreshCw, Search, Truck, Edit, Trash2, Package, MapPin, Phone, ChevronRight } from 'lucide-react';

interface SupplierData {
  id: string;
  name: string;
  code: string;
  contact: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    products: number;
  };
}

export default function SuppliersPage() {
  const { token } = useAuthStore();
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog & Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contact: '',
    address: '',
    isActive: true,
  });

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/suppliers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Gagal mengambil data supplier');
      
      setSuppliers(data.suppliers || []);
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
    fetchSuppliers();
  }, [token]);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      contact: '',
      address: '',
      isActive: true,
    });
    setEditingId(null);
  };

  const handleEdit = (supplier: SupplierData) => {
    setFormData({
      name: supplier.name,
      code: supplier.code,
      contact: supplier.contact || '',
      address: supplier.address || '',
      isActive: supplier.isActive,
    });
    setEditingId(supplier.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus supplier ${name}?`)) return;

    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menghapus supplier');

      toast({
        title: 'Supplier Dihapus',
        description: `${name} berhasil dihapus`,
      });
      fetchSuppliers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingId ? `/api/suppliers/${editingId}` : '/api/suppliers';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan data');

      toast({
        title: editingId ? 'Supplier Diperbarui' : 'Supplier Ditambahkan',
        description: `${formData.name} telah disimpan`,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchSuppliers();
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 pb-32 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Manajemen Supplier</h1>
        <p className="text-xs lg:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Kelola data mitra penyedia layanan PPOB Anda
        </p>
      </div>

       {/* Search & Stats Section */}
       <div className="flex flex-col gap-4 px-1 lg:px-0 mb-6">
          {/* Action Button - Large on Mobile, Above Search */}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
          }}>
              <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto h-12 sm:h-auto gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 dark:shadow-none font-black text-base sm:text-sm order-first sm:order-last px-6 transition-all active:scale-95">
                      <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                      <span>Daftarkan Supplier Baru</span>
                  </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-4xl border-none shadow-2xl p-6 lg:p-8">
                  <DialogHeader>
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-4">
                          <Truck className="h-6 w-6 text-indigo-600" />
                      </div>
                      <DialogTitle className="text-xl font-black tracking-tight">{editingId ? 'Edit Data Supplier' : 'Supplier Baru'}</DialogTitle>
                      <DialogDescription className="text-sm font-medium">
                          Masukkan rincian informasi partner bisnis Anda.
                      </DialogDescription>
                  </DialogHeader>
                   <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 col-span-2 sm:col-span-1">
                              <Label htmlFor="code" className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Kode Supplier</Label>
                              <Input 
                                  id="code" 
                                  className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 font-bold h-11"
                                  placeholder="DIGIFLAZZ"
                                  value={formData.code}
                                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                  required
                              />
                          </div>
                          <div className="space-y-2 col-span-2 sm:col-span-1">
                              <Label htmlFor="name" className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Nama Perusahaan</Label>
                              <Input 
                                  id="name" 
                                  className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 font-bold h-11"
                                  placeholder="PT. Digital Flazz"
                                  value={formData.name}
                                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                                  required
                              />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <Label htmlFor="contact" className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Kontak Person / WA</Label>
                          <Input 
                              id="contact" 
                              className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 font-bold h-11"
                              placeholder="0812-3456-7890"
                              value={formData.contact}
                              onChange={(e) => setFormData({...formData, contact: e.target.value})}
                          />
                      </div>

                      <div className="space-y-2">
                          <Label htmlFor="address" className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Alamat Kantor</Label>
                          <Input 
                              id="address" 
                              className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 font-bold h-11"
                              placeholder="Jakarta, Indonesia"
                              value={formData.address}
                              onChange={(e) => setFormData({...formData, address: e.target.value})}
                          />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 bg-zinc-50 dark:bg-zinc-950/50 dark:border-zinc-800">
                          <div className="space-y-0.5">
                              <Label htmlFor="isActive" className="text-sm font-black">Status Kerjasama</Label>
                              <p className="text-[10px] text-zinc-400 font-medium">
                                  {formData.isActive ? 'Aktif - Produk dapat digunakan' : 'Nonaktif - Produk disembunyikan'}
                              </p>
                          </div>
                          <Switch 
                              id="isActive"
                              checked={formData.isActive}
                              onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                          />
                      </div>
                  
                      <div className="flex flex-col gap-2 mt-6">
                          <Button type="submit" className="w-full rounded-2xl h-12 font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 dark:shadow-none" disabled={isSubmitting}>
                              {isSubmitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Daftarkan Supplier')}
                          </Button>
                          <Button 
                              type="button" 
                              variant="ghost" 
                              className="w-full rounded-2xl h-11 font-bold text-zinc-400" 
                              onClick={() => setIsDialogOpen(false)}
                              disabled={isSubmitting}
                          >
                              Batal
                          </Button>
                      </div>
                  </form>
              </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
             <div className="lg:col-span-3 order-2 sm:order-first">
                <div className="relative group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                   <Input
                       placeholder="Cari berdasarkan nama atau kode supplier..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="pl-12 w-full h-12 lg:h-14 rounded-2xl lg:rounded-3xl bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 shadow-sm focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all"
                   />
                </div>
             </div>
             <div className="flex items-center gap-2 p-1 bg-white dark:bg-zinc-900 rounded-2xl lg:rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm order-3 sm:order-last h-12 lg:h-14">
                <div className="flex-1 flex flex-col items-center">
                   <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pt-1 leading-none mb-0.5">Total</span>
                   <span className="text-sm lg:text-lg font-black leading-none pb-1">{filteredSuppliers.length}</span>
                </div>
                <div className="w-px h-8 bg-zinc-100 dark:bg-zinc-800"></div>
                <Button variant="outline" size="icon" onClick={fetchSuppliers} className="h-10 w-10 border-none bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl">
                   <RefreshCw className={`h-4 w-4 text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
             </div>
          </div>
       </div>

       {/* Content Section */}
       <div className="grid gap-6">
        <div className="hidden md:block">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden outline outline-zinc-100 dark:outline-zinc-800">
                <Table>
                    <TableHeader className="bg-zinc-50 text-zinc-500 font-black tracking-widest uppercase dark:bg-zinc-950">
                        <TableRow className="border-zinc-100 dark:border-zinc-800 text-[10px]">
                            <TableHead className="pl-10 h-14">Supplier Partner</TableHead>
                            <TableHead className="h-14">Kontak / Hubungi</TableHead>
                            <TableHead className="h-14 text-center">Produk</TableHead>
                            <TableHead className="h-14">Status</TableHead>
                            <TableHead className="h-14 text-right pr-10">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                             <TableRow>
                                <TableCell colSpan={5} className="text-center py-24 text-zinc-400 italic">Memuat data supplier...</TableCell>
                             </TableRow>
                        ) : filteredSuppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-24">
                                    <div className="flex flex-col items-center gap-3">
                                        <Truck className="h-12 w-12 opacity-10" />
                                        <p className="text-zinc-400 font-bold italic">Belum ada partner terdaftar...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSuppliers.map((s) => (
                                <TableRow key={s.id} className="border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                                    <TableCell className="pl-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-110">
                                                {s.code.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-base text-zinc-900 dark:text-zinc-100 tracking-tight">{s.name}</p>
                                                <p className="text-[10px] font-black tracking-[0.2em] text-indigo-500 uppercase">{s.code}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                                <Phone className="h-3 w-3" /> {s.contact || '-'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400">
                                                <MapPin className="h-3 w-3" /> {s.address || 'Alamat tidak diinput'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="rounded-full px-3 py-1 font-black text-[10px] gap-1.5 border-zinc-200">
                                            <Package className="h-3 w-3" /> {s._count?.products || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={`rounded-full px-4 font-black text-[9px] uppercase tracking-widest ${s.isActive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
                                            {s.isActive ? 'Active' : 'Archived'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-10">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl bg-white shadow-sm border border-zinc-100 hover:text-indigo-600 dark:bg-zinc-800 dark:border-zinc-700" onClick={() => handleEdit(s)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl bg-white shadow-sm border border-zinc-100 hover:text-red-600 dark:bg-zinc-800 dark:border-zinc-700" onClick={() => handleDelete(s.id, s.name)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>

        {/* Mobile List View - Redesigned for Premium Feel */}
        <div className="md:hidden space-y-4 px-1">
            {isLoading ? (
                <div className="flex flex-col items-center py-10 gap-4">
                    <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                    <p className="text-xs font-bold text-zinc-400">Sinkronisasi data...</p>
                </div>
            ) : filteredSuppliers.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 bg-zinc-50 rounded-3xl flex items-center justify-center">
                        <Truck className="h-8 w-8 text-zinc-200" />
                    </div>
                    <p className="text-sm font-bold text-zinc-400">Oops! Partner belum ada.</p>
                </div>
            ) : (
                filteredSuppliers.map((s) => (
                    <div key={s.id} className="relative group bg-white dark:bg-zinc-900 p-5 rounded-4xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden" onClick={() => handleEdit(s)}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-[1.25rem] bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 font-black text-xl">
                                    {s.code.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-black text-zinc-900 dark:text-zinc-50 text-base">{s.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-none px-2 text-[9px] font-black tracking-widest">{s.code}</Badge>
                                        <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-zinc-200" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 py-4 border-y border-zinc-50 dark:border-zinc-800">
                             <div className="flex flex-col gap-1">
                                <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">Kontak Partner</span>
                                <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300 truncate">{s.contact || 'No Contact'}</p>
                             </div>
                             <div className="flex flex-col gap-1">
                                <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">Total Produk</span>
                                <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{s._count?.products || 0} Item</p>
                             </div>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 rounded-xl text-red-500 font-bold text-[10px] hover:bg-red-50 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(s.id, s.name);
                                }}
                            >
                                <Trash2 className="h-3 w-3 mr-1.5" /> Hapus Partner
                            </Button>
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-full">{s.isActive ? 'OPERASIONAL' : 'ARCHIVED'}</span>
                        </div>
                    </div>
                )
            ))}
        </div>
       </div>
    </div>
  );
}
