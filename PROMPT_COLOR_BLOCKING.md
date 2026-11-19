# Prompt Antigravity — Color Blocking dengan Cahaya (HIMASRI v3.1)

> Salin seluruh isi file ini ke Antigravity sebagai satu prompt. Kerjakan di repo `D:\website_himasri`.
> Prompt ini **menggantikan arah visual** `PROMPT_PERBAIKAN_UI.md`. Perbaikan struktur dari prompt itu tetap dipakai (lihat §1).

---

## Peran & tujuan

Kamu adalah senior visual designer sekaligus frontend engineer. Restyle sebelumnya membuat website terlalu polos: putih, datar, tanpa kedalaman. Pemilik ingin gaya **color blocking**: bidang warna besar maroon, emas, krem, dan gelap yang saling bergantian, lengkap dengan **gradasi, bayangan, highlight, dan pencahayaan**. Hasilnya harus terasa mewah, hidup, dan semi-profesional. Jangan polos, tapi juga jangan acak seperti template AI.

Kuncinya: **semua efek mengikuti satu sistem cahaya**. Efek yang mengikuti satu aturan terlihat dirancang. Efek yang ditaruh di mana-mana tanpa aturan terlihat seperti slop.

## Batasan keras

1. Hanya tampilan yang berubah. Route, guard, peran, Firestore Rules, Cloud Functions, service, skema data, validasi, konten teks, dan data BPH (termasuk Forkom) tetap sama.
2. Jangan menambah dependency. Pakai Tailwind, CSS variables, dan `motion/react` yang sudah ada.
3. API props komponen tetap kompatibel. Perbarui test hanya bila kelas/teks yang diuji berubah.
4. Semua animasi baru menghormati `prefers-reduced-motion`.
5. Kerjakan hanya yang tertulis di sini.

## 1. Yang dipertahankan dari restyle sebelumnya

- Kode referal satu baris (`whitespace-nowrap`, `tabular-nums`).
- Matriks hak akses berupa teks "Kelola" / "Lihat" / "—", tanpa lingkaran warna.
- Jurusan di Materi memakai select, bukan 12 chip.
- Tidak ada `font-mono`, tidak ada `backdrop-blur` di overlay modal (blur boleh di §4.6), `min-h-dvh` menggantikan `h-screen`.
- Tidak ada penomoran dekoratif 01–04. Tidak ada ikon di dalam kotak/lingkaran berwarna.
- Body text minimal 15px di app dan 16px di publik. Headline hero maksimal 2 baris.
- Kontras teks normal ≥ 4.5:1, target sentuh ≥ 44px, fokus keyboard terlihat.
- Tombol "Tolak" tetap sekunder, bukan merah pekat. WhatsApp hijau solid hanya di kontak publik.

## 2. Sistem cahaya (aturan inti — wajib di semua layar)

1. **Satu sumber cahaya, dari kiri atas (±135°).** Semua gradien menjadi terang di kiri atas dan gelap di kanan bawah. Highlight selalu di tepi atas. Bayangan selalu jatuh ke bawah.
2. **Gradien hanya di bidang besar:** sidebar, pita header halaman, tile KPI, kartu unggulan (kode referal, kontak Ketua/Wakil, hero), seksi gelap publik, dan footer. Tombol primer boleh gradien halus 2 stop. **Teks tidak pernah bergradien.**
3. **Maksimal 3 warna blok per layar** dari empat keluarga: maroon, emas, krem, gelap. Setiap warna punya arti:
   - **maroon** = identitas organisasi (sidebar, header, blok struktur);
   - **emas** = sesuatu yang ditonjolkan (kode aktif, periode berjalan, item aktif, Ketua);
   - **krem** = permukaan konten (kartu, tabel, form);
   - **gelap** (maroon-950) = kedalaman dan kontras (footer, seksi penutup, tile ke-4).
4. **Kedalaman berlapis.** Setiap permukaan yang terangkat memakai: bayangan ambient (lebar, lembut) + bayangan kunci (pendek, lebih gelap) + highlight 1px di tepi atas (`inset`). Bayangan berwarna maroon, bukan hitam.
5. **Satu elemen tanda per layar:** motif songket (garis belah ketupat emas) di sudut bidang maroon, opasitas 6–10%. Jangan diulang di setiap kartu.
6. **Interaksi = cahaya bergerak.** Hover kartu: naik 2px, bayangan lebih dalam, highlight lebih terang. Tombol ditekan: turun 1px, bayangan menipis. Durasi 180–220ms, `ease-out`.

## 3. Token — ganti di `web/tailwind.config.ts` dan `web/src/styles/index.css`

### 3.1 Warna (`theme.extend.colors`)

```ts
maroon: { 950: '#2A0A0F', 900: '#4A1219', 800: '#5E1620', 700: '#7A1F2B', 500: '#9E2F3C', 300: '#C98A92', 100: '#F2DCDC' },
gold:   { 100: '#F6EBC8', 300: '#E6C76A', 400: '#D9B54A', 500: '#C9A227', 700: '#735510' },
cream:  { 50: '#FFFBF3', 100: '#F7EFE0', 200: '#EDE0C8', 300: '#E0CDA9' },
ink:    { 900: '#2B1A1C', 600: '#6B5457', 400: '#8C7A7D' },          // ink-400 hanya placeholder/disabled
success: { 600: '#1E7F4F', 50: '#E6F4EC' },
whatsapp: { 50: '#E6F4EC' },
danger:  { 600: '#B42318', 50: '#FDECEA' },
warning: { 600: '#8A6100', 50: '#FBF1DA' },
// DILARANG: raspberry #BE1E3E, lemon #F7D154 / #EEC02B, netral pink #FAF6F7 / #F2E8EA / #F5DCE1, red-600, red-800
```

Pasangan kontras aman: `ink-900`/`ink-600` di atas `cream-*`/`white`; `cream-50`/`gold-300` di atas `maroon-700…950`; `maroon-950`/`maroon-900` di atas `gold-300…500`.

### 3.2 Gradien (CSS variables di `:root`, lalu utilitas `bg-[image:var(--g-…)]` atau kelas `.g-…`)

```css
:root {
  /* bidang maroon — cahaya kiri atas */
  --g-maroon: radial-gradient(120% 90% at 0% 0%, rgba(201,162,39,.16) 0%, rgba(201,162,39,0) 45%),
              linear-gradient(135deg, #8A2533 0%, #7A1F2B 35%, #4A1219 100%);
  /* sidebar — sedikit lebih gelap, cahaya di atas */
  --g-sidebar: radial-gradient(140% 60% at 0% 0%, rgba(230,199,106,.14) 0%, rgba(230,199,106,0) 50%),
               linear-gradient(180deg, #5E1620 0%, #3A0E15 60%, #2A0A0F 100%);
  /* emas — logam dengan kilau */
  --g-gold: radial-gradient(100% 120% at 0% 0%, rgba(255,251,243,.55) 0%, rgba(255,251,243,0) 45%),
            linear-gradient(135deg, #E6C76A 0%, #D9B54A 45%, #B8912A 100%);
  /* krem — permukaan hangat */
  --g-cream: linear-gradient(160deg, #FFFDF8 0%, #F7EFE0 100%);
  /* gelap — kedalaman */
  --g-dark: radial-gradient(110% 80% at 100% 0%, rgba(158,47,60,.35) 0%, rgba(158,47,60,0) 55%),
            linear-gradient(135deg, #3A0E15 0%, #2A0A0F 100%);
  /* tombol primer — 2 stop halus */
  --g-btn: linear-gradient(180deg, #8A2533 0%, #7A1F2B 100%);
  /* latar halaman app — sangat halus, bukan putih datar */
  --g-page: radial-gradient(80% 50% at 100% 0%, rgba(201,162,39,.07) 0%, rgba(201,162,39,0) 60%),
            linear-gradient(180deg, #FFFBF3 0%, #F7EFE0 100%);
  /* overlay hero foto */
  --g-hero: linear-gradient(90deg, rgba(42,10,15,.92) 0%, rgba(74,18,25,.78) 45%, rgba(122,31,43,.35) 100%),
            linear-gradient(180deg, rgba(42,10,15,0) 55%, rgba(42,10,15,.85) 100%);
}
```

### 3.3 Bayangan & highlight (`theme.extend.boxShadow`)

```ts
boxShadow: {
  // permukaan terang
  card:   '0 1px 0 0 rgba(255,255,255,.9) inset, 0 1px 2px rgba(74,18,25,.06), 0 10px 24px -8px rgba(74,18,25,.12)',
  lift:   '0 1px 0 0 rgba(255,255,255,.95) inset, 0 2px 4px rgba(74,18,25,.08), 0 18px 36px -12px rgba(74,18,25,.22)',
  // blok berwarna (maroon/gelap)
  block:  '0 1px 0 0 rgba(255,255,255,.10) inset, 0 -1px 0 0 rgba(0,0,0,.25) inset, 0 4px 8px rgba(42,10,15,.18), 0 22px 44px -14px rgba(42,10,15,.45)',
  // blok emas
  gold:   '0 1px 0 0 rgba(255,251,243,.7) inset, 0 -1px 0 0 rgba(115,85,16,.35) inset, 0 4px 8px rgba(115,85,16,.18), 0 20px 40px -14px rgba(115,85,16,.40)',
  // tombol
  btn:    '0 1px 0 0 rgba(255,255,255,.18) inset, 0 1px 2px rgba(42,10,15,.25), 0 6px 14px -6px rgba(122,31,43,.55)',
  // item aktif / fokus emas
  glow:   '0 0 0 1px rgba(230,199,106,.55), 0 6px 18px -6px rgba(201,162,39,.55)',
  // lapisan melayang (modal, drawer, dropdown)
  raised: '0 24px 60px -16px rgba(42,10,15,.40), 0 8px 20px -8px rgba(42,10,15,.20)',
},
borderRadius: { sm: '8px', md: '12px', lg: '16px', xl: '24px', full: '999px' },
```

Radius: tombol & input `rounded-md` (12), kartu `rounded-lg` (16), blok besar & hero `rounded-xl` (24), chip `rounded-full`. Tombol primer boleh `rounded-full` di situs publik saja.

### 3.4 Motif songket

Buat `src/components/ui/SongketPattern.tsx`: SVG belah ketupat berulang (stroke `gold-300`, 1px, sel 24px), `position:absolute`, `pointer-events:none`, `aria-hidden`, props `opacity` (default 0.08) dan `corner` (`tr` | `br` | `full`). Pakai dengan `mask-image: radial-gradient(...)` supaya memudar ke tengah. Hanya ditaruh di bidang maroon/gelap, maksimal satu per layar.

## 4. Komponen

### 4.1 `AppLayout` & latar
Latar halaman app memakai `--g-page` (krem hangat dengan cahaya emas tipis di kanan atas), bukan putih datar.

### 4.2 `AppSidebar` & `NavItem`
- Latar `--g-sidebar` + `shadow-block`, `SongketPattern corner="br" opacity={0.06}`.
- Header: logo HIMASRI 32px dalam lingkaran krem dengan `shadow-gold`, "HIMASRI" 16px/800 `cream-50`, "Ruang Anggota" 13px `gold-300`.
- Label grup 12px/600 `maroon-300`, kapital biasa.
- Item default: teks `cream-100/85`, ikon `cream-100/70`; hover latar `white/6` dengan highlight `inset 0 1px 0 rgba(255,255,255,.06)`.
- **Item aktif: blok `--g-gold`, teks `maroon-950` 600, ikon `maroon-900`, `shadow-glow`.** Satu-satunya emas penuh di sidebar.
- Profil di bawah: kartu `white/6` dengan border `white/10`, avatar ring `gold-400`.

### 4.3 `Topbar`
Latar `cream-50/80` + `backdrop-blur-md` (diizinkan di sini saja), border bawah `cream-200`, breadcrumb 13px `ink-600`, badge peran `bg-maroon-100 text-maroon-800`.

### 4.4 `PageHeader` baru (`src/components/layout/PageHeader.tsx`) — pita color block
Dipakai di semua halaman app, menggantikan judul polos:

```
┌───────────────────────────────────────────────────────────────┐  --g-maroon, rounded-xl, shadow-block
│  [label 13px gold-300, opsional, satu]                       ░░│  SongketPattern corner="tr"
│  Judul halaman 32px/800 cream-50                [aksi]        ░│
│  Deskripsi 15px cream-100/80, maks 1 kalimat                    │
└───────────────────────────────────────────────────────────────┘
```

- Padding 32px desktop / 20px mobile, tinggi alami (tanpa foto, tanpa ilustrasi besar).
- Props: `title`, `description`, `label?`, `actions?`, `tone?: 'maroon' | 'dark' | 'gold'` (default maroon). Halaman Kode Referal memakai `dark` agar kartu emas di bawahnya menonjol; halaman lain `maroon`.
- Aksi di atas pita: tombol `onDark` (krem dengan teks maroon, `shadow-btn`).

### 4.5 `Button`
- `primary`: `--g-btn`, teks `cream-50`, `shadow-btn`, hover `brightness-110` + naik 1px, active turun 1px.
- `gold`: `--g-gold`, teks `maroon-950`, `shadow-gold` — untuk satu aksi paling penting di sebuah blok (mis. "Salin kode").
- `secondary`: `bg-white`, border `cream-300`, `shadow-card`, teks `ink-900`.
- `onDark`: `bg-cream-50`, teks `maroon-900`, `shadow-btn`.
- `danger`: outline `danger-600`, hover `bg-danger-50`.
- `whatsapp`: `success-600` solid dengan highlight inset — hanya situs publik. Di app pakai `secondary` + ikon WA hijau.
- Fokus: ring `gold-400` 3px offset 2px.

### 4.6 Kartu & permukaan
- Kartu konten: `bg-[image:var(--g-cream)]` atau `bg-white`, border `cream-200`, `rounded-lg`, `shadow-card`; hover (bila bisa diklik) `shadow-lift` + `-translate-y-0.5`.
- Tabel: dibungkus kartu; header tabel `bg-cream-100` 13px/600 `ink-600`; baris hover `bg-gold-100/50`; angka `tabular-nums`.
- Modal/Drawer: panel `cream-50`, `shadow-raised`, overlay `bg-maroon-950/50` + `backdrop-blur-sm`.
- `Badge`: pil pucat (`success`, `warning`, `danger`, `neutral` krem, `maroon`), plus varian `gold` = `--g-gold` dengan teks `maroon-950` untuk status unggulan ("Berjalan", "Aktif").
- `Avatar`: latar `--g-maroon`, inisial `cream-50`, ring 2px `gold-400`.
- `EmptyState`: ikon polos 28px `maroon-300` di atas lingkaran cahaya (radial `gold-100` → transparan, bukan kotak), judul 16px/700, satu aksi.

### 4.7 `StatTile` — tile color block (tanpa ikon dalam kotak)
Empat varian, dipakai berurutan **maroon → gold → cream → dark**:

| Varian | Latar | Bayangan | Angka | Label |
|---|---|---|---|---|
| maroon | `--g-maroon` | `block` | `cream-50` | `gold-300` |
| gold | `--g-gold` | `gold` | `maroon-950` | `maroon-900` |
| cream | `--g-cream` + border `cream-200` | `card` | `ink-900` | `ink-600` |
| dark | `--g-dark` | `block` | `gold-300` | `cream-100/80` |

Angka 40px/800 `tabular-nums`, label 14px/600. Ikon boleh ada **polos** 20px di pojok kanan atas, opasitas 60%. Padding 24px, `rounded-xl`. Hover naik 2px. Angka count-up 600ms saat masuk viewport (sekali, hormati reduced motion).

## 5. Halaman app

**Struktur & Anggota** — `PageHeader` maroon dengan select periode sebagai aksi. Di bawahnya 4 `StatTile` (BPH, Departemen & Biro, Anggota Aktif, Asisten Lab). Foto kabinet: `rounded-xl`, `shadow-lift`, gradien bawah gelap tipis dengan caption `cream-50` di atas foto. `BphTree`: Ketua & Wakil berupa kartu `--g-maroon` + `shadow-block` (nama `cream-50`, jabatan `gold-300`); pengurus inti lain kartu krem `shadow-card` dengan aksen bar atas 3px `gold-500`; garis penghubung `maroon-300/50`. Blok departemen: kepala departemen di strip `--g-gold`, anggota di kartu krem.

**Pengguna & Hak Akses** — `PageHeader` maroon. Tab underline: aktif teks `maroon-800` + garis bawah 3px `--g-gold`. Tabel verifikasi dalam kartu `shadow-card`; tombol Setujui `primary`, Tolak `secondary`. Matriks: kartu, header kolom peran sticky `bg-cream-100`, kolom "Admin" diberi latar `gold-100/60` sebagai sorotan; sel "Kelola" teks `maroon-700` 600, "Lihat" `ink-900`, "—" `ink-400`.

**Kode Referal** — `PageHeader tone="dark"`. Kartu utama = **komposisi color block dua bidang** dalam satu kartu `rounded-xl` berlapis `shadow-gold`:
- Kiri (≈60%): `--g-gold` + kilau. Label "Kode aktif" 13px/700 `maroon-900`, kode `clamp(32px, 4.4vw, 56px)`/800 `maroon-950` satu baris, chip periode `bg-maroon-950 text-gold-300`, tombol "Salin kode" `primary` + "Bagikan ke grup" `onDark`.
- Kanan (≈40%): `--g-dark` + `SongketPattern`. "Berganti otomatis dalam", angka hari 56px/800 `gold-300`, progress bar 8px (track `white/10`, isi `--g-gold` dengan glow), tanggal mulai/berakhir 13px `cream-100/80`.
- **Tanda halaman:** satu kilau cahaya menyapu bidang emas dari kiri ke kanan setiap 6 detik (pseudo-element gradien putih 20% miring, `translateX`, 1.2s). Mati saat reduced motion.
- Di bawahnya 3 info dalam satu kartu krem bersekat (bukan 3 tile). Zona "Kode bocor?" = kartu krem dengan border kiri 4px `danger-600`, tombol `danger`. Riwayat = tabel dalam kartu.

**Periode & BPH** — `PageHeader` maroon dengan "Buat periode baru" (`onDark`). Pemilih periode: segmented control krem, aktif `--g-gold`. Form pengurus inti: satu kartu `shadow-card`; tiap jabatan satu baris dengan label jabatan 14px/700 `maroon-800` dan bar kiri 3px `gold-500`; tombol simpan `primary` sticky.

**Materi Kuliah** — `PageHeader` maroon dengan select jurusan + "Unggah materi" (`gold`). Kolom kiri daftar mata kuliah: kartu krem; item aktif blok `--g-maroon` teks `cream-50` dengan `shadow-block`. Kolom kanan: kepala mata kuliah = kartu `--g-cream` dengan bar atas `--g-gold` 4px; `MateriRow` kartu putih `shadow-card` hover `shadow-lift`.

**Asisten Lab** — `PageHeader` maroon dengan filter select. `LabAssistantCard`: kartu krem; strip atas 56px `--g-maroon` berisi chip lab `gold`; avatar 56px menimpa batas strip dengan ring `cream-50` 3px; tombol WA `secondary`.

**Toko & Produk Event** — `PageHeader` maroon. Filter event: segmented control, aktif `--g-gold`. `ProductCard`: kartu `shadow-card` hover `shadow-lift`; area gambar 4:3 dengan latar `--g-maroon` + `SongketPattern` bila tanpa foto (logo HIMASRI krem 40% di tengah, bukan teks mono); harga 20px/800 `maroon-800`; badge stok pucat; "Pesan via panitia" `secondary` + ikon WA. Mode kelola: Ubah `secondary`, Hapus ikon `danger`.

**Foto Beranda & Journey** — `PageHeader` maroon. Pratinjau slider dalam bingkai `rounded-xl shadow-lift` dengan ring 1px `gold-300/40`. Panel pengaturan kartu krem; `ToggleSwitch` aktif `--g-btn` dengan knob krem ber-highlight. Daftar foto: baris kartu dengan thumbnail `rounded-md shadow-card`.

## 6. Situs publik — color blocking penuh

Urutan blok bergantian, tidak ada dua seksi berurutan dengan warna sama:

1. **Hero** — foto slider + `--g-hero`. Headline 64px/800 `cream-50` maks 2 baris, satu kalimat 18px `cream-100/85`, tombol `gold` ("Kenali HIMASRI") + outline krem. Cahaya: radial `gold-300/18` di kiri atas foto. Kartu BPH di hero dihapus dari hero (pindah ke seksi 3).
2. **Tentang** — latar `--g-cream`. Teks kiri, kanan satu foto `rounded-xl shadow-lift` yang menimpa blok `--g-gold` 24px di belakangnya (offset kanan bawah) sebagai bayangan warna.
3. **BPH inti** — latar `--g-maroon` + `SongketPattern`. Kartu Ketua & Wakil = kartu krem `shadow-block` dengan tombol WhatsApp hijau; pengurus lain kartu `white/8` border `white/12`.
4. **Budaya Palembang** — latar `cream-100`. `CultureCard` bergantian `--g-maroon`, `--g-gold`, `--g-cream`, `--g-dark` (teks sesuai pasangan kontras §3.1), foto/ilustrasi di atas, tanpa ikon dalam kotak, `shadow-block`/`gold`/`card`.
5. **Agenda** — latar `--g-cream`. Daftar per bulan dalam satu kartu besar; bulan berjalan disorot strip `--g-gold`. Chip filter: aktif `--g-btn` teks krem, nonaktif `bg-white border-cream-300 text-ink-900` (kontras lolos).
6. **Journey Kahim/Wakahim** — latar `--g-dark`. Timeline satu kolom lurus, garis `gold-500/40`, titik periode krem; periode berjalan titik `--g-gold` dengan `shadow-glow`.
7. **Penutup / CTA** — blok `--g-gold` `rounded-xl` di atas latar krem, teks `maroon-950`, tombol `primary`.
8. **Footer** — `--g-dark` + `SongketPattern corner="br"`, 3 kolom, teks `cream-100/80`.

Navbar: transparan di atas hero, setelah scroll menjadi `maroon-950/85` + `backdrop-blur-md` + `shadow-block`. Maksimal 5 tautan + tombol "Masuk" (`gold`).

Login/Daftar: panel foto kiri dengan `--g-hero` + songket; panel form kanan `--g-cream`, form dalam kartu `shadow-lift` `rounded-xl` maks 420px, tombol utama `primary`.

Mobile 390px: headline 40px maks 2 baris, hilangkan celah kosong di bawah hero, blok `rounded-xl` menjadi `rounded-lg` dengan margin 16px.

## 7. Anti-slop (tetap berlaku walau penuh efek)

- Tidak ada ikon di dalam kotak/lingkaran berwarna.
- Tidak ada teks bergradien, tidak ada border bergradien pelangi.
- Tidak ada glow selain `shadow-glow` pada item aktif/periode berjalan.
- Tidak ada lebih dari 3 keluarga warna blok dalam satu viewport.
- Arah cahaya selalu kiri atas. Jangan campur gradien 90°, 45°, dan 180° acak untuk bidang yang setara.
- Label kecil di atas judul maksimal satu per blok berwarna, tidak di setiap kartu.
- Tidak ada emoji sebagai ikon.

## 8. Perbarui dokumen

Perbarui `docs/01-design-system.md` agar sama persis dengan prompt ini: sistem cahaya (§2), token (§3), komponen (§4), dan pola halaman (§5–6). Hapus isi yang bertentangan dari restyle polos sebelumnya.

## 9. Verifikasi (wajib)

```bash
npm run lint
npm run build
npm --workspace=web run test
```

Sapu kode, harus **0 hasil**:

```bash
rg -n "#BE1E3E|#F7D154|#EEC02B|#FAF6F7|#F2E8EA|#F5DCE1|red-600|red-800" web/src web/tailwind.config.ts
rg -n "font-mono|h-screen" web/src
rg -n "bg-clip-text" web/src
```

Restart dev server (`npm run dev`) lalu hard refresh browser sebelum mengecek, supaya modul HMR lama tidak tersisa.

Cek visual dengan akun demo emulator (admin, akademik, kominfo, anggota) di **1440, 1024, 768, 390 px**:

- [ ] Beranda `/` tampil tanpa error.
- [ ] Setiap halaman app punya `PageHeader` pita maroon (Kode Referal: gelap) dan latar `--g-page`.
- [ ] Sidebar maroon bercahaya, item aktif blok emas dengan glow.
- [ ] Tile KPI berurutan maroon → emas → krem → gelap, tanpa ikon dalam kotak.
- [ ] Kartu kode referal dua bidang emas/gelap, kode satu baris di semua lebar, kilau berjalan dan berhenti saat reduced motion.
- [ ] Semua bayangan jatuh ke bawah, semua gradien terang di kiri atas.
- [ ] Maksimal 3 keluarga warna blok per viewport.
- [ ] Semua teks lolos kontras 4.5:1 (cek teks di atas emas dan di atas maroon).
- [ ] Tidak ada scroll horizontal; target sentuh ≥ 44px; fokus keyboard terlihat.
- [ ] Semua alur fungsi tetap berjalan (login, daftar, verifikasi, ubah peran, unggah materi, kelola hero, produk, buat ulang kode).

Tulis hasilnya di `docs/BUILD_REPORT.md` sebagai seksi "Color Blocking v3.1": file yang diubah, hasil tiap perintah, screenshot before/after per halaman di `docs/screenshots/v3.1/`, dan butir yang gagal beserta alasannya.
