# Dokumentasi Migrasi Firebase

Dokumen ini merangkum perubahan yang dilakukan untuk memindahkan backend dari PostgreSQL (Drizzle) ke Firebase (Firestore + Functions + Auth).

## Arsitektur Baru

- **Frontend:** React (Vite) - Rencana Deploy: **Vercel**
- **Backend:** Node.js (Express) - Rencana Deploy: **Firebase Cloud Functions (v2)**
- **Database:** **Google Cloud Firestore** (NoSQL)
- **Autentikasi:** **Firebase Authentication** (ID Token berbasis JWT)

## Perubahan Utama

### 1. Backend (`artifacts/api-server`)
- **Penghapusan Drizzle ORM:** Semua query SQL di rute `transactions`, `categories`, dan `summary` telah diganti dengan Firebase Admin SDK (`firestore`).
- **Stateless Auth:** Mengganti `express-session` dengan verifikasi token Bearer. Middleware `requireAdmin` sekarang memverifikasi token yang dikirim oleh frontend.
- **Entry Point:** `src/index.ts` sekarang mengekspor `api` sebagai `onRequest` function untuk Firebase.
- **Konfigurasi:** Menambahkan `firebase.json` dan aturan keamanan `firestore.rules`.

### 2. Frontend (`artifacts/finance-app`)
- **Firebase SDK:** Menambahkan inisialisasi Firebase di `src/lib/firebase.ts`.
- **Auth Provider:** `AuthProvider` sekarang memantau status login melalui `onAuthStateChanged`.
- **API Client:** Menggunakan `setAuthTokenGetter` dari client library untuk menyuntikkan ID Token ke setiap request API secara otomatis.

### 3. Database Schema (Firestore)
Struktur koleksi yang digunakan:
- `categories`:
  - `name`: string
  - `color`: string
- `transactions`:
  - `amount`: string (disimpan sebagai string untuk presisi, diparse di app)
  - `type`: "income" | "expense"
  - `description`: string
  - `date`: string (YYYY-MM-DD)
  - `categoryId`: string (ID dokumen dari koleksi categories)
  - `createdAt`: Timestamp

## Langkah Persiapan Deployment

### 1. Konfigurasi Firebase (Frontend)
Isi API Key dan ID proyek di file berikut:
`artifacts/finance-app/src/lib/firebase.ts`

### 2. Instalasi Library
Jalankan perintah berikut di root folder:
```bash
npm install
# atau jika menggunakan pnpm
pnpm install
```

### 3. Deploy Backend
Pastikan Anda sudah login ke Firebase CLI (`firebase login`), lalu jalankan:
```bash
firebase deploy --only functions,firestore
```

### 4. Deploy Frontend (Vercel)
- Hubungkan repositori ke Vercel.
- Set **Root Directory** ke `artifacts/finance-app`.
- Tambahkan Environment Variable (jika ada) sesuai kebutuhan di dashboard Vercel.

## Catatan Teknis
- **Agregasi Data:** Karena Firestore tidak memiliki fungsi `SUM()` atau `GROUP BY` yang kompleks seperti SQL, agregasi untuk rute `/summary` sekarang dilakukan di sisi server (Node.js) dengan memproses dokumen hasil query.
- **Admin Access:** Secara default, semua user yang login dianggap admin dalam aplikasi ini. Untuk sistem yang lebih kompleks, gunakan *Firebase Custom Claims*.
