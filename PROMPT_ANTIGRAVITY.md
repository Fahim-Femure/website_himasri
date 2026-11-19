# Prompt Fullstack — Website HIMASRI (untuk Google Antigravity)

Cara pakai: buka folder `D:\website_himasri` sebagai workspace di Antigravity, pastikan aset sudah ditaruh di `assets-source/` (lihat `assets-source/README.md`), lalu salin **seluruh isi di antara garis `=== MULAI PROMPT ===` dan `=== SELESAI PROMPT ===`** ke panel agen sebagai satu pesan.

=== MULAI PROMPT ===

Kamu adalah senior fullstack engineer (React + Firebase) dan UI engineer yang teliti. Bangun **website HIMASRI (Himpunan Mahasiswa Sriwijaya — Institut Teknologi PLN) secara lengkap dan siap deploy** di workspace ini, dalam satu kali kerja, tanpa menunggu konfirmasi di tengah jalan. Bila menemui keputusan kecil yang tidak diatur, ambil pilihan paling aman dan paling sederhana, lalu catat di `docs/BUILD_REPORT.md`.

## 0. Wajib dibaca dulu (sumber kebenaran)

Sebelum menulis kode, baca seluruh file berikut dan ikuti persis isinya. Jika ada yang bertentangan, urutan prioritasnya: prompt ini → `docs/03` (keamanan/peran) → `docs/05` → dokumen lain.

- `docs/00-overview.md` — tujuan, teknologi, peta dokumen
- `docs/01-design-system.md` — token warna, tipografi Plus Jakarta Sans, spasi, radius, bayangan, gradien, komponen, aksesibilitas
- `docs/02-pages-and-flows.md` — semua route, isi tiap halaman, alur pengguna
- `docs/03-roles-and-access.md` — peran & matriks hak akses
- `docs/04-data-model.md` — koleksi Firestore, path Storage, indeks
- `docs/05-firebase-backend.md` — Auth berbasis NIM, Cloud Functions, Security Rules, emulator, deploy
- `docs/06-animation-and-motion.md` — **semua animasi & transisi** (wajib diimplementasikan seluruhnya)
- `docs/07-content-and-seed-data.md` — copy teks, daftar pilihan, aset, data seed
- `docs/08-acceptance-checklist.md` — daftar uji yang harus lolos
- `docs/data/bph-2025-2026.md` — data asli BPH 2025/2026
- `web/README.md`, `functions/README.md`, `firebase/README.md`, `scripts/README.md` — struktur folder yang sudah disiapkan (gunakan folder yang ada, jangan membuat struktur lain)

Referensi visual: Figma `https://www.figma.com/design/LBecOH4GpJTjuNnpQJEFf5` (page berawalan `v2 —` dan page "Design System"). Jika tidak bisa dibuka, dokumen di `docs/` sudah cukup.

## 1. Teknologi (jangan diganti)

- Monorepo npm workspaces di root: `web/` dan `functions/`, plus `scripts/`.
- **Frontend**: React 18, TypeScript (strict), Vite, React Router v6 (`createBrowserRouter`), Tailwind CSS **3.4** (token dari `docs/01` sebagai CSS variables + `tailwind.config.ts`), `motion` (import dari `motion/react`), React Hook Form + Zod, `lucide-react`, `@fontsource-variable/plus-jakarta-sans`, `sonner`, `@dnd-kit/sortable` hanya bila `Reorder` dari motion tidak cukup.
- **Backend**: Firebase JS SDK modular (Auth, Firestore, Storage, Functions, App Check opsional), Cloud Functions **2nd gen** TypeScript Node 20 region `asia-southeast2`, `firebase-admin`, `firebase-functions`, Firebase Hosting, Firebase Emulator Suite.
- **Kualitas**: ESLint + Prettier, Vitest + Testing Library untuk komponen kunci, `@firebase/rules-unit-testing` untuk Security Rules.
- Jangan memakai UI kit lain (MUI, Chakra, shadcn, Bootstrap). Semua komponen dibuat sendiri mengikuti `docs/01`.

## 2. Urutan kerja (kerjakan berurutan, selesaikan tiap fase sebelum lanjut)

**Fase 1 — Fondasi**
1. Inisialisasi root `package.json` (workspaces), `web/` (Vite React TS), `functions/` (TS), `firebase.json`, `.firebaserc` (alias `default` → `demo-himasri`, sehingga Emulator berjalan tanpa project sungguhan; tulis di BUILD_REPORT bahwa pemilik menggantinya dengan ID project asli saat deploy), `.gitignore`, `.editorconfig`, `web/.env.example`.
2. Salin & optimalkan aset dari `assets-source/` ke `web/public/assets/images/` (`logo-himasri.png`, `hero-kebersamaan.jpg`, `hero-pengurus.jpg`; buat juga versi WebP ≤ 300 KB untuk foto). Jika berkas tidak ada, buat placeholder berwarna maroon dengan teks nama berkas dan catat di BUILD_REPORT — jangan menghentikan pekerjaan.
3. Siapkan Tailwind + token + font Plus Jakarta Sans + `styles/index.css`; buat `components/motion/tokens.ts`.

**Fase 2 — Design system (komponen)**
Bangun semua komponen di `docs/01` §4 beserta seluruh varian & state (hover, focus-visible, active, disabled, loading, error, success), lengkap dengan animasi mikro dari `docs/06` §5. Buat halaman pratinjau komponen di route `/_dev/ui` yang **hanya aktif di mode development**.

**Fase 3 — Firebase**
1. `lib/firebase/client.ts` (inisialisasi dari env + koneksi emulator).
2. Tulis `firebase/firestore.rules`, `firebase/storage.rules`, `firebase/firestore.indexes.json` sesuai `docs/05` §4 dan `docs/04`.
3. Tulis semua Cloud Functions di `docs/05` §3 (validasi input dengan Zod, error `HttpsError` dengan kode & pesan Indonesia, cek peran dari `request.auth.token`, transaksi untuk NIM unik & penggunaan kode).
4. Tulis `scripts/seed/seed.ts` dan `scripts/seed/bootstrap-admin.ts` sesuai `docs/05` §5 dan `docs/07` §4.
5. Tulis unit test Rules untuk setiap baris tabel di `docs/05` §4 (tamu, anggota, pending, akademik, kominfo, inti, admin).

**Fase 4 — Situs publik** (`docs/02` §1) — Navbar, HeroSlider, Tentang, Budaya, BPH, Agenda, Kontak, Pita CTA, Footer, 403, 404; versi mobile mengikuti Figma `v2 — Publik (Mobile)`.

**Fase 5 — Auth** (`docs/02` §2–4) — Masuk, Daftar (dengan logika aslab bersyarat & validasi kode referal di server), Menunggu verifikasi (realtime), `AuthContext`, guard route, refresh token saat `claimsUpdatedAt` berubah.

**Fase 6 — Ruang anggota** (`docs/02` §5a–5d) — AppLayout (sidebar per peran), Struktur & Anggota (pemilih periode, kartu departemen, anggota aktif non-BPH dengan filter & paginasi), Materi Kuliah (lihat + unggah untuk peran berhak), Asisten Lab, Toko.

**Fase 7 — Panel peran & admin** (`docs/02` §5e–5i) — Kelola Foto Beranda (unggah, kompres WebP di klien, urutkan drag, aktif/nonaktif, pengaturan durasi/transisi), Kelola Produk & event, Kode Referal (salin, bagikan WhatsApp, hitung mundur, buat ulang), Pengguna & Hak Akses (setujui/tolak, ubah peran, nonaktifkan, reset kata sandi, matriks), Periode & BPH.

**Fase 8 — Penyelesaian** — responsif, aksesibilitas, performa (lazy route, code splitting per halaman, `loading="lazy"` gambar non-hero, preload font), SEO dasar (title & meta description per halaman publik, Open Graph dengan foto hero, `lang="id"`), lalu jalankan seluruh `docs/08-acceptance-checklist.md`.

## 3. Aturan inti yang tidak boleh dilanggar

1. **Data publik vs rahasia**: tamu hanya boleh membaca `periods/{id}` (field publik), `settings/public`, `settings/hero`, dan `heroSlides` yang aktif. NIM, nomor WhatsApp anggota (kecuali aslab untuk sesama anggota), anggota departemen, materi, produk, dan kode referal **tidak boleh** terbaca tanpa login aktif — dijamin oleh Security Rules, bukan hanya UI.
2. **Login memakai NIM**: email sintetis `{nim}@anggota.himasri.id` lewat satu helper `nimToEmail` yang dipakai web & functions. Pengguna tidak pernah melihat email ini.
3. **Pendaftaran wajib kode referal** yang divalidasi di Cloud Function `registerMember`; klien tidak pernah bisa membaca kode aktif. Kode berganti otomatis tiap 2 bulan (`onSchedule`, cron `0 0 1 1,3,5,7,9,11 *`, zona `Asia/Jakarta`) dan bisa dibuat ulang manual oleh admin.
4. **Peran ditetapkan admin**, bukan dipilih sendiri. `role` & `status` hanya ditulis oleh Functions dan disimpan di custom claims + `users/{uid}`. Matriks hak akses persis `docs/03`.
5. **Form daftar**: Nama, NIM, Angkatan, Jurusan wajib; pertanyaan "Apakah Anda asisten laboratorium (aslab)?" Ya/Tidak; jika Ya → Fakultas wajib → Laboratorium wajib (opsi bergantung fakultas) → jadwal opsional; nomor WhatsApp wajib; jabatan yang diajukan opsional; kode referal wajib.
6. **Halaman anggota**: pemilih periode paling atas → struktur BPH dengan kartu per departemen/biro berisi anggotanya → daftar semua anggota aktif periode itu di luar BPH.
7. **Hero beranda**: latar foto dari koleksi `heroSlides` (dikelola Kominfo & Kewirausahaan), bergeser otomatis sesuai jumlah foto aktif, dilapisi gradien merah tua (`docs/01` "Overlay hero"), dengan tombol jeda dan dukungan reduced motion.
8. **WhatsApp**: semua tombol WhatsApp membuka `https://wa.me/{62nomor}?text={pesan ter-encode}` di tab baru (`rel="noopener noreferrer"`). Nomor disimpan tanpa `+`, spasi, atau tanda hubung.
9. **Data contoh**: semua data yang belum resmi (nomor kontak, produk, mata kuliah contoh, fakultas/lab, anggota demo) diberi `isSample: true` dan memunculkan komponen `SimulationNote`. Jangan menulis lorem ipsum.
10. **Bahasa**: seluruh UI, pesan error, toast, dan email/teks Functions dalam Bahasa Indonesia; format rupiah `Rp95.000`, tanggal `1 Nov 2026` (locale `id-ID`, zona `Asia/Jakarta`).

## 4. Animasi & transisi (wajib, detail di `docs/06`)

Implementasikan **semua** butir di `docs/06-animation-and-motion.md`, minimal:
- **Hero slider**: crossfade 600ms (atau slide sesuai pengaturan), Ken Burns `scale 1.06→1`, stagger masuk teks hero saat halaman dimuat, titik navigasi yang melebar dengan layout animation, penghitung berganti dengan fade-slide, jeda saat hover/fokus/tab tersembunyi.
- **Navbar**: transparan → solid + blur setelah scroll 80px; garis bawah tautan aktif `scaleX`; sheet menu mobile slide dari kanan dengan fokus terkunci.
- **Reveal saat scroll** untuk tiap section publik dan stagger kartu (Budaya, BPH, Agenda, pilar); count-up angka Stat Tile.
- **Mikro-interaksi**: tombol (hover, press `scale .97`, loading), kartu terangkat saat hover, indikator chip/segmented control `layoutId`, Choice radio, field fokus & error (termasuk getar kecil saat submit gagal), toggle switch dengan spring, ikon mata kata sandi, salin kode (copy → check).
- **Transisi halaman**: fade + `y 8→0` 250ms antar halaman ruang anggota, sorotan item sidebar aktif `layoutId`, fade 200ms antara publik ↔ auth.
- **Komponen**: kotak detail aslab membuka/menutup (tinggi auto + fade), dropdown, drawer kanan, modal, progress unggah, drag urut foto hero (`Reorder`), progress masa berlaku kode, denyut ikon jam di halaman Menunggu, skeleton shimmer, baris tabel verifikasi yang keluar.
- **Reduced motion**: semua gerakan diganti fade 150ms, carousel tidak auto-geser, Ken Burns/count-up/shimmer/getar mati. Bungkus aplikasi dengan `MotionConfig reducedMotion="user"`.
- Hanya animasikan `transform` dan `opacity`; durasi & easing memakai token dari `components/motion/tokens.ts`.

## 5. Kualitas & verifikasi (wajib sebelum menyatakan selesai)

1. `npm run build`, `npm run lint`, `npm run test` (web, functions, rules) semuanya lolos tanpa error.
2. Jalankan `npm run dev` + `npm run seed -- --demo`, buka browser, dan periksa setiap halaman di lebar 375, 768, 1024, 1440 px: tidak ada teks terpotong, elemen bertumpuk, atau scroll horizontal. Login sebagai setiap peran (buat akun uji di emulator) dan cocokkan dengan matriks `docs/03`.
3. Uji alur penuh: daftar dengan kode salah → error; daftar benar (aslab Ya) → menunggu → admin setujui sebagai `akademik` → otomatis masuk → unggah materi → anggota lain bisa membuka; Kominfo unggah foto hero → beranda menampilkan slide baru dan jumlah titik bertambah.
4. Tulis `docs/BUILD_REPORT.md`: ringkasan yang dibangun, cara menjalankan (dev, seed, bootstrap admin, deploy), daftar env yang harus diisi pemilik, hasil setiap butir `docs/08` (lolos/gagal + catatan), keputusan yang kamu ambil sendiri, dan hal yang masih perlu data resmi dari pengurus (fakultas/lab, nomor kontak, produk).
5. Jangan menghapus atau mengubah isi `docs/`, `assets-source/`, atau file README yang sudah ada selain menambah `docs/BUILD_REPORT.md`.
6. Jangan menjalankan `firebase deploy` dan jangan membuat project Firebase sungguhan — cukup siapkan konfigurasinya. Semua pengujian memakai Emulator.

=== SELESAI PROMPT ===
