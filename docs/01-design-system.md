# Design System HIMASRI — Color Blocking dengan Cahaya (v3.1)

Dokumen ini menjadi acuan tunggal untuk seluruh token warna, gradien, cahaya, bayangan, radius, tipografi, ornamen Songket, dan komponen UI pada aplikasi web HIMASRI (situs publik, autentikasi, dan Ruang Anggota).

---

## 1. Arah Desain & Sumber Cahaya

- **Konsep Utama**: *Color Blocking dengan Cahaya* — blok warna besar yang berselang-seling (Maroon, Emas, Krem, Maroon Gelap) untuk memisahkan hierarki dan peran tiap bagian.
- **Sumber Cahaya**: Datang seragam dari **kiri-atas (±135°)**.
  - Setiap permukaan mendapat *1px inset highlight* lembut di sisi atas (`rgba(255, 255, 255, ...)`).
  - Bayangan jatuh ke kanan-bawah menggunakan tinta maroon (`rgba(42, 10, 15, ...)`) agar hangat dan menyatu dengan palet.
- **Aturan Gradien**: Gradien (`--g-*`) hanya dipakai pada permukaan besar (Sidebar, PageHeader, StatTile, Kartu Kode Referal, Kontak, Hero, Pita CTA, Footer) dan tombol utama. Tidak ada teks gradien (`bg-clip-text`) maupun border pelangi.
- **Ornamen Songket**: Komponen `<SongketPattern />` berupa kisi belah ketupat tipis berwarna emas (`opacity` 6%–10%), maksimal 1 area per layar pada permukaan maroon/gelap.

---

## 2. Token Warna

### 2.1 Palet Utama
| Token | Hex | Peran |
| :--- | :--- | :--- |
| `--color-maroon-950` | `#2A0A0F` | Blok gelap, bayangan dasar, teks di atas emas |
| `--color-maroon-900` | `#460D15` | Permukaan maroon gelap, akhir gradien sidebar/header |
| `--color-maroon-800` | `#5F1420` | Teks aksen maroon kontras tinggi, harga produk |
| `--color-maroon-700` | `#7A1F2B` | Maroon utama (highlight sisi terang) |
| `--color-maroon-500` | `#9E3341` | Aksen border/strip |
| `--color-maroon-300` | `#D48B94` | Label grup di atas sidebar gelap, ikon empty state |
| `--color-maroon-100` | `#F8E9EC` | Latar badge maroon & pilihan aktif |

### 2.2 Emas & Krem Hangat
| Token | Hex | Peran |
| :--- | :--- | :--- |
| `--color-gold-600` | `#947218` | Aksen emas gelap untuk teks kecil |
| `--color-gold-500` | `#BC9428` | Akhir gradien tombol/blok emas |
| `--color-gold-400` | `#D9B54A` | Emas utama & cincin fokus keyboard (`3px`) |
| `--color-gold-300` | `#EBC65C` | Highlight awal gradien emas & teks aksen di atas gelap |
| `--color-gold-100` | `#FBF3DA` | Kolom Admin aktif di matriks, glow lembut empty state |
| `--color-cream-50` | `#FFFBF3` | Latar halaman dasar & permukaan terang |
| `--color-cream-100` | `#F7EFE0` | Akhir gradien blok krem & pemisah bagian |
| `--color-cream-200` | `#EADCC5` | Garis batas halus antar kartu/sekat |
| `--color-cream-300` | `#D8C3A4` | Border input & kontrol pasif |

### 2.3 Teks & Semantik
| Token | Hex | Peran |
| :--- | :--- | :--- |
| `--color-ink-900` | `#1C1012` | Teks utama di atas permukaan terang |
| `--color-ink-600` | `#5E4B4E` | Teks sekunder & keterangan |
| `--color-ink-400` | `#8F7B7E` | Placeholder & tanda strip kosong (`—`) |
| `--color-success-600` | `#15803D` | Status berhasil / stok aman |
| `--color-whatsapp-600` | `#16A34A` | Tombol solid WhatsApp di kontak publik & ikon WA |
| `--color-danger-600` | `#B91C1C` | Validasi galat & aksi hapus |
| `--color-warning-600` | `#B45309` | Peringatan & stok menipis |

---

## 3. Token Gradien & Bayangan

### 3.1 Gradien Permukaan (135° / 160° / 180°)
- `--g-maroon`: `linear-gradient(135deg, #7A1F2B 0%, #5F1420 52%, #460D15 100%)`
- `--g-sidebar`: `linear-gradient(180deg, #5F1420 0%, #460D15 48%, #2A0A0F 100%)`
- `--g-gold`: `linear-gradient(135deg, #EBC65C 0%, #D9B54A 50%, #BC9428 100%)`
- `--g-cream`: `linear-gradient(135deg, #FFFFFF 0%, #FFFBF3 55%, #F7EFE0 100%)`
- `--g-dark`: `linear-gradient(135deg, #460D15 0%, #2A0A0F 65%, #1A0508 100%)`
- `--g-btn`: `linear-gradient(135deg, #8F2533 0%, #7A1F2B 55%, #5F1420 100%)`
- `--g-page`: `radial-gradient(ellipse 80% 45% at 10% 0%, #FBF3DA 0%, #FFFBF3 45%, #F7EFE0 100%)`
- `--g-hero`: `linear-gradient(160deg, rgba(42, 10, 15, 0.72) 0%, rgba(70, 13, 21, 0.52) 48%, rgba(42, 10, 15, 0.88) 100%)`

### 3.2 Bayangan Berlapis (Maroon-Tinted + Inset Highlight)
- `shadow-card`: Kartu putih/krem standar + `inset 0 1px 0 rgba(255,255,255,0.8)`
- `shadow-lift`: Efek hover kartu interaktif (`-translate-y-0.5`)
- `shadow-block`: Blok maroon & gelap (`PageHeader`, `AppSidebar`, `StatTile` maroon/dark)
- `shadow-gold`: Blok & tombol emas (`0 12px 28px -8px rgba(188,148,40,0.32)`)
- `shadow-btn`: Tombol utama & chip aktif
- `shadow-glow`: Item aktif navigasi sidebar & titik periode berjalan
- `shadow-raised`: Modal, Drawer, dan Dropdown

---

## 4. Radius & Tipografi

- **Radius**: `sm: 8px`, `md: 12px` (tombol, input), `lg: 16px` (kartu, tabel), `xl: 24px` (blok besar, `PageHeader`, `StatTile`, Hero), `full: 999px` (chip, pill CTA, avatar).
- **Font**: `Plus Jakarta Sans` (tanpa `font-mono` di seluruh aplikasi; angka sejajar menggunakan `tabular-nums`).
- **Ukuran**: Minimal `15px` untuk isi aplikasi dan `16px` untuk situs publik; `type-app-h1` (`26px`/`32px` bold `800`); `type-display-xl` (`40px`–`64px` bold `800`).
- **Aksesibilitas**: Kontras teks minimal `4.5:1`, target sentuh minimal `44px`, cincin fokus keyboard `3px solid #D9B54A` (`offset 2px`), serta menghormati `prefers-reduced-motion` (termasuk animasi kilau `.referral-sheen`).

---

## 5. Komponen Utama

- **App Frame**: Sidebar gelap (`--g-sidebar`) dengan `<SongketPattern corner="br" />`, item aktif emas (`--g-gold` + `shadow-glow`), Topbar krem transparan (`backdrop-blur-md`), dan latar halaman `--g-page`.
- **PageHeader (`tone?: 'maroon' | 'dark' | 'gold'`)**: Tajuk blok warna dengan pola Songket sudut kanan atas pada varian maroon/gelap.
- **StatTile (`variant?: 'maroon' | 'gold' | 'cream' | 'dark'`)**: 4 blok statistik berwarna kontras dengan angka `40px` `tabular-nums`.
- **Button**: Varian `primary` (`--g-btn`), `gold` (`--g-gold`), `secondary`, `onDark`, `outlineOnDark`, `whatsapp` (solid hijau untuk kontak publik), `danger`, dan `ghost`.
- **LabAssistantCard**: Kartu krem dengan strip atas `--g-maroon` `56px`, badge lab emas, dan Avatar `56px` bertumpuk di atas garis batas.
- **ProductCard**: Kartu produk dengan placeholder fallback `--g-maroon` + `<SongketPattern />` dan harga `maroon-800`.
- **Public HomePage**: Urutan blok bergantian Hero (`--g-hero`) → Tentang (`--g-cream` + blok foto/emas bertumpuk) → Budaya (`cream-100` dengan 4 variasi warna `CultureCard`) → BPH & Kontak (`--g-maroon` + `<SongketPattern />`) → Agenda (`--g-cream` dengan 1 kartu sorotan `--g-gold`) → Journey (`--g-dark` + titik emas `shadow-glow`) → CTA (`--g-gold`) → Footer (`--g-dark`).
