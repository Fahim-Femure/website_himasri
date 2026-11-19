# 00 — Gambaran Umum Proyek HIMASRI

## Apa yang dibangun

Website resmi **HIMASRI (Himpunan Mahasiswa Sriwijaya) — Institut Teknologi PLN**: organisasi daerah untuk mahasiswa asal Sumatera Selatan di IT PLN.

Website ini terdiri dari dua dunia:

1. **Situs publik** — dapat dibuka siapa saja tanpa login. Hanya berisi informasi non-rahasia: latar belakang HIMASRI, budaya Palembang, susunan BPH (pengurus inti + kepala departemen/biro) periode berjalan, agenda tahunan, dan kontak WhatsApp Ketua/Wakil Ketua.
2. **Ruang anggota** — hanya untuk mahasiswa HIMASRI yang mendaftar dengan **kode referal** dan sudah **diverifikasi admin**. Isinya: struktur lengkap tiap departemen per periode, daftar anggota aktif, materi kuliah, direktori asisten lab, toko merchandise event, serta panel input sesuai peran (role).

## Sumber kebenaran desain

- Figma: `https://www.figma.com/design/LBecOH4GpJTjuNnpQJEFf5` — gunakan **page berawalan `v2 —`** dan page **Design System** (bagian "v2 — Komponen Aplikasi"). Page **"Arsip v1"** TIDAK dipakai.
- Jika Figma tidak bisa diakses oleh agen, seluruh keputusan desain yang dibutuhkan sudah dituliskan di folder `docs/` ini. Dokumen ini lebih diutamakan daripada tebakan.

## Teknologi (wajib)

| Lapisan | Pilihan |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Routing | React Router v6 (data router: `createBrowserRouter`) |
| Styling | Tailwind CSS **v3.4** + CSS variables (token di `docs/01-design-system.md`) |
| Animasi | `motion` (paket penerus Framer Motion, import dari `motion/react`) |
| Form & validasi | React Hook Form + Zod |
| Ikon | `lucide-react` (stroke 2, tanpa emoji sebagai ikon) |
| Font | Plus Jakarta Sans (via `@fontsource-variable/plus-jakarta-sans`) |
| Toast | `sonner` |
| Backend | Firebase: Authentication, Cloud Firestore, Cloud Storage, Cloud Functions (2nd gen, Node 20, TypeScript), Hosting |
| Tooling | ESLint + Prettier, Firebase Emulator Suite untuk pengembangan lokal |

> Catatan biaya: Cloud Functions terjadwal (rotasi kode referal) dan Cloud Storage untuk project baru membutuhkan **paket Blaze** (bayar sesuai pemakaian; pemakaian himpunan normalnya masih dalam kuota gratis). Pengembangan lokal memakai Emulator sehingga tidak perlu Blaze.

## Peta dokumen

| File | Isi |
|---|---|
| `01-design-system.md` | Warna, tipografi, spasing, radius, bayangan, gradien, komponen UI |
| `02-pages-and-flows.md` | Daftar route, isi tiap halaman, alur pengguna |
| `03-roles-and-access.md` | Peran, matriks hak akses, aturan guard |
| `04-data-model.md` | Koleksi Firestore, field, path Storage |
| `05-firebase-backend.md` | Auth berbasis NIM, Cloud Functions, rules, indexes, emulator, deploy |
| `06-animation-and-motion.md` | Semua animasi & transisi beserta durasi/easing |
| `07-content-and-seed-data.md` | Copy teks, konten statis, data seed BPH 2025/2026 |
| `08-acceptance-checklist.md` | Daftar uji yang harus lolos sebelum selesai |
| `data/bph-2025-2026.md` | Data asli susunan BPH periode 2025/2026 |
