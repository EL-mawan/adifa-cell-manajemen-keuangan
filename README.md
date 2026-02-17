# 🏪 Adifa Cell - Sistem Manajemen Keuangan PPOB

Sistem manajemen keuangan lengkap untuk agen pembayaran PPOB (Payment Point Online Bank) dengan fitur transaksi, manajemen saldo, laporan keuangan, dan audit trail.

## ✨ Fitur Utama

### 🔐 Authentication & Authorization
- Login & Logout dengan JWT
- Role-based access control (Admin & Kasir)
- Session management yang aman

### 📊 Dashboard
- Total Saldo Agen
- Total Transaksi Hari Ini
- Total Keuntungan Hari Ini
- Grafik Transaksi 7 Hari Terakhir
- Top Produk Terlaris
- Notifikasi Saldo Minimum

### 💼 Master Data
- **Data Produk PPOB**: Pulsa, Paket Data, PLN, PDAM, BPJS, dll
- **Data Supplier**: Manajemen penyedia layanan
- **Fee per Produk**: Konfigurasi fee dan keuntungan
- **Data User**: Manajemen admin dan kasir

### 💳 Transaksi
- Input transaksi baru
- Pilih produk dan input nomor pelanggan
- Perhitungan otomatis: harga modal, fee, dan keuntungan
- Status tracking: Sukses / Pending / Gagal
- Cetak Struk (PDF)

### 💰 Manajemen Saldo
- Top Up Saldo
- Riwayat Mutasi Saldo
- Alert otomatis jika saldo < minimum

### 📈 Laporan Keuangan
- Laporan Harian
- Laporan Bulanan
- Export PDF & Excel
- Rekapitulasi: Total Modal, Penjualan, Fee, Profit

### 🔍 Audit & Tracking
- Log aktivitas user lengkap
- Filter berdasarkan tanggal, modul, dan aksi
- Tracking transaksi bermasalah

### 🎨 UI/UX
- Modern fintech dashboard
- Sidebar navigation yang responsif
- Dark mode support
- Animasi dan transisi smooth
- Tabel dengan search & filter

## 🛠️ Technology Stack

### Core Framework
- **⚡ Next.js 16** - React framework dengan App Router
- **📘 TypeScript 5** - Type-safe development
- **🎨 Tailwind CSS 4** - Utility-first CSS framework
- **🧩 shadcn/ui** - High-quality UI components

### Database & Auth
- **🗄️ Prisma** - Next-generation TypeScript ORM
- **🔐 JWT** - Secure authentication
- **🔒 bcryptjs** - Password hashing

### State & Data
- **🐻 Zustand** - State management
- **🔄 TanStack Query** - Data synchronization
- **📊 Recharts** - Chart library

### Export & Utils
- **📄 jsPDF** - PDF generation
- **📊 jspdf-autotable** - PDF tables
- **📈 xlsx** - Excel export

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ atau Bun
- SQLite (included)

### Installation

```bash
# Install dependencies
bun install

# Setup database
bun run db:push

# Seed initial data (optional, but recommended)
bun run prisma/seed.ts

# Start development server
bun run dev
```

### Default Login Credentials

Setelah menjalankan seed script, Anda dapat login dengan:

**Admin:**
- Email: `admin@adifacell.com`
- Password: `admin123`

**Kasir:**
- Email: `kasir@adifacell.com`
- Password: `kasir123`

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── balance/           # Balance management
│   │   ├── dashboard/         # Dashboard stats
│   │   ├── products/          # Product management
│   │   ├── transactions/      # Transaction handling
│   │   ├── reports/           # Financial reports
│   │   ├── audit/             # Audit logs
│   │   └── users/             # User management
│   ├── dashboard/             # Dashboard pages
│   │   ├── page.tsx          # Main dashboard
│   │   ├── transactions/     # Transaction module
│   │   ├── balance/          # Balance management
│   │   ├── reports/          # Financial reports
│   │   ├── audit/            # Audit logs
│   │   ├── products/         # Product management
│   │   ├── master-data/      # Master data overview
│   │   └── settings/         # Settings
│   ├── layout.tsx            # Root layout with theme provider
│   └── page.tsx              # Login page
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── theme-provider.tsx    # Theme context
├── lib/
│   ├── auth-api.ts          # API auth utilities
│   ├── db.ts                # Prisma client
│   ├── jwt.ts               # JWT utilities
│   ├── store/
│   │   └── auth.ts          # Auth state management
│   └── utils.ts             # Utility functions
└── hooks/
    ├── use-mobile.ts        # Mobile detection
    └── use-toast.ts         # Toast notifications

prisma/
├── schema.prisma            # Database schema
└── seed.ts                 # Initial data seeding
```

## 🗄️ Database Schema

### Tables
- **users** - User accounts (admin & kasir)
- **products** - PPOB products
- **suppliers** - Product suppliers
- **transactions** - Transaction records
- **balance_logs** - Balance mutations
- **activity_logs** - User activity tracking
- **system_settings** - System configuration

### Key Relations
- Transaction → Product & User
- Balance Log → User
- Activity Log → User
- Product → Supplier

## 🔒 Security Features

- Password hashing dengan bcryptjs
- JWT-based authentication
- Role-based access control
- Protected API routes
- Activity logging untuk audit

## 🐳 Docker Deployment

### Build & Run with Docker

```bash
# Build Docker image
docker build -t adifa-cell .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="file:./db/custom.db" \
  -e JWT_SECRET="your-secret-key" \
  adifa-cell
```

### Environment Variables

Lihat file `.env.example` untuk semua environment variables yang diperlukan:

```bash
cp .env.example .env
# Edit .env dengan konfigurasi Anda
```

## 📊 Available API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/[id]` - Get transaction details

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product (Admin only)

### Balance
- `GET /api/balance` - Get balance logs
- `POST /api/balance` - Top up balance

### Reports
- `GET /api/reports` - Financial reports (Admin only)

### Audit
- `GET /api/audit` - Activity logs (Admin only)

### Users
- `GET /api/users` - List users (Admin only)
- `POST /api/users` - Create user (Admin only)

## 🎨 UI Design

### Color Scheme
- **Primary**: Blue (biru tua) - Trust & professionalism
- **Secondary**: Emerald (hijau) - Success & growth
- **Accent**: Purple, Orange - Visual hierarchy
- **Background**: Clean white with dark mode support

### Design Principles
- Modern fintech aesthetic
- High contrast for readability
- Consistent spacing and typography
- Smooth animations and transitions
- Mobile-first responsive design

## 🤝 Role Permissions

### Admin
- Full access to all features
- Manage products and suppliers
- Manage users and their permissions
- Access financial reports
- View audit logs
- System settings

### Kasir
- Create transactions
- View transaction history
- Manage own balance
- View basic dashboard
- No access to reports or settings

## 📝 Development

### Available Scripts

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run ESLint
bun run db:push      # Push database schema
bun run db:generate  # Generate Prisma Client
bun run db:reset     # Reset database
```

### Code Quality

```bash
# Lint code
bun run lint

# Type check
bunx tsc --noEmit
```

## 🚀 Production Deployment

### Environment Setup

1. Set production environment variables
2. Generate a secure JWT_SECRET
3. Configure DATABASE_URL for production database
4. Set up SSL/HTTPS

### Build

```bash
bun run build
```

### Run

```bash
bun start
```

## 📄 License

This project is proprietary and confidential.

## 👥 Support

For support and questions, please contact the Adifa Cell team.

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
