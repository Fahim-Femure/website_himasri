# 08 — Daftar Uji Penerimaan

Pekerjaan dianggap selesai hanya jika semua butir ini lolos. Tuliskan hasilnya di `docs/BUILD_REPORT.md` (butir, lolos/gagal, catatan).

## Build & kualitas
- [ ] `npm install` di root berhasil; `npm run build` (web + functions) tanpa error TypeScript.
- [ ] `npm run lint` tanpa error.
- [ ] `npm run dev` menjalankan Firebase Emulator + Vite; `npm run seed` mengisi emulator.
- [ ] Tidak ada kunci rahasia di repo; `.env.example` ada; `.gitignore` mencakup `.env.local`, `node_modules`, `dist`, `lib`, log emulator.

## Publik
- [ ] `/` tampil tanpa login, semua 9 bagian sesuai `02-pages-and-flows.md` §1.
- [ ] Hero bergeser otomatis sesuai `settings/hero`, bisa dijeda, titik bisa diklik, panah keyboard berfungsi, berhenti pada `prefers-reduced-motion`.
- [ ] Jumlah titik & penghitung mengikuti jumlah slide aktif; menambah/menonaktifkan slide di Kelola Foto Beranda langsung terlihat di beranda.
- [ ] Tidak ada NIM, anggota departemen, nomor aslab, atau kode referal yang bisa dibaca tamu (uji dengan Firestore Rules unit test).
- [ ] Navbar berubah saat scroll; tautan anchor menandai section aktif; sheet menu mobile bisa ditutup dengan Esc.
- [ ] Tombol WhatsApp Ketua/Wakil membuka `wa.me` di tab baru dengan pesan otomatis.

## Auth
- [ ] Daftar dengan kode salah → error di bawah field, akun tidak dibuat.
- [ ] Daftar dengan NIM yang sudah ada → error "NIM sudah terdaftar".
- [ ] Pilih aslab **Ya** → Fakultas & Laboratorium wajib; opsi lab berubah sesuai fakultas; pilih **Tidak** → kotak hilang dan nilainya dikosongkan.
- [ ] Daftar sukses → `/daftar/menunggu`; disetujui admin → otomatis masuk ruang anggota tanpa login ulang.
- [ ] Login dengan NIM + kata sandi; "Ingat saya" mengatur persistence.
- [ ] Pengguna `pending` tidak bisa membuka `/anggota/*` (UI dan Rules).

## Peran (uji tiap peran dengan akun emulator)
- [ ] Matriks `03-roles-and-access.md` terpenuhi di UI **dan** Rules (klien yang memalsukan request ditolak).
- [ ] Akademik bisa menambah mata kuliah & mengunggah/ubah/hapus materi; anggota biasa hanya membuka.
- [ ] Kominfo bisa unggah/urutkan/aktifkan foto hero dan mengelola produk & event; tidak bisa membuka `/admin/*`.
- [ ] Inti bisa melihat kode referal tetapi tombol "Buat ulang kode" tidak ada dan callable menolak.
- [ ] Admin bisa menyetujui/menolak, mengubah peran, menonaktifkan, mereset kata sandi; perubahan peran langsung berlaku di sesi pengguna.

## Kode referal
- [ ] `rotateReferralCode` (diuji dengan memanggil handler langsung di emulator) mengarsipkan kode lama dan membuat kode baru berformat `HMS-MMMYY-XXXX` berlaku 2 bulan.
- [ ] `regenerateReferralCode` langsung membuat kode lama tidak berlaku.
- [ ] Hitung mundur hari & progress bar sesuai `validFrom`/`validUntil`.

## Desain & aksesibilitas
- [ ] Warna, font Plus Jakarta Sans, radius, spasi sesuai `01-design-system.md`; tidak ada emoji sebagai ikon.
- [ ] Responsif di 375, 768, 1024, 1440 px tanpa scroll horizontal.
- [ ] Semua target klik ≥ 44px; fokus keyboard terlihat; kontras teks ≥ 4.5:1.
- [ ] Semua animasi di `06-animation-and-motion.md` ada; reduced motion dihormati.
- [ ] Lighthouse (build produksi, mobile) halaman `/`: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95.
