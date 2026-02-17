'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Lock, 
  Bell, 
  Palette, 
  Store, 
  ShieldCheck, 
  Smartphone,
  ChevronRight,
  Save,
  Moon,
  Sun,
  Laptop,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Akun Saya', icon: User, description: 'Kelola informasi profil personal Anda' },
    { id: 'security', name: 'Keamanan', icon: Lock, description: 'Perbarui kata sandi dan keamanan akun' },
    { id: 'appearance', name: 'Tampilan', icon: Palette, description: 'Sesuaikan tema dan gaya aplikasi' },
    { id: 'store', name: 'Informasi Toko', icon: Store, description: 'Detail bisnis dan alamat operasional' },
  ];

  const handleSave = () => {
    toast({
      title: "Pengaturan Disimpan",
      description: "Perubahan Anda telah berhasil diperbarui.",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 lg:space-y-8 pb-24 lg:pb-8">
      {/* Header Section - More compact on mobile */}
      <div className="flex flex-col gap-0.5 lg:gap-2 px-1 lg:px-0">
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Pengaturan</h1>
        <p className="text-xs lg:text-sm text-zinc-500 dark:text-zinc-400">Konfigurasi akun dan preferensi aplikasi Anda di sini.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-4 lg:gap-8 items-start">
        {/* Navigation Tabs - Refined for both mobile and desktop */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-2">
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 snap-x">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 lg:gap-4 px-3 py-2.5 lg:py-4 rounded-2xl lg:rounded-3xl transition-all duration-300 min-w-max lg:min-w-0 text-left group shrink-0 snap-start
                  ${activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-lg lg:shadow-xl shadow-indigo-200 dark:shadow-none lg:translate-x-1' 
                    : 'bg-white dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-100 dark:border-zinc-800'
                  }`}
              >
                <div className={`p-1.5 lg:p-2 rounded-xl lg:rounded-2xl transition-colors ${activeTab === tab.id ? 'bg-white/20' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                  <tab.icon className="h-3.5 w-3.5 lg:h-5 lg:w-5" />
                </div>
                <div className="flex-1 pr-1 lg:pr-0">
                  <p className={`font-black text-[11px] lg:text-sm tracking-tight ${activeTab === tab.id ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {tab.name}
                  </p>
                  <p className={`text-[9px] lg:text-[10px] hidden lg:block font-medium ${activeTab === tab.id ? 'text-indigo-100' : 'text-zinc-400'}`}>
                    {tab.description}
                  </p>
                </div>
                {activeTab !== tab.id && (
                  <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'profile' && (
              <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden outline outline-zinc-100 dark:outline-zinc-800">
                <CardHeader className="p-4 lg:p-8 pb-3 lg:pb-4">
                  <CardTitle className="text-lg lg:text-xl font-black">Profil Personal</CardTitle>
                  <CardDescription className="text-xs lg:text-sm">Informasi ini akan digunakan untuk identifikasi akun Anda.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 lg:p-8 pt-0 space-y-4 lg:space-y-8">
                  <div className="flex flex-col sm:flex-row gap-4 lg:gap-8 items-center lg:items-start py-4 lg:py-8 border-b border-zinc-50 dark:border-zinc-800">
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-4xl bg-linear-to-br from-indigo-50 to-white dark:from-indigo-900/10 dark:to-zinc-900 flex items-center justify-center border-2 border-dashed border-indigo-200 dark:border-indigo-800 group-hover:border-indigo-500 transition-all duration-300">
                        <User className="h-10 w-10 lg:h-14 lg:w-14 text-indigo-500" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 text-white rounded-xl shadow-lg border-2 border-white dark:border-zinc-900">
                        <Smartphone className="h-3 w-3 lg:h-4 lg:w-4" />
                      </div>
                    </div>
                    <div className="text-center sm:text-left pt-2">
                      <h4 className="font-black text-xl lg:text-2xl text-zinc-900 dark:text-zinc-100 tracking-tight">{user?.name}</h4>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                         <span className="px-3 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                            {user?.role}
                         </span>
                         <span className="px-3 py-1 bg-zinc-50 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                            Verified Account
                         </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
                    <div className="space-y-1.5 lg:space-y-2">
                      <Label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">Nama Lengkap</Label>
                      <Input defaultValue={user?.name} className="rounded-2xl h-10 lg:h-12 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 transition-all font-bold" />
                    </div>
                    <div className="space-y-1.5 lg:space-y-2">
                      <Label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">Email Utama</Label>
                      <Input defaultValue={user?.email} disabled className="rounded-2xl h-10 lg:h-12 border-zinc-100 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 opacity-60 font-bold" />
                    </div>
                    <div className="space-y-1.5 lg:space-y-2">
                      <Label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">Nomor HP</Label>
                      <Input placeholder="0812xxxx" className="rounded-2xl h-10 lg:h-12 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 transition-all font-bold" />
                    </div>
                    <div className="space-y-1.5 lg:space-y-2">
                      <Label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">Provinsi</Label>
                      <Input placeholder="Pilih Provinsi" className="rounded-2xl h-10 lg:h-12 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 transition-all font-bold" />
                    </div>
                  </div>

                  <div className="pt-2 lg:pt-6">
                    <Button onClick={handleSave} className="w-full h-10 lg:h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black gap-2 shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-[0.98]">
                      <Save className="h-4 w-4" />
                      Simpan Perubahan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden outline outline-zinc-100 dark:outline-zinc-800">
                <CardHeader className="p-4 lg:p-8 pb-3 lg:pb-4">
                  <div className="flex items-center gap-3 mb-1 lg:mb-2">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                      <ShieldCheck className="h-6 w-6 text-emerald-500" />
                    </div>
                    <CardTitle className="text-lg lg:text-xl font-black">Kata Sandi & Keamanan</CardTitle>
                  </div>
                  <CardDescription className="text-xs lg:text-sm">Jaga keamanan akun Anda dengan memperbarui password secara berkala.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 lg:p-8 pt-0 space-y-6 lg:space-y-8">
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-1.5 lg:space-y-2">
                      <Label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">Password Lama</Label>
                      <Input type="password" placeholder="••••••••" className="rounded-2xl h-11 lg:h-12 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 font-bold" />
                    </div>
                    <div className="space-y-1.5 lg:space-y-2">
                      <Label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">Password Baru</Label>
                      <Input type="password" placeholder="••••••••" className="rounded-2xl h-11 lg:h-12 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 font-bold" />
                    </div>
                    <div className="space-y-1.5 lg:space-y-2">
                      <Label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">Konfirmasi Password</Label>
                      <Input type="password" placeholder="••••••••" className="rounded-2xl h-11 lg:h-12 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 font-bold" />
                    </div>
                  </div>
                  <div className="pt-2 lg:pt-6">
                    <Button onClick={handleSave} className="w-full lg:w-auto h-10 lg:h-12 px-10 rounded-2xl bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 font-black transition-all active:scale-[0.98]">
                      Perbarui Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'appearance' && (
              <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden outline outline-zinc-100 dark:outline-zinc-800">
                <CardHeader className="p-4 lg:p-8 pb-3 lg:pb-4">
                  <CardTitle className="text-lg lg:text-xl font-black">Tema & Tampilan</CardTitle>
                  <CardDescription className="text-xs lg:text-sm">Pilih gaya visual yang paling nyaman untuk Anda gunakan.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 lg:p-8 pt-0 space-y-6 lg:space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                    {[
                      { id: 'light', name: 'Light Mode', icon: Sun, desc: 'Tampilan cerah & bersih' },
                      { id: 'dark', name: 'Dark Mode', icon: Moon, desc: 'Hemat baterai & mata' },
                      { id: 'system', name: 'System', icon: Laptop, desc: 'Ikuti setelan perangkat' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setTheme(mode.id)}
                        className={`flex items-center sm:flex-col gap-4 sm:gap-3 p-4 lg:p-6 rounded-2xl lg:rounded-3xl border-2 transition-all duration-300 text-left sm:text-center
                          ${theme === mode.id 
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                            : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                          }`}
                      >
                        <div className={`p-2 lg:p-3 rounded-xl ${theme === mode.id ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                           <mode.icon className="h-5 w-5 lg:h-6 lg:w-6" />
                        </div>
                        <div>
                          <p className={`text-xs lg:text-sm font-black ${theme === mode.id ? 'text-indigo-900 dark:text-indigo-200' : 'text-zinc-900 dark:text-zinc-100'}`}>
                            {mode.name}
                          </p>
                          <p className={`text-[10px] font-medium sm:hidden lg:block mt-0.5 ${theme === mode.id ? 'text-indigo-600' : 'text-zinc-400'}`}>
                            {mode.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-zinc-50 dark:border-zinc-800">
                    <h4 className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">Push Notifications</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 flex items-center justify-center transition-transform group-hover:scale-110">
                              <Bell className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xs lg:text-sm font-black">Alert Saldo Rendah</p>
                              <p className="text-[10px] text-zinc-500 font-medium">Beri tahu jika saldo di bawah Rp 100.000</p>
                            </div>
                          </div>
                          <div className="w-10 h-5 bg-indigo-600 rounded-full relative">
                            <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-110">
                              <Zap className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xs lg:text-sm font-black">Laporan Harian</p>
                              <p className="text-[10px] text-zinc-500 font-medium">Kirim ringkasan transaksi setiap jam 21:00</p>
                            </div>
                          </div>
                          <div className="w-10 h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full relative">
                            <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'store' && (
              <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden outline outline-zinc-100 dark:outline-zinc-800">
                <CardHeader className="p-4 lg:p-8 pb-3 lg:pb-4">
                  <div className="flex items-center gap-3 mb-1 lg:mb-2">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
                      <Store className="h-6 w-6 text-indigo-600" />
                    </div>
                    <CardTitle className="text-lg lg:text-xl font-black">Informasi Toko</CardTitle>
                  </div>
                  <CardDescription className="text-xs lg:text-sm">Detail ini akan muncul pada struk dan laporan transaksi.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 lg:p-8 pt-0 space-y-6 lg:space-y-8">
                  <div className="grid gap-4 lg:gap-6">
                    <div className="space-y-1.5 lg:space-y-2">
                      <Label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">Nama Toko / Outlet</Label>
                      <Input placeholder="ADIFA CELL" className="rounded-2xl h-10 lg:h-12 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 font-bold" />
                    </div>
                    <div className="space-y-1.5 lg:space-y-2">
                      <Label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">Alamat Lengkap</Label>
                      <Input placeholder="Jl. Raya Utama No. 123..." className="rounded-2xl h-10 lg:h-12 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 lg:gap-6">
                      <div className="space-y-1.5 lg:space-y-2">
                        <Label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">Kota / Kab</Label>
                        <Input placeholder="Kota" className="rounded-2xl h-10 lg:h-12 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 font-bold" />
                      </div>
                      <div className="space-y-1.5 lg:space-y-2">
                        <Label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">Kode POS</Label>
                        <Input placeholder="12345" className="rounded-2xl h-10 lg:h-12 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 font-bold" />
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 lg:pt-6">
                    <Button onClick={handleSave} className="w-full h-10 lg:h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-[0.98]">
                      Simpan Data Toko
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
