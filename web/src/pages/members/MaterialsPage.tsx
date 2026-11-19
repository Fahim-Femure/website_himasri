import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, Plus, Search, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Drawer } from '@/components/feedback/Drawer';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ConfirmDialog, Modal } from '@/components/feedback/Modal';
import { SimulationNote } from '@/components/feedback/SimulationNote';
import { Skeleton } from '@/components/feedback/Skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Choice } from '@/components/ui/Choice';
import { Field, SelectField, TextareaField } from '@/components/ui/Field';
import { MateriRow } from '@/components/ui/MateriRow';
import { JURUSAN_OPTIONS } from '@/content/forms';
import { useAuth } from '@/contexts/AuthContext';
import {
  createCourse,
  deleteMaterial,
  saveMaterial,
  subscribeCourses,
  subscribeMaterialsByCourse,
  uploadBlobWithProgress,
} from '@/services/memberService';
import type { CourseDoc, MaterialDoc } from '@/types/models';
import { can } from '@/utils/permissions';

const MAX_MATERIAL_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export default function MaterialsPage() {
  const { user, profile, role } = useAuth();
  const canEdit = can(role, 'materials:edit');

  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedJurusan, setSelectedJurusan] = useState<string>(JURUSAN_OPTIONS[0]);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [materials, setMaterials] = useState<MaterialDoc[]>([]);

  // Course modal
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseSemester, setNewCourseSemester] = useState(1);
  const [newCourseJurusan, setNewCourseJurusan] = useState<string>(JURUSAN_OPTIONS[0]);
  const [savingCourse, setSavingCourse] = useState(false);

  // Material Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialDoc | null>(null);
  const [matJurusan, setMatJurusan] = useState<string>(JURUSAN_OPTIONS[0]);
  const [matCourseId, setMatCourseId] = useState<string>('');
  const [matSemester, setMatSemester] = useState<number>(1);
  const [matTitle, setMatTitle] = useState('');
  const [matType, setMatType] = useState<'file' | 'link'>('link');
  const [matLinkUrl, setMatLinkUrl] = useState('');
  const [matDescription, setMatDescription] = useState('');
  const [matFile, setMatFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [savingMaterial, setSavingMaterial] = useState(false);

  // Delete confirm
  const [deletingMaterial, setDeletingMaterial] = useState<MaterialDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = 'Materi Kuliah — HIMASRI IT PLN';
    return subscribeCourses((list) => {
      setCourses(list);
      setLoadingCourses(false);
    });
  }, []);

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    return courses.filter(
      (c) => c.jurusan === selectedJurusan && (!q || c.name.toLowerCase().includes(q)),
    );
  }, [courses, selectedJurusan, courseSearch]);

  useEffect(() => {
    if (filteredCourses.length === 0) {
      setSelectedCourseId('');
      return;
    }
    if (!filteredCourses.some((c) => c.id === selectedCourseId)) {
      setSelectedCourseId(filteredCourses[0].id);
    }
  }, [filteredCourses, selectedCourseId]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );

  useEffect(() => {
    if (!selectedCourseId) {
      setMaterials([]);
      return;
    }
    return subscribeMaterialsByCourse(selectedCourseId, setMaterials);
  }, [selectedCourseId]);

  const groupedCourses = useMemo(() => {
    const map = new Map<number, CourseDoc[]>();
    filteredCourses.forEach((c) => {
      const list = map.get(c.semester) ?? [];
      list.push(c);
      map.set(c.semester, list);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredCourses]);

  const coursesForDrawer = useMemo(
    () => courses.filter((c) => c.jurusan === matJurusan),
    [courses, matJurusan],
  );

  const hasSampleCourses = useMemo(
    () => filteredCourses.some((c) => c.isSample),
    [filteredCourses],
  );

  const materialCountByJurusan = useMemo(() => {
    const map = new Map<string, number>();
    courses.forEach((c) => {
      map.set(c.jurusan, (map.get(c.jurusan) ?? 0) + (c.materialCount || 0));
    });
    return map;
  }, [courses]);

  const openNewMaterialDrawer = () => {
    setEditingMaterial(null);
    const defaultJurusan = selectedCourse?.jurusan || selectedJurusan;
    setMatJurusan(defaultJurusan);
    setMatCourseId(selectedCourse?.id || '');
    setMatSemester(selectedCourse?.semester || 1);
    setMatTitle('');
    setMatType('file');
    setMatLinkUrl('');
    setMatDescription('');
    setMatFile(null);
    setUploadProgress(0);
    setDrawerOpen(true);
  };

  const openEditMaterialDrawer = (mat: MaterialDoc) => {
    setEditingMaterial(mat);
    setMatJurusan(mat.jurusan);
    setMatCourseId(mat.courseId);
    setMatSemester(mat.semester);
    setMatTitle(mat.title);
    setMatType(mat.type);
    setMatLinkUrl(mat.linkUrl || '');
    setMatDescription(mat.description || '');
    setMatFile(null);
    setUploadProgress(0);
    setDrawerOpen(true);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || newCourseName.trim().length < 2) {
      toast.error('Nama mata kuliah minimal 2 karakter.');
      return;
    }
    setSavingCourse(true);
    try {
      const created = await createCourse({
        jurusan: newCourseJurusan,
        name: newCourseName.trim(),
        semester: Number(newCourseSemester),
        createdBy: user.uid,
      });
      setSelectedJurusan(newCourseJurusan);
      setSelectedCourseId(created.id);
      setCourseModalOpen(false);
      setNewCourseName('');
      toast.success('Mata kuliah berhasil ditambahkan');
    } catch {
      toast.error('Gagal menambahkan mata kuliah.');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!matCourseId) {
      toast.error('Pilih mata kuliah terlebih dahulu.');
      return;
    }
    if (matTitle.trim().length < 3 || matTitle.trim().length > 120) {
      toast.error('Judul materi harus 3–120 karakter.');
      return;
    }

    if (matType === 'link') {
      if (!/^https?:\/\/.+/i.test(matLinkUrl.trim())) {
        toast.error('Masukkan tautan URL yang diawali http:// atau https://.');
        return;
      }
    } else if (!editingMaterial && !matFile) {
      toast.error('Pilih berkas PDF, PPT, atau DOCX untuk diunggah.');
      return;
    }

    if (matFile) {
      if (matFile.size > MAX_MATERIAL_BYTES) {
        toast.error('Ukuran berkas maksimal 20 MB.');
        return;
      }
      const extOk = /\.(pdf|ppt|pptx|doc|docx)$/i.test(matFile.name);
      if (!ALLOWED_MIME_TYPES.includes(matFile.type) && !extOk) {
        toast.error('Format berkas harus PDF, PPT/PPTX, atau DOC/DOCX.');
        return;
      }
    }

    setSavingMaterial(true);
    try {
      const targetId = editingMaterial?.id || crypto.randomUUID();
      let fileUrl = editingMaterial?.fileUrl;
      let storagePath = editingMaterial?.storagePath;
      let fileName = editingMaterial?.fileName;
      let fileSize = editingMaterial?.fileSize;
      let mimeType = editingMaterial?.mimeType;

      if (matType === 'file' && matFile) {
        storagePath = `materials/${targetId}/${matFile.name}`;
        const resolvedMime = matFile.type || 'application/pdf';
        fileUrl = await uploadBlobWithProgress(storagePath, matFile, resolvedMime, setUploadProgress);
        fileName = matFile.name;
        fileSize = matFile.size;
        mimeType = resolvedMime;
      }

      await saveMaterial(editingMaterial ? editingMaterial.id : null, {
        courseId: matCourseId,
        jurusan: matJurusan,
        semester: Number(matSemester),
        title: matTitle.trim(),
        type: matType,
        ...(matType === 'file'
          ? { fileUrl, storagePath, fileName, fileSize, mimeType }
          : { linkUrl: matLinkUrl.trim() }),
        description: matDescription.trim(),
        uploadedBy: user.uid,
        uploadedByName: profile?.nama || 'Pengurus Akademik',
      });

      toast.success(editingMaterial ? 'Materi diperbarui' : 'Materi berhasil diunggah');
      setDrawerOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan materi.');
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMaterial) return;
    setDeleting(true);
    try {
      await deleteMaterial(deletingMaterial.id, deletingMaterial.courseId);
      toast.success('Materi dihapus');
      setDeletingMaterial(null);
    } catch {
      toast.error('Gagal menghapus materi.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        tone="maroon"
        label="Arsip Akademik"
        title="Materi Kuliah"
        description="Kumpulan modul, catatan, dan tautan belajar per jurusan dari divisi Akademik."
        actions={
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto min-w-0">
            <div className="relative inline-flex items-center w-full sm:w-auto min-w-0 max-w-full">
              <select
                aria-label="Jurusan"
                value={selectedJurusan}
                onChange={(e) => setSelectedJurusan(e.target.value)}
                className="min-h-[40px] w-full sm:w-auto max-w-full appearance-none rounded-md border border-cream-300 bg-white pl-3.5 pr-9 py-2 type-small font-medium text-ink-900 cursor-pointer focus:border-maroon-700 focus:outline-none truncate"
              >
                {JURUSAN_OPTIONS.map((j) => {
                  const count = materialCountByJurusan.get(j) ?? 0;
                  return (
                    <option key={j} value={j}>
                      {j} ({count})
                    </option>
                  );
                })}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 h-4 w-4 text-ink-600"
                aria-hidden="true"
              />
            </div>

            {canEdit && (
              <Button
                variant="primary"
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={openNewMaterialDrawer}
              >
                Unggah materi
              </Button>
            )}
          </div>
        }
      />

      {hasSampleCourses && <SimulationNote />}

      {/* Two Column Workspace (wider sidebar column so course titles don't break/truncate) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,340px)_1fr] gap-6 items-start">
        <aside className="rounded-lg bg-white border border-cream-200 p-5 space-y-4 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="type-body leading-6 font-semibold text-ink-900 whitespace-nowrap">
              Daftar Mata Kuliah
            </h2>
            {canEdit && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setNewCourseJurusan(selectedJurusan);
                  setCourseModalOpen(true);
                }}
              >
                Tambah
              </Button>
            )}
          </div>

          <Field
            label="Cari mata kuliah"
            placeholder="Ketik nama mata kuliah…"
            leftIcon={<Search className="h-4 w-4" />}
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
          />

          {loadingCourses ? (
            <div className="space-y-2.5">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          ) : groupedCourses.length > 0 ? (
            <div className="scrollbar-light space-y-4 max-h-[540px] overflow-y-auto pr-1">
              {groupedCourses.map(([semester, list]) => (
                <div key={semester} className="space-y-1.5">
                  <p className="type-label leading-5 font-semibold text-ink-600">
                    Semester {semester}
                  </p>
                  <div className="space-y-1.5">
                    {list.map((course) => {
                      const active = course.id === selectedCourseId;
                      return (
                        <button
                          key={course.id}
                          type="button"
                          title={course.name}
                          onClick={() => setSelectedCourseId(course.id)}
                          className={[
                            'w-full min-h-[44px] rounded-md px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer',
                            active
                              ? 'bg-cream-100 border border-cream-300 text-maroon-700 font-semibold'
                              : 'bg-white border border-cream-200 text-ink-900 font-medium hover:bg-cream-100/60',
                          ].join(' ')}
                        >
                          <span className="type-small leading-5 line-clamp-2 break-words">
                            {course.name}
                          </span>
                          <Badge variant={active ? 'maroon' : 'neutral'} className="tabular-nums shrink-0">
                            {course.materialCount || 0}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="h-6 w-6" />}
              title="Belum ada mata kuliah"
              description={`Belum ada mata kuliah untuk ${selectedJurusan}.`}
            />
          )}
        </aside>

        {/* Right: Course Detail + Materials */}
        <section className="min-w-0 space-y-4">
          {selectedCourse ? (
            <>
              <div className="rounded-lg bg-white border border-cream-200 p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">Semester {selectedCourse.semester}</Badge>
                    <Badge variant="neutral">{selectedCourse.jurusan}</Badge>
                  </div>
                  <h2 className="mt-2 type-app-h2 text-ink-900">{selectedCourse.name}</h2>
                  <p className="mt-0.5 type-small leading-5 text-ink-600 tabular-nums">
                    {materials.length} materi tersedia untuk diunduh atau dibuka.
                  </p>
                </div>

                {canEdit && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Upload className="h-4 w-4" />}
                    onClick={openNewMaterialDrawer}
                  >
                    Unggah ke mata kuliah ini
                  </Button>
                )}
              </div>

              {materials.length > 0 ? (
                <div className="space-y-3">
                  {materials.map((mat) => (
                    <MateriRow
                      key={mat.id}
                      material={mat}
                      mode={canEdit ? 'editor' : 'viewer'}
                      onEdit={openEditMaterialDrawer}
                      onDelete={setDeletingMaterial}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<BookOpen className="h-6 w-6" />}
                  title="Belum ada materi di mata kuliah ini"
                  description="Materi PDF, slide presentasi, atau tautan catatan akan muncul di sini setelah diunggah."
                  action={
                    canEdit ? (
                      <Button variant="primary" size="sm" onClick={openNewMaterialDrawer}>
                        Unggah materi pertama
                      </Button>
                    ) : undefined
                  }
                />
              )}
            </>
          ) : (
            <EmptyState
              icon={<BookOpen className="h-6 w-6" />}
              title="Pilih mata kuliah"
              description="Pilih mata kuliah di panel kiri atau tambah mata kuliah baru."
            />
          )}
        </section>
      </div>

      {/* Modal Tambah Mata Kuliah */}
      <Modal
        open={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        title="Tambah Mata Kuliah"
      >
        <form onSubmit={handleAddCourse} className="space-y-4">
          <SelectField
            label="Jurusan"
            required
            value={newCourseJurusan}
            onChange={(e) => setNewCourseJurusan(e.target.value)}
          >
            {JURUSAN_OPTIONS.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </SelectField>

          <Field
            label="Nama mata kuliah"
            required
            placeholder="Contoh: Pemrograman Web"
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
          />

          <SelectField
            label="Semester"
            required
            value={String(newCourseSemester)}
            onChange={(e) => setNewCourseSemester(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </SelectField>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCourseModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={savingCourse} loadingLabel="Menyimpan…">
              Simpan mata kuliah
            </Button>
          </div>
        </form>
      </Modal>

      {/* Drawer Unggah / Ubah Materi */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingMaterial ? 'Ubah Materi' : 'Unggah Materi'}
        description="PDF, PPT/PPTX, DOC/DOCX maksimal 20 MB atau tautan eksternal."
        dirty={Boolean(matTitle || matFile || matLinkUrl)}
      >
        <form onSubmit={handleSaveMaterial} className="space-y-4">
          <SelectField
            label="Jurusan"
            required
            value={matJurusan}
            onChange={(e) => {
              setMatJurusan(e.target.value);
              setMatCourseId('');
            }}
          >
            {JURUSAN_OPTIONS.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Mata kuliah"
            required
            value={matCourseId}
            onChange={(e) => {
              const cid = e.target.value;
              setMatCourseId(cid);
              const c = courses.find((item) => item.id === cid);
              if (c) setMatSemester(c.semester);
            }}
          >
            <option value="">Pilih mata kuliah…</option>
            {coursesForDrawer.map((c) => (
              <option key={c.id} value={c.id}>
                Smt {c.semester}: {c.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Semester"
            required
            value={String(matSemester)}
            onChange={(e) => setMatSemester(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </SelectField>

          <Field
            label="Judul materi"
            required
            placeholder="Contoh: Modul 01 Pengantar"
            value={matTitle}
            onChange={(e) => setMatTitle(e.target.value)}
          />

          <div className="space-y-2">
            <p className="type-small font-semibold text-ink-900">Jenis materi *</p>
            <div className="grid grid-cols-2 gap-3">
              <Choice
                name="matType"
                value="file"
                checked={matType === 'file'}
                onChange={() => setMatType('file')}
                label="Berkas (≤ 20 MB)"
              />
              <Choice
                name="matType"
                value="link"
                checked={matType === 'link'}
                onChange={() => setMatType('link')}
                label="Tautan URL"
              />
            </div>
          </div>

          {matType === 'file' ? (
            <div className="space-y-2">
              <label className="block type-small font-semibold text-ink-900">
                Pilih berkas (PDF/PPT/DOCX)
              </label>
              <input
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx"
                onChange={(e) => setMatFile(e.target.files?.[0] ?? null)}
                className="block w-full rounded-md border border-cream-300 bg-white p-2.5 type-small text-ink-900"
              />
              {editingMaterial?.fileName && !matFile && (
                <p className="type-label text-ink-600">
                  Berkas saat ini: {editingMaterial.fileName}
                </p>
              )}
              {savingMaterial && uploadProgress > 0 && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream-200">
                    <div
                      className="h-full origin-left bg-maroon-700 transition-transform duration-150"
                      style={{ transform: `scaleX(${uploadProgress / 100})` }}
                    />
                  </div>
                  <p className="type-label text-ink-600 tabular-nums">
                    Mengunggah {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          ) : (
            <Field
              label="Tautan URL"
              required
              placeholder="https://drive.google.com/..."
              value={matLinkUrl}
              onChange={(e) => setMatLinkUrl(e.target.value)}
            />
          )}

          <TextareaField
            label="Deskripsi (opsional)"
            placeholder="Catatan singkat isi materi…"
            value={matDescription}
            onChange={(e) => setMatDescription(e.target.value)}
          />

          <div className="flex gap-3 pt-4 border-t border-cream-200">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDrawerOpen(false)}
              disabled={savingMaterial}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={savingMaterial}
              loadingLabel="Menyimpan…"
            >
              Simpan materi
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deletingMaterial)}
        onClose={() => setDeletingMaterial(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Hapus materi ini?"
        description={`Materi "${deletingMaterial?.title || ''}" akan dihapus permanen beserta berkasnya.`}
        confirmLabel="Hapus materi"
      />
    </div>
  );
}
