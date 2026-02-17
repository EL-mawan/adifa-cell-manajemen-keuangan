'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth';
import { useRouter } from 'next/navigation';
import { Package, Truck, Users, Database, ArrowRight } from 'lucide-react';

export default function MasterDataPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const masterDataItems = [
    {
      title: 'Produk PPOB',
      description: 'Kelola semua produk PPOB seperti pulsa, paket data, PLN, BPJS, dll.',
      icon: Package,
      color: 'from-blue-600 to-blue-700',
      path: '/dashboard/products',
      accessibleBy: ['ADMIN', 'KASIR'],
    },
    {
      title: 'Supplier',
      description: 'Kelola data supplier atau penyedia layanan PPOB.',
      icon: Truck,
      color: 'from-emerald-600 to-emerald-700',
      path: '/dashboard/master-data/suppliers',
      accessibleBy: ['ADMIN'],
    },
    {
      title: 'Pengguna',
      description: 'Kelola data pengguna (admin dan kasir) dan hak akses.',
      icon: Users,
      color: 'from-purple-600 to-purple-700',
      path: '/dashboard/master-data/users',
      accessibleBy: ['ADMIN'],
    },
    {
      title: 'Fee Produk',
      description: 'Atur fee dan keuntungan untuk setiap produk.',
      icon: Database,
      color: 'from-orange-600 to-orange-700',
      path: '/dashboard/products',
      accessibleBy: ['ADMIN'],
    },
  ];

  const accessibleItems = masterDataItems.filter((item) =>
    item.accessibleBy.includes(user?.role || '')
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Master Data</h1>
        <p className="text-muted-foreground mt-1">
          Kelola data master dan konfigurasi sistem
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {accessibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.title}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => router.push(item.path)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${item.color} text-white mb-2`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription className="mt-2">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  Kelola {item.title}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {accessibleItems.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              Anda tidak memiliki akses ke halaman ini
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
