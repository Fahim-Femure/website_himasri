# 06 — Animasi & Transisi

Pustaka: `motion` (`import { motion, AnimatePresence, useReducedMotion } from "motion/react"`). Animasi CSS sederhana (hover, focus) boleh pakai Tailwind `transition`.

## 1. Prinsip

- Animasi menjelaskan perubahan, bukan hiasan. Hanya animasikan `opacity` dan `transform` (translate/scale) agar mulus — jangan animasikan `width`, `height`, `top`, `left`, kecuali tinggi akordeon memakai `height: auto` milik motion.
- Token durasi: `fast` 150ms, `base` 200ms, `medium` 300ms, `slow` 500ms, `hero` 600ms.
- Easing: masuk `[0.16, 1, 0.3, 1]` (ease-out-expo), keluar `[0.7, 0, 0.84, 0]`, standar `[0.4, 0, 0.2, 1]`. Keluar selalu lebih cepat dari masuk (±70%).
- `prefers-reduced-motion: reduce` (atau pengaturan hero "Hormati kurangi gerakan"): matikan auto-geser carousel, ganti semua gerakan translate/scale menjadi fade 150ms, matikan Ken Burns dan count-up.
- Simpan token di `web/src/components/motion/tokens.ts`; buat primitif `FadeIn`, `Reveal`, `Stagger`, `PageTransition` di `components/motion/`.

## 2. Hero slider (beranda publik & pratinjau di Kelola Foto Beranda)

| Perilaku | Detail |
|---|---|
| Auto-geser | Tiap `settings/hero.durationSec` detik (default 5). Jeda saat: hover pada hero, fokus keyboard di dalam hero, tab browser tersembunyi (`visibilitychange`), tombol jeda ditekan, atau reduced motion. |
| Transisi `fade` | Slide baru `opacity 0→1` durasi 600ms easing standar, slide lama `1→0` 600ms (crossfade, keduanya absolute). |
| Transisi `slide` | `x: 6% → 0` + fade 600ms; arah mengikuti navigasi (maju/mundur). |
| Ken Burns | Foto aktif `scale 1.06 → 1` selama durasi slide (linear). Dimatikan saat reduced motion. |
| Konten teks | Badge, judul, subjudul, tombol masuk berurutan (stagger 80ms): `y 24 → 0`, `opacity 0 → 1`, 500ms ease-out-expo — hanya saat halaman pertama dimuat, tidak diulang tiap slide. |
| Titik navigasi | Titik aktif melebar `12px → 40px` dan berubah warna (layout animation 300ms). Bisa diklik & dipakai keyboard (←/→ saat fokus di carousel). |
| Penghitung | "01 / 02" berganti dengan fade-slide vertikal 200ms; `aria-live="polite"`. |
| Caption | Fade 300ms saat slide berganti. |
| Gambar | `loading="eager"` + `fetchpriority="high"` untuk slide pertama, lainnya di-preload setelah load; `object-fit: cover`; posisi fokus dari field opsional `focalY`. |

## 3. Navbar publik

- Transparan di atas hero; setelah scroll > 80px: latar `maroon-950/92` + `backdrop-blur-md` + bayangan, transisi 300ms.
- Garis bawah tautan aktif: `scaleX 0 → 1` dari kiri, 200ms. Section aktif dideteksi dengan `IntersectionObserver`.
- Klik tautan: scroll halus (`scroll-behavior: smooth`, offset tinggi navbar 88px); reduced motion → lompat langsung.
- Sheet menu mobile: overlay fade 200ms + panel `x 100% → 0` 300ms; tutup 200ms; fokus terkunci di dalam sheet; Esc menutup.

## 4. Reveal saat scroll (situs publik)

- Setiap section: judul & overline `y 24 → 0`, fade, 500ms saat 20% terlihat, sekali saja (`viewport={{ once: true, amount: 0.2 }}`).
- Grid kartu (Budaya, BPH, Agenda, pilar): stagger 60ms per kartu, `y 16 → 0` + fade 400ms.
- Statistik/angka (Stat Tile di ruang anggota): count-up 0 → nilai dalam 800ms ease-out saat pertama terlihat.

## 5. Mikro-interaksi

| Elemen | Animasi |
|---|---|
| Button | hover: kecerahan latar naik / latar outline terisi 8%, 150ms; active: `scale .97` 100ms; loading: spinner berputar 800ms linear, label tetap terbaca ("Menyimpan…"). |
| Kartu (Culture, Product, Member, LabAssistant) | hover (pointer: fine saja): `y -4px` + bayangan `card → raised`, 200ms. |
| Chip / segmented control | indikator terpilih bergeser ke chip baru (`layoutId`), 250ms. |
| Choice (radio kartu) | warna latar & titik berubah 150ms; titik `scale .6 → 1`. |
| Field | border & ring fokus 150ms; pesan error muncul `y -4 → 0` + fade 150ms; field error bergetar kecil (`x: 0,-4,4,-2,2,0`, 300ms) saat submit gagal (dimatikan pada reduced motion). |
| Toggle switch | knob bergeser dengan spring (`stiffness 500, damping 30`). |
| Tombol mata kata sandi | ikon crossfade 150ms. |
| Salin kode referal | ikon copy → check (crossfade 150ms) selama 1,5 detik + toast. |
| Toast (sonner) | default sonner; posisi kanan bawah desktop, atas tengah mobile. |

## 6. Transisi halaman & layout

- Ganti route di dalam `AppLayout`: konten `opacity 0 → 1` + `y 8 → 0`, 250ms (sidebar tidak ikut beranimasi). Keluar: fade 150ms (`AnimatePresence mode="wait"`).
- Ganti route publik ↔ auth: fade 200ms.
- Item sidebar aktif: latar emas bergeser antar item (`layoutId="nav-active"`), 250ms.
- Sidebar mobile (drawer): sama dengan sheet menu §3.

## 7. Komponen khusus

| Komponen | Animasi |
|---|---|
| Form daftar — kotak "Detail asisten lab" | Muncul saat pilih **Ya**: tinggi `0 → auto` + fade 300ms; hilang 200ms. Select Laboratorium aktif setelah fakultas dipilih (fade 150ms). |
| Dropdown/select kustom | `opacity 0 → 1`, `y -4 → 0`, `scale .98 → 1`, 150ms; origin atas. |
| Drawer kanan (Unggah materi, Tambah/Ubah produk di mobile) | scrim fade 200ms; panel `x 100% → 0` 300ms ease-out-expo; tutup 200ms. Fokus ke field pertama; Esc/klik scrim menutup (konfirmasi bila form kotor). |
| Modal/ConfirmDialog | scrim fade 150ms; dialog `scale .96 → 1` + fade 200ms. |
| Progress unggah berkas | bar lebar mengikuti persen (transform `scaleX`), 150ms. |
| Daftar foto hero (drag urutkan) | item yang diseret terangkat (`scale 1.02`, bayangan raised); item lain bergeser dengan layout animation 200ms (`Reorder` dari motion). |
| Progress masa berlaku kode | bar `scaleX 0 → nilai` 800ms saat halaman dibuka. |
| Halaman Menunggu verifikasi | ikon jam berdenyut pelan (`scale 1 ↔ 1.05`, 2 detik, berulang); saat disetujui: ikon berubah ke centang dengan scale-in 300ms sebelum redirect. |
| Skeleton loader | shimmer gradien bergerak 1,2 detik linear berulang (dimatikan pada reduced motion → latar statis). |
| Tabel verifikasi | baris yang disetujui/ditolak keluar: fade + `x 16` 200ms, sisa baris merapat (layout 200ms). |
| Empty state | ikon fade + `y 8 → 0` 300ms. |
