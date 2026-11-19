# 04 — Model Data (Cloud Firestore & Storage)

Semua timestamp memakai `serverTimestamp()`. ID periode berformat `2025-2026`. Dokumen yang berisi data contoh (bukan data resmi) memiliki field `isSample: true` — berlaku untuk `settings/public`, `events`, `products`, `courses`, dan anggota demo; UI menampilkan `SimulationNote` selama field ini `true`, dan form edit admin/editor menyetelnya ke `false` saat disimpan. Tipe TypeScript ditulis di `web/src/types/` dan dibagikan ke `functions/` (salin, atau paket bersama sederhana).

## Koleksi Firestore

### `users/{uid}` — data pribadi (pemilik + admin saja)
| Field | Tipe | Keterangan |
|---|---|---|
| `nama` | string | |
| `nim` | string | unik (dijaga oleh `nimIndex`) |
| `angkatan` | number | mis. 2024 |
| `jurusan` | string | dari daftar jurusan |
| `whatsapp` | string | format `62xxxxxxxxxx` |
| `isAslab` | boolean | |
| `fakultas` | string \| null | wajib bila aslab |
| `lab` | string \| null | wajib bila aslab |
| `jadwalAslab` | string \| null | opsional |
| `requestedPosition` | string \| null | jabatan yang diajukan saat daftar |
| `role` | string | ditulis hanya oleh Functions |
| `status` | `'pending'\|'active'\|'rejected'\|'disabled'` | ditulis hanya oleh Functions |
| `activePeriods` | string[] | periode di mana ia anggota aktif; diisi periode berjalan saat disetujui |
| `referralCodeId` | string | kode yang dipakai saat daftar |
| `claimsUpdatedAt` | timestamp | pemicu refresh token |
| `createdAt`, `approvedAt`, `approvedBy` | | |

### `members/{uid}` — profil yang boleh dilihat sesama anggota aktif
`nama`, `jurusan`, `angkatan`, `isAslab`, `fakultas`, `lab`, `jadwalAslab`, `whatsappAslab` (hanya terisi bila `isAslab`), `role`, `activePeriods`, `photoURL` (opsional), `searchName` (lowercase untuk pencarian). Ditulis oleh Functions saat `approveMember`/perubahan profil. **Tidak ada NIM.**

### `nimIndex/{nim}` — penjaga NIM unik
`{ uid, createdAt }`. Hanya Functions yang menulis/membaca.

### `periods/{periodId}` — periode kepengurusan (field publik)
| Field | Tipe |
|---|---|
| `label` | string, mis. "2025/2026" |
| `isCurrent` | boolean (hanya satu yang true) |
| `startYear` | number (untuk urutan) |
| `inti` | array `{ position, nama, jurusan }` — urutan: Ketua Himpunan, Wakil Ketua Himpunan, Sekretaris Jenderal, Sekretaris, Bendahara |
| `heads` | array `{ kind: 'DEPARTEMEN'\|'BIRO', unit, jabatan: 'Kepala'\|'Ketua', nama, jurusan, color }` |
| `updatedAt` | timestamp |

### `periods/{periodId}/units/{unitId}` — detail departemen/biro (anggota aktif saja)
`kind`, `name`, `color` (token warna strip), `order`, `leaders: [{ jabatan, nama, jurusan, uid? }]`, `members: [{ nama, jurusan, uid? }]`.

### `settings/public` — konten publik yang bisa diubah
`kahimWhatsapp`, `wakahimWhatsapp`, `email`, `instagram`, `alamat`, `adminWhatsapp` (untuk "Lupa kata sandi").

### `settings/hero`
`durationSec` (4|5|7, default 5), `transition` ('fade'|'slide', default 'fade'), `autoplay` (bool, default true), `respectReducedMotion` (bool, default true).

### `heroSlides/{slideId}`
`imageUrl`, `storagePath`, `caption`, `order` (number), `active` (bool), `width`, `height`, `focalY` (0–100, posisi vertikal fokus foto untuk `object-position`, default 50), `uploadedBy`, `createdAt`.

### `secure/referral` — kode aktif (inti & admin saja)
`code`, `periodLabel` ("Nov – Des 2026"), `validFrom`, `validUntil`, `usedCount`, `rotatedAt`, `rotatedBy` ('system' | uid).

### `referralHistory/{id}`
`code` (disimpan utuh; UI menyamarkan 4 karakter terakhir), `periodLabel`, `validFrom`, `validUntil`, `usedCount`, `endedReason` ('rotated' | 'regenerated').

### `courses/{courseId}` — mata kuliah
`jurusan`, `name`, `semester` (1–8), `materialCount` (dirawat oleh Functions trigger atau batch klien), `createdBy`, `createdAt`.

### `materials/{materialId}`
`courseId`, `jurusan`, `semester`, `title`, `type` ('file'|'link'), `fileUrl`, `storagePath`, `fileName`, `fileSize`, `mimeType`, `linkUrl`, `description`, `uploadedBy`, `uploadedByName`, `createdAt`, `updatedAt`.

### `events/{eventId}`
`name` (mis. "HUT HIMASRI 2026"), `contactWhatsapp` (narahubung panitia), `active` (bool), `order`.

### `products/{productId}`
`eventId`, `eventName`, `name`, `price` (number, rupiah), `stock` (number), `imageUrl`, `storagePath`, `description`, `status` ('published'|'draft'), `createdBy`, `createdAt`, `updatedAt`.

### `rateLimits/{hash}` — penahan percobaan (Functions saja)
`count`, `windowStart` — hash dari IP pemanggil `checkReferralCode`/`registerMember`.

### `productClicks/{autoId}`
`productId`, `uid`, `createdAt` — dicatat saat anggota menekan "Pesan via panitia" (untuk angka "Klik pesan").

## Cloud Storage

| Path | Isi | Batas |
|---|---|---|
| `hero/{slideId}.webp` | Foto hero | ≤ 5 MB, `image/*` |
| `products/{productId}.webp` | Foto produk | ≤ 3 MB, `image/*` |
| `materials/{materialId}/{fileName}` | Berkas materi | ≤ 20 MB, PDF/PPT/PPTX/DOC/DOCX |
| `avatars/{uid}.webp` | Foto profil (opsional) | ≤ 1 MB |

## Indeks komposit (`firebase/firestore.indexes.json`)

- `heroSlides`: `active` ASC, `order` ASC
- `materials`: `courseId` ASC, `createdAt` DESC
- `courses`: `jurusan` ASC, `semester` ASC, `name` ASC
- `products`: `eventId` ASC, `status` ASC, `createdAt` DESC
- `members`: `activePeriods` CONTAINS, `searchName` ASC
- `members`: `isAslab` ASC, `fakultas` ASC, `nama` ASC
- `users`: `status` ASC, `createdAt` DESC
