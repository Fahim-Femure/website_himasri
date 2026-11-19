# 02 — Halaman, Route, dan Alur

## Peta route

| Route | Halaman | Akses | Layout |
|---|---|---|---|
| `/` | Beranda publik | Semua orang | `PublicLayout` |
| `/masuk` | Masuk (login) | Hanya yang belum login | `AuthLayout` |
| `/daftar` | Daftar anggota | Hanya yang belum login | `AuthLayout` |
| `/daftar/menunggu` | Menunggu verifikasi | Akun berstatus `pending` | `AuthLayout` |
| `/anggota` | Redirect ke `/anggota/struktur` | Anggota aktif | `AppLayout` |
| `/anggota/struktur` | Struktur & Anggota | Anggota aktif | `AppLayout` |
| `/anggota/materi` | Materi Kuliah (lihat; unggah bila berhak) | Anggota aktif | `AppLayout` |
| `/anggota/asisten-lab` | Direktori Asisten Lab | Anggota aktif | `AppLayout` |
| `/anggota/toko` | Toko HIMASRI | Anggota aktif | `AppLayout` |
| `/kelola/foto-beranda` | Kelola foto hero | `kominfo`, `inti`, `admin` | `AppLayout` |
| `/kelola/produk` | Kelola produk event | `kominfo`, `inti`, `admin` | `AppLayout` |
| `/admin/kode-referal` | Kode referal | Lihat: `inti`, `admin`. Buat ulang: `admin` | `AppLayout` |
| `/admin/pengguna` | Pengguna & hak akses | `admin` | `AppLayout` |
| `/admin/periode` | Periode & susunan BPH | `admin`, `inti` | `AppLayout` |
| `/403` | Tidak punya akses | — | `PublicLayout` |
| `*` | 404 | — | `PublicLayout` |

Guard: `RequireGuest`, `RequireActiveMember`, `RequireRole(roles[])`. Pengguna `pending` yang mencoba ke `/anggota/*` diarahkan ke `/daftar/menunggu`. Pengguna yang tidak berhak diarahkan ke `/403`. Saat memeriksa sesi, tampilkan layar memuat (logo + skeleton), jangan berkedip ke halaman login.

## 1. Beranda publik `/` (Figma: `v2 — Publik (Desktop)` dan `v2 — Publik (Mobile)`)

Urutan section (id anchor dalam kurung):

1. **Navbar transparan** di atas hero (sticky; setelah scroll > 80px berubah jadi latar `maroon-950` 92% + blur 12px). Kiri: logo dalam tile krem + "HIMASRI" + tagline "Himpunan Mahasiswa Sriwijaya · IT PLN". Tengah: tautan Beranda, Tentang, BPH, Budaya, Agenda, Kontak (scroll halus ke anchor, tautan aktif berwarna `gold-400` mengikuti section yang terlihat). Kanan: tombol `Masuk` (outlineOnDark) dan `Daftar Anggota` (onDark). Jika sudah login: ganti dengan tombol `Ruang Anggota`. Mobile: logo + tombol `Masuk` + tombol menu (44px) yang membuka sheet navigasi penuh.
2. **Hero** (`#beranda`, tinggi 820px desktop / 760px mobile): `HeroSlider` dengan foto dari Firestore `heroSlides` (aktif, urut `order`). Isi: badge emas "Himpunan Mahasiswa Sriwijaya · IT PLN", judul "Rumah Mahasiswa Sumatera Selatan di IT PLN.", subjudul, tombol `Kenali HIMASRI` (scroll ke Tentang) dan `Masuk Anggota`. Kontrol kiri-bawah: tombol jeda/putar, titik navigasi (aktif = pil emas 40px, lainnya 12px krem 50%), penghitung "01 / 02", garis pemisah, caption foto. **Blok emas BPH** menempel di sudut kanan bawah (desktop) / pita emas tepat di bawah hero (mobile): "BPH 2025/2026", nama Ketua Himpunan, "Ketua Himpunan · bersama {Wakil} (Wakil Ketua)", tautan "Lihat susunan BPH →". Jika `heroSlides` kosong: pakai foto default di `web/public/assets/images/`.
3. **Tentang** (`#tentang`): split color-block. Kiri (560px) blok maroon gradien: overline "TENTANG HIMASRI", "Wong Kito Galo.", kalimat sejarah. Kanan krem: paragraf latar belakang + 3 kartu pilar (Kekeluargaan – maroon, Budaya – emas, Prestasi – gold-100).
4. **Budaya** (`#budaya`): latar `gold-100`, judul "Warisan yang kami rawat bersama", grid 3×2 `CultureCard` dengan warna blok bergantian (maroon-700, putih, gold-400, putih, maroon-950, red-600). Mobile: 3 kartu pertama + teks "+3 budaya lainnya" yang bisa dibuka (expand).
5. **BPH** (`#bph`): section gelap. Judul "Kabinet {periode}". Baris 1: kartu emas Ketua & Wakil (Avatar L). Baris 2: Sekretaris Jenderal, Sekretaris, Bendahara (kartu krem). Baris 3: 5 kartu kepala departemen/biro dengan strip warna di atas. Lalu kotak berikon gembok: "Susunan lengkap tiap departemen dan daftar anggota aktif hanya dapat dilihat oleh anggota HIMASRI." + tombol `Masuk untuk melihat`. Data dari `periods/{currentPeriodId}` (field publik saja).
6. **Agenda** (`#agenda`): 4 blok warna menyatu (Buka Bersama Sriwijaya, Bakti Sosial, Family Gathering, HUT HIMASRI) dengan nomor besar 01–04 dan ikon.
7. **Kontak** (`#kontak`): latar `gold-100`, judul kiri, 2 `ContactCard` kanan (Ketua & Wakil Ketua) dengan tombol WhatsApp.
8. **Pita CTA**: gradien merah → maroon. "Anggota HIMASRI? Masuk ke ruang anggota." + deskripsi + tombol `Masuk` dan `Daftar dengan kode referal`.
9. **Footer** `maroon-950`: brand, kolom Jelajahi, Akun Anggota, Kontak (email, Instagram, alamat dari `settings/public`), garis, copyright "© {tahun} HIMASRI · Himpunan Mahasiswa Sriwijaya, Institut Teknologi PLN".

Tidak ada data sensitif di halaman publik (tidak ada NIM, tidak ada anggota departemen, tidak ada nomor aslab).

## 2. Masuk `/masuk`

Layout split: panel foto kiri 560px (foto kebersamaan + overlay merah tua, logo atas, kutipan "Selamat datang kembali, wong kito." bawah), form kanan max 520px di tengah.

- Tautan "← Beranda", overline "MASUK", judul "Masuk ke Ruang Anggota".
- Field: **NIM** (ikon user), **Kata sandi** (ikon gembok, tombol mata untuk tampil/sembunyi).
- Baris: checkbox "Ingat saya" (persistence `local` vs `session`), tautan "Lupa kata sandi?" → modal: "Hubungi admin HIMASRI untuk mereset kata sandi" + tombol WhatsApp admin.
- Tombol `Masuk` (primary, full width, state loading).
- Pemisah "Belum punya akun?" + tombol `Daftar dengan kode referal` (secondary).
- Kotak info: hak akses mengikuti jabatan yang diverifikasi admin.
- Error yang ditampilkan: NIM/kata sandi salah ("NIM atau kata sandi salah."), akun dinonaktifkan ("Akun dinonaktifkan. Hubungi admin HIMASRI."), terlalu banyak percobaan ("Terlalu banyak percobaan. Coba lagi beberapa menit lagi."). Pendaftar yang ditolak akunnya dihapus, sehingga login menghasilkan pesan NIM/kata sandi salah dan ia bisa mendaftar ulang.

## 3. Daftar `/daftar`

Layout sama dengan Masuk (kutipan: "Satu rumah, banyak cerita."). Field (urut):

1. Nama lengkap* (teks, 3–80 karakter)
2. NIM* (hanya angka, 9–12 digit) — dan Angkatan* (select tahun, dari tahun berjalan mundur 7 tahun) dalam satu baris
3. Jurusan* (select; daftar di `07-content-and-seed-data.md`)
4. Kata sandi* (min 8 karakter, berisi huruf & angka) — dan Konfirmasi kata sandi* dalam satu baris
5. Nomor WhatsApp* (format Indonesia, disimpan sebagai `62xxxxxxxxxx`; helper: "Hanya terlihat oleh admin, kecuali Anda aslab.")
6. **"Apakah Anda asisten laboratorium (aslab)?"*** — dua `Choice`: Ya / Tidak.
   - Jika **Ya**, muncul kotak "Detail asisten lab" (animasi buka, lihat 06) berisi: **Fakultas*** (select) → **Laboratorium*** (select yang opsinya tergantung fakultas; dinonaktifkan sampai fakultas dipilih; reset bila fakultas berubah) → **Jadwal jaga** (opsional, teks bebas, contoh "Sen & Rab · 13.00–16.00").
7. Jabatan di HIMASRI (opsional, select: Anggota, Ketua Himpunan, Wakil Ketua Himpunan, Sekretaris Jenderal, Sekretaris, Bendahara, Kepala/Wakil Departemen …). Helper: "Jabatan BPH aktif setelah diverifikasi admin."
8. **Kode referal*** — divalidasi di server. Setelah blur, panggil validasi ringan; tampilkan state `success` "Kode valid · berlaku hingga {tanggal}" atau `error` "Kode referal tidak valid atau sudah kedaluwarsa. Minta kode terbaru ke pengurus."
9. Tombol `Daftar` (nonaktif sampai semua wajib valid; teks bantuan di bawahnya).

Sukses → akun dibuat berstatus `pending` → otomatis login → arahkan ke `/daftar/menunggu`.

## 4. Menunggu verifikasi `/daftar/menunggu`

Ikon jam di lingkaran emas, judul "Akunmu sedang diverifikasi", ringkasan data (Nama, NIM, Jurusan · Angkatan, Aslab, Jabatan diajukan), tombol `Kembali ke beranda` dan `Keluar`. Halaman mendengarkan perubahan status secara realtime; saat admin menyetujui, tampilkan toast "Akun disetujui" lalu refresh token dan arahkan ke `/anggota/struktur`. Bila ditolak: tampilkan pesan dan tombol keluar.

## 5. AppLayout (ruang anggota)

- **Sidebar** kiri 272px (gradien sidebar): logo + "Ruang Anggota"; kartu pengguna (avatar, nama, badge peran); grup **JELAJAHI**: Struktur & Anggota, Materi Kuliah, Asisten Lab, Toko HIMASRI; grup **KELOLA** (hanya bila berhak): Foto Beranda, Produk Event; grup **ADMIN** (hanya bila berhak): Kode Referal, Pengguna & Hak Akses, Periode & BPH; bawah: Lihat Situs Publik, Keluar.
- **Topbar**: breadcrumb kiri, kanan badge "Hak akses: {nama peran}" + avatar (menu: nama & NIM pengguna, Lihat situs publik, Keluar).
- Konten: padding 32/48, jarak antar blok 32px.
- < 1024px: sidebar menjadi drawer kiri dengan tombol menu di topbar; < 768px: grid menjadi 1–2 kolom.

### 5a. Struktur & Anggota `/anggota/struktur`
1. Blok header gradien maroon: overline, "Keluarga HIMASRI", deskripsi, **pemilih periode** (segmented control: 4 periode terbaru + dropdown "Lainnya"); pilihan disimpan di query `?periode=2025-2026`. Di bawahnya 4 `StatTile`: Pengurus BPH, Departemen & Biro, Anggota aktif, Asisten lab (dihitung dari data).
2. "Badan Pengurus Harian {periode}": baris 5 kartu inti (Ketua & Wakil kartu emas), lalu grid 2 kolom kartu departemen/biro: header berwarna (jenis, nama, jumlah orang), daftar pimpinan (`MemberRow` lead), garis, label "ANGGOTA DEPARTEMEN", grid 2 kolom `MemberRow`.
3. "Anggota Aktif {periode}" (di luar BPH): sumber data `members` dengan `activePeriods` berisi periode terpilih, dikurangi orang yang tercantum di BPH periode itu (cocokkan `uid` bila ada, selain itu nama yang dinormalisasi). Bar filter (cari nama/NIM, Angkatan, Jurusan, toggle "Hanya aslab"), grid 4 kolom kartu anggota (avatar, nama, prodi, badge angkatan, badge "Aslab · {lab}"), paginasi 24 per halaman. Empty state bila tidak ada.

### 5b. Materi Kuliah `/anggota/materi`
1. Blok header emas: "Bank materi tiap jurusan" + tombol `Unggah materi` (hanya `akademik`, `inti`, `admin`).
2. Chip jurusan (wrap).
3. Dua kolom: kiri (320px) daftar mata kuliah dikelompokkan per semester + kotak cari + (editor) tombol "Tambah mata kuliah"; kanan: judul mata kuliah, meta, daftar `MateriRow` (editor bisa Ubah/Hapus).
4. **Drawer Unggah Materi**: Jurusan*, Mata kuliah*, Semester*, Judul*, Jenis* (Berkas PDF/PPT/DOCX ≤ 20 MB | Tautan URL), dropzone berkas atau field URL, Deskripsi (opsional), tombol Batal / Simpan materi (progres unggah).

### 5c. Asisten Lab `/anggota/asisten-lab`
Header emas "Tanya kakak asisten", chip filter fakultas, grid 3 kolom `LabAssistantCard` dari anggota `isAslab=true`. Tombol WhatsApp membuka `https://wa.me/{nomor}?text={encodeURIComponent("Halo Kak {nama depan}, saya ingin bertanya seputar praktikum di {lab}.")}` di tab baru.

### 5d. Toko HIMASRI `/anggota/toko`
Header gradien merah "Merchandise event", chip event, grid 4 kolom `ProductCard` mode view (hanya produk `status=published`). Tombol "Pesan via panitia" → WhatsApp narahubung event dengan teks "Halo panitia, saya ingin memesan {produk}." Produk stok 0 → badge "Habis" dan tombol nonaktif.

### 5e. Kelola Foto Beranda `/kelola/foto-beranda`
Header gradien merah + tombol `Tambah foto`. Kiri: pratinjau mini hero (komponen `HeroSlider` yang sama dalam skala kecil, autoplay). Kanan: pengaturan — durasi per foto (4/5/7 detik), efek transisi (Pudar/Geser), toggle Geser otomatis, toggle Hormati "kurangi gerakan". Bawah: daftar foto (drag handle untuk mengurutkan, nomor urut, thumbnail, caption yang bisa diubah, meta, badge status, toggle aktif, ubah, hapus) + dropzone "Tambah foto kegiatan" (JPG/PNG/WebP, lebar min 1920px, maks 5 MB). Unggahan dikompres di klien ke WebP lebar 1920px sebelum dikirim.

### 5f. Kelola Produk `/kelola/produk`
Header gradien merah, chip event, 3 `StatTile` (Produk aktif, Total stok, Pesanan masuk — "pesanan" = jumlah klik "Pesan via panitia" yang dicatat di `productClicks`, beri label "Klik pesan"), grid 3 kolom `ProductCard` mode manage, kartu form kanan "Tambah produk" (Nama*, Harga (Rp)*, Stok*, Event*, Foto produk 4:3 ≤ 3 MB, Deskripsi, Status Tampilkan/Draf, `Simpan produk`). Ubah produk membuka form yang sama terisi. Hapus memakai ConfirmDialog. Kelola event (tambah/ubah nama event & nomor WhatsApp panitia) lewat dialog kecil dari chip "+ Event".

### 5g. Kode Referal `/admin/kode-referal`
Judul "Gerbang pendaftaran anggota". Blok split: kiri emas — label "KODE AKTIF" + badge, kode besar (font `display-xl`, tracking 4%), tombol `Salin kode` (toast "Kode disalin") dan `Bagikan ke grup anggota` (WhatsApp tanpa nomor, teks berisi kode & masa berlaku). Kanan maroon-950 — "BERGANTI OTOMATIS DALAM", angka hari tersisa, progress bar periode, tanggal mulai/akhir, teks jadwal rotasi berikutnya. Baris 3 kartu info (Masa berlaku, Rotasi "Otomatis tiap 2 bulan", Dipakai untuk daftar N pendaftar). Kotak bahaya "Kode bocor ke luar anggota?" + tombol `Buat ulang kode` (admin saja; ConfirmDialog). Tabel riwayat (periode, kode — kode lama disamarkan `HMS-SEP26-••••`, jumlah pemakaian, status).

### 5h. Pengguna & Hak Akses `/admin/pengguna`
Judul "Verifikasi anggota & tetapkan peran". Tab: Menunggu verifikasi (n), Semua pengguna (n), Aslab (n). Tabel: Nama·NIM (avatar), Jurusan·Angkatan, Aslab (badge lab), Jabatan diajukan, select **Tetapkan hak akses** (peran), Aksi (Setujui ✓ / Tolak ✗). Tab Semua: kolom status + aksi ubah peran, nonaktifkan, reset kata sandi (menghasilkan kata sandi sementara yang ditampilkan sekali). Di bawah: **Matriks hak akses** (statis, dari `03-roles-and-access.md`) dengan legenda.

### 5i. Periode & BPH `/admin/periode` (tambahan agar data bisa dikelola)
Daftar periode (buat periode baru, tandai "periode berjalan"). Untuk periode terpilih: form pengurus inti (Ketua, Wakil, Sekjen, Sekretaris, Bendahara), daftar departemen/biro (jenis, nama, warna strip, pimpinan, anggota — anggota dipilih dari pengguna aktif atau diketik manual), dan kontak publik (nomor WhatsApp Ketua & Wakil, email, Instagram, alamat). Gaya visual sama dengan halaman panel lain.

## Alur utama

1. **Tamu** membuka `/` → membaca info publik → klik WhatsApp Ketua/Wakil, atau klik `Masuk`/`Daftar`.
2. **Pendaftaran**: `/daftar` → isi form + kode referal → Cloud Function `registerMember` memvalidasi kode & NIM unik → akun `pending` → `/daftar/menunggu`.
3. **Verifikasi**: Admin di `/admin/pengguna` menetapkan peran → `approveMember` → custom claims diset → pengguna diarahkan otomatis ke ruang anggota.
4. **Login**: `/masuk` (NIM + sandi) → status `active` → `/anggota/struktur`; `pending` → `/daftar/menunggu`; `disabled` → pesan error dan sign out.
5. **Input konten** sesuai peran: Akademik mengunggah materi; Kominfo mengatur foto hero & produk; Admin mengelola kode, pengguna, periode.
