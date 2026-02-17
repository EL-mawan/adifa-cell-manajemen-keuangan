# Adifa Cell - Manajemen Keuangan PPOB

Sistem manajemen keuangan untuk agen pembayaran PPOB (Payment Point Online Bank) yang modern, cepat, dan mudah digunakan.

## ✨ Fitur Utama

- 📊 **Dashboard Real-time** - Monitoring transaksi dan profit secara langsung
- 💰 **Manajemen Saldo** - Top-up dan tracking mutasi saldo otomatis
- 📱 **Transaksi PPOB** - Pulsa, paket data, token listrik, dll
- 📈 **Laporan Keuangan** - Export PDF & Excel dengan filter tanggal
- 👥 **Multi-User** - Role Admin & Kasir dengan permission berbeda
- 🔒 **Keamanan** - JWT Authentication & Activity Logging
- 📲 **PWA Support** - Install sebagai aplikasi di HP/Desktop
- 🌙 **Dark Mode** - Tema gelap untuk kenyamanan mata

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Turso (LibSQL/SQLite Cloud)
- **ORM**: Prisma
- **Runtime**: Bun
- **UI**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Auth**: JWT

## 📦 Instalasi Lokal

```bash
# Clone repository
git clone https://github.com/EL-mawan/adifa-cell-manajemen-keuangan.git
cd adifa-cell-manajemen-keuangan

# Install dependencies
bun install

# Setup database
cp .env.example .env
# Edit .env dengan konfigurasi Anda

# Generate Prisma Client
bunx prisma generate

# Push schema ke database
bunx prisma db push

# Seed data awal (opsional)
bunx prisma db seed

# Run development server
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Login Default
- **Email**: `admin@adifacell.com`
- **Password**: `admin123`

## 🌐 Deployment

Lihat panduan lengkap di [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Rekomendasi**: Vercel + Turso (Gratis & Mudah)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/EL-mawan/adifa-cell-manajemen-keuangan)

## 📱 PWA Installation

Aplikasi ini dapat diinstall sebagai aplikasi native di:
- **Android**: Chrome → Menu (⋮) → "Install app"
- **iOS**: Safari → Share → "Add to Home Screen"
- **Desktop**: Chrome → Address bar → Install icon

## 📸 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Transaksi
![Transactions](docs/screenshots/transactions.png)

### Laporan Keuangan
![Reports](docs/screenshots/reports.png)

## 🔧 Development

```bash
# Run dev server
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Lint code
bun run lint

# Database commands
bunx prisma studio        # Open Prisma Studio
bunx prisma db push       # Push schema changes
bunx prisma generate      # Generate Prisma Client
```

## 📁 Struktur Project

```
adifa-cell/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API Routes
│   │   ├── dashboard/    # Dashboard Pages
│   │   └── page.tsx      # Landing Page
│   ├── components/       # React Components
│   ├── lib/              # Utilities & Config
│   └── hooks/            # Custom React Hooks
├── prisma/
│   └── schema.prisma     # Database Schema
├── public/               # Static Assets
└── .env.example          # Environment Variables Template
```

## 🔐 Environment Variables

```env
# Database (Turso)
DATABASE_URL="libsql://[your-db].turso.io"
TURSO_AUTH_TOKEN="your-token"

# JWT
JWT_SECRET="your-secret-key"

# App
NEXT_PUBLIC_APP_NAME="Adifa Cell"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**EL-mawan**
- GitHub: [@EL-mawan](https://github.com/EL-mawan)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Turso](https://turso.tech/)
- [Prisma](https://www.prisma.io/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Bun](https://bun.sh/)

---

⭐ Jika project ini membantu Anda, berikan star di GitHub!
