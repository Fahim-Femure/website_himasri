# 03 — Peran (Role) dan Hak Akses

## Peran

| Kode peran (`role`) | Nama tampil | Sumber |
|---|---|---|
| — (tidak login) | Tamu | — |
| `anggota` | Anggota | Default untuk semua anggota terverifikasi |
| `psdm` | Pemberdayaan Sumber Daya Manusia (PSDM) | Ditetapkan admin |
| `minat_bakat` | Minat & Bakat | Ditetapkan admin |
| `akademik` | Akademik & Keilmuan | Ditetapkan admin |
| `kominfo` | Kominfo & Kewirausahaan | Ditetapkan admin |
| `inti` | Ketua · Wakil · Sekretaris · Bendahara (pengurus inti) | Ditetapkan admin |
| `admin` | Admin | Ditetapkan admin (admin pertama dibuat lewat skrip bootstrap) |

Setiap pengguna punya **satu** `role` dan satu `status`: `pending` (baru daftar), `active`, `rejected`, `disabled`. Hanya `status=active` yang boleh masuk ruang anggota.

Peran **tidak dipilih sendiri** saat daftar. Saat mendaftar, pengguna hanya *mengajukan* jabatan (`requestedPosition`); admin yang menetapkan `role`. Ini mencegah orang mengaku sebagai pengurus.

`role` dan `status` disimpan di **dua tempat** yang selalu disinkronkan oleh Cloud Functions: custom claims token Firebase Auth (dipakai Security Rules) dan dokumen `users/{uid}` (dipakai UI). Klien **tidak pernah** menulis `role`/`status`.

## Matriks hak akses

Keterangan: **E** = bisa mengisi/mengubah, **V** = hanya melihat, **—** = tidak ada akses.

| Fitur | Tamu | Anggota | PSDM | Minat & Bakat | Akademik | Kominfo | Inti | Admin |
|---|---|---|---|---|---|---|---|---|
| Beranda publik | V | V | V | V | V | V | V | E |
| Struktur & anggota | — | V | V | V | V | V | V | E |
| Materi kuliah (lihat/unduh) | — | V | V | V | V | V | V | E |
| Unggah/ubah/hapus materi & mata kuliah | — | — | — | — | E | — | E | E |
| Asisten lab | — | V | V | V | V | V | V | E |
| Toko (lihat) | — | V | V | V | V | V | V | E |
| Foto beranda (hero) | — | — | — | — | — | E | E | E |
| Produk & event | — | — | — | — | — | E | E | E |
| Kode referal | — | — | — | — | — | — | V | E |
| Periode & susunan BPH | — | — | — | — | — | — | E | E |
| Kelola pengguna & peran | — | — | — | — | — | — | — | E |

PSDM dan Minat & Bakat sementara hanya pelihat. Siapkan konstanta `PERMISSIONS` di satu file (`web/src/utils/permissions.ts`) agar mudah ditambah fitur nanti.

Catatan "Beranda publik — Admin E": admin mengubah konten publik lewat `/admin/periode` (kontak & BPH) dan `/kelola/foto-beranda` (hero); teks statis tetap di kode.

## Implementasi guard

- `useAuth()` menyediakan `{ user, profile, role, status, loading }`. `role`/`status` diambil dari `getIdTokenResult().claims`, dengan fallback `users/{uid}`.
- `can(role, permission)` dari `permissions.ts` dipakai oleh: route guard, item sidebar, tombol aksi (mis. `Unggah materi`, `Buat ulang kode`).
- Menyembunyikan tombol di UI **bukan** keamanan — Security Rules & Cloud Functions wajib menolak aksi yang tidak berhak (lihat `05-firebase-backend.md`).
- Setelah admin mengubah peran, Cloud Function menulis `users/{uid}.claimsUpdatedAt`; klien yang sedang login mendengarkan field ini lalu memanggil `getIdToken(true)` agar peran baru langsung berlaku.

## Sidebar per peran

| Peran | JELAJAHI | KELOLA | ADMIN |
|---|---|---|---|
| anggota, psdm, minat_bakat, akademik | ✔ | — | — |
| kominfo | ✔ | Foto Beranda, Produk Event | — |
| inti | ✔ | Foto Beranda, Produk Event | Kode Referal (lihat), Periode & BPH |
| admin | ✔ | Foto Beranda, Produk Event | Kode Referal, Pengguna & Hak Akses, Periode & BPH |

Badge peran di sidebar memakai label pendek bila panjang: "Kominfo & KWU", "Akademik & Keilmuan", "Pengurus Inti", "Admin", "Anggota".
