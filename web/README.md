# web — aplikasi React (Vite + TypeScript)

Konvensi folder `src/`:

| Folder | Isi |
|---|---|
| `app/` | `main.tsx`, `App.tsx`, provider global (Auth, Toaster, MotionConfig) |
| `routes/` | definisi `createBrowserRouter`, guard (`RequireGuest`, `RequireActiveMember`, `RequireRole`) |
| `layouts/` | `PublicLayout`, `AuthLayout`, `AppLayout` (sidebar + topbar) |
| `pages/public` | Beranda, 403, 404 |
| `pages/auth` | Masuk, Daftar, Menunggu verifikasi |
| `pages/members` | Struktur & Anggota, Materi, Asisten Lab, Toko |
| `pages/manage` | Kelola Foto Beranda, Kelola Produk |
| `pages/admin` | Kode Referal, Pengguna & Hak Akses, Periode & BPH |
| `pages/errors` | halaman error & batas error (ErrorBoundary) |
| `features/*` | logika + komponen spesifik fitur (hook data, form, tabel) — satu folder per fitur |
| `components/ui` | komponen dasar dari design system (Button, Badge, Avatar, Field, Choice, …) |
| `components/layout` | Navbar publik, Footer, AppSidebar, Topbar, Section |
| `components/feedback` | Skeleton, EmptyState, SimulationNote, ConfirmDialog, Drawer, Modal |
| `components/motion` | token & primitif animasi (`FadeIn`, `Reveal`, `Stagger`, `PageTransition`) |
| `hooks/` | hook umum (`useMediaQuery`, `useScrollSpy`, `useCountUp`, `usePrefersReducedMotion`) |
| `contexts/` | `AuthContext` |
| `lib/firebase` | inisialisasi Firebase + koneksi emulator |
| `services/` | akses Firestore/Storage/Functions per domain (users, periods, materials, products, hero, referral) |
| `content/` | teks & data statis (budaya, agenda, jurusan, fakultas/lab) |
| `styles/` | `index.css` (Tailwind layers, CSS variables, font) |
| `types/` | tipe TypeScript model data |
| `utils/` | `permissions.ts`, `format.ts` (rupiah, tanggal Indonesia), `whatsapp.ts`, `nim.ts` |

`public/assets/images/` berisi logo dan foto default hero (disalin dari `assets-source/`).
