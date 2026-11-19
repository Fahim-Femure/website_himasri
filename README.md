# website_himasri

Persiapan proyek website **HIMASRI — Himpunan Mahasiswa Sriwijaya, Institut Teknologi PLN**. Folder ini **belum berisi kode**. Isinya hanya struktur folder dan dokumen spesifikasi yang akan dipakai agen AI (Google Antigravity) untuk membangun website dalam satu prompt.

## Langkah pakai

1. Isi `assets-source/` dengan logo dan dua foto hero (petunjuk di `assets-source/README.md`).
2. Buka folder ini di Antigravity sebagai workspace.
3. Salin isi prompt di `PROMPT_ANTIGRAVITY.md` (antara `=== MULAI PROMPT ===` dan `=== SELESAI PROMPT ===`) ke agen, lalu jalankan.
4. Setelah agen selesai, baca `docs/BUILD_REPORT.md` yang dibuatnya: berisi cara menjalankan, env yang perlu diisi, dan hasil uji.
5. Untuk online: buat project Firebase (paket Blaze untuk Cloud Functions terjadwal & Storage), isi `web/.env.local` dan `.firebaserc`, jalankan `npm run bootstrap:admin`, lalu `firebase deploy`.

## Isi folder

```
website_himasri/
├─ README.md                  ← file ini
├─ PROMPT_ANTIGRAVITY.md      ← prompt fullstack satu kali jalan
├─ docs/                      ← spesifikasi lengkap (desain, halaman, peran, data, backend, animasi, konten, uji)
│  └─ data/bph-2025-2026.md   ← data asli BPH 2025/2026
├─ assets-source/             ← logo & foto asli (diisi pemilik)
├─ firebase/                  ← rules & indeks (diisi agen)
├─ functions/                 ← Cloud Functions (diisi agen)
├─ scripts/                   ← seed & bootstrap admin (diisi agen)
└─ web/                       ← aplikasi React + Vite (diisi agen)
```

## Ringkasan teknologi

React 18 + TypeScript + Vite · React Router v6 · Tailwind CSS 3.4 · motion (animasi) · React Hook Form + Zod · Firebase (Auth, Firestore, Storage, Cloud Functions 2nd gen, Hosting) · Firebase Emulator Suite.

Desain acuan: Figma `website_himasri`, page `v2 —` dan `Design System`.
