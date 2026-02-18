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
import { Plus, RefreshCw, Search, Edit, Trash2, User, UserPlus } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'KASIR';
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { token, user } = useAuthStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog & Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN', // Default Fixed
    balance: '0',
    isActive: true,
    date: new Date().toISOString().split('T')[0],
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Gagal mengambil data user');
      
      setUsers(data.users || []);
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
    fetchUsers();
  }, [token]);

  // Filter Users
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'ADMIN',
      balance: '0',
      isActive: true,
      date: new Date().toISOString().split('T')[0],
    });
    setEditingId(null);
  };

  const handleEdit = (user: UserData) => {
    if (user.email === 'admin@adifacell.com') {
      toast({
        title: 'Akses Dibatasi',
        description: 'Akun Administrator Utama tidak dapat diubah melalui menu ini.',
        variant: 'destructive',
      });
      return;
    }

    setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: 'ADMIN',
        balance: user.balance.toString(),
        isActive: user.isActive,
        date: new Date(user.createdAt).toISOString().split('T')[0],
    });
    setEditingId(user.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    // Note: Delete button is hidden from UI as per previous request, 
    // but logic kept if needed in future.
    if (id === user?.id) {
        toast({ title: 'Gagal', description: 'Tidak dapat menghapus akun sendiri', variant: 'destructive' });
        return;
    }
    
    if (!confirm(`Apakah Anda yakin ingin menghapus user ${name}?`)) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Gagal menghapus user');

      toast({
        title: 'User Dihapus',
        description: `${name} berhasil dihapus`,
      });
      fetchUsers();
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
      const url = editingId ? `/api/users/${editingId}` : '/api/users';
      const method = editingId ? 'PATCH' : 'POST';

      const body: any = {
        name: formData.name,
        email: formData.email,
        role: 'ADMIN',
        balance: parseFloat(formData.balance) || 0,
        isActive: formData.isActive,
        date: formData.date ? new Date(formData.date).toISOString() : undefined,
      };

      if (formData.password) {
        body.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan data');

      toast({
        title: editingId ? 'User Diperbarui' : 'User Ditambahkan',
        description: `${formData.name} telah disimpan`,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchUsers();
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Admin Adifa Cell</h1>
        <p className="text-zinc-500 mt-1 hidden md:block">
          Kelola daftar administrator sistem
        </p>
      </div>

       {/* Action Bar */}
       <div className="flex flex-col sm:flex-row gap-4 mb-6 px-1 lg:px-0">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
          }}>
              <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto h-12 sm:h-auto gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 dark:shadow-none font-bold text-base sm:text-sm order-first sm:order-last px-6 transition-all active:scale-95">
                      <UserPlus className="h-5 w-5 sm:h-4 sm:w-4" />
                      <span>Tambah Admin Baru</span>
                  </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl">
                  <DialogHeader>
                      <DialogTitle>{editingId ? 'Edit Data Admin' : 'Admin Baru'}</DialogTitle>
                      <DialogDescription>
                          Lengkapi form berikut sesuai kolom data user.
                      </DialogDescription>
                  </DialogHeader>
                   <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                      {/* Tanggal */}
                      <div className="space-y-2">
                          <Label htmlFor="date" className="text-zinc-600">Tanggal Daftar</Label>
                          <Input 
                              id="date" 
                              type="date"
                              className="rounded-xl bg-zinc-50 border-zinc-200 focus:bg-white transition-all h-11"
                              value={formData.date}
                              onChange={(e) => setFormData({...formData, date: e.target.value})}
                              required
                          />
                      </div>
                      
                      {/* 1. Nama */}
                      <div className="space-y-2">
                          <Label htmlFor="name" className="text-zinc-600">Nama Lengkap</Label>
                          <Input 
                              id="name" 
                              className="rounded-xl bg-zinc-50 border-zinc-200 focus:bg-white transition-all h-11"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              required
                          />
                      </div>

                      {/* 2. Email */}
                      <div className="space-y-2">
                          <Label htmlFor="email" className="text-zinc-600">Email Login</Label>
                          <Input 
                              id="email" 
                              type="email"
                              className="rounded-xl bg-zinc-50 border-zinc-200 focus:bg-white transition-all h-11"
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              required
                          />
                      </div>

                      {/* 3. Saldo */}
                      <div className="space-y-2">
                          <Label htmlFor="balance" className="text-zinc-600">Saldo Awal (Rp)</Label>
                          <Input 
                              id="balance"
                              type="number"
                              className="rounded-xl bg-zinc-50 border-zinc-200 focus:bg-white transition-all h-11"
                              value={formData.balance}
                              onChange={(e) => setFormData({...formData, balance: e.target.value})}
                          />
                      </div>

                      {/* 4. Status (Switch) */}
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-zinc-50">
                          <div className="space-y-0.5">
                              <Label htmlFor="isActive" className="text-base">Status Akun</Label>
                              <p className="text-xs text-muted-foreground">
                                  {formData.isActive ? 'Admin dapat login' : 'Akses ditangguhkan'}
                              </p>
                          </div>
                          <Switch 
                              id="isActive"
                              checked={formData.isActive}
                              onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                          />
                      </div>

                      {/* 5. Password (Terakhir/Privasi) */}
                      <div className="space-y-2 pt-2 border-t mt-2">
                          <Label htmlFor="password" className="text-zinc-600">Password {editingId && '(Opsional)'}</Label>
                          <Input 
                              id="password" 
                              type="password"
                              className="rounded-xl bg-zinc-50 border-zinc-200 focus:bg-white transition-all h-11"
                              placeholder={editingId ? "Biarkan kosong jika tetap" : "Password baru"}
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              required={!editingId}
                          />
                      </div>
                  
                      <div className="flex flex-col gap-2 mt-4">
                          <Button type="submit" className="w-full rounded-xl h-11 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg" disabled={isSubmitting}>
                              {isSubmitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Buat Akun Admin')}
                          </Button>
                          <Button 
                              type="button" 
                              variant="ghost" 
                              className="w-full rounded-xl h-11 font-bold text-zinc-400" 
                              onClick={() => setIsDialogOpen(false)}
                              disabled={isSubmitting}
                          >
                              Batal
                          </Button>
                      </div>
                  </form>
              </DialogContent>
          </Dialog>

          <div className="flex-1 flex gap-2 order-2 sm:order-first">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari admin..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full h-12 lg:h-10 rounded-xl bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 shadow-sm"
                />
            </div>
            <Button variant="outline" size="icon" onClick={fetchUsers} className="rounded-2xl h-12 sm:h-10 w-12 sm:w-10 border-zinc-100 bg-white dark:bg-zinc-800 shadow-sm shrink-0 transition-all active:scale-95">
                <RefreshCw className={`h-4 w-4 text-zinc-600 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
       </div>

       {/* Filters & Content */}
       <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4 hidden md:flex">
          <div>
            <CardTitle className="text-lg font-bold">Daftar Admin</CardTitle>
            <CardDescription>
              {filteredUsers.length} akun terdaftar
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
           {/* Desktop Table View */}
           <div className="hidden md:block border-t border-zinc-100 dark:border-zinc-800">
                <Table>
                    <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                        <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                            <TableHead className="pl-6 h-12 text-zinc-500 font-medium">Nama Admin</TableHead>
                            <TableHead className="h-12 text-zinc-500 font-medium">Email</TableHead>
                            <TableHead className="h-12 text-zinc-500 font-medium">Saldo Dompet</TableHead>
                            <TableHead className="h-12 text-zinc-500 font-medium">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                             <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-zinc-400">Memuat data...</TableCell>
                             </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-zinc-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <User className="h-8 w-8 opacity-20" />
                                        <span>Tidak ada admin ditemukan</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((u) => (
                                <TableRow key={u.id} className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer" onClick={() => handleEdit(u)}>
                                    <TableCell className="pl-6 font-medium text-zinc-900 dark:text-zinc-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                {u.name.charAt(0)}
                                            </div>
                                            {u.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-zinc-600 dark:text-zinc-400">{u.email}</TableCell>
                                    <TableCell className="text-zinc-900 dark:text-zinc-100 font-medium">{formatCurrency(u.balance)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className={`rounded-full px-3 font-normal ${u.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                              {u.isActive ? 'Active' : 'Inactive'}
                                          </Badge>
                                          {u.email === 'admin@adifacell.com' && (
                                            <div className="text-zinc-400" title="Akun Terkunci">
                                              <Edit className="h-3 w-3 opacity-20" />
                                            </div>
                                          )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
           </div>

           {/* Mobile List View */}
           <div className="md:hidden px-4 pb-4 space-y-3">
                {isLoading ? (
                     <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400">
                        <div className="flex flex-col items-center gap-2">
                            <User className="h-8 w-8 opacity-20" />
                            <span>Tidak ada admin ditemukan</span>
                        </div>
                    </div>
                ) : (
                    filteredUsers.map((u) => (
                        <div key={u.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl flex items-center justify-between" onClick={() => handleEdit(u)}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-700 flex items-center justify-center text-indigo-600 font-bold shadow-sm">
                                    {u.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{u.name}</p>
                                    <p className="text-xs text-zinc-500">{u.email}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{formatCurrency(u.balance)}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                    {u.isActive ? 'Active' : 'Inactive'}
                                </span>
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
