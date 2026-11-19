# Panduan Go-Live & Produksi HIMASRI

Dokumen ini merangkum langkah menyiapkan project Firebase produksi, konfigurasi environment, IAM untuk backup otomatis, App Check, monitoring error, dan checklist sebelum rilis resmi.

---

## 1. Membuat Project Firebase Produksi

1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat project baru (mis. `himasri-itpln-prod`).
2. Aktifkan **Blaze Plan** (diperlukan untuk Cloud Functions v2, Cloud Scheduler backup, dan App Check).
3. Aktifkan layanan berikut pada region **`asia-southeast2` (Jakarta)**:
   - **Authentication**: aktifkan provider *Email/Password*.
   - **Cloud Firestore**: buat database `(default)` di `asia-southeast2`.
   - **Cloud Storage**: buat bucket default di `asia-southeast2`.
   - **Firebase Hosting**: siapkan situs utama.
   - **App Check**: daftarkan aplikasi web menggunakan **reCAPTCHA Enterprise** dan salin *Site Key*.
4. (Opsional untuk notifikasi email pendaftar baru) Pasang ekstensi resmi **Trigger Email from Firestore** (`firebase/firestore-send-email`) yang membaca koleksi `mail`.

---

## 2. Variabel Environment

### 2.1 Frontend (`web/.env.production`)
```env
VITE_USE_EMULATORS=false
VITE_DEMO_MODE=false
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_RECAPTCHA_SITE_KEY=<reCAPTCHA Enterprise Site Key>
VITE_SENTRY_DSN=<Sentry DSN opsional; kosongkan jika belum dipakai>
```
> Pastikan `VITE_DEMO_MODE=false` agar banner `"Data contoh..."`, label demo, dan data `isSample` tidak pernah muncul di produksi.

### 2.2 Cloud Functions (`functions/.env.<project-id>`)
```env
ADMIN_NOTIFY_EMAIL=admin@himasri-itpln.id
BACKUP_BUCKET=gs://<project-id>-firestore-backups
```

---

## 3. IAM & Bucket untuk Backup Mingguan Firestore (`scheduledFirestoreBackup`)

Fungsi `scheduledFirestoreBackup` berjalan otomatis setiap **Minggu pukul 02.00 WIB (`0 2 * * 0`, `Asia/Jakarta`)** dan mengekspor seluruh koleksi Firestore ke GCS.

1. Buat bucket Cloud Storage di `asia-southeast2`:
   ```bash
   gsutil mb -l asia-southeast2 gs://<project-id>-firestore-backups
   ```
2. Atur lifecycle retention bucket (mis. hapus otomatis arsip > 90 hari agar biaya penyimpanan minimal).
3. Berikan peran IAM berikut ke Service Account default Cloud Functions (`<project-id>@appspot.gserviceaccount.com` atau Compute Engine default SA):
   - `roles/datastore.importExportAdmin` (Cloud Datastore Import Export Admin)
   - `roles/storage.objectAdmin` pada bucket `gs://<project-id>-firestore-backups`

---

## 4. Deploy Rules, Indexes, Functions & Hosting

> **Jangan jalankan perintah deploy di bawah ini pada lingkungan emulator lokal.**

```bash
# 1. Pilih project produksi
firebase use <project-id>

# 2. Build & uji lokal sebelum deploy
npm run lint
npm run build
npm run test

# 3. Deploy Firestore & Storage Rules + Indexes
firebase deploy --only firestore:rules,firestore:indexes,storage

# 4. Deploy Cloud Functions (asia-southeast2)
firebase deploy --only functions

# 5. Deploy Hosting (web/dist)
firebase deploy --only hosting
```

---

## 5. Membuat Akun Admin Pertama

1. Jalankan script seed produksi **tanpa** flag `--demo` (atau buat user pertama di Firebase Auth dengan email `<NIM>@anggota.himasri.id`), lalu set Custom Claims `{ role: 'admin', status: 'active' }` serta dokumen `users/{uid}`, `members/{uid}`, dan `nimIndex/{nim}` melalui Firebase Admin SDK.
2. Segera masuk di `/masuk`, buka `/admin/kode-referal`, dan pastikan kode referal aktif terbuat.
3. Ganti kata sandi admin awal setelah login pertama.

---

## 6. Checklist Go-Live

- [ ] `VITE_USE_EMULATORS=false` dan `VITE_DEMO_MODE=false` di `.env.production`.
- [ ] App Check (reCAPTCHA Enterprise) aktif pada `registerMember` dan `checkReferralCode`.
- [ ] `BACKUP_BUCKET` dan peran IAM backup sudah dikonfigurasi.
- [ ] Ekstensi Trigger Email aktif untuk koleksi `mail` dan `ADMIN_NOTIFY_EMAIL` sudah diisi.
- [ ] `VITE_SENTRY_DSN` terisi (atau sengaja dikosongkan bila monitoring belum dipakai).
- [ ] Data resmi BPH periode berjalan, kontak WhatsApp Kahim/Wakahim/Admin, konten beranda, agenda, dan fakultas/lab sudah diisi melalui panel admin.
- [ ] Seluruh role (`admin`, `inti`, `kominfo`, `akademik`, `psdm`, `minat_bakat`, `anggota`, `pending`) sudah diuji akses dan redirect `/403`.

---

## 7. Pengujian

- **Aturan Uji Unggah Media**: Setiap pengujian unggah foto/berkas (Budaya, Hero, Journey, Produk, Avatar) pada emulator maupun staging **WAJIB** menggunakan gambar yang isinya sesuai dengan judul/subjek item yang diuji (mis. foto Songket untuk item Songket, bukan foto jembatan/item lain).
- **Pembersihan Pasca-Uji**: Setelah pengujian unggah atau sunting konten selesai diverifikasi, data Firestore dan berkas uji di Cloud Storage **WAJIB** dikembalikan ke kondisi semula (atau gunakan tombol *"Kembalikan foto bawaan"* di panel kelola) agar tidak ada data/media uji yang tertinggal.
