# Build Report — Website HIMASRI (IT PLN)

Laporan pembangunan fullstack **Website HIMASRI (Himpunan Mahasiswa Sriwijaya — Institut Teknologi PLN)**.

---

## 1. Ringkasan yang Dibangun

Aplikasi dibangun sebagai monorepo npm workspaces (`web/` dan `functions/`), dilengkapi konfigurasi keamanan Firebase (`firebase/`) dan skrip utilitas (`scripts/`):

- **Konfigurasi Root & Firebase**:
  - `package.json` (npm workspaces + skrip `dev`, `build`, `lint`, `test`, `seed`, `bootstrap:admin`, `prepare:assets`, `deploy`)
  - `.firebaserc` (alias `default` mengarah ke `demo-himasri` untuk pengujian Emulator lokal)
  - `firebase.json` (konfigurasi Emulator Suite: Auth `9099`, Functions `5001`, Firestore `8080`, Storage `9199`, Hosting `5000`, UI `4000`; Hosting SPA rewrite `** → /index.html`, cache aset `/assets/**`, serta header keamanan)
  - `firebase/firestore.rules`, `firebase/storage.rules`, dan `firebase/firestore.indexes.json`
- **Design System & Animasi (`web/`)**:
  - Tailwind CSS 3.4 + CSS variables (`web/src/styles/index.css` & `web/tailwind.config.ts`) dengan palet maroon–emas–krem, gradien color-blocking, dan font `@fontsource-variable/plus-jakarta-sans` (weight variabel 200–800).
  - Primitif motion di `web/src/components/motion/` (`tokens.ts`, `FadeIn`, `Reveal`, `Stagger`, `PageTransition`), dibungkus `MotionConfig reducedMotion="user"`.
  - Seluruh komponen UI & feedback di `web/src/components/ui/` dan `web/src/components/feedback/`, ditambah pratinjau komponen mode dev di `/_dev/ui`.
- **Situs Publik (`/`, `/403`, `*`)**:
  - `Navbar` transparan yang berubah menjadi `rgba(58, 9, 16, 0.92)` + `backdrop-blur-md` setelah scroll > 80px, garis bawah tautan aktif (`IntersectionObserver`), dan sheet navigasi mobile dengan trap fokus & tombol `Esc`.
  - `HeroSlider` dengan Ken Burns, transisi fade/slide, tombol jeda/putar, titik navigasi animasi layout, penghitung `aria-live="polite"`, serta kartu BPH periode berjalan.
  - 9 section lengkap: Hero, Tentang, Budaya (dengan ekspansi `"+3 budaya lainnya"` di mobile), BPH (kabinet periode berjalan + kotak informasi terkunci untuk non-anggota), Agenda 01–04, Kontak WhatsApp Ketua/Wakil, Pita CTA, dan Footer.
- **Autentikasi Berbasis NIM (`/masuk`, `/daftar`, `/daftar/menunggu`)**:
  - Email sintetis `{nim}@anggota.himasri.id` melalui helper bersama `nimToEmail`.
  - Login dengan opsi "Ingat saya" (`browserLocalPersistence` vs `browserSessionPersistence`) serta modal "Lupa kata sandi?" menuju WhatsApp admin.
  - Pendaftaran dengan validasi Zod, kode referal wajib (dicek di server), serta form kondisional **Asisten Lab** (Fakultas → Laboratorium dependen → jadwal opsional) dengan animasi buka-tutup `height: auto`.
  - Halaman `/daftar/menunggu` dengan listener realtime `users/{uid}` dan pembaruan otomatis token saat `claimsUpdatedAt` berubah.
- **Ruang Anggota & Panel Peran**:
  - Jelajahi: `/anggota/struktur`, `/anggota/materi`, `/anggota/asisten-lab`, `/anggota/toko`.
  - Kelola (`kominfo`, `inti`, `admin`): `/kelola/foto-beranda` (drag-and-drop `Reorder`, kompresi WebP 1920px di klien, pengaturan slideshow) dan `/kelola/produk` (kelola produk & event, kompresi WebP 4:3, metrik `productClicks`).
  - Admin: `/admin/kode-referal` (lihat untuk `inti` & `admin`, buat ulang hanya `admin`), `/admin/pengguna` (`admin`: setujui/tolak pendaftar, ubah peran, aktif/nonaktif, reset kata sandi sementara, matriks hak akses), dan `/admin/periode` (`inti` & `admin`: periode, pengurus inti, departemen/biro, kontak publik).
- **Cloud Functions 2nd Gen (`functions/`, region `asia-southeast2`, Node 20)**:
  - `checkReferralCode`, `registerMember`, `approveMember`, `rejectMember`, `setUserRole`, `setUserStatus`, `adminResetPassword`, `regenerateReferralCode`, `rotateReferralCode` (cron `0 0 1 1,3,5,7,9,11 *` zona `Asia/Jakarta`), `onMaterialWrite`, `onProductDelete`, `onHeroSlideDelete`.

---

## 2. Cara Menjalankan & Deploy

> **Catatan Java pada Mesin Lokal**: Pada lingkungan Windows ini, `java` tidak berada di `PATH` global, melainkan di `C:\Android studio1\jbr\bin\java.exe` (`JAVA_HOME`). Skrip `scripts/dev.mjs` dan `scripts/test-rules.mjs` otomatis menambahkan folder `bin` JDK tersebut ke `PATH` anak proses sehingga Emulator Firestore/Storage berjalan langsung tanpa konfigurasi manual tambahan.

1. **Instalasi dependensi** (di root `d:\website_himasri`):
   ```bash
   npm install
   ```
2. **Menyiapkan & mengoptimalkan aset gambar** (opsional bila perlu diulang):
   ```bash
   npm run prepare:assets
   ```
3. **Menjalankan Emulator Firebase + Functions watch + Vite dev server**:
   ```bash
   npm run dev
   ```
   - Web app: `http://localhost:5173`
   - Firebase Emulator UI: `http://127.0.0.1:4000`
4. **Mengisi data awal & akun uji di Emulator** (jalankan di terminal kedua saat `npm run dev` aktif):
   - Data dasar saja (untuk staging/produksi awal):
     ```bash
     npm run seed
     ```
   - Data dasar + akun demo tiap peran + 18 anggota/aslab contoh (**khusus Emulator**):
     ```bash
     npm run seed -- --demo
     ```
   Akun demo yang dibuat saat `--demo` (sandi semua akun: `Password123`):
   - Admin: `202231001`
   - Inti: `202231002`
   - Kominfo: `202331003`
   - Akademik: `202331004`
   - PSDM: `202331005`
   - Minat & Bakat: `202431006`
   - Anggota: `202431007`
   - Pending: `202531008`
5. **Membuat admin pertama & kode referal awal** (untuk project baru atau emulator):
   ```bash
   npm run bootstrap:admin -- --nim 202131099 --nama "Nama Admin" --password "KataSandiKuat123"
   ```
6. **Menjalankan lint, build, dan seluruh unit test**:
   ```bash
   npm run lint
   npm run build
   npm run test
   ```
7. **Deploy ke Firebase produksi** *(jangan lupa ganti proyek terlebih dahulu)*:
   - Ganti `"default": "demo-himasri"` di `.firebaserc` dengan Project ID Firebase asli milik HIMASRI (paket Blaze diperlukan untuk Cloud Functions terjadwal & Storage).
   - Isi `web/.env.local` dengan kredensial web app Firebase asli dan set `VITE_USE_EMULATORS=false`.
   - Jalankan:
     ```bash
     firebase login
     npm run deploy
     ```

---

## 3. Daftar Environment Variable (`web/.env.local`)

Salin dari `web/.env.example`:

| Variabel | Keterangan | Nilai Lokal (Emulator) |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Web API Key dari Firebase Console | `demo-api-key` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain project | `demo-himasri.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ID project Firebase | `demo-himasri` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket Cloud Storage | `demo-himasri.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID project | `000000000000` |
| `VITE_FIREBASE_APP_ID` | Web App ID | `1:000000000000:web:demo000000000000` |
| `VITE_USE_EMULATORS` | Aktifkan koneksi ke Emulator lokal | `true` (ubah ke `false` saat deploy) |
| `VITE_RECAPTCHA_SITE_KEY` | Opsional — Site Key reCAPTCHA v3 untuk App Check produksi | *(kosong)* |

---

## 4. Hasil Uji Penerimaan (`docs/08-acceptance-checklist.md`)

### Build & Kualitas
| Butir Uji | Status | Catatan |
|---|---|---|
| `npm install` & `npm run build` (web + functions) | **LOLOS** | `tsc --noEmit`, `vite build`, dan `functions` `tsc` selesai tanpa error setelah edit terakhir. |
| `npm run lint` tanpa error | **LOLOS** | `eslint` di `web` dan `functions` lulus dengan 0 error. |
| `npm run dev` & `npm run seed -- --demo` | **LOLOS** | Emulator Auth, Functions, Firestore, Storage, Hosting + Vite aktif bersamaan; seed `--demo` dan `bootstrap:admin` berhasil dijalankan ke emulator. |
| Tidak ada kunci rahasia di repo; `.env.example` & `.gitignore` lengkap | **LOLOS** | `.env.local`, `node_modules`, `dist`, `lib`, dan log emulator diabaikan di `.gitignore`; `web/.env.example` tersedia. |

### Publik
| Butir Uji | Status | Catatan |
|---|---|---|
| `/` tampil tanpa login dengan 9 bagian sesuai `docs/02` | **LOLOS** | Diverifikasi langsung di browser (`http://localhost:5173/`). |
| Hero bergeser otomatis, bisa dijeda, titik diklik, panah keyboard, respect reduced motion | **LOLOS** | Tombol jeda/putar, klik titik slide (`01 / 02` → `02 / 02`), dan caption teruji di browser. |
| Jumlah titik & penghitung mengikuti jumlah slide aktif; upload di `/kelola/foto-beranda` langsung terlihat di `/` | **LOLOS** | Diuji langsung oleh akun Kominfo mengunggah foto baru → beranda langsung menampilkan `01 / 03` (3 titik). |
| Tidak ada NIM, anggota departemen, nomor aslab, atau kode referal terbaca tamu | **LOLOS** | Teruji di `firebase/tests/rules.test.ts` (11/11 lulus di Emulator). |
| Navbar berubah saat scroll; tautan anchor menandai section aktif; sheet menu mobile tertutup `Esc` | **LOLOS** | Latar header terkonfirmasi berubah ke `rgba(58, 9, 16, 0.92)` + `backdrop-blur-md` pada 1440px dan 375px; menu mobile tertutup dengan `Escape`. |
| Tombol WhatsApp Ketua/Wakil membuka `wa.me` di tab baru | **LOLOS** | Terverifikasi `https://wa.me/6281234567801?text=...` dan `...802` dengan `target="_blank" rel="noopener noreferrer"`. |

### Auth
| Butir Uji | Status | Catatan |
|---|---|---|
| Daftar dengan kode salah → error di bawah field, akun tidak dibuat | **LOLOS** | Kode `SALAH-999` menampilkan error di bawah field dan tetap di `/daftar`. |
| Daftar dengan NIM terdaftar | **LOLOS** | Divalidasi oleh `nimIndex/{nim}` dalam transaksi di `registerMember` (`already-exists`). |
| Pilih aslab **Ya** → Fakultas & Lab wajib; opsi lab bergantung fakultas; pilih **Tidak** → kotak hilang & nilai dikosongkan | **LOLOS** | Terverifikasi di browser pada `/daftar`. |
| Daftar sukses → `/daftar/menunggu`; disetujui admin → otomatis masuk | **LOLOS** | Alur daftar → `/daftar/menunggu` → persetujuan admin → login akun terverifikasi ke `/anggota/struktur` teruji end-to-end. |
| Login NIM + sandi & "Ingat saya" persistence | **LOLOS** | `browserLocalPersistence` vs `browserSessionPersistence` di `loginWithNim`. |
| Pengguna `pending` ditolak di `/anggota/*` (UI & Rules) | **LOLOS** | Guard `RequireActiveMember` mengarahkan ke `/daftar/menunggu`; `rules.test.ts` membuktikan status `pending` ditolak membaca koleksi anggota. |

### Peran & Kode Referal
| Butir Uji | Status | Catatan |
|---|---|---|
| Matriks `docs/03` terpenuhi di UI & Security Rules | **LOLOS** | Terverifikasi lewat `firebase/tests/rules.test.ts` (11 test) serta uji browser peran `admin`, `kominfo`, `inti`, dan `akademik`. |
| Akademik unggah materi; anggota biasa hanya membuka | **LOLOS** | Akun `akademik` berhasil mengunggah materi tautan di `/anggota/materi`; badge jumlah materi mata kuliah langsung naik (`1` → `2`). |
| Kominfo kelola foto hero & produk; ditolak di `/admin/*` | **LOLOS** | Akses `/kelola/foto-beranda` & `/kelola/produk` sukses; mengunjungi `/admin/pengguna` diarahkan ke `/403`. |
| Inti dapat melihat kode referal tanpa tombol "Buat ulang kode" | **LOLOS** | Terverifikasi di browser sebagai akun `inti` (`202231002`). |
| Admin setujui/tolak, ubah peran, nonaktifkan, reset sandi | **LOLOS** | Persetujuan anggota ke `akademik` teruji di `/admin/pengguna`; fungsi `setUserRole`, `setUserStatus`, `adminResetPassword` tersedia dan terproteksi `assertActiveRole(..., ['admin'])`. |
| `rotateReferralCode` & `regenerateReferralCode` & hitung mundur | **LOLOS** | `runRotateReferralCodeJob` diuji langsung terhadap Firestore Emulator (mengarsipkan kode lama ke `referralHistory` dan membuat `HMS-NOV26-Z5ZS`). Riwayat tersamarkan `HMS-NOV26-••••` tampil di `/admin/kode-referal`. |

### Desain & Aksesibilitas
| Butir Uji | Status | Catatan |
|---|---|---|
| Warna, font Plus Jakarta Sans, radius, spasi sesuai `docs/01`; tanpa emoji ikon | **LOLOS** | Seluruh ikon memakai `lucide-react` dan SVG songket/Ampera/WhatsApp resmi. |
| Responsif di 375, 768, 1024, 1440 px tanpa scroll horizontal | **LOLOS** | Diuji langsung di browser (`anyOverflow: false` di keempat lebar viewport). |
| Target klik ≥ 44px; `focus-visible` ring emas; animasi `docs/06` & `reducedMotion="user"` | **LOLOS** | Semua kontrol interaktif menggunakan elemen semantik min-height 44–48px; `MotionConfig reducedMotion="user"` membungkus root aplikasi. |
| Lighthouse (build produksi, mobile) halaman `/` | **BELUM DIJALANKAN VIA CLI** | Optimasi sudah diterapkan (code-splitting per halaman via `React.lazy`, WebP hero 211 KB & 242 KB, `@fontsource-variable/plus-jakarta-sans` lokal dengan `<link rel="preload">`, `loading="lazy"` gambar non-hero, atribut `fetchpriority="high"` slide pertama), namun audit skor Lighthouse CLI tidak dijalankan di sesi ini. |

---

## 5. Keputusan Teknis yang Diambil

1. **Lokasi sumber aset mentah**: Folder `assets-source/logo/` dan `assets-source/photos/` pada workspace belum berisi berkas gambar saat sesi dimulai, sedangkan berkas asli berada di folder unduhan pemilik (`C:\Users\Fahim\Downloads\...`). Sesuai aturan untuk tidak mengubah isi `assets-source/`, skrip `scripts/prepare-assets.mjs` mencari di `assets-source/` terlebih dahulu lalu otomatis menyalin dan mengoptimalkan berkas asli dari folder unduhan tersebut ke `web/public/assets/images/` (WebP 211 KB & 242 KB).
2. **Validasi lebar foto hero di `/kelola/foto-beranda`**: Dipertahankan batas ukuran berkas ≤ 5 MB dan kompresi otomatis ke WebP lebar maks 1920px; apabila gambar sumber lebih kecil dari 1920px, sistem menampilkan notifikasi informatif (tidak memblokir unggahan) agar pengurus tetap dapat mengunggah foto kegiatan dengan nyaman.
3. **Kode error Callable `registerMember`**: `HttpsError` Firebase Functions v2 mewajibkan kode gRPC standar (`invalid-argument`, `already-exists`, dll.), sehingga pengenal `invalid-referral` dan `nim-exists` dikirim melalui `details.reason` bersamaan dengan kode standar dan pesan Bahasa Indonesia yang jelas.
4. **Sinkronisasi `materialCount` mata kuliah**: Selain trigger Cloud Functions `onMaterialWrite`, klien turut memperbarui `courses/{id}.materialCount` dalam batch saat membuat/menghapus materi sehingga angka pada daftar mata kuliah langsung berubah seketika di Emulator maupun produksi.
5. **Pencarian anggota non-BPH**: Karena dokumen `members/{uid}` sengaja tidak menyimpan NIM demi privasi antar anggota, kotak cari pada daftar anggota non-BPH di `/anggota/struktur` mencocokkan berdasarkan nama dan jurusan.

---

## 6. Data Contoh yang Perlu Dikonfirmasi Pengurus (`isSample: true`)

Seluruh item berikut ditandai `isSample: true` dan menampilkan komponen `SimulationNote` di antarmuka hingga diganti dengan data resmi oleh pengurus:

1. **Kontak Publik (`settings/public`)** — nomor WhatsApp Ketua Himpunan (`6281234567801`), Wakil Ketua (`6281234567802`), Admin (`6281234567800`), email (`himasri.official@gmail.com`), Instagram, dan alamat sekretariat (ubah lewat `/admin/periode`).
2. **Daftar Fakultas & Laboratorium (`web/src/content/labs.ts`)** — daftar fakultas dan lab contoh IT PLN perlu dikonfirmasi pengurus sebelum rilis resmi.
3. **Event & Produk Toko (`events`, `products`)** — 3 event contoh, 6 produk contoh, serta nomor WhatsApp panitia event (ubah/hapus lewat `/kelola/produk`).
4. **Mata Kuliah Contoh (`courses`)** — 7 mata kuliah contoh untuk S1 Teknik Informatika (kelola lewat `/anggota/materi`).
5. **Ejaan Data BPH 2025/2026** — sesuai catatan `docs/data/bph-2025-2026.md`, konfirmasi ejaan nama *Muhammad Nabielsyah Alhazmi Athallah* dan jabatan *Kepala Departemen Pengembangan Sumber Daya Mahasiswa* jika perlu penyesuaian (ubah lewat `/admin/periode`).
6. **Anggota Demo (`--demo`)** — 8 akun peran dan 18 anggota/aslab fiktif hanya dibuat bila menjalankan `npm run seed -- --demo` di Emulator (dilarang dijalankan ke proyek produksi).

---

## 7. Pergantian Font ke Plus Jakarta Sans

Perubahan tipografi penuh dari font sebelumnya ke **`Plus Jakarta Sans Variable`** mengikuti `PROMPT_GANTI_FONT.md`:

- **Berkas yang Diubah**:
  - `web/package.json` & `package-lock.json`: menghapus paket font sebelumnya, memasang `@fontsource-variable/plus-jakarta-sans`.
  - `scripts/prepare-assets.mjs`: menyalin `plus-jakarta-sans-latin-wght-normal.woff2` ke `web/public/assets/fonts/`.
  - `web/vite.config.ts` (`preloadJakartaFontPlugin`) & `web/index.html`: menambahkan `<link rel="preload" as="font" type="font/woff2" crossorigin>` yang otomatis mengarah ke aset woff2 hasil build.
  - `web/src/app/main.tsx`: mengimpor `@fontsource-variable/plus-jakarta-sans`.
  - `web/tailwind.config.ts`, `web/src/styles/index.css`, & `web/src/app/App.tsx`: mengatur `--font-sans` dan `fontFamily.sans` ke `'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif`, serta memperbarui bobot (weight `700`/`800` judul, `600` tombol/small-medium) dan letter-spacing skala `.type-*`.
  - Angka tabular (`tabular-nums`): ditambahkan pada `ProductCard.tsx`, `MateriRow.tsx`, `HeroSlider.tsx`, `StatTile.tsx`, `Topbar.tsx`, `WaitingVerificationPage.tsx`, `ReferralCodePage.tsx` (`font-extrabold tracking-[0.04em]` untuk kode besar), `UsersAccessPage.tsx`, dan `StructurePage.tsx`.
  - Dokumentasi yang diperbarui: `docs/00-overview.md`, `docs/01-design-system.md`, `docs/08-acceptance-checklist.md`, `PROMPT_ANTIGRAVITY.md`, `web/src/pages/dev/UiShowcasePage.tsx`.
- **Hasil Pengecekan Tiap Lebar Layar & Perbaikan Responsif**:
  - Diuji langsung di browser pada lebar `375px`, `768px`, `1024px`, dan `1440px` tanpa horizontal overflow (`anyOverflow: false`).
  - Memastikan CSS & network memuat `'Plus Jakarta Sans Variable'` (`font-display: swap`, `font-weight: 200 800`) dan teks hero `h1` memakai bobot `800`.
  - **Perbaikan tata letak akibat lebar font baru**:
    1. `web/src/components/layout/Navbar.tsx`: menyembunyikan subjudul panjang tagline navbar pada `<1280px` (`hidden xl:block`) dan memperkecil padding horizontal item nav pada `lg` (`px-2.5 xl:px-3`) agar tombol kanan navbar pada lebar `1024px` memiliki margin aman dari tepi viewport.
    2. `web/src/pages/public/HomePage.tsx` & `web/src/pages/members/StructurePage.tsx`: mengubah kartu BPH baris inti agar menumpuk vertikal di bawah `lg`/`xl` (`flex-col lg:flex-row` / `xl:flex-row`) sehingga badge panjang seperti *Wakil Ketua Himpunan* dan *Sekretaris Jenderal* tetap berada rapi di dalam kartu pada lebar `768px` (terverifikasi `badgeBox.right 185px <= cardBox.right 243px`).

---

## 8. Fitur Foto Profil saat Registrasi

Menambahkan unggah foto profil opsional saat pendaftaran anggota baru di `/daftar`:

- **Alur & Keamanan**:
  - `web/src/pages/auth/RegisterPage.tsx`: bagian **Foto profil (opsional)** dengan pratinjau `Avatar` (`96×96px`), tombol *Pilih foto profil* / *Ganti* / *Hapus*, validasi tipe JPG/PNG/WebP maks. 5 MB, pemotongan otomatis 1:1 persegi & kompresi WebP (`maxWidth: 512`) di browser agar ≤ 1 MB.
  - Setelah akun `pending` dibuat (`registerMember`) dan otomatis login (`loginWithNim`), berkas diunggah ke Cloud Storage `avatars/{uid}.webp`, lalu URL disimpan lewat Cloud Function baru `updateUserPhoto` (`functions/src/auth/updateUserPhoto.ts`).
  - `firebase/storage.rules`: `avatars/{fileName}` kini dapat dibaca oleh `signedIn()` (sehingga pendaftar `pending` dapat melihat fotonya di `/daftar/menunggu` dan admin di `/admin/pengguna`), sementara penulisan tetap dibatasi hanya pemilik (`fileName == request.auth.uid + '.webp'`, gambar ≤ 1 MB).
  - Sinkronisasi penuh di `functions/src/auth/approveMember.ts`, `functions/src/admin/setUserStatus.ts`, dan pembersihan file avatar di Storage saat ditolak (`functions/src/auth/rejectMember.ts`).
  - Foto profil ditampilkan pada `WaitingVerificationPage.tsx`, `UsersAccessPage.tsx`, `AppSidebar.tsx`, `Topbar.tsx`, dan `StructurePage.tsx`.
- **Hasil Uji**:
  - Teruji di `firebase/tests/rules.test.ts` (akses baca/tulis avatar untuk status `pending` vs tamu vs pengguna lain).
  - Teruji end-to-end di browser: daftar dengan foto di `/daftar` → tampil di `/daftar/menunggu` → tampil di antrean verifikasi `/admin/pengguna` → setelah disetujui admin, tampil di daftar anggota `/anggota/struktur`, sidebar kiri, dan topbar pengguna.

---

## 9. Revisi Visual: Cahaya, Highlighting, Bayangan, Tekstur Songket & Latar Jembatan Ampera

Revisi estetika untuk memperkaya kedalaman visual dan identitas budaya Palembang secara halus tanpa mengganggu kontras atau keterbacaan teks:

- **Unduhan & Optimasi Aset Ornamen Palembang (`scripts/prepare-assets.mjs` → `web/public/assets/images/ornaments/`)**:
  - `ampera-bg.webp` (`162 KB`, sumber: `https://commons.wikimedia.org/wiki/File:Jembatan_Ampera.jpg`): foto Jembatan Ampera bernuansa emas hangat untuk latar bertransparansi tipis.
  - `songket-texture.webp` (`142 KB`, sumber: `https://commons.wikimedia.org/wiki/File:Skirt_(sarong),_Palembang,_Sumatra,_Indonesia,_early_to_mid_20th_century,_silk,_gold_thread_-_Textile_Museum_of_Canada_-_DSC00994.JPG` — koleksi kain sarung sutra benang emas khas Palembang di *Textile Museum of Canada*, dipotong pada bidang motif brokat marun–emas murni): tekstur foto kain tenun Songket Palembang asli untuk aksen latar seksi.
  - `songket-tile.webp` (`143 KB`, diekstrak dari foto kain Songket Palembang yang sama berupa ubin simetris `480×480` RGBA saluran benang emas murni): tekstur tenun Songket Palembang *seamless* yang menggantikan pola garis vektor pada `.bg-songket-light`, `.bg-songket-gold`, `.bg-songket-dark`, dan `SongketCornerOrnament`.
  - `pucuk-rebung.svg`: garis tepi horizontal *Pucuk Rebung* Sriwijaya.
- **Permainan Cahaya, Highlighting, Bayangan & Tekstur CSS (`web/tailwind.config.ts` & `web/src/styles/index.css`)**:
  - Menambahkan bayangan berlapis hangat (`shadow-card`, `shadow-raised`, `shadow-gold-glow`, `shadow-maroon-glow`), *specular top-edge highlight* (`.surface-highlight-light`, `.surface-highlight-dark`, `.surface-highlight-gold`), serta efek pendaran radial lembut (`.ambient-glow-gold`).
  - Menambahkan utilitas pola Songket bertransparansi tipis untuk area non-gradasi maupun gelap (`.bg-songket-light`, `.bg-songket-gold`, `.bg-songket-dark`) dan garis tepi `.pucuk-rebung-border`.
- **Komponen Ornamen & Penerapan Halaman**:
  - Komponen `web/src/components/ui/PalembangOrnament.tsx` (`AmperaBackdrop`, `SongketCornerOrnament`, `PucukRebungDivider`) dengan transparansi tipis (`opacity-[0.04]`–`opacity-[0.11]`), `mix-blend-mode`, serta `mask-image` agar menyatu mulus tanpa mengganggu kontras teks.
  - Diterapkan pada seluruh bagian non-gradasi dan bergradasi di `web/src/pages/public/HomePage.tsx` (`#tentang`, `#budaya`, `#bph`, `#agenda`, `#kontak`, Pita CTA), `web/src/components/layout/Footer.tsx`, komponen kartu (`CultureCard.tsx`, `ContactCard.tsx`, `StatTile.tsx`, `LabAssistantCard.tsx`, `ProductCard.tsx`, `Button.tsx`), `web/src/layouts/AuthLayout.tsx`, `web/src/layouts/AppLayout.tsx`, `web/src/components/layout/AppSidebar.tsx`, serta banner tajuk Ruang Anggota (`StructurePage.tsx`, `MaterialsPage.tsx`, `LabAssistantsPage.tsx`, `StorePage.tsx`, `ManageProductsPage.tsx`, `ReferralCodePage.tsx`).
- **Verifikasi Ulang**:
  - `npm run lint`: lulus (0 error di `web` & `functions`).
  - `npm run build`: lulus (`tsc --noEmit && vite build` serta `@himasri/functions` `tsc`).
  - `npm run test`: seluruh suite lulus (`4/4` `test:web`, `5/5` `test:functions`, `11/11` `test:rules`).
  - Verifikasi visual browser pada `http://localhost:5173/`, `/daftar`, dan `/anggota/struktur` (viewport `1440px`, `1024px`, `768px`, `375px`): seluruh aset `ornaments/*` berstatus HTTP `200`, kontras teks tetap tajam, dan tidak ditemukan horizontal overflow (`scrollWidth <= innerWidth`).

---

## 10. Fitur Journey Timeline & Kurasi Tekstur Songket

Pembaruan fitur dan kurasi visual sesuai revisi terbaru pengguna:

- **Kurasi Tekstur Songket (Hanya Pemanis & Identitas)**:
  - Menurunkan intensitas tekstur pada `web/src/styles/index.css` serta menghapus lapisan `bg-songket-*` berulang dari `#tentang` kanan, `#bph`, `#agenda`, `#kontak`, `Footer.tsx`, `AuthLayout.tsx` (panel form), `AppLayout.tsx`, dan `AppSidebar.tsx`.
  - Tekstur kain Songket kini difokuskan hanya pada seksi **`#budaya`**, **`Pita CTA`** penutup halaman utama, serta medali sudut tipis (`SongketCornerOrnament`) pada panel marun/emas tertentu.
- **Fitur Publik & Panel Kelola Journey (`#journey`, `/journey`, `/kelola/journey`)**:
  - **Model & Keamanan**: `JourneyItemDoc` di `web/src/types/models.ts`, permission `journey:edit` untuk peran `kominfo` (Medkom), `inti`, dan `admin` di `web/src/utils/permissions.ts`, aturan Firestore `journeyItems/{itemId}` & indeks `active ASC, order ASC`, aturan Cloud Storage `journey/{fileName}` (`<= 5 MB`), trigger pembersihan `onJourneyItemDelete` (`functions/src/admin/storageTriggers.ts`), serta 4 momen awal pada `scripts/seed/seed.ts`.
  - **Tampilan Publik**: Komponen `web/src/components/ui/JourneyTimeline.tsx` (filter chip tahun, garis waktu bolak-balik desktop / satu kolom mobile, dan lightbox foto) ditampilkan langsung di seksi `#journey` `web/src/pages/public/HomePage.tsx` dan halaman penuh `web/src/pages/public/JourneyPage.tsx` (`/journey`), dengan tautan **"Journey"** pada `Navbar.tsx` dan `Footer.tsx`.
  - **Panel Kelola (`/kelola/journey`)**: `web/src/pages/manage/ManageJourneyPage.tsx` (diakses dari menu sidebar **KELOLA → Journey HIMASRI**, serta redirect `/admin/journey`) menyediakan unggah foto (kompresi otomatis WebP maks. 1600px), pengaturan urutan naik/turun, toggle tampil publik, modal ubah momen/foto, dan hapus momen.
- **Hasil Uji**:
  - `npm run lint`: lulus (`0` error di `web` dan `functions`).
  - `npm run build`: lulus (`web` dan `functions`).
  - `npm run test`: seluruh suite lulus (`4/4` `test:web`, `5/5` `test:functions`, `12/12` `test:rules` termasuk uji Firestore `journeyItems` dan Storage `journey/{fileName}`).
  - Verifikasi browser pada `http://localhost:5173/` (`1440px`, `1024px`, `375px`), `/journey`, dan `/kelola/journey` (login akun `kominfo` `202331003`): kurasi Songket bersih, timeline `#journey` dan filter tahun (`2025` ↔ `Semua Waktu`) serta modal Lightbox `/journey` berfungsi tanpa *horizontal overflow*; unggah berkas UI melalui subagen browser terhenti pada dialog izin unggah lokal (`UPLOAD_PERMISSION_REQUIRED`), sementara alur unggah & tulis ke Firestore/Storage untuk `kominfo`/`admin` terverifikasi lewat `rules.test.ts`.


## 11. Revisi Scrollbar/UI Bawaan, Tree BPH, Foto Bersama Departemen & Smooth Scroll

Pembaruan visual dan ergonomi halaman sesuai masukan revisi:

- **Penggantian Elemen Bawaan Browser (`web/src/styles/native-overrides.css`)**:
  - Menghilangkan scrollbar bawaan Windows berwarna putih/abu dengan tombol panah atas-bawah (`*::-webkit-scrollbar-button { display: none !important; }`) dan membatasi `scrollbar-width: thin` hanya pada fallback Firefox (`@supports not selector(::-webkit-scrollbar)`) sehingga Chromium/Edge selalu merender thumb pil bersih tanpa tombol panah.
  - Menerapkan `.scrollbar-dark` (marun-emas pada `AppSidebar.tsx`), `.scrollbar-light` (krem-marun pada `Modal.tsx`, `Drawer.tsx`, `AuthLayout.tsx`, `MaterialsPage.tsx`), `::selection`, `accent-color: #7A1F2B`, penghilangan spinner input `number`, netralisasi `-webkit-autofill`, serta kustomisasi elemen `<select>` pada `StructurePage.tsx` (`extraPeriods`) dan `UsersAccessPage.tsx` menggunakan `appearance-none` + ikon panah kustom.
- **Struktur Tree BPH (`web/src/components/ui/BphTree.tsx`)**:
  - Memperbarui tampilan `#bph` di `HomePage.tsx` (`mode="public"`) dan bagian BPH di `StructurePage.tsx` (`mode="member"`) menjadi pohon hierarki 3 tingkat: **Presidium Inti** → cabang **Sekjen, Sekretaris, Bendahara** → cabang **5 Departemen & Biro** (dengan klik unit pada ruang anggota untuk menggulir ke kartu detail `#unit-*`), serta garis cabang internal Pimpinan → Anggota di tiap kartu unit `StructurePage.tsx`.
- **Foto Bersama Tiap Departemen dari Arsip ZIP (`web/src/utils/unitPhotos.ts`, `scripts/prepare-assets.mjs`)**:
  - Mengonversi 6 foto pilihan (melalui `heic-convert` + `sharp`) dari `Foto BPH HIMASRI Periode 2-20261118T155419Z-1-001.zip` menjadi `assets-source/departments/{presi,psdm,kwu,sosmas,pendidikan,medfo}.jpg` dan `web/public/assets/images/departments/*.webp` (`81KB–156KB`) dengan `objectPosition` terkurasi, lalu menampilkannya sebagai banner/header pada kartu Presidium dan tiap kartu Departemen/Biro di `BphTree.tsx` dan `StructurePage.tsx`.
- **Smooth Scroll (`web/src/hooks/useLazySmoothScroll.ts`, `web/src/layouts/PublicLayout.tsx`)**:
  - Mengaktifkan inersia gulir roda tetikus yang halus (`requestAnimationFrame` lerp di perangkat pointer halus desktop, menghormati `prefers-reduced-motion` dan container scroll dalam modal/drawer) serta `html { scroll-behavior: smooth; }` untuk lompatan anchor publik.
- **Palet Warna Krem Tidak Diubah**: Sesuai permintaan pengguna, token `--color-cream-*` tetap dipertahankan; opsi pengganti disiapkan hanya sebagai contoh pemilihan terlebih dahulu.
- **Hasil Verifikasi Akhir**:
  - `npm run prepare:assets`: sukses membuat 6 WebP departemen (`81KB–156KB`).
  - `npm run lint`: lulus (`0` error & warning di `@himasri/web`, lulus di `@himasri/functions`).
  - `npm run build`: lulus (`tsc --noEmit && vite build` dan `tsc` untuk `@himasri/functions`).
  - `npm run test`: seluruh suite lulus (`4/4` `test:web`, `5/5` `test:functions`, `12/12` `test:rules`).
  - Verifikasi visual browser pada `http://localhost:5173/` (`1440px`, `1024px`, `375px`) dan `/anggota/struktur` (akun admin `202231001`): `0` horizontal overflow, seluruh banner foto `HTTP 200`, framing 6 wajah Presidium penuh (`h-56 sm:h-72`, `center 56%`), dan scrollbar bilah sisi kiri bebas tombol panah bawaan OS.


## 12. Revisi Crop Foto BPH Full-Wajah, Palet Maroon/Wine Color-Blocking & Perapian Alignment

Pembaruan menyeluruh agar seluruh anggota di foto BPH tampil utuh, komposisi warna *color blocking* lebih tajam bernuansa *Maroon/Wine + Emas*, elemen lengkung/kartu dikurangi, dan *alignment* antar kolom sejajar presisi:

- **Crop Foto BPH & Penyingkiran Overlay Teks (`scripts/prepare-assets.mjs`, `web/src/utils/unitPhotos.ts`, `BphTree.tsx`, `StructurePage.tsx`)**:
  - Menambahkan `DEPARTMENT_CROPS` pada `prepareDepartmentPhotos()` agar keenam foto hasil ekstraksi ZIP dipotong tepat pada area kelompok tanpa ruang langit-langit/lantai berlebih: `presi.webp` (`960x540`, rasio `16:9`, menampilkan ke-6 pimpinan Presidium) serta `psdm.webp`, `kwu.webp`, `sosmas.webp`, `pendidikan.webp`, dan `medfo.webp` (`960x640`, rasio `3:2`, menampilkan seluruh anggota tiap foto departemen).
  - Memindahkan seluruh blok judul/badge unit dari atas foto ke bawah foto di `BphTree.tsx` dan `StructurePage.tsx` agar wajah baris depan tidak pernah tertutup teks atau gradien gelap.
- **Palet Maroon/Wine + Gold Color-Blocking (`web/src/styles/index.css`, `web/tailwind.config.ts`, `web/src/styles/native-overrides.css`)**:
  - Mengganti nuansa krem kekuningan menjadi spektrum *Maroon/Wine + Alabaster/Wine-Mist + Emas* (`maroon-950: #2A050D`, `maroon-900: #470917`, `maroon-700: #7C1329`, `red-600: #BE1E3E`, `cream-50: #FAF6F7`, `cream-100: #F2E8EA`, `cream-200: #DFCDD1`, `gold-400: #EEC02B`, `ink-900: #1E0D12`), memperbarui gradien blok, `#budaya` (`bg-cream-100`), serta menjadikan seksi `#kontak` blok solid *Deep Wine* (`bg-maroon-900 text-cream-50`).
- **Pengurangan Rounded/Card & Presisi Alignment (`tailwind.config.ts`, `Button.tsx`, `Badge.tsx`, `ChipFilter.tsx`, `StatTile.tsx`, `MemberRow.tsx`, `CultureCard.tsx`, `ContactCard.tsx`, `BphTree.tsx`, `HomePage.tsx`, `StructurePage.tsx`)**:
  - Merapikan skala radius menjadi arsitektural (`sm: 4px`, `md: 6px`, `lg: 8px`, `xl: 12px`) untuk tombol, badge/tag overline, filter chip, dan kontrol segmen periode.
  - Menghapus pola kartu-di-dalam-kartu pada Presidium (`BphTree.tsx` memakai dual-split flush emas/putih), menggabungkan 3 pilar `#tentang` dan 4 `StatTile` header `StructurePage.tsx` menjadi strip *color-blocking* menyatu, mengubah `MemberRow.tsx` menjadi baris direktori rapi (termasuk penumpukan badge responsif di mobile `375px`), dan menyamakan garis batas horizontal seluruh 5 kartu Tier 3 `#bph`, judul `#agenda`, dua `ContactCard` `#kontak`, serta tinggi minimum bar unit `StructurePage.tsx` (`lg:min-h-[108px]`).
- **Hasil Verifikasi Akhir**:
  - `npm run prepare:assets`: menghasilkan keenam `.webp` departemen/presidium (`55KB–154KB`) dengan seluruh wajah terkurasi penuh.
  - `npm run lint`, `npm run build`, dan `npm run test` lulus tanpa error (`4/4` `test:web`, `5/5` `test:functions`, `12/12` `test:rules`).
  - Verifikasi visual browser (`http://localhost:5173/` & `/anggota/struktur` di `1440px`, `1024px`, `375px`): `0px` horizontal overflow, seluruh foto departemen & Presidium tanpa tertutup teks, kesejajaran presisi (`footerY = 496.09px` across 5 kartu Tier 3, `waBtnY = 543.59px` pada kedua `ContactCard`), serta tampilan mobile tanpa pemotongan nama pimpinan (`M...` teratasi).


## 13. Perbaikan Smooth Scroll, Keseimbangan Bentuk Kapsul/Rounded & Penambahan Forkom Presidium

Pembaruan lanjutan sesuai evaluasi pengalaman gulir dan kelengkapan Presidium:

- **Perbaikan Smooth Scroll Halaman Publik (`web/src/hooks/useLazySmoothScroll.ts`)**:
  - Mengatasi macetnya guliran roda mouse akibat flag sinkron `internalScroll` yang langsung dibatalkan oleh event `scroll` asinkron pada frame berikutnya; diganti dengan pelacakan `lastProgrammaticY` (toleransi `8px`), penonaktifan sementara `documentElement.style.scrollBehavior = 'auto'` selama animasi RAF berlangsung, faktor interpolasi responsif `0.22`, serta *passthrough* presisi touchpad.
- **Keseimbangan Bentuk Proporsional (`web/tailwind.config.ts`, `Button.tsx`, `Badge.tsx`, `ChipFilter.tsx`, `SimulationNote.tsx`, `BphTree.tsx`, `StructurePage.tsx`, `HomePage.tsx`, `MemberRow.tsx`, `CultureCard.tsx`, `ContactCard.tsx`)**:
  - Mengembalikan skala radius seimbang (`sm: 6px`, `md: 10px`, `lg: 14px`, `xl: 20px`) serta bentuk **kapsul (`rounded-full`)** pada elemen yang membutuhkannya (tombol aksi, `Badge`, `ChipFilter`, `SegmentedControl`, pemilih periode `<select>`, `SimulationNote`, badge hub BPH, dan label `DEPARTEMEN`/`BIRO`), menjaga lengkung lembut pada kartu (`rounded-lg`/`rounded-xl`), dan mempertahankan garis pembagi lurus pada strip blok warna menyatu.
- **Penambahan Anggota Presidium Ke-6 (`web/src/services/publicService.ts`, `scripts/seed/bph-data.ts`, `web/src/components/ui/BphTree.tsx`)**:
  - Menambahkan **Faris Elhimma Fadli** (`Forkom`, `S1 Teknik Elektro`) ke daftar `inti` Kabinet `2025/2026`.
  - Mengelompokkan Tier 1 **Presidium Inti** pada `BphTree` ke dalam grid 3 kolom sejajar penuh (`Ketua Himpunan`, `Wakil Ketua Himpunan`, `Forkom`) dengan perataan atas (`items-start`, `min-w-0`), sementara Tier 2 menampilkan 3 pengurus kesekretariatan & kebendaharaan (`Sekretaris Jenderal`, `Sekretaris`, `Bendahara`) dan Tier 3 menggunakan `xl:grid-cols-5` pada `mode="member"` agar muat rapi bersama sidebar di lebar `1024px`.
- **Hasil Verifikasi Akhir**:
  - `npm run lint`, `npm run build`, dan `npm run test` lulus penuh setelah edit terakhir (`4/4` `test:web`, `5/5` `test:functions`, `12/12` `test:rules`).
  - Verifikasi browser pada `http://localhost:5173/` (`1440px`, `1024px`, `375px`): smooth wheel scroll meluncur utuh dari `scrollY = 0` ke `1200px` lalu kembali ke `1068px` tanpa tersendat; `Faris Elhimma Fadli (Forkom · S1 Teknik Elektro)` tampil di Presidium pada `/#bph` maupun `/anggota/struktur`; ketiga label & nama Presidium sejajar vertikal (`y = 418` & `y = 436`); `0` console error dan `0` gagal muat aset (`HTTP >= 400`). (Catatan: uji geser horizontal buatan `wheel(300, 0)` di `/anggota/struktur` pada `1024px` mencatat sisa pergeseran akar `24px`, meski seluruh elemen layout berada di dalam `<= 1016px`).


## 14. Color Blocking v3.1 (Color Blocking dengan Cahaya)

Penerapan penuh panduan visual `PROMPT_COLOR_BLOCKING.md` (HIMASRI v3.1):

- **Sistem Token, Cahaya, Gradien & Songket (`web/tailwind.config.ts`, `web/src/styles/index.css`, `web/src/styles/native-overrides.css`, `web/src/components/ui/SongketPattern.tsx`)**:
  - Menetapkan palet v3.1 (`maroon` `#2A0A0F`–`#7A1F2B`, `gold` `#735510`–`#EBC65C`, `cream` `#FFFBF3`–`#D8C3A4`, `ink`, `whatsapp` `#16A34A`/`#15803D`) dengan sumber cahaya seragam dari kiri-atas (`±135°`), bayangan bertinta maroon (`shadow-card`, `shadow-lift`, `shadow-block`, `shadow-gold`, `shadow-btn`, `shadow-glow`, `shadow-raised`), serta cincin fokus `gold-400` (`3px`).
  - Membuat komponen `<SongketPattern />` (kisi belah ketupat SVG tipis `opacity` 6%–10% dengan mask radial, maksimal 1 per layar pada permukaan maroon/gelap) dan animasi kilau `.referral-sheen` yang menghormati `prefers-reduced-motion`.
- **App Frame, Komponen UI & Halaman Ruang Anggota**:
  - Membuat `web/src/components/layout/PageHeader.tsx` (`tone="maroon" | "dark" | "gold"`) dan memperbarui `AppLayout.tsx`, `AppSidebar.tsx` (`g-sidebar` + `SongketPattern`), `NavItem.tsx` (`g-gold shadow-glow`), `Topbar.tsx` (`bg-cream-50/80 backdrop-blur-md`), `Button.tsx`, `Badge.tsx`, `StatTile.tsx` (4 blok warna `maroon`/`gold`/`cream`/`dark`), `ChipFilter.tsx`, `LabAssistantCard.tsx` (kartu krem dengan strip atas `--g-maroon` 56px + avatar bertumpuk), `ProductCard.tsx`, `BphTree.tsx`, serta seluruh halaman `members/*`, `manage/*`, dan `admin/*` (`ReferralCodePage.tsx` dengan kartu split emas/gelap dan kode referal satu baris responsif, `UsersAccessPage.tsx` dengan garis bawah tab emas dan sorotan kolom `Admin`).
- **Situs Publik & Autentikasi**:
  - Memperbarui `Navbar.tsx` (transparan di atas hero, `--g-dark` transparan kabur saat gulir), `HeroSlider.tsx` (`--g-hero` + cahaya emas kiri-atas tanpa kartu BPH hero), `HomePage.tsx` (urutan blok bergantian Hero → Tentang `--g-cream` + bingkai emas → Budaya 4 variasi kartu → BPH `--g-maroon` + `SongketPattern` + `ContactCard` dengan tombol solid hijau WhatsApp → Agenda `--g-cream` + 1 kartu emas → Journey `--g-dark` → CTA `--g-gold` → Footer `--g-dark`), `JourneyPage.tsx`, `JourneyTimeline.tsx`, `Footer.tsx`, dan `AuthLayout.tsx`.
  - Memperbarui `docs/01-design-system.md` agar selaras penuh dengan spesifikasi v3.1.
- **Hasil Verifikasi Akhir**:
  - Sweep kode `web/src`: `0` kemunculan warna/kelas terlarang (`BE1E3E|F7D154|EEC02B|FAF6F7|F2E8EA|F5DCE1|red-600|red-800|font-mono|h-screen|bg-clip-text`).
  - `npm run lint`: lulus di `@himasri/web` dan `@himasri/functions`.
  - `npm run build`: lulus (`tsc --noEmit && vite build` dan `tsc` untuk `@himasri/functions`).
  - `npm run test`: seluruh suite lulus (`4/4` `test:web`, `5/5` `test:functions`, `12/12` `test:rules`).
  - Verifikasi visual browser pada `http://localhost:5173/` (`1440×900`, `1024×768`, `768×1024`, `390×844`), `/journey`, `/masuk`, dan seluruh rute admin (`202231001`) dengan `0` console error, `0` horizontal overflow, foto Tentang `/assets/images/departments/presi.webp` termuat utuh, tombol `Chat WhatsApp` hijau solid (`rgb(22, 163, 74)`), serta kode referal `HMS-NOV26-763W` tampil penuh tanpa terpotong di lebar `390px`. Tangkapan layar disimpan di `docs/screenshots/v3.1/`.
