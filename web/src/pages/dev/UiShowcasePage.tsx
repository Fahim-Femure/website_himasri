import { useState } from 'react';
import { BookOpen, Lock, Mail, Shield, User } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ChipFilter, SegmentedControl } from '@/components/ui/ChipFilter';
import { Choice } from '@/components/ui/Choice';
import { ContactCard } from '@/components/ui/ContactCard';
import { CultureCard } from '@/components/ui/CultureCard';
import { Field, SelectField, TextareaField } from '@/components/ui/Field';
import { LabAssistantCard } from '@/components/ui/LabAssistantCard';
import { MateriRow } from '@/components/ui/MateriRow';
import { MemberRow } from '@/components/ui/MemberRow';
import { ProductCard } from '@/components/ui/ProductCard';
import { StatStrip, StatTile } from '@/components/ui/StatTile';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { Drawer } from '@/components/feedback/Drawer';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ConfirmDialog, Modal } from '@/components/feedback/Modal';
import { SimulationNote } from '@/components/feedback/SimulationNote';
import { CardSkeleton, Skeleton } from '@/components/feedback/Skeleton';
import { CULTURE_COPY } from '@/content/site';

export default function UiShowcasePage() {
  const [choiceVal, setChoiceVal] = useState<'ya' | 'tidak'>('ya');
  const [toggleVal, setToggleVal] = useState(true);
  const [chipVal, setChipVal] = useState('all');
  const [periodVal, setPeriodVal] = useState('2025-2026');
  const [shakeKey, setShakeKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="min-h-dvh g-page py-10 px-6">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="space-y-1">
          <h1 className="type-app-h1 text-ink-900">Komponen UI HIMASRI v3.1</h1>
          <p className="type-app-body text-ink-600 max-w-2xl">
            Halaman pratinjau token warna Color Blocking, tipografi Plus Jakarta Sans, dan komponen UI sesuai
            docs/01-design-system.md.
          </p>
        </header>

        {/* Buttons */}
        <section className="rounded-lg bg-white border border-cream-200 p-6 shadow-card space-y-5">
          <h2 className="type-app-h2 text-ink-900">1. Button & Badge</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" arrowRight>Primary</Button>
            <Button variant="gold">Gold</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="whatsapp">WhatsApp</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" loading loadingLabel="Menyimpan…">Simpan</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
          <div className="rounded-lg bg-maroon-900 p-5 flex flex-wrap gap-3">
            <Button variant="onDark" arrowRight>OnDark</Button>
            <Button variant="outlineOnDark">OutlineOnDark</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="neutral">Neutral</Badge>
            <Badge variant="maroon">Maroon</Badge>
          </div>
        </section>

        {/* Avatar & MemberRow */}
        <section className="rounded-lg bg-white border border-cream-200 p-6 space-y-5">
          <h2 className="type-app-h2 text-ink-900">2. Avatar & MemberRow</h2>
          <div className="flex items-center gap-6">
            <Avatar name="Pengurus Inti" size="S" />
            <Avatar name="Kepala Biro" size="M" />
            <Avatar name="Anggota HIMASRI" size="L" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MemberRow
              variant="lead"
              jabatan="Kepala Biro"
              nama="Contoh Pimpinan Unit"
              jurusan="S1 Teknik Sistem Energi"
            />
            <MemberRow
              variant="member"
              nama="Contoh Anggota"
              jurusan="S1 Sistem Informasi"
            />
          </div>
        </section>

        {/* Form Controls */}
        <section className="rounded-lg bg-white border border-cream-200 p-6 space-y-5">
          <h2 className="type-app-h2 text-ink-900">3. Field, Choice, Toggle & ChipFilter</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field
              label="NIM"
              required
              leftIcon={<User className="h-4 w-4" />}
              placeholder="202431001"
              helperText="9–12 digit angka NIM IT PLN"
            />
            <Field
              label="Kata sandi"
              required
              type="password"
              leftIcon={<Lock className="h-4 w-4" />}
              defaultValue="rahasia123"
            />
            <Field
              label="Kode referal (Error state)"
              required
              state="error"
              error="Kode referal tidak valid atau sudah kedaluwarsa."
              shakeKey={shakeKey}
              defaultValue="SALAH-123"
            />
            <Field
              label="Kode referal (Success state)"
              required
              state="success"
              successText="Kode valid · berlaku hingga 31 Des 2026"
              defaultValue="HMS-NOV26-7K4M"
            />
            <SelectField label="Jurusan" required leftIcon={<BookOpen className="h-4 w-4" />}>
              <option value="S1 Teknik Informatika">S1 Teknik Informatika</option>
              <option value="S1 Sistem Informasi">S1 Sistem Informasi</option>
            </SelectField>
            <TextareaField label="Catatan" placeholder="Tulis deskripsi singkat…" />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="secondary" size="sm" onClick={() => setShakeKey((k) => k + 1)}>
              Uji animasi getar error
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            <Choice
              name="dev-aslab"
              value="ya"
              checked={choiceVal === 'ya'}
              onChange={() => setChoiceVal('ya')}
              label="Ya, saya aslab"
            />
            <Choice
              name="dev-aslab"
              value="tidak"
              checked={choiceVal === 'tidak'}
              onChange={() => setChoiceVal('tidak')}
              label="Tidak"
            />
          </div>
          <ToggleSwitch
            checked={toggleVal}
            onChange={setToggleVal}
            label="Geser otomatis hero"
            description="Menggeser slide setiap 5 detik secara otomatis"
          />
          <ChipFilter
            value={chipVal}
            onChange={setChipVal}
            options={[
              { value: 'all', label: 'Semua', count: 12 },
              { value: 'ftbe', label: 'FTBE', count: 4 },
              { value: 'ftik', label: 'FTIK', count: 3 },
            ]}
          />
          <div>
            <SegmentedControl
              value={periodVal}
              onChange={setPeriodVal}
              options={[
                { value: '2025-2026', label: '2025/2026' },
                { value: '2024-2025', label: '2024/2025' },
              ]}
            />
          </div>
        </section>

        {/* Stat Strip & Culture Cards */}
        <section className="rounded-lg bg-white border border-cream-200 p-6 space-y-5">
          <h2 className="type-app-h2 text-ink-900">4. StatStrip & CultureCard</h2>
          <StatStrip cols={4}>
            <StatTile label="Pengurus BPH" value={37} />
            <StatTile label="Departemen & Biro" value={5} />
            <StatTile label="Produk Aktif" value={6} />
            <StatTile label="Asisten Lab" value={6} />
          </StatStrip>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CULTURE_COPY.items.slice(0, 3).map((item) => (
              <CultureCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* Domain Cards */}
        <section className="rounded-lg bg-white border border-cream-200 p-6 space-y-5">
          <h2 className="type-app-h2 text-ink-900">5. Contact, Aslab, Product, Materi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ContactCard
              roleLabel="Ketua Himpunan"
              nama="Contoh Ketua Himpunan"
              jurusan="S1 Bisnis Energi"
              whatsapp="6280000000001"
              message="Halo Kak, saya ingin bertanya tentang HIMASRI."
            />
            <LabAssistantCard
              assistant={{
                uid: 'sample',
                nama: 'Contoh Asisten Lab',
                jurusan: 'S1 Teknik Informatika',
                angkatan: 2023,
                isAslab: true,
                fakultas: 'Fakultas Telematika Energi',
                lab: 'Lab Pemrograman Dasar',
                jadwalAslab: 'Sen & Rab · 13.00–16.00',
                whatsappAslab: '6280000000002',
                role: 'anggota',
                activePeriods: ['2025-2026'],
                searchName: 'contoh asisten lab',
              }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <ProductCard
              mode="view"
              product={{
                id: 'p1',
                eventId: 'e1',
                eventName: 'Event HIMASRI',
                name: 'Contoh Produk 1',
                price: 95000,
                stock: 40,
                imageUrl: '/assets/images/budaya/songket.webp',
                status: 'published',
              }}
            />
            <ProductCard
              mode="manage"
              product={{
                id: 'p2',
                eventId: 'e1',
                eventName: 'Event HIMASRI',
                name: 'Contoh Produk 2',
                price: 20000,
                stock: 0,
                imageUrl: '/assets/images/budaya/ampera.webp',
                status: 'draft',
              }}
            />
          </div>
          <MateriRow
            mode="editor"
            material={{
              id: 'm1',
              courseId: 'c1',
              jurusan: 'S1 Teknik Informatika',
              semester: 1,
              title: 'Modul 01 Pengantar Algoritma & Flowchart',
              type: 'file',
              fileUrl: '#',
              fileName: 'modul-01.pdf',
              fileSize: 2450000,
              mimeType: 'application/pdf',
              description: 'Ringkasan materi pertemuan 1–3 lengkap dengan contoh pseudocode.',
              uploadedBy: 'u1',
              uploadedByName: 'Contoh Pengunggah',
              createdAt: new Date(),
            }}
          />
        </section>

        {/* Feedback */}
        <section className="rounded-lg bg-white border border-cream-200 p-6 space-y-5">
          <h2 className="type-app-h2 text-ink-900">6. SimulationNote, Skeleton, EmptyState, Drawer, Modal</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <SimulationNote variant="light" />
            <div className="rounded-md bg-maroon-900 px-3 py-1.5">
              <SimulationNote variant="dark" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardSkeleton />
            <div className="space-y-3">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
          <EmptyState
            icon={<Mail className="h-6 w-6" />}
            title="Belum ada materi di semester ini"
            description="Materi yang diunggah oleh divisi Akademik & Keilmuan akan muncul di sini."
            action={<Button variant="primary" size="sm">Muat ulang</Button>}
          />
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setDrawerOpen(true)}>Buka Drawer</Button>
            <Button variant="secondary" onClick={() => setModalOpen(true)}>Buka Modal</Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>Buka ConfirmDialog</Button>
          </div>
        </section>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Contoh Drawer Kanan"
        description="Lebar 480px dengan fokus otomatis ke field pertama."
      >
        <div className="space-y-4">
          <Field label="Judul materi" required leftIcon={<Shield className="h-4 w-4" />} />
          <Button variant="primary" fullWidth onClick={() => setDrawerOpen(false)}>
            Tutup Drawer
          </Button>
        </div>
      </Drawer>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Contoh Modal"
        description="Animasi scale 0.96 ke 1 dengan overlay gelap netral."
      >
        <p className="type-app-body leading-6 text-ink-600">Konten dialog tampil di sini.</p>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
        title="Buat ulang kode referal?"
        description="Kode lama akan langsung tidak berlaku."
        confirmLabel="Buat ulang kode"
      />
    </div>
  );
}
