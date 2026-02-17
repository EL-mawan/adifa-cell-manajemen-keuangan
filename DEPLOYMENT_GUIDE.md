# 🚀 Panduan Deployment Adifa Cell

## Persiapan Database Turso

### 1. Buat Akun Turso
1. Kunjungi [turso.tech](https://turso.tech)
2. Daftar dengan GitHub Anda
3. Install Turso CLI:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

### 2. Login & Buat Database
```bash
# Login ke Turso
turso auth login

# Buat database baru
turso db create adifa-cell

# Dapatkan URL database
turso db show adifa-cell --url

# Buat auth token
turso db tokens create adifa-cell
```

### 3. Migrasi Data (Opsional)
Jika Anda ingin memindahkan data dari SQLite lokal ke Turso:

```bash
# Export data dari SQLite lokal
sqlite3 db/custom.db .dump > backup.sql

# Import ke Turso
turso db shell adifa-cell < backup.sql
```

### 4. Update Environment Variables
Buat file `.env.production` atau update `.env`:

```env
# Database Turso
DATABASE_URL="libsql://adifa-cell-[your-username].turso.io"
TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..." # Token dari step 2

# JWT Secret (Generate baru untuk production)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"

# App Info
NEXT_PUBLIC_APP_NAME="Adifa Cell"
NEXT_PUBLIC_APP_URL="https://adifa-cell.vercel.app"
NODE_ENV="production"
```

---

## Deployment ke Vercel

### 1. Push ke GitHub
```bash
git add .
git commit -m "Configure Turso database"
git push origin main
```

### 2. Deploy di Vercel
1. Kunjungi [vercel.com](https://vercel.com)
2. Login dengan GitHub
3. Klik **"New Project"**
4. Pilih repository: `adifa-cell-manajemen-keuangan`
5. Klik **"Import"**

### 3. Konfigurasi Environment Variables di Vercel
Di halaman project settings, tambahkan:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | URL dari Turso (step 2 di atas) |
| `TURSO_AUTH_TOKEN` | Token dari Turso |
| `JWT_SECRET` | Secret key Anda |
| `NEXT_PUBLIC_APP_NAME` | Adifa Cell |
| `NEXT_PUBLIC_APP_URL` | https://[your-project].vercel.app |
| `NODE_ENV` | production |

### 4. Deploy
Klik **"Deploy"** dan tunggu proses selesai (±2-3 menit).

### 5. Migrasi Database di Production
Setelah deploy berhasil, jalankan migrasi:

```bash
# Dari terminal lokal
turso db shell adifa-cell

# Atau gunakan Vercel CLI
vercel env pull
bunx prisma db push
```

---

## Deployment ke Railway (Alternatif)

### 1. Buat Project di Railway
1. Kunjungi [railway.app](https://railway.app)
2. Login dengan GitHub
3. Klik **"New Project"** → **"Deploy from GitHub repo"**
4. Pilih `adifa-cell-manajemen-keuangan`

### 2. Tambahkan Environment Variables
Sama seperti di Vercel, tambahkan semua environment variables.

### 3. Deploy
Railway akan otomatis build dan deploy aplikasi Anda.

---

## Deployment ke VPS (Docker)

### 1. Persiapan VPS
```bash
# SSH ke VPS
ssh user@your-vps-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y
```

### 2. Clone Repository
```bash
git clone https://github.com/EL-mawan/adifa-cell-manajemen-keuangan.git
cd adifa-cell-manajemen-keuangan
```

### 3. Buat .env File
```bash
nano .env
# Paste environment variables dari atas
```

### 4. Build & Run
```bash
# Build image
docker build -t adifa-cell .

# Run container
docker run -d \
  --name adifa-cell \
  -p 3000:3000 \
  --env-file .env \
  adifa-cell
```

### 5. Setup Reverse Proxy (Nginx)
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/adifa-cell
```

Isi dengan:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/adifa-cell /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Setup SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## Verifikasi Deployment

### 1. Cek Aplikasi Berjalan
Buka browser dan akses URL deployment Anda.

### 2. Test Login
- Email: `admin@adifacell.com`
- Password: `admin123`

### 3. Cek Database Connection
Pastikan dashboard menampilkan data dengan benar.

---

## Troubleshooting

### Error: "Cannot connect to database"
- Pastikan `DATABASE_URL` dan `TURSO_AUTH_TOKEN` sudah benar
- Cek apakah database Turso aktif: `turso db list`

### Error: "Prisma Client not generated"
```bash
bunx prisma generate
```

### Error: "JWT Secret not found"
Pastikan `JWT_SECRET` sudah di-set di environment variables.

---

## Maintenance

### Backup Database
```bash
# Backup dari Turso
turso db shell adifa-cell .dump > backup-$(date +%Y%m%d).sql
```

### Update Aplikasi
```bash
git pull origin main
# Vercel/Railway akan auto-deploy
# Untuk VPS:
docker build -t adifa-cell .
docker stop adifa-cell
docker rm adifa-cell
docker run -d --name adifa-cell -p 3000:3000 --env-file .env adifa-cell
```

---

## Rekomendasi

**Untuk Production:**
- ✅ Gunakan **Vercel + Turso** (Gratis, cepat, mudah)
- ✅ Setup custom domain
- ✅ Enable SSL/HTTPS
- ✅ Setup monitoring (Vercel Analytics)
- ✅ Backup database secara berkala

**Biaya Estimasi:**
- Vercel: **Gratis** (Hobby Plan)
- Turso: **Gratis** (500 databases, 9GB storage)
- Domain: **~$10-15/tahun**

**Total: ~$1/bulan** (hanya domain)
