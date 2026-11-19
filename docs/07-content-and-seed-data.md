# 07 — Konten, Copy, dan Data Seed

Semua teks antarmuka berbahasa Indonesia. Teks statis disimpan di `web/src/content/*.ts` (bukan di Firestore), kecuali yang disebut berasal dari Firestore.

## 1. Copy situs publik

**Hero**
- Badge: `Himpunan Mahasiswa Sriwijaya · IT PLN` (mobile: `HIMASRI · IT PLN`)
- Judul: `Rumah Mahasiswa Sumatera Selatan di IT PLN.`
- Subjudul: `Wong Kito Galo — kami merawat budaya Palembang, mempererat kekeluargaan, dan tumbuh berprestasi bersama.`
- Tombol: `Kenali HIMASRI`, `Masuk Anggota`

**Tentang**
- Overline `TENTANG HIMASRI`, pernyataan `Wong Kito Galo.`
- Kalimat blok kiri: `Satu rumah bagi mahasiswa asal Sumatera Selatan di Institut Teknologi PLN — sejak kampus ini masih bernama STT-PLN.`
- Paragraf: `Himpunan Mahasiswa Sriwijaya (HIMASRI) adalah organisasi daerah yang menaungi mahasiswa asal Sumatera Selatan di IT PLN. Di sini anggota saling membantu beradaptasi di perantauan, belajar bersama, dan memperkenalkan budaya Palembang kepada civitas kampus.`
- Pilar: **Kekeluargaan** — `Saling menjaga selama kuliah di perantauan.` · **Budaya** — `Melestarikan dan mengenalkan budaya Sumatera Selatan.` · **Prestasi** — `Ruang belajar dan berkembang, akademik maupun nonakademik.`

**Budaya** — judul `Warisan yang kami rawat bersama`, deskripsi `Dari tenun songket hingga Sungai Musi — identitas yang kami bawa ke kampus.`

| Ikon (lucide / kustom) | Kategori | Judul | Deskripsi | Warna blok |
|---|---|---|---|---|
| motif songket (SVG wajik bertingkat) | WASTRA | Kain Songket | Tenun benang emas warisan Kesultanan Palembang Darussalam, simbol kemuliaan wong kito. | maroon-700 |
| `Utensils` | KULINER | Pempek & Cuko | Olahan ikan tenggiri dan sagu berkuah cuko pedas-manis, ikon kuliner Palembang. | putih |
| jembatan (SVG dua menara) | IKON KOTA | Jembatan Ampera | Dibangun 1962–1965, menghubungkan Seberang Ulu dan Seberang Ilir di atas Sungai Musi. | gold-400 |
| `Landmark` | ARSITEKTUR | Rumah Limas | Rumah panggung berundak (kekijing) yang mencerminkan tatanan sosial masyarakat Palembang. | putih |
| `Music` | SENI TARI | Tari Gending Sriwijaya | Tarian penyambutan tamu agung yang menggambarkan keramahan dan kejayaan Sriwijaya. | maroon-950 |
| `Waves` | ALAM & SEJARAH | Sungai Musi | Urat nadi Palembang sejak era Sriwijaya: jalur dagang, budaya, dan rumah rakit. | red-600 |

**BPH** — overline `BADAN PENGURUS HARIAN`, judul `Kabinet {label periode}`, deskripsi `Pengurus inti serta kepala departemen dan biro yang memimpin HIMASRI periode ini.`

**Agenda Tahunan** — judul `Tradisi yang selalu kami jaga`
| No | Judul | Deskripsi | Ikon | Warna |
|---|---|---|---|---|
| 01 | Buka Bersama Sriwijaya | Berbuka puasa bersama seluruh anggota HIMASRI di bulan Ramadan. | `CalendarDays` | maroon-700 |
| 02 | Bakti Sosial | Kegiatan berbagi dan kepedulian kepada masyarakat sekitar. | `Heart` | gold-400 |
| 03 | Family Gathering | Kebersamaan santai anggota dan pengurus untuk mempererat keakraban. | `Users` | red-600 |
| 04 | HUT HIMASRI | Perayaan ulang tahun himpunan sebagai wujud syukur dan kebersamaan. | `Sparkles` | maroon-950 |

**Kontak** — overline `HUBUNGI KAMI`, judul `Ada pertanyaan tentang HIMASRI?`, deskripsi `Chat langsung Ketua atau Wakil Ketua Himpunan lewat WhatsApp.`; pesan WhatsApp otomatis: `Halo Kak, saya ingin bertanya tentang HIMASRI.`

**Pita CTA** — `Anggota HIMASRI? Masuk ke ruang anggota.` / `Akses materi kuliah tiap jurusan, kontak asisten lab, struktur lengkap tiap departemen, dan toko event HIMASRI. Pendaftaran akun memerlukan kode referal dari pengurus.`

## 2. Daftar pilihan form

**Jurusan** (urut): S1 Teknik Informatika, S1 Sistem Informasi, S1 Teknik Elektro, S1 Teknik Tenaga Listrik, S1 Teknik Sistem Energi, S1 Teknik Industri, S1 Bisnis Energi, S1 Teknik Sipil, S1 Teknik Mesin, D3 Teknologi Listrik, Lainnya.

**Fakultas & laboratorium** — ⚠️ data contoh, **wajib dikonfirmasi pengurus** sebelum rilis; simpan di `web/src/content/labs.ts` agar mudah diganti:
| Fakultas | Laboratorium |
|---|---|
| Fakultas Telematika Energi | Lab Pemrograman Dasar, Lab Basis Data, Lab Jaringan Komputer, Lab Rekayasa Perangkat Lunak |
| Fakultas Ketenagalistrikan dan Energi Terbarukan | Lab Sistem Tenaga, Lab Elektronika Dasar, Lab Sistem Digital, Lab Konversi Energi |
| Fakultas Teknologi dan Bisnis Energi | Lab Analisis Sistem, Lab Bisnis Energi, Lab Teknik Industri |
| Fakultas Teknologi Infrastruktur dan Kewilayahan | Lab Teknik Sipil, Lab Teknik Mesin |

**Jabatan diajukan**: Anggota (default), Ketua Himpunan, Wakil Ketua Himpunan, Sekretaris Jenderal, Sekretaris, Bendahara, Kepala/Ketua Departemen, Wakil Kepala/Ketua Departemen, Kepala Biro, Wakil Kepala Biro, Anggota Departemen/Biro.

## 3. Aset

| Aset | Path di proyek | Sumber asli di komputer pemilik |
|---|---|---|
| Logo HIMASRI (PNG transparan) | `web/public/assets/images/logo-himasri.png` | `assets-source/logo/` (lihat README di sana) |
| Foto hero 1 — kebersamaan anggota (720×1280, potret) | `web/public/assets/images/hero-kebersamaan.jpg` | `assets-source/photos/` |
| Foto hero 2 — pengurus di Kampus IT PLN (2000×1500) | `web/public/assets/images/hero-pengurus.jpg` | `assets-source/photos/` |
| Favicon | `web/public/favicon.svg` | dibuat dari motif songket (wajik emas di kotak maroon) |

Foto default hero dipakai bila koleksi `heroSlides` masih kosong. Foto 1 berorientasi potret: pada layar lebar gunakan `object-position: center 72%` agar orang-orangnya terlihat.

## 4. Data seed (dijalankan `npm run seed`)

1. **Periode** `2025-2026` (`isCurrent: true`): `inti` & `heads` & `units` persis dari `docs/data/bph-2025-2026.md`.
2. **settings/public**: `kahimWhatsapp: "6281234567801"`, `wakahimWhatsapp: "6281234567802"`, `adminWhatsapp: "6281234567800"`, `email: "himasri.official@gmail.com"`, `instagram: "@himasri.official"`, `alamat: "Sekretariat HIMASRI, IT PLN"` — **semua contoh**, beri flag `isSample: true` agar UI menampilkan `SimulationNote` sampai admin menggantinya.
3. **settings/hero**: `{ durationSec: 5, transition: 'fade', autoplay: true, respectReducedMotion: true }`.
4. **heroSlides**: 2 slide dari foto default (caption: "Kebersamaan anggota HIMASRI", "Pengurus HIMASRI di Kampus IT PLN").
5. **events**: "HUT HIMASRI 2026" (aktif), "Family Gathering", "Buka Bersama" — `contactWhatsapp` contoh.
6. **products** (`isSample: true`, event HUT HIMASRI 2026): Kaos HIMASRI Songket Rp95.000 stok 40; Totebag Motif Songket Rp60.000 stok 35; Gantungan Kunci Ampera Rp15.000 stok 60; Stiker Pack Wong Kito Rp10.000 stok 30; Topi HIMASRI Rp55.000 stok 15; Pin Enamel Sriwijaya Rp20.000 stok 0.
7. **courses** contoh (`isSample: true`) untuk S1 Teknik Informatika: Algoritma & Pemrograman (smt 1), Kalkulus I (1), Fisika Dasar (1), Struktur Data (2), Matematika Diskrit (2), Basis Data (3), Jaringan Komputer (3). Tanpa materi berkas.
8. **Mode demo emulator saja** (`--demo`): 12 anggota aktif fiktif + 6 aslab fiktif agar halaman anggota tidak kosong. Jangan pernah dijalankan ke proyek produksi.

Setiap entitas `isSample: true` menampilkan `SimulationNote` di UI ("Data contoh — ganti dengan data resmi HIMASRI").
