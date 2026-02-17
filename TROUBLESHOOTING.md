# 🔧 Troubleshooting Guide - Adifa Cell

## ✅ Masalah yang Sudah Diperbaiki

### 1. ChunkLoadError - Cross-Project Loading ✅ SOLVED

**Gejala:**
```
ChunkLoadError: Failed to load chunk /_next/static/chunks/Gambar_PROJECT%20ARWAN_Project%20Staff%20Sekolah_...
```

**Penyebab:**
- Next.js Turbopack mendeteksi multiple lockfiles di parent directory
- Mencoba memuat chunks dari project lain ("Project Staff Sekolah")
- Workspace root tidak dikonfigurasi dengan benar

**Solusi:**
Tambahkan konfigurasi `turbopack.root` di `next.config.ts`:

```typescript
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
```

**Hasil:**
- ✅ Warning workspace hilang
- ✅ Chunks dimuat dari project yang benar
- ✅ Tidak ada lagi cross-origin errors

---

## 🚨 Masalah Umum & Solusi

### Port 3000 Sudah Digunakan

**Gejala:**
```
Error: Failed to start server. Is port 3000 in use?
```

**Solusi:**
```bash
# Opsi 1: Kill process di port 3000
lsof -ti:3000 | xargs kill -9

# Opsi 2: Gunakan port lain
PORT=3001 bun run dev
```

---

### Database Error

**Gejala:**
```
PrismaClientInitializationError: Can't reach database server
```

**Solusi:**
```bash
# 1. Cek DATABASE_URL di .env
cat .env | grep DATABASE_URL

# 2. Generate Prisma Client
bun run db:generate

# 3. Push schema
bun run db:push

# 4. Jika masih error, reset database
bun run db:reset
bun run prisma/seed.ts
```

---

### Build Error - Module Not Found

**Gejala:**
```
Module not found: Can't resolve '@/components/...'
```

**Solusi:**
```bash
# 1. Clear cache
rm -rf .next
rm -rf node_modules/.cache

# 2. Reinstall dependencies
bun install

# 3. Restart dev server
bun run dev
```

---

### TypeScript Errors

**Gejala:**
```
Type error: Property 'xxx' does not exist on type 'yyy'
```

**Solusi:**
```bash
# 1. Generate Prisma types
bun run db:generate

# 2. Restart TypeScript server di VSCode
# Ctrl+Shift+P > TypeScript: Restart TS Server

# 3. Jika masih error, cek tsconfig.json
```

---

### Prisma Studio Tidak Bisa Dibuka

**Gejala:**
```
Error: Port 5555 already in use
```

**Solusi:**
```bash
# Kill process di port 5555
lsof -ti:5555 | xargs kill -9

# Restart Prisma Studio
bunx prisma studio
```

---

### Hot Reload Tidak Bekerja

**Gejala:**
- Perubahan code tidak otomatis reload

**Solusi:**
```bash
# 1. Restart dev server
# Ctrl+C di terminal, lalu:
bun run dev

# 2. Clear Next.js cache
rm -rf .next

# 3. Cek file watcher limit (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

### JWT Token Invalid

**Gejala:**
```
Error: Invalid token / Token expired
```

**Solusi:**
```bash
# 1. Cek JWT_SECRET di .env
cat .env | grep JWT_SECRET

# 2. Logout dan login ulang

# 3. Clear browser cookies untuk localhost:3000
```

---

### Database Locked Error

**Gejala:**
```
SqliteError: database is locked
```

**Solusi:**
```bash
# 1. Tutup semua koneksi database (Prisma Studio, dll)
# 2. Restart aplikasi
# 3. Jika masih locked:
rm db/custom.db-journal
```

---

### Service Worker Errors (404 /sw.js)

**Gejala:**
```
GET /sw.js 404
```

**Catatan:**
- Ini adalah **warning normal**, bukan error
- Next.js mencari service worker yang tidak ada
- Tidak mempengaruhi fungsionalitas aplikasi
- Bisa diabaikan

**Solusi (Optional):**
Jika ingin menghilangkan warning, tambahkan file `public/sw.js`:
```javascript
// Empty service worker
self.addEventListener('install', () => self.skipWaiting());
```

---

### Source Map Errors (404 .map files)

**Gejala:**
```
Error: request failed with status 404
Source URL: xxx.js.map
```

**Catatan:**
- Ini adalah **warning development**, bukan error
- Source maps tidak di-generate di development mode
- Tidak mempengaruhi aplikasi
- Bisa diabaikan

---

### Memory Leak / High Memory Usage

**Gejala:**
- Aplikasi lambat setelah beberapa waktu
- Memory usage tinggi

**Solusi:**
```bash
# 1. Restart dev server
# 2. Disable React Strict Mode (sudah disabled di config)
# 3. Limit Turbopack memory:
NODE_OPTIONS="--max-old-space-size=4096" bun run dev
```

---

## 🔍 Debugging Tips

### 1. Cek Logs
```bash
# Server logs
tail -f dev.log

# Database logs
bunx prisma studio
```

### 2. Inspect Network
- Buka DevTools > Network tab
- Filter by "Fetch/XHR" untuk API calls
- Cek status codes dan response

### 3. Cek Database
```bash
# Query langsung
sqlite3 db/custom.db "SELECT * FROM User;"

# Atau gunakan Prisma Studio
bunx prisma studio
```

### 4. Clear Everything
```bash
# Nuclear option - clear semua cache
rm -rf .next
rm -rf node_modules
rm -rf db/custom.db
bun install
bun run db:push
bun run prisma/seed.ts
bun run dev
```

---

## 📞 Getting Help

Jika masalah masih berlanjut:

1. **Cek Logs**: Selalu cek error message lengkap
2. **Search Docs**: https://nextjs.org/docs
3. **Prisma Docs**: https://www.prisma.io/docs
4. **GitHub Issues**: Cari masalah serupa

---

## ✅ Checklist Sebelum Deploy

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] JWT_SECRET changed from default
- [ ] Build succeeds: `bun run build`
- [ ] Production test: `bun run start`

---

**Last Updated**: 2026-02-17  
**Status**: All major issues resolved ✅
