# BRIEF: Mini App Telegram - POS Pecel Lele

## 1. OVERVIEW
Aplikasi Point of Sale (POS) berbasis Telegram Mini App untuk usaha Pecel Lele dengan sistem manajemen orderan real-time, multi-role access, dan pencatatan transaksi lengkap.

---

## 2. USER ROLES & ACCESS

### 2.1 Admin (Requires Login)
- **Login**: Menggunakan username & password
- **Fungsi**:
  - Manage menu (tambah, edit, hapus, update harga)
  - Manage stok barang
  - Lihat laporan penjualan harian
  - Lihat histori semua transaksi
  - Export laporan (Excel/PDF)
  - Manage user credentials

### 2.2 Kasir (No Login - Direct Access)
- **Fungsi**:
  - Input pesanan baru
  - Edit pesanan yang sudah dibuat (tambah/kurang item)
  - Pilih tipe order: Dine-in (dengan nomor meja) atau Online
  - Input nama pelanggan (opsional)
  - Proses pembayaran (Cash/Transfer/QRIS/Hutang)
  - Print/Share receipt via Telegram
  - Lihat status pesanan real-time

### 2.3 Staff Dapur (No Login - Notification Only)
- **Fungsi**:
  - Terima notifikasi Telegram saat ada pesanan baru
  - Lihat detail pesanan (menu, jumlah, meja, waktu order)
  - Tandai pesanan "Sedang Diproses" → "Siap"
  - Notifikasi ke kasir saat pesanan siap

---

## 3. CORE FEATURES

### 3.1 Order Management

#### A. Tipe Orderan
1. **Dine-in**
   - Wajib pilih nomor meja (dropdown/button)
   - Nama pelanggan opsional
   
2. **Online/Takeaway**
   - Nama pelanggan wajib diisi
   - Tanpa nomor meja

#### B. Alur Orderan
```
1. Kasir input pesanan → Auto log timestamp order
2. Staff dapur terima notifikasi Telegram
3. Staff update status: "Sedang Diproses"
4. Staff update status: "Siap"
5. Kasir proses pembayaran
6. Status: "Selesai" → Auto log timestamp selesai
```

#### C. Edit Pesanan
- Kasir bisa edit pesanan sebelum status "Selesai"
- Tambah/kurang item (contoh: +1 Nasi, +1 Sambel)
- Edit otomatis trigger notifikasi update ke staff dapur
- Log perubahan pesanan

### 3.2 Menu & Inventory Management (Admin Only)

#### A. Menu Items
- Nama item
- Harga
- Kategori (Makanan Utama, Lauk, Minuman, Extra)
- Status: Tersedia/Habis
- Foto (opsional)

#### B. Stok Management
- Track stok bahan baku (opsional integration)
- Alert stok menipis
- Update stok manual

### 3.3 Payment System

#### Metode Pembayaran:
1. **Cash**
   - Input jumlah bayar
   - Hitung kembalian otomatis
   
2. **Transfer/QRIS**
   - Input nominal
   - Upload bukti transfer (opsional)
   
3. **Hutang**
   - Wajib input nama pelanggan
   - Catat tanggal hutang
   - Status: "Belum Lunas" / "Lunas"
   - Fitur pelunasan hutang dengan log waktu

#### Mixed Payment
- Bisa kombinasi metode (contoh: Sebagian Cash + Sebagian Transfer)

### 3.4 Reporting & Analytics

#### A. Laporan Harian
- Total penjualan (Rupiah)
- Jumlah transaksi
- Breakdown per metode pembayaran
- Menu terlaris
- Total hutang belum lunas
- Average order value
- Peak hours (jam tersibuk)

#### B. Histori Transaksi
- Filter by:
  - Tanggal (range)
  - Tipe order (dine-in/online)
  - Metode pembayaran
  - Status (selesai/pending/hutang)
- Search by nama pelanggan atau nomor meja
- Export to Excel/PDF

#### C. Analytics Dashboard
- Grafik penjualan harian/mingguan/bulanan
- Menu performance
- Payment method distribution
- Order completion time (analytics)

---

## 4. AUTOMATIC LOGGING

### Time Logging (Auto-record):
- **order_created_at**: Timestamp saat pesanan pertama kali dibuat
- **order_updated_at**: Timestamp setiap kali pesanan diedit
- **order_processing_at**: Timestamp saat staff mulai proses
- **order_ready_at**: Timestamp saat pesanan siap
- **order_completed_at**: Timestamp saat pembayaran selesai
- **payment_time**: Timestamp pembayaran

### Purpose Analytics:
- Rata-rata waktu pembuatan pesanan
- Bottleneck identification
- Staff performance
- Peak order times

---

## 5. UI/UX REQUIREMENTS

### Design Principles:
- **Simple & Clean**: Minimal clutter, fokus pada fungsi utama
- **Fast Access**: Maksimal 2-3 tap untuk fungsi utama
- **Mobile-First**: Optimized untuk layar smartphone
- **Color Coding**: 
  - Pending orders: Orange/Yellow
  - Processing: Blue
  - Ready: Green
  - Completed: Gray
  - Hutang: Red

### Key Screens:

#### 5.1 Kasir Dashboard
```
[+ Order Baru] [Pesanan Aktif (5)] [Hutang]

--- Pesanan Aktif ---
[Meja 3 - Siap] [Meja 5 - Proses] [Online - Pending]

--- Quick Menu ---
Grid layout menu items dengan harga
```

#### 5.2 Input Pesanan
```
Tipe Order: [Dine-in] [Online]

[Pilih Meja: ▼] (jika dine-in)
Nama: [_____________] (opsional dine-in, wajib online)

--- Menu ---
[Kategori: Semua ▼]

Item cards dengan +/- button
[Pecel Lele 1 ekor] Rp 15.000 [- 0 +]
[Nasi Putih] Rp 5.000 [- 0 +]

[Keranjang (3 item) - Total: Rp 45.000]
[Buat Pesanan]
```

#### 5.3 Pembayaran
```
Order #1234 - Meja 3
Total: Rp 50.000

Metode Pembayaran:
○ Cash  ○ Transfer/QRIS  ○ Hutang

[Jika Cash]
Bayar: [_____________]
Kembalian: Rp XX.XXX

[Proses Pembayaran]
```

#### 5.4 Admin Dashboard
```
=== Dashboard ===
Hari ini: Rp 1.500.000 | 45 transaksi

[Manage Menu] [Laporan] [Hutang] [Settings]

--- Laporan Cepat ---
Menu Terlaris: Pecel Lele (25x)
Jam Sibuk: 12:00 - 13:00
Hutang Aktif: Rp 150.000
```

#### 5.5 Staff Dapur View
```
=== Pesanan Masuk ===

[Meja 5 - 10:30] BARU!
• 2x Pecel Lele Goreng
• 2x Nasi Putih
• 1x Es Teh Manis
[Proses] [Detail]

[Meja 3 - 10:25] SEDANG DIPROSES
• 1x Pecel Lele Bakar
• 1x Nasi
[Tandai Siap]
```

---

## 6. TECHNICAL STACK RECOMMENDATIONS

### Frontend (Telegram Mini App):
- **Framework**: React.js + Vite atau Next.js
- **UI Library**: Telegram Mini App SDK + Tailwind CSS
- **State Management**: Zustand atau Redux Toolkit
- **Notifications**: Telegram Bot API

### Backend:
- **Runtime**: Node.js (Express.js) atau Python (FastAPI)
- **Database**: PostgreSQL atau MongoDB
- **Real-time**: WebSocket (Socket.io) atau Telegram Bot updates
- **Authentication**: JWT for admin login

### Hosting:
- **Backend**: Railway, Render, atau VPS
- **Database**: Supabase, Railway PostgreSQL, atau MongoDB Atlas
- **File Storage**: Cloudinary (untuk foto menu/bukti transfer)

---

## 7. DATABASE SCHEMA (Simplified)

### Tables:

#### users
```sql
id, username, password_hash, role (admin/kasir/staff), telegram_id, created_at
```

#### menu_items
```sql
id, name, price, category, is_available, photo_url, created_at, updated_at
```

#### orders
```sql
id, order_number, order_type (dine-in/online), table_number, 
customer_name, total_amount, status (pending/processing/ready/completed),
payment_method, payment_status (paid/unpaid/partial),
order_created_at, order_processing_at, order_ready_at, order_completed_at,
notes, created_by_user_id
```

#### order_items
```sql
id, order_id, menu_item_id, quantity, price_at_order, subtotal
```

#### payments
```sql
id, order_id, amount, payment_method, payment_proof_url, 
payment_time, notes
```

#### debts
```sql
id, order_id, customer_name, amount, status (unpaid/paid), 
debt_date, paid_date, notes
```

#### order_logs
```sql
id, order_id, action (created/updated/status_changed/paid), 
old_value, new_value, timestamp, user_id
```

---

## 8. NOTIFICATION SYSTEM

### Telegram Bot Notifications:

#### To Staff Dapur:
```
🔔 PESANAN BARU!

📍 Meja 5 | ⏰ 10:30
👤 Andi (opsional)

📋 Pesanan:
• 2x Pecel Lele Goreng
• 2x Nasi Putih  
• 1x Es Teh Manis

[Mulai Proses] [Lihat Detail]
```

#### To Kasir (when ready):
```
✅ Pesanan Siap!

📍 Meja 5
Pesanan sudah siap disajikan
Total: Rp 45.000

[Proses Pembayaran]
```

---

## 9. SECURITY & PERMISSIONS

### Admin Access:
- Login dengan session timeout (24 jam)
- Two-factor auth menggunakan Telegram (opsional)

### Data Privacy:
- Encrypt password menggunakan bcrypt
- Sanitize input untuk prevent SQL injection
- Rate limiting untuk prevent spam

### Backup:
- Auto daily backup database
- Export data fitur untuk admin

---

## 10. FUTURE ENHANCEMENTS (Phase 2)

- Integrasi printer thermal untuk kitchen receipt
- QR code untuk self-order di meja
- Loyalty program & customer database
- Multi-outlet support
- Inventory auto-deduct saat order
- Staff performance tracking
- Whatsapp notification integration
- Reservation system

---

## 11. DEVELOPMENT PRIORITIES

### MVP (Phase 1):
1. ✅ Basic order input (kasir)
2. ✅ Menu management (admin)
3. ✅ Payment processing (cash/transfer/hutang)
4. ✅ Telegram notification ke staff
5. ✅ Basic reporting (harian)
6. ✅ Auto time logging

### Phase 2:
7. Advanced analytics
8. Export laporan
9. Debt management system
10. Inventory tracking

---

## 12. TESTING CHECKLIST

- [ ] Kasir bisa input pesanan dine-in dan online
- [ ] Edit pesanan berfungsi (tambah/kurang item)
- [ ] Staff terima notifikasi real-time
- [ ] Update status pesanan smooth
- [ ] Semua metode pembayaran works
- [ ] Hutang tercatat dengan benar
- [ ] Time logging akurat
- [ ] Laporan harian accurate
- [ ] Admin bisa manage menu & harga
- [ ] UI responsive di berbagai device
- [ ] Load time < 3 detik
- [ ] No data loss saat network interrupt

---

## 13. DELIVERABLES

1. **Source Code**: Full repository dengan dokumentasi
2. **Database Schema**: SQL migration files
3. **API Documentation**: Endpoints & payload examples
4. **User Guide**: Panduan untuk admin, kasir, dan staff
5. **Deployment Guide**: Step-by-step hosting instructions
6. **Telegram Bot Setup**: Bot configuration & commands

---

## 14. NOTES UNTUK CURSOR AI

### Coding Guidelines:
- Gunakan TypeScript untuk type safety
- Clean code dengan proper comments
- Modular architecture (easy to scale)
- Error handling yang comprehensive
- Optimized query untuk fast load
- Responsive design (mobile-first)

### UI Framework Priority:
- Gunakan Telegram Mini App native components jika memungkinkan
- Fallback ke custom UI jika ada limitasi
- Pastikan smooth animation & transitions

### Real-time Updates:
- Implementasi WebSocket atau polling (pilih yang paling reliable)
- Handle offline mode dengan grace (queue updates)

---

## CONTACT & SUPPORT
Jika ada pertanyaan teknis selama development, dokumentasikan di README.md

---

**Version**: 1.0  
**Last Updated**: 2026-02-13  
**Project Type**: Telegram Mini App - POS System  
**Target Users**: 2-3 Kasir, 1 Admin, Multiple Kitchen Staff