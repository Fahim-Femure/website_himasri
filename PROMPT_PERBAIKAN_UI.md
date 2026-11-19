# Prompt Antigravity — Perbaikan UI/UX & Warna HIMASRI (tanpa mengubah fungsi)

> Salin seluruh isi file ini ke Antigravity sebagai satu prompt. Kerjakan di repo `D:\website_himasri`.

---

## Peran & tujuan

Kamu adalah senior product designer sekaligus frontend engineer. Website HIMASRI (React + Vite + Tailwind v3.4 + Firebase) sudah berjalan, tetapi tampilannya terlihat seperti template buatan AI: gradien di mana-mana, sidebar maroon gelap, judul halaman berbentuk blok hero, overline kecil huruf besar di atas setiap judul, tile berikon dalam kotak berwarna, bayangan di semua kartu, dan terlalu banyak warna (raspberry, lemon, pink, empat maroon).

Tugasmu: **restyle tampilan saja** supaya terlihat tenang, rapi, dan dirancang manusia. Ruang anggota/admin harus terasa seperti alat kerja; situs publik tetap hangat dan berkarakter Palembang.

## Batasan keras (jangan dilanggar)

1. **Jangan ubah fungsi.** Route, guard, peran, Firestore Rules, Cloud Functions, service, skema data, validasi form, dan teks konten tetap sama.
2. **Jangan ubah data.** Termasuk susunan BPH dan entri Forkom (Faris Elhimma Fadli) yang memang sudah ditambahkan sebelumnya.
3. **Jangan hapus fitur atau komponen.** Komponen boleh di-restyle dan disederhanakan, tetapi API props tetap kompatibel; perbarui `src/components/ui/__tests__/ui.test.tsx` hanya bila kelas/teks yang diuji berubah.
4. **Jangan menambah dependency baru.**
5. Animasi yang sudah ada (`motion/react`, PageTransition, Reveal, HeroSlider) tetap, kecuali yang disebut di bawah. `prefers-reduced-motion` tetap dihormati.
6. Kerjakan hanya yang tertulis di prompt ini.

## 1. Token baru — ganti `web/tailwind.config.ts` bagian `colors`, `borderRadius`, `boxShadow`

Nama kunci lama dipertahankan agar kelas yang ada tidak rusak, tetapi nilainya diganti. Setelah itu sapu kode dan hapus pemakaian yang dilarang di §2.

```ts
colors: {
  // netral hangat — BUKAN pink
  cream: { 50: '#FAF8F5', 100: '#F3EFEA', 200: '#E7E1D9', 300: '#D6CEC4' },
  ink:   { 900: '#1F1A17', 600: '#6B635C', 400: '#9A918A' }, // ink-400 hanya placeholder/disabled
  // satu maroon utama + satu gelap
  maroon: { 950: '#3A0E14', 900: '#4A1219', 700: '#6E1A24', 500: '#57141C', 100: '#F4E9EA' },
  // emas: aksen tanda saja
  gold:  { 100: '#F6EFDB', 300: '#D9BE6A', 400: '#C9A227', 500: '#B8912A', 700: '#6E5512' },
  // status: pasangan pucat
  success: { 600: '#1E7F4F', 50: '#E7F3EC' },
  whatsapp: { 50: '#E7F3EC' },
  danger:  { 600: '#B42318', 50: '#FCEBEA' },
  warning: { 600: '#8A6100', 50: '#FBF1DA' },
  // red-600 (#BE1E3E raspberry) & red-800 DIHAPUS. Ganti semua pemakaiannya dengan maroon-700 / maroon-900.
},
borderRadius: { sm: '6px', md: '8px', lg: '10px', xl: '16px', full: '999px' },
boxShadow: {
  // hanya untuk lapisan melayang (dropdown, modal, drawer, toast). Kartu diam TIDAK berbayang.
  raised: '0 12px 32px -8px rgba(31, 26, 23, 0.18)',
  // card, gold-glow, maroon-glow DIHAPUS
},
```

Peran warna:

| Peran | Token | Aturan |
|---|---|---|
| Latar app | `cream-50` `#FAF8F5` | latar semua halaman `/anggota/*`, `/kelola/*`, `/admin/*` |
| Permukaan | `white` | kartu, tabel, input |
| Garis | `cream-200` `#E7E1D9` | border 1px — pengganti bayangan |
| Teks utama | `ink-900` | semua judul (h1–h4) di app, bukan maroon |
| Teks sekunder | `ink-600` | deskripsi, header tabel, meta |
| Primer | `maroon-700` (hover `maroon-500`) | tombol primer, indikator menu aktif, link, fokus |
| Aksen tanda | `gold-400/500` | maksimal satu per layar: garis songket tipis, chip periode berjalan |
| Status | pasangan `*-600` di atas `*-50` | pil status, badge stok, pesan form |

Proporsi target: **app** ±85% netral, 10% ink, 4% maroon, 1% emas. **Publik** ±60% krem, 25% bidang maroon, 10% ink, 5% emas.

Kontras teks normal tetap ≥ 4.5:1. Cek ulang setiap pasangan yang kamu pakai.

## 2. Aturan global (berlaku di seluruh `web/src`)

Hapus atau ganti:

- **Semua gradien** (`bg-gradient-*`, `from-*`, `via-*`, `to-*`, `linear-gradient` di CSS) kecuali satu: overlay foto hero publik (lihat §5). Ganti dengan warna solid.
- **Semua bayangan pada elemen diam** (`shadow-card`, `shadow-sm`, `shadow-md`, `shadow-*-glow`). Kartu memakai `border border-cream-200 bg-white`. Bayangan `shadow-raised` hanya untuk Modal, Drawer, dropdown, toast.
- **Semua `backdrop-blur`** (Drawer, Modal, Navbar, Topbar, AppLayout). Overlay modal cukup `bg-ink-900/40`. Navbar/Topbar memakai latar solid.
- **Overline / eyebrow** (teks kecil huruf besar di atas judul, mis. "ADMINISTRASI PENGGUNA", "GERBANG PENDAFTARAN", "KEPENGURUSAN", "PRESIDIUM INTI", "PRATINJAU LANGSUNG"). Hapus. Bila konteksnya perlu, cukup breadcrumb di Topbar yang sudah ada.
- **Penomoran dekoratif** `01`–`04` di `content/site.ts` dan tempat lain.
- **Ikon di dalam kotak/lingkaran berwarna** (StatTile, CultureCard, tile info Kode Referal, EmptyState). Ikon boleh tetap, polos, warna `ink-600`, ukuran 20.
- **`uppercase` + `tracking-*`** pada label, header tabel, label grup sidebar. Pakai huruf kapital biasa.
- **`font-mono`** di `ReferralCodePage.tsx` dan `UsersAccessPage.tsx`. Ganti `font-sans tabular-nums`.
- **Em dash (—) dekoratif** di UI copy; ganti titik, koma, atau titik dua. (Tanda "—" untuk sel kosong tabel boleh.)
- **`h-screen`** di layout → `min-h-dvh`.

Tipografi (Plus Jakarta Sans tetap):

| Elemen | App | Publik |
|---|---|---|
| h1 halaman | 28px / 36, weight 650, `ink-900`, tracking -1% | 56px desktop / 36px mobile, weight 750, maks 2 baris |
| h2 seksi | 18px / 28, weight 650 | 36px / 28px mobile |
| Body | 15px / 24 | 16–18px / 28 |
| Meta, header tabel | 13px / 20, `ink-600`, kapital biasa | 14px |
| Angka | `tabular-nums`, rata kanan di tabel | `tabular-nums` |

Maksimal 6 ukuran font per layar. Tidak ada teks < 12px.

Radius: pilih sekali — kartu & panel `rounded-lg` (10px), kontrol (input, select, tombol) `rounded-md` (8px), chip/pil status `rounded-full`. Tombol **tidak** lagi berbentuk pil penuh, kecuali chip filter.

Spasi: padding kartu 20–24px, jarak antar-seksi dalam halaman app 32px, gutter konten app 32px desktop / 16px mobile.

## 3. Bingkai aplikasi (`AppLayout`, `AppSidebar`, `NavItem`, `Topbar`)

- **Sidebar terang.** Latar `cream-100` `#F3EFEA` dengan `border-r border-cream-200`. Lebar tetap 256px. Teks menu `ink-900` 14px/500, ikon `ink-600` 18px.
- **Item aktif:** latar `white` + border `cream-200`, teks `maroon-700`, ikon `maroon-700`, dan bar 3px `maroon-700` di sisi kiri. **Bukan** pil kuning.
- Hover item: latar `cream-200/60`.
- Label grup (Jelajahi, Kelola, Admin): 12px/600 `ink-600`, kapital biasa, margin atas 24px.
- **Header sidebar = wajah produk:** logo HIMASRI 28px + "HIMASRI" 15px/700 `ink-900` + "Ruang Anggota" 13px `ink-600`. Di bawahnya satu garis songket tipis `gold-500` 2px × 32px — ini satu-satunya elemen emas di bingkai.
- Kartu profil di sidebar: hapus kotak bergradasi. Jadikan baris sederhana di bagian bawah sidebar: avatar 32px, nama 14px/600, peran 13px `ink-600`, di atas tombol "Lihat situs publik" dan "Keluar".
- **Avatar** (`Avatar.tsx`): latar `cream-200`, inisial `ink-900`, tanpa ring emas.
- **Topbar:** latar `cream-50` solid, `border-b border-cream-200`, tinggi 56px, breadcrumb 13px `ink-600`. Badge "Hak akses: Admin" jadi teks 13px `ink-600` biasa.
- Di < 1024px sidebar menjadi drawer dari kiri (perilaku yang ada dipertahankan, cukup restyle).

## 4. Komponen & halaman app

### Pola judul halaman (semua halaman app)

```
[h1 28px ink-900]                                  [aksi primer]
[deskripsi 15px ink-600, maks 1 kalimat, maks 640px]
```

Tanpa blok hero, tanpa latar berwarna, tanpa foto, tanpa overline. Margin bawah 24px. Terapkan di Struktur, Materi, Asisten Lab, Toko, Foto Beranda, Journey, Produk, Kode Referal, Pengguna, Periode.

### `Button.tsx`
- `primary`: `bg-maroon-700 text-white hover:bg-maroon-500`, tinggi 40px app / 48px publik, `rounded-md`.
- `secondary`: `bg-white border border-cream-300 text-ink-900 hover:bg-cream-100`.
- `danger`: `bg-white border border-danger-600/40 text-danger-600 hover:bg-danger-50`.
- `whatsapp`: hanya di **situs publik** (kontak Ketua/Wakil, kartu aslab publik) tetap `success-600` solid. Di app (Toko, Asisten Lab) pakai varian `secondary` + ikon WhatsApp berwarna `success-600`.
- Satu tombol primer per layar/kartu. Fokus: ring `maroon-700` 2px offset 2px.
- Target sentuh ≥ 44px tetap (tambahkan area klik bila tombol 40px).

### `Badge.tsx` & status
Semua badge = pil pucat 12px/600: `success`, `danger`, `warning`, `neutral` (`bg-cream-100 text-ink-600`), `maroon` (`bg-maroon-100 text-maroon-700`). Hapus badge kuning pekat dan badge gelap.

### `StatTile.tsx` → strip angka
Ganti grid 4 tile berwarna-berikon dengan satu **strip**: satu kartu putih, 4 kolom dipisah garis vertikal `cream-200`. Tiap kolom: angka 28px/700 `ink-900` `tabular-nums`, label 13px `ink-600` di bawahnya. Tanpa ikon, tanpa warna latar. Di mobile jadi grid 2×2.

### `/anggota/struktur` (`StructurePage.tsx`, `BphTree.tsx`)
- Hapus header bergradasi. Pakai pola judul + pemilih periode (select `rounded-md`) di kanan.
- Di bawahnya strip angka (BPH, Departemen, Anggota aktif, Aslab).
- `BphTree`: kartu orang = `bg-white border border-cream-200 rounded-lg`, tanpa bayangan, garis penghubung `cream-300` 1px. Label jabatan 13px `ink-600` (bukan chip pink). Ketua & Wakil boleh diberi aksen: border kiri 3px `maroon-700`.
- Foto besar kabinet (jika ada): tanpa bayangan, `rounded-lg`, caption 13px `ink-600` di bawahnya.

### `/admin/pengguna` (`UsersAccessPage.tsx`)
- Tab (Menunggu verifikasi / Semua pengguna / Aslab): gaya *underline tabs* — teks 14px/600, aktif `ink-900` dengan garis bawah 2px `maroon-700`, jumlah dalam pil `neutral`.
- Tabel: header 13px `ink-600` kapital biasa di atas `cream-100`, baris tinggi 56px, garis antar-baris `cream-200`, NIM `tabular-nums`.
- Aksi verifikasi: **Setujui** = `primary` kecil; **Tolak** = `secondary` (bukan merah pekat). Konfirmasi penolakan tetap lewat ConfirmDialog.
- **Matriks Hak Akses:** ganti lingkaran "V"/"E" dengan teks 13px: "Kelola" (`maroon-700`, weight 600), "Lihat" (`ink-900`), "—" (`ink-400`). Hapus legenda chip. Kolom peran rata tengah, sticky header.

### `/admin/kode-referal` (`ReferralCodePage.tsx`)
- **Bug:** kode aktif terbungkus jadi dua baris ("HMS-NOV26-D / UTZ"). Wajib satu baris: `whitespace-nowrap`, ukuran `clamp(28px, 4vw, 44px)`, weight 700, `tabular-nums`, `tracking-normal`.
- Layout: satu kartu putih dua kolom. Kiri: label "Kode aktif" 13px `ink-600`, kode, masa berlaku 14px, tombol "Salin kode" (`primary`) + "Bagikan ke grup" (`secondary` + ikon WA). Kanan: "Berganti dalam" + angka hari 44px `ink-900` + progress bar tipis 6px (track `cream-200`, isi `maroon-700`) + tanggal mulai/berakhir 13px.
- Hapus kartu kuning bergradasi, kartu foto gelap, dan tiga tile info berikon (gabungkan isinya jadi satu baris meta di bawah kartu).
- Zona bahaya "Kode bocor?": kartu putih `border-cream-200`, judul 15px/600, tombol `danger` outline. Bukan kartu pink.
- Riwayat kode: tabel standar (§ pola tabel di atas), status sebagai badge pucat.
- Peran Inti tetap melihat kode tanpa tombol buat ulang (logika yang ada).

### `/admin/periode` (`PeriodsBphPage.tsx`)
- Pemilih periode: select atau tab underline, bukan chip maroon.
- Hilangkan kartu di dalam kartu: tiap jabatan = satu baris form dua kolom (Nama lengkap | Program studi) dengan label jabatan 14px/600 `ink-900` di atasnya; pemisah antar-jabatan garis `cream-200`. Label jabatan bukan chip pink.
- Tombol "Simpan Pengurus Inti" `primary`, sticky di bawah kartu saat scroll di desktop.

### `/anggota/materi` (`MaterialsPage.tsx`, `MateriRow.tsx`, `ChipFilter.tsx`)
- Hapus header kuning.
- 12 chip jurusan → satu **select "Jurusan"** (dengan jumlah materi di tiap opsi) di samping judul. `ChipFilter` tetap dipakai hanya bila opsinya ≤ 5.
- Dua kolom tetap: kiri daftar mata kuliah (grup semester 13px/600 `ink-600`, item aktif latar `cream-100` + teks `maroon-700`), kanan materi.
- `MateriRow`: ikon file polos `ink-600`, judul 15px/600, meta 13px, badge tipe `neutral`, tombol "Buka" `secondary`.
- `SimulationNote` jadi teks 13px `ink-600` dengan ikon info, tanpa pil kuning.

### `/anggota/asisten-lab` (`LabAssistantsPage.tsx`, `LabAssistantCard.tsx`)
Kartu putih border, avatar 40px, nama 15px/600, prodi·angkatan 13px, chip lab `neutral`, jadwal 13px, tombol WA `secondary`. Filter fakultas/lab memakai select.

### `/anggota/toko` & `/kelola/produk` (`StorePage.tsx`, `ManageProductsPage.tsx`, `ProductCard.tsx`)
- Hapus header bergradasi berfoto.
- Filter event: tab underline atau chip `neutral` (aktif `bg-ink-900 text-white`).
- `ProductCard`: gambar 4:3 `rounded-md`, tanpa label event berwarna di atas gambar (pindahkan nama event jadi meta 13px di bawah judul), harga 18px/700 `tabular-nums`, badge stok pucat (`success`/`warning`/`danger`), tombol "Pesan via panitia" `secondary` + ikon WA. Mode `manage`: Ubah (`secondary`) + Hapus (`danger` ikon saja dengan `aria-label`).
- Placeholder gambar produk (bila tanpa foto): latar `cream-100` dengan logo HIMASRI 40% opasitas di tengah, bukan kotak maroon bertulisan mono.

### `/kelola/foto-beranda` (`ManageHeroPage.tsx`) & `/kelola/journey`
- Hapus header bergradasi. Pratinjau slider tetap, `rounded-lg`, tanpa bayangan, label "Pratinjau" 13px `ink-600` biasa.
- Panel pengaturan: kartu putih border; `ToggleSwitch` aktif `maroon-700`, nonaktif `cream-300`.
- Daftar foto: baris dengan thumbnail 64×40, caption, toggle aktif, handle urut; bukan kartu besar berbayang.

### `Drawer`, `Modal`, `EmptyState`, `Skeleton`, `Field`
- Drawer/Modal: panel putih, `shadow-raised`, overlay `bg-ink-900/40` tanpa blur, header 18px/650.
- `Field`: input putih, border `cream-300`, fokus border `maroon-700` + ring `maroon-700/15` 3px, error `danger-600`. Label 14px/600 `ink-900`.
- `EmptyState`: ikon polos 24px `ink-400`, judul 15px/600, satu kalimat 14px `ink-600`, satu aksi. Tanpa lingkaran berwarna.
- `Skeleton`: `bg-cream-200` dengan pulse yang ada.

## 5. Situs publik (`HomePage`, `JourneyPage`, `Navbar`, `Footer`, `HeroSlider`, auth pages)

- **Latar** `#FAF8F5`/`cream-50`, bidang gelap `maroon-900` `#4A1219` solid untuk maksimal 2 seksi (hero + satu seksi, mis. kontak). Hapus pink, raspberry, lemon.
- **Hero:** foto slider tetap. Overlay = satu-satunya gradien yang diizinkan: `linear-gradient(90deg, rgba(58,14,20,.82) 0%, rgba(58,14,20,.55) 60%, rgba(58,14,20,.25) 100%)` (maroon netral, bukan magenta). Headline maks **2 baris** di semua lebar (persingkat bila perlu tanpa mengubah makna; maks ±32 karakter per baris pada 56px). Satu kalimat pendukung tepat di bawahnya, satu tombol primer (`bg-white text-maroon-900`) + satu tombol sekunder outline putih. Kartu BPH kuning di hero dipindah keluar hero atau dibuat permukaan putih kecil.
- **Navbar:** maksimal 5 tautan + tombol "Masuk". Latar solid (`maroon-950` di atas hero, `cream-50` setelah scroll), tanpa blur.
- **Budaya Palembang (`CultureCard`):** hapus ikon dalam kotak dan gradien. Jadikan kartu dengan foto/ilustrasi `PalembangOrnament` di atas, judul 20px/700, deskripsi 16px. Warna blok bergantian boleh hanya `white` dan `cream-100`.
- **Agenda:** hapus blok warna pelangi. Daftar/tabel rapi: bulan 14px/600 `maroon-700`, nama kegiatan 18px/600, deskripsi 16px. Chip filter "Semua Waktu" dll. harus lolos kontras (aktif `bg-ink-900 text-white`, nonaktif `bg-white border-cream-300 text-ink-900`).
- **Timeline Kahim/Wakahim (`JourneyTimeline`):** satu kolom lurus (bukan zigzag), garis `cream-300`, titik periode `maroon-700`, periode berjalan diberi aksen `gold-500`.
- **Kontak Ketua/Wakil (`ContactCard`):** tetap dengan tombol WhatsApp `success-600` solid — ini satu-satunya hijau pekat di situs.
- **Footer:** ringkas 2–3 kolom (identitas + alamat, tautan utama, sosial). Bukan sitemap.
- **Body text** minimal 16px, label minimal 14px. Hapus 34 label mikro.
- **Mobile 390px:** hilangkan celah kosong ±464px di bawah hero (cek tinggi hero `min-h-[100svh]` vs konten), headline 36px maks 2 baris.
- **Login/Daftar (`AuthLayout`):** panel foto kiri memakai overlay hero di atas, panel form kanan `cream-50` solid, form terpusat vertikal, maks lebar 400px, tanpa eyebrow, tanpa bayangan kartu.

## 6. Perbarui dokumen desain

Setelah kode selesai, perbarui `docs/01-design-system.md` agar sesuai dengan prompt ini (token warna, tabel gradien tinggal satu baris overlay hero, tipografi app, radius, bayangan hanya `raised`, `NavItem` aktif, `StatTile` sebagai strip, `Badge` pucat, `Button` varian baru). Dokumen lama menyuruh gradien & tile berikon — itu sumber masalahnya, jadi wajib diganti agar build berikutnya tidak mengulang.

## 7. Verifikasi (wajib, laporkan hasilnya)

Jalankan dan pastikan lolos:

```bash
npm run lint
npm run build
npm --workspace=web run test
```

Lalu sapu kode, setiap perintah harus mengembalikan **0 hasil** di `web/src` (kecuali pengecualian yang disebut):

```bash
rg -n "bg-gradient|from-|via-|linear-gradient" web/src        # kecuali overlay hero (1 tempat) & AuthLayout yang memakai overlay yang sama
rg -n "shadow-card|shadow-sm|shadow-md|glow" web/src
rg -n "backdrop-blur" web/src
rg -n "font-mono" web/src
rg -n "#BE1E3E|#F7D154|#FAF6F7|#F2E8EA|#F5DCE1|red-600|red-800" web/src web/tailwind.config.ts
rg -n "uppercase" web/src                                    # tinjau tiap hasil; hanya boleh untuk singkatan seperti kode referal
```

Cek visual dengan akun demo di emulator (admin, akademik, kominfo, anggota) pada lebar **1440, 1024, 768, 390 px**:

- [ ] Kode referal satu baris di semua lebar.
- [ ] Sidebar terang, item aktif bar maroon, tidak ada pil kuning.
- [ ] Tidak ada judul halaman berbentuk blok hero di app.
- [ ] Setiap layar app maksimal 1 tombol primer maroon dan maksimal 1 elemen emas.
- [ ] Matriks hak akses berupa teks, tanpa lingkaran warna.
- [ ] Headline hero publik maks 2 baris di 1440 & 390.
- [ ] Chip "Semua Waktu" dan semua teks lolos kontras 4.5:1.
- [ ] Tidak ada scroll horizontal; target sentuh ≥ 44px; fokus keyboard terlihat.
- [ ] Semua alur fungsi (login, daftar, verifikasi, ubah peran, unggah materi, kelola hero, produk, buat ulang kode) masih berjalan seperti sebelumnya.

Tulis hasilnya sebagai seksi baru di `docs/BUILD_REPORT.md`: "Restyle UI/UX v3" — daftar file yang diubah, hasil tiap perintah di atas, screenshot before/after per halaman (simpan di `docs/screenshots/v3/`), dan butir yang gagal beserta alasannya.
