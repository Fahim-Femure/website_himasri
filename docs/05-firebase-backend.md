# 05 — Backend Firebase

## 1. Struktur proyek Firebase

```
website_himasri/
├─ firebase.json           ← dibuat agen: hosting (web/dist, SPA rewrite), firestore, storage, functions, emulators
├─ .firebaserc             ← alias "default" = "demo-himasri" untuk Emulator; diganti ID project asli oleh pemilik saat deploy
├─ firebase/
│  ├─ firestore.rules
│  ├─ firestore.indexes.json
│  └─ storage.rules
├─ functions/              ← Cloud Functions 2nd gen, TypeScript, Node 20, region asia-southeast2 (Jakarta)
└─ web/                    ← aplikasi React (Vite)
```

Konfigurasi web dibaca dari `web/.env.local` (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_USE_EMULATORS=true|false`). Sediakan `web/.env.example`. Jangan commit `.env.local`.

## 2. Autentikasi berbasis NIM

Firebase Auth memakai **Email/Password** dengan email sintetis: `{nim}@anggota.himasri.id` (dibuat oleh helper `nimToEmail(nim)` yang dipakai bersama di web & functions). Pengguna hanya pernah melihat/mengisi **NIM**.

- Login: `signInWithEmailAndPassword(auth, nimToEmail(nim), password)`; persistence `browserLocalPersistence` bila "Ingat saya", selain itu `browserSessionPersistence`.
- Reset kata sandi tidak memakai email (email sintetis): admin memanggil `adminResetPassword` yang membuat kata sandi sementara.
- Setelah login, baca `getIdTokenResult()`; `status !== 'active'` → arahkan sesuai `02-pages-and-flows.md`.

## 3. Cloud Functions (semua di `functions/src`, region `asia-southeast2`)

| Nama | Jenis | Pemanggil | Fungsi |
|---|---|---|---|
| `checkReferralCode` | `onCall` | publik | Input `{ code }`. Balas `{ valid: boolean, validUntil?: string }`. Batasi laju: maksimal 10 cek per IP per 10 menit (simpan hitungan di `rateLimits/{hash}`). Tidak pernah membocorkan kode aktif. |
| `registerMember` | `onCall` | publik | Validasi Zod (sama dengan form). Cek kode referal == `secure/referral.code` dan `now < validUntil`. Cek NIM belum ada di `nimIndex`. Buat user Auth (`nimToEmail`, password), set claims `{ role: 'anggota', status: 'pending' }`, tulis `users/{uid}` + `nimIndex/{nim}` dalam transaksi, `secure/referral.usedCount += 1`. Error yang jelas: `invalid-referral`, `nim-exists`, `invalid-argument`. |
| `approveMember` | `onCall` | admin | Input `{ uid, role }`. Set claims `{ role, status: 'active' }`, update `users/{uid}` (status, role, approvedAt/By, `activePeriods` ∪ periode berjalan, `claimsUpdatedAt`), buat/perbarui `members/{uid}`. |
| `rejectMember` | `onCall` | admin | Input `{ uid, reason? }`. Urutan: (1) tulis `users/{uid}.status = 'rejected'` + `rejectReason` (halaman Menunggu yang sedang terbuka langsung menampilkan pesan penolakan), (2) hapus `nimIndex/{nim}` dan **hapus akun Auth** agar NIM yang sama bisa mendaftar ulang dengan data yang benar. Dokumen `users/{uid}` tetap disimpan sebagai arsip (admin saja). |
| `setUserRole` | `onCall` | admin | Ubah peran pengguna aktif; sinkron claims + `users` + `members`. Admin tidak bisa menurunkan dirinya sendiri bila ia admin terakhir. |
| `setUserStatus` | `onCall` | admin | `active` ↔ `disabled` (disable/enable Auth user). |
| `adminResetPassword` | `onCall` | admin | Hasilkan kata sandi sementara 10 karakter, set lewat Admin SDK, kembalikan sekali ke admin. |
| `regenerateReferralCode` | `onCall` | admin | Pindahkan kode aktif ke `referralHistory` (`endedReason: 'regenerated'`), buat kode baru dengan masa berlaku sampai akhir periode 2-bulanan yang sama. |
| `rotateReferralCode` | `onSchedule` | sistem | Cron `0 0 1 1,3,5,7,9,11 *`, timeZone `Asia/Jakarta`. Arsipkan kode lama (`endedReason: 'rotated'`), buat kode baru berlaku 2 bulan (tanggal 1 bulan ganjil s.d. akhir bulan berikutnya, 23.59.59 WIB). |
| `onMaterialWrite` | Firestore trigger | sistem | Rawat `courses/{id}.materialCount`; saat materi dihapus, hapus berkas Storage-nya. |
| `onProductDelete` / `onHeroSlideDelete` | Firestore trigger | sistem | Hapus berkas Storage terkait. |

Format kode referal: `HMS-{MMM}{YY}-{XXXX}` — `MMM` = 3 huruf bulan mulai dalam bahasa Indonesia kapital (JAN, MAR, MEI, JUL, SEP, NOV), `YY` = 2 digit tahun, `XXXX` = 4 karakter acak dari `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (tanpa 0/O/1/I), memakai `crypto.randomInt`. Perbandingan kode tidak peka huruf besar/kecil dan mengabaikan spasi.

Bootstrap: skrip `scripts/seed/bootstrap-admin.ts` (Admin SDK) membuat admin pertama dari argumen `--nim --nama --password`, serta kode referal awal bila `secure/referral` belum ada.

## 4. Security Rules (wajib, ditulis lengkap oleh agen)

Fungsi bantu di `firestore.rules`: `signedIn()`, `role()` = `request.auth.token.role`, `active()` = `request.auth.token.status == 'active'`, `isAdmin()`, `isInti()`, `canEditContent()` (kominfo|inti|admin), `canEditMateri()` (akademik|inti|admin).

| Koleksi | read | write |
|---|---|---|
| `users/{uid}` | pemilik (`request.auth.uid == uid`) atau admin | **ditolak** untuk klien (hanya Functions/Admin SDK) |
| `members/{uid}` | `active()` | ditolak (Functions) |
| `nimIndex`, `rateLimits` | ditolak | ditolak |
| `periods/{id}` | publik | `isAdmin() \|\| isInti()` (dan `active()`) |
| `periods/{id}/units/{u}` | `active()` | `isAdmin() \|\| isInti()` |
| `settings/public`, `settings/hero` | publik | `public`: admin/inti; `hero`: `canEditContent()` |
| `heroSlides/{id}` | publik **hanya** bila `resource.data.active == true`; editor boleh baca semua | `canEditContent()` |
| `secure/referral`, `referralHistory` | `isAdmin() \|\| isInti()` | ditolak (Functions) |
| `courses`, `materials` | `active()` | `canEditMateri()`; validasi field & tipe (`title` 3–120, `type` in ['file','link'], `semester` 1–8) |
| `events`, `products` | `active()`; produk `draft` hanya untuk `canEditContent()` | `canEditContent()`; `price` & `stock` angka ≥ 0 |
| `productClicks` | `canEditContent()` | create oleh `active()` dengan `uid == request.auth.uid` |

`storage.rules`: `hero/**` & `products/**` baca publik/aktif sesuai Firestore, tulis `canEditContent` + `contentType.matches('image/.*')` + batas ukuran; `materials/**` baca `active`, tulis `canEditMateri` + tipe dokumen + ≤ 20 MB; `avatars/{uid}.webp` tulis pemilik ≤ 1 MB.

## 5. Emulator & skrip

- `firebase.json` emulator: auth 9099, firestore 8080, storage 9199, functions 5001, hosting 5000, UI aktif. Project ID pengembangan: `demo-himasri` (awalan `demo-` membuat Emulator berjalan tanpa project sungguhan).
- `web/src/lib/firebase/client.ts` menghubungkan ke emulator bila `VITE_USE_EMULATORS=true`.
- `scripts/seed/seed.ts`: mengisi emulator/proyek dengan data di `07-content-and-seed-data.md` (periode 2025/2026 + unit, pengaturan publik, hero settings, 2 slide hero dari `web/public/assets/images`, event & produk contoh bertanda simulasi, mata kuliah contoh). Dapat dijalankan ulang (idempotent).
- Script npm di root (`package.json` workspace): `dev` (emulators + vite paralel), `build`, `seed`, `bootstrap:admin`, `deploy`, `lint`, `test`.

## 6. Deploy

`firebase deploy --only hosting,firestore,storage,functions`. Hosting: `public: web/dist`, rewrite `** → /index.html`, header cache panjang untuk `/assets/**`, header keamanan (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimal).
