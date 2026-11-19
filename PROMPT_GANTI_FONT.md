# Prompt — Ganti Font ke Plus Jakarta Sans (untuk Google Antigravity)

Cara pakai: buka folder `D:\website_himasri` di Antigravity, lalu salin seluruh isi di antara `=== MULAI PROMPT ===` dan `=== SELESAI PROMPT ===` ke panel agen. Prompt ini bisa dijalankan **sesudah** website dibangun dengan `PROMPT_ANTIGRAVITY.md`. Jika website belum dibangun, prompt ini cukup memperbarui dokumen, sehingga pembangunan berikutnya langsung memakai font baru.

=== MULAI PROMPT ===

Ganti font website HIMASRI dari **Lexend** ke **Plus Jakarta Sans** di seluruh proyek. Kerjakan hanya perubahan font yang dijelaskan di bawah; jangan mengubah warna, layout, komponen, data, atau fitur lain.

## 1. Dependensi & pemuatan font
- Hapus paket `@fontsource/lexend` dan semua import-nya.
- Pasang `@fontsource-variable/plus-jakarta-sans` lalu import sekali di `web/src/app/main.tsx` (atau `web/src/styles/index.css`): `import "@fontsource-variable/plus-jakarta-sans";`.
- Preload file woff2 variabel (subset latin) di `web/index.html` dengan `<link rel="preload" as="font" type="font/woff2" crossorigin>` agar judul hero tidak berkedip saat dimuat. Gunakan `font-display: swap`.

## 2. Token tipografi
- Tailwind `theme.extend.fontFamily.sans` = `['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif']`; CSS variable `--font-sans` disamakan. Hapus semua sisa `Lexend`.
- Perbarui skala tipografi (ukuran & line-height tetap, ubah weight & letter-spacing):

| Token | Ukuran / line-height | Weight | Letter-spacing |
|---|---|---|---|
| `display-xl` | 64 / 72 | 800 | -2.5% |
| `h1` | 48 / 56 | 800 | -2% |
| `h2` | 36 / 44 | 700 | -1.5% |
| `h3` | 24 / 32 | 700 | -1% |
| `h4` | 20 / 28 | 700 | -0.5% |
| `body-lg` | 18 / 28 | 400 | 0 |
| `body` | 16 / 24 | 400 | 0 |
| `body-medium` | 16 / 24 | 500 | 0 |
| `small` | 14 / 20 | 400 | 0 |
| `small-medium` | 14 / 20 | 600 | 0 |
| `button` | 16 / 24 | 600 | 0 |
| `overline` | 13 / 16 | 700 | +12%, UPPERCASE |
| `caption` | 12 / 16 | 500 | +2% |
| `mobile-display` | 40 / 48 | 800 | -2% |
| `mobile-h2` | 28 / 36 | 700 | -1% |

- Kode referal besar di `/admin/kode-referal`: weight 800, letter-spacing +4%.

## 3. Angka tabular
Tambahkan `font-variant-numeric: tabular-nums` (utility Tailwind `tabular-nums`) pada: harga produk, stok, NIM, tanggal, penghitung slide "01 / 02", angka Stat Tile & count-up, hitung mundur hari kode referal, tabel riwayat kode, tabel verifikasi pengguna, dan paginasi. Tujuannya agar angka tidak bergeser saat berubah dan sejajar di tabel.

## 4. Dokumen
Perbarui semua penyebutan Lexend agar sesuai font baru: `docs/00-overview.md` (tabel teknologi), `docs/01-design-system.md` (judul §2 dan tabel tipografi di atas), `PROMPT_ANTIGRAVITY.md` (§1 Teknologi: ganti `@fontsource/lexend` menjadi `@fontsource-variable/plus-jakarta-sans`), dan `docs/08-acceptance-checklist.md` (butir "font Lexend" → "font Plus Jakarta Sans"). Jangan mengubah isi lain dokumen tersebut.

## 5. Verifikasi (wajib)
1. Cari di seluruh repo (kecuali `node_modules`) bahwa kata `Lexend` sudah tidak ada.
2. `npm run build`, `npm run lint`, `npm run test` lolos.
3. Jalankan `npm run dev`, periksa setiap halaman di lebar 375, 768, 1024, 1440 px: judul hero, kartu BPH, tombol, chip, sidebar, dan tabel tidak terpotong, tidak berganti baris secara janggal, dan tidak bertumpuk. Perbaiki hanya bila ada yang rusak akibat pergantian font.
4. Di DevTools, pastikan elemen teks memakai `Plus Jakarta Sans Variable` (bukan font cadangan).
5. Tambahkan bagian "Pergantian font" di `docs/BUILD_REPORT.md` (buat bila belum ada): berkas yang diubah, hasil pengecekan di tiap lebar layar, dan perbaikan yang dilakukan.

=== SELESAI PROMPT ===
