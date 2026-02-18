'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Wallet,
  FileText,
  History,
  Settings,
  LogOut,
  HelpCircle,
  Home,
  UserCog,
  Bell,
  Search,
  Menu,
  ShoppingCart,
  Truck
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { Logo } from '@/components/logo';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from 'framer-motion';

// Full Navigation List
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'KASIR'] },
  { name: 'Transaksi', href: '/dashboard/transactions', icon: ShoppingCart, roles: ['ADMIN', 'KASIR'] },
  { name: 'Produk', href: '/dashboard/products', icon: ShoppingBag, roles: ['ADMIN'] }, 
  { name: 'Saldo', href: '/dashboard/balance', icon: Wallet, roles: ['ADMIN', 'KASIR'] },
  { name: 'Supplier', href: '/dashboard/master-data/suppliers', icon: Truck, roles: ['ADMIN'] },
  { name: 'Admin', href: '/dashboard/users', icon: Users, roles: ['ADMIN'] },
  { name: 'Laporan', href: '/dashboard/reports', icon: FileText, roles: ['ADMIN'] },
  { name: 'Audit Log', href: '/dashboard/audit', icon: History, roles: ['ADMIN'] },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, roles: ['ADMIN', 'KASIR'] },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [liveBalance, setLiveBalance] = useState<number>(user?.balance || 0);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLiveBalance(data.totalBalance.value);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    
    fetchBalance();
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, router]);

  const confirmLogout = async () => {
    try {
      // Clear token from store and redirect
      logout();
      router.push('/');
      toast({
        title: 'Logout Berhasil',
        description: 'Anda telah keluar dari sistem',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user.role)
  );

  // Bottom Nav Items (Restored to previous version)
  const bottomNavItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Transaksi', href: '/dashboard/transactions', icon: ShoppingCart },
    { name: 'Produk', href: '/dashboard/products', icon: ShoppingBag },
    { name: 'Saldo', href: '/dashboard/balance', icon: Wallet },
    { name: 'Logout', action: 'logout', icon: LogOut },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
      {/* Brand Logo */}
      <div className="p-8">
        <Link href="/dashboard" className="group block">
          <Logo className="h-20 w-20 mx-auto" variant="stacked" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.name}
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-xl text-base font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 hover:bg-indigo-700'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-900'
                }`}
              onClick={() => router.push(item.href)}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'}`} />
              <span className="flex-1 text-left">{item.name}</span>
            </Button>
          );
        })}
      </nav>

    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-black font-sans pb-20 lg:pb-0">
      <AnimatePresence>
        {showLogoutDialog && (
          <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
            <AlertDialogContent className="rounded-3xl p-8 border-none shadow-2xl">
              <AlertDialogHeader>
                <div className="mx-auto w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6">
                  <LogOut className="w-10 h-10" />
                </div>
                <AlertDialogTitle className="text-2xl font-bold text-center">Sudah Selesai?</AlertDialogTitle>
                <AlertDialogDescription className="text-center text-base text-zinc-500">
                  Apakah Anda yakin ingin keluar dari sistem? Semua sesi aktif akan dihentikan demi keamanan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-8 flex-col sm:flex-row gap-3">
                <AlertDialogCancel className="h-12 rounded-2xl font-bold border-zinc-100 hover:bg-zinc-50 mt-0">
                  Kembali
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmLogout}
                  className="h-12 rounded-2xl font-bold bg-red-500 hover:bg-red-600 text-white border-none shadow-lg shadow-red-100"
                >
                  Ya, Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </AnimatePresence>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/50 px-6 py-3 flex items-center justify-between shadow-sm">
            <Link href="/dashboard" className="flex items-center gap-2">
                <Logo className="h-8 w-8" showText={true} />
            </Link>
            <div className="flex flex-col items-end">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tight">Total Saldo</span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(liveBalance)}
                </span>
            </div>
      </div>

      <div className="flex pt-[68px] lg:pt-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-80 h-screen sticky top-0 flex-col bg-white">
          <SidebarContent />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-0 min-h-screen">
          {/* Desktop Header */}
          <header className="hidden lg:flex sticky top-0 z-40 bg-[#F8F9FC]/80 backdrop-blur-md dark:bg-black/80 px-8 py-5 items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    Welcome back, {user.name.split(' ')[0]}!
                </h1>
                <p className="text-zinc-500 text-sm mt-1">
                    It is the best time to manage your finances
                </p>
            </div>

                <div className="flex items-center gap-4">
                    {/* Integrated Balance Display */}
                    <div className="hidden lg:flex flex-col items-end mr-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Total Saldo</span>
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 leading-none">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(liveBalance)}
                        </span>
                    </div>

                    <div className="flex items-center relative">
                        <Search className="w-4 h-4 absolute left-3 text-zinc-400" />
                        <Input 
                            placeholder="Search..." 
                            className="pl-10 w-64 rounded-full bg-white border-none shadow-sm dark:bg-zinc-900"
                        />
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm dark:bg-zinc-900 text-zinc-500">
                        <Bell className="w-5 h-5" />
                    </Button>
                <div className="flex items-center gap-3 pl-2">
                    <Button 
                      variant="ghost" 
                      className="gap-2 text-zinc-500 hover:text-red-600 font-bold"
                      onClick={() => setShowLogoutDialog(true)}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </Button>
                </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-4 lg:p-10 lg:pt-4">
            {children}
          </div>
        </main>
      </div>

      <div className="lg:hidden fixed bottom-6 left-2 right-2 bg-indigo-600 dark:bg-indigo-700 backdrop-blur-xl border border-white/20 flex justify-around items-center px-2 py-5 z-50 rounded-4xl shadow-[0_20px_50px_-12px_rgba(79,70,229,0.4)]">
        {bottomNavItems.map((item: any) => {
           const isActive = pathname === item.href;
           
           if (item.action === 'logout') {
             return (
               <button
                  key={item.name}
                  onClick={() => setShowLogoutDialog(true)}
                  className="flex flex-col items-center justify-center relative px-3 py-1.5 transition-all duration-300 min-w-[64px] text-white"
               >
                  <item.icon className="h-5 w-5 stroke-2 opacity-90 text-red-300" />
                  <span className="text-[8px] font-black mt-1 tracking-tighter uppercase opacity-80">
                      {item.name}
                  </span>
               </button>
             );
           }

           return (
             <Link 
                key={item.name} 
                href={item.href}
                className={`flex flex-col items-center justify-center relative px-3 py-1.5 transition-all duration-300 min-w-[64px] ${isActive ? 'text-indigo-600' : 'text-white'}`}
             >
                {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white rounded-2xl -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <item.icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2 opacity-90'}`} />
                <span className={`text-[8px] font-black mt-1 tracking-tighter uppercase transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-80'}`}>
                    {item.name}
                </span>
             </Link>
           );
        })}
      </div>
    </div>
  );
}
