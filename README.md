# Payment Receipt System

Sistem pencatatan transaksi, pembayaran, dan laporan berbasis REST API menggunakan **Django 5 + Django REST Framework**, yang berjalan di Laragon dengan MySQL.

## Fitur

- **Inventory** — CRUD produk (nama, stok, harga)
- **Sales** — pencatatan penjualan & item-nya (nomor resi otomatis `RC-xxxxxx`)
- **Finance** — pembayaran (Cash / Transfer / Card / QRIS) dan pengeluaran (Expense)
- **Reports** — ringkasan transaksi, tren penjualan & pendapatan per hari
- **Autentikasi** — JWT (SimpleJWT) pada seluruh endpoint API

## Tech Stack

| Komponen | Teknologi                                |
| -------- | ---------------------------------------- |
| Backend  | Django 5.1.7, Django REST Framework 3.15 |
| Auth     | djangorestframework-simplejwt (JWT)      |
| Database | MySQL (Laragon)                          |
| Config   | python-decouple (`.env`)               |
| Frontend | *(lihat folder `frontend/`)*         |

## Struktur Project

```
paymentreceiptsystem/
├── core/          # Konfigurasi project Django (settings, urls)
├── inventory/     # App produk
├── sales/         # App penjualan (Sale, SaleItem)
├── finance/       # App pembayaran & pengeluaran (Payment, Expense)
├── reports/       # App laporan/ringkasan
├── frontend/      # Frontend TypeScript
├── requirements.txt
└── .env           # Konfigurasi lingkungan (tidak dikomit)
```

## Setup Lokal

### 1. Prasyarat

- Python 3.12+ (sudah termasuk di venv)
- MySQL 8.x via Laragon (port 3306)
- Node.js 18+ (untuk frontend)

### 2. Backend

```bash
# aktifkan virtual environment (sudah ada)
.\venv\Scripts\activate

# (opsional) install ulang dependency dari requirements
pip install -r requirements.txt

# siapkan konfigurasi dari contoh
cp .env.example .env
# lalu isi SECRET_KEY & kredensial DB pada .env

# buat database (jalankan satu kali)
mysql -u root -e "CREATE DATABASE IF NOT EXISTS db_prcompany CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# migrasi database
python manage.py migrate

# buat user admin
python manage.py createsuperuser

# jalankan server
python manage.py runserver
```

Server berjalan di `http://127.0.0.1:8000/`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

> Konfigurasi URL API frontend ada di `frontend/.env` (default `http://127.0.0.1:8000`).

## Autentikasi API

Semua endpoint membutuhkan header `Authorization: Bearer <token>`.

```bash
# ambil token
curl -s -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Response berisi `access` dan `refresh` token. Gunakan `POST /api/token/refresh/` untuk memperbarui token.

## Endpoint API

| Method | Endpoint                                 | Deskripsi                                     |
| ------ | ---------------------------------------- | --------------------------------------------- |
| POST   | `/api/token/`                          | Login JWT                                     |
| POST   | `/api/token/refresh/`                  | Refresh JWT                                   |
| CRUD   | `/api/inventory/products/`             | Manajemen produk                              |
| CRUD   | `/api/sales/sales/`                    | Penjualan (nested items)                      |
| CRUD   | `/api/sales/items/`                    | Item penjualan                                |
| CRUD   | `/api/finance/payments/`               | Pembayaran                                    |
| CRUD   | `/api/finance/expenses/`               | Pengeluaran                                   |
| GET    | `/api/reports/summary/`                | Ringkasan (total penjualan, pendapatan, laba) |
| GET    | `/api/reports/sales-per-day/?days=7`   | Tren penjualan per hari                       |
| GET    | `/api/reports/revenue-per-day/?days=7` | Tren pendapatan per hari                      |

Admin Django tersedia di `/admin/`.

## Akun Default (Development)

- Username: `admin`
- Password: `admin123`

> Ganti akun ini jika dipakai selain untuk development.

## Endpoint CRUD — Contoh

**Membuat produk:**

```bash
curl -s -X POST http://127.0.0.1:8000/api/inventory/products/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Kaos Polos","stock":50,"price":75000}'
```

**Membuat penjualan dengan item:**

```bash
curl -s -X POST http://127.0.0.1:8000/api/sales/sales/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"customer_name":"Budi","items":[{"product":1,"quantity":2,"unit_price":75000}]}'
```
