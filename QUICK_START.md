# 🚀 Quick Start Guide - Adifa Cell

## ⚡ Start Development

```bash
# Terminal 1: Start development server
bun run dev

# Terminal 2: Open Prisma Studio (optional)
bunx prisma studio
```

## 🔐 Login ke Aplikasi

Buka browser: **http://localhost:3000**

### Admin
- Email: `admin@adifacell.com`
- Password: `admin123`

### Kasir
- Email: `kasir@adifacell.com`
- Password: `kasir123`

## 🗄️ Database Management

**Prisma Studio**: http://localhost:5555

### Query Database Langsung
```bash
# Lihat semua users
sqlite3 db/custom.db "SELECT * FROM User;"

# Lihat semua products
sqlite3 db/custom.db "SELECT * FROM Product;"

# Lihat transactions
sqlite3 db/custom.db "SELECT * FROM Transaction;"
```

## 🔄 Reset Database

```bash
# Reset dan seed ulang
bun run db:reset
bun run prisma/seed.ts
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product (Admin)

### Balance
- `GET /api/balance` - Balance logs
- `POST /api/balance` - Top up

### Reports
- `GET /api/reports` - Financial reports (Admin)

### Audit
- `GET /api/audit` - Activity logs (Admin)

## 🛠️ Troubleshooting

### Port sudah digunakan
```bash
# Cek process di port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Atau gunakan port lain
PORT=3001 bun run dev
```

### Database error
```bash
# Generate Prisma Client
bun run db:generate

# Push schema
bun run db:push
```

### Clear cache
```bash
# Hapus .next folder
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
bun install
```

## 📝 Development Tips

1. **Hot Reload**: Perubahan code otomatis reload
2. **TypeScript**: Gunakan type checking untuk keamanan
3. **Prisma Studio**: GUI terbaik untuk manage database
4. **API Testing**: Gunakan Thunder Client atau Postman
5. **Logs**: Check terminal untuk error messages

## 🎯 Next Steps

1. ✅ Login sebagai Admin
2. ✅ Explore Dashboard
3. ✅ Buat transaksi test
4. ✅ Check laporan keuangan
5. ✅ Review audit logs

---

**Happy Coding!** 🚀
