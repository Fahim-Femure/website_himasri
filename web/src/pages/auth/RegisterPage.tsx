import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Camera, KeyRound, Lock, Phone, Trash2, User } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { DURATION, EASING, REDUCED_TRANSITION } from '@/components/motion';
import { Avatar } from '@/components/ui/Avatar';
import { Choice } from '@/components/ui/Choice';
import { Button } from '@/components/ui/Button';
import { Field, SelectField } from '@/components/ui/Field';
import {
  getAngkatanOptions,
  JURUSAN_OPTIONS,
  REQUESTED_POSITION_OPTIONS,
} from '@/content/forms';
import { useFaculties } from '@/hooks/useFaculties';
import { AuthLayout } from '@/layouts/AuthLayout';
import {
  checkReferralCode,
  loginWithNim,
  mapFirebaseAuthError,
  registerMember,
  updateUserPhoto,
} from '@/services/authService';
import { compressImageToWebp, uploadBlobWithProgress } from '@/services/memberService';
import { formatDateId, isValidWhatsapp } from '@/utils/format';

const registerFormSchema = z
  .object({
    nama: z
      .string()
      .trim()
      .min(3, 'Nama lengkap minimal 3 karakter.')
      .max(80, 'Nama lengkap maksimal 80 karakter.'),
    nim: z
      .string()
      .trim()
      .regex(/^\d{9,12}$/, 'NIM harus terdiri dari 9–12 digit angka.'),
    angkatan: z.coerce.number().int().min(2015, 'Pilih angkatan yang valid.'),
    jurusan: z.string().min(2, 'Jurusan wajib dipilih.'),
    password: z
      .string()
      .min(8, 'Kata sandi minimal 8 karakter.')
      .regex(/[A-Za-z]/, 'Kata sandi harus mengandung huruf.')
      .regex(/\d/, 'Kata sandi harus mengandung angka.'),
    confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi.'),
    whatsapp: z
      .string()
      .trim()
      .refine((val) => isValidWhatsapp(val), {
        message: 'Masukkan nomor WhatsApp Indonesia yang valid (mis. 081234567890).',
      }),
    isAslab: z.enum(['ya', 'tidak']),
    fakultas: z.string().optional(),
    lab: z.string().optional(),
    jadwalAslab: z.string().max(120, 'Maksimal 120 karakter.').optional(),
    requestedPosition: z.string().optional(),
    referralCode: z.string().trim().min(4, 'Kode referal wajib diisi.'),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Konfirmasi kata sandi tidak cocok.',
      });
    }
    if (data.isAslab === 'ya') {
      if (!data.fakultas || data.fakultas.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fakultas'],
          message: 'Fakultas wajib dipilih.',
        });
      }
      if (!data.lab || data.lab.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lab'],
          message: 'Laboratorium wajib dipilih.',
        });
      }
    }
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();
  const { facultyNames, getLabsForFaculty } = useFaculties();
  const angkatanOptions = useMemo(() => getAngkatanOptions(), []);

  const [shakeKey, setShakeKey] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [referralCheck, setReferralCheck] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    validUntilText?: string;
    errorMessage?: string;
  }>({ status: 'idle' });

  useEffect(() => {
    document.title = 'Daftar Anggota — HIMASRI IT PLN';
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    setFocus,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    mode: 'onChange',
    defaultValues: {
      nama: '',
      nim: '',
      angkatan: angkatanOptions[0],
      jurusan: '',
      password: '',
      confirmPassword: '',
      whatsapp: '',
      isAslab: 'tidak',
      fakultas: '',
      lab: '',
      jadwalAslab: '',
      requestedPosition: 'Anggota',
      referralCode: '',
    },
  });

  const isAslab = watch('isAslab');
  const namaDraft = watch('nama') || 'Anggota Baru';
  const selectedFakultas = watch('fakultas') || '';
  const availableLabs = useMemo(
    () => getLabsForFaculty(selectedFakultas),
    [selectedFakultas, getLabsForFaculty],
  );
  const referralCodeField = register('referralCode');

  const handlePhotoChange = async (file: File | undefined) => {
    setPhotoError(null);
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Format foto harus JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Ukuran berkas foto maksimal 5 MB.');
      return;
    }
    try {
      const compressed = await compressImageToWebp(file, {
        maxWidth: 512,
        aspectRatio: 1,
        quality: 0.85,
      });
      if (compressed.blob.size > 1 * 1024 * 1024) {
        setPhotoError('Ukuran foto setelah kompresi melebihi 1 MB. Pilih foto lain.');
        return;
      }
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
      setPhotoBlob(compressed.blob);
      setPhotoPreviewUrl(URL.createObjectURL(compressed.blob));
    } catch {
      setPhotoError('Gagal memproses foto profil. Coba pilih berkas lain.');
    }
  };

  const handleClearPhoto = () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
    setPhotoError(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleAslabChange = (val: 'ya' | 'tidak') => {
    setValue('isAslab', val, { shouldValidate: true });
    if (val === 'tidak') {
      setValue('fakultas', '', { shouldValidate: true });
      setValue('lab', '', { shouldValidate: true });
      setValue('jadwalAslab', '', { shouldValidate: true });
      clearErrors(['fakultas', 'lab', 'jadwalAslab']);
    }
  };

  const handleFakultasChange = (nextFakultas: string) => {
    setValue('fakultas', nextFakultas, { shouldValidate: true });
    setValue('lab', '', { shouldValidate: true });
  };

  const verifyReferralOnServer = async (code: string) => {
    const trimmed = code.trim();
    if (trimmed.length < 4) {
      setReferralCheck({ status: 'idle' });
      return;
    }
    setReferralCheck({ status: 'checking' });
    try {
      const res = await checkReferralCode(trimmed);
      if (res.valid) {
        clearErrors('referralCode');
        setReferralCheck({
          status: 'valid',
          validUntilText: res.validUntil
            ? `Kode valid · berlaku hingga ${formatDateId(res.validUntil)}`
            : 'Kode valid',
        });
      } else {
        const msg =
          'Kode referal tidak valid atau sudah kedaluwarsa. Minta kode terbaru ke pengurus.';
        setError('referralCode', { type: 'server', message: msg });
        setReferralCheck({ status: 'invalid', errorMessage: msg });
      }
    } catch (err) {
      const msg = mapFirebaseAuthError(err);
      setReferralCheck({ status: 'invalid', errorMessage: msg });
    }
  };

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);
    try {
      const regRes = await registerMember({
        nama: values.nama.trim(),
        nim: values.nim.trim(),
        angkatan: Number(values.angkatan),
        jurusan: values.jurusan,
        password: values.password,
        whatsapp: values.whatsapp.trim(),
        isAslab: values.isAslab === 'ya',
        fakultas: values.isAslab === 'ya' ? values.fakultas || null : null,
        lab: values.isAslab === 'ya' ? values.lab || null : null,
        jadwalAslab: values.isAslab === 'ya' ? values.jadwalAslab?.trim() || null : null,
        requestedPosition: values.requestedPosition || 'Anggota',
        referralCode: values.referralCode.trim(),
      });

      await loginWithNim(values.nim.trim(), values.password, true);

      if (photoBlob) {
        try {
          const uploadedUrl = await uploadBlobWithProgress(
            `avatars/${regRes.uid}.webp`,
            photoBlob,
            'image/webp',
          );
          await updateUserPhoto(uploadedUrl);
        } catch (uploadErr) {
          console.error('Avatar upload error:', uploadErr);
          toast.warning('Akun terdaftar, namun foto profil gagal diunggah.');
        }
      }

      toast.success('Pendaftaran terkirim! Menunggu verifikasi admin.');
      navigate('/daftar/menunggu', { replace: true });
    } catch (err) {
      const errObj = err as { details?: { reason?: string } };
      const reason = errObj?.details?.reason;
      const message = mapFirebaseAuthError(err);

      if (reason === 'invalid-referral') {
        setError('referralCode', { type: 'server', message });
        setReferralCheck({ status: 'invalid', errorMessage: message });
        setFocus('referralCode');
      } else if (reason === 'nim-exists') {
        setError('nim', { type: 'server', message });
        setFocus('nim');
      } else {
        setFormError(message);
      }
      setShakeKey((k) => k + 1);
    }
  };

  const onInvalid = () => {
    setShakeKey((k) => k + 1);
    const firstField = Object.keys(errors)[0] as keyof RegisterFormValues | undefined;
    if (firstField) setFocus(firstField);
  };

  return (
    <AuthLayout quote="Satu rumah, banyak cerita." maxWidthClass="max-w-[440px]">
      <div className="space-y-6 py-4">
        <div>
          <Link
            to="/"
            className="inline-flex min-h-[40px] items-center gap-2 type-small font-medium text-ink-600 hover:text-maroon-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Beranda</span>
          </Link>
          <h1 className="mt-3 type-app-h1 text-ink-900">Daftar dengan Kode Referal</h1>
          <p className="mt-1 type-small leading-5 text-ink-600">
            Lengkapi identitas mahasiswa Anda. Akun akan aktif setelah diverifikasi admin HIMASRI.
          </p>
        </div>

        {formError && (
          <div
            role="alert"
            className="rounded-md border border-danger-600/30 bg-danger-50 px-4 py-3 type-small font-medium text-danger-600"
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4" noValidate>
          {/* Foto Profil (Opsional) */}
          <div className="rounded-lg border border-cream-200 bg-white p-4 space-y-3">
            <p className="type-small font-semibold text-ink-900">Foto profil (opsional)</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar name={namaDraft} photoURL={photoPreviewUrl} size="L" />
              <div className="flex-1 space-y-2">
                <input
                  ref={photoInputRef}
                  id="register-avatar-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => void handlePhotoChange(e.target.files?.[0])}
                  className="sr-only"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<Camera className="h-4 w-4" />}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    {photoPreviewUrl ? 'Ganti foto profil' : 'Pilih foto profil'}
                  </Button>
                  {photoPreviewUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      leftIcon={<Trash2 className="h-4 w-4 text-danger-600" />}
                      onClick={handleClearPhoto}
                    >
                      Hapus
                    </Button>
                  )}
                </div>
                <p className="type-caption leading-4 text-ink-600">
                  JPG, PNG, atau WebP maks. 5 MB. Dipotong persegi & dikompresi otomatis ke WebP.
                </p>
                {photoError && (
                  <p role="alert" className="type-label text-danger-600">
                    {photoError}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Field
            label="Nama lengkap"
            required
            placeholder="Contoh: Nadia Putri"
            leftIcon={<User className="h-4 w-4" />}
            error={errors.nama?.message}
            shakeKey={shakeKey}
            {...register('nama')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="NIM"
              required
              placeholder="9–12 digit angka"
              inputMode="numeric"
              error={errors.nim?.message}
              shakeKey={shakeKey}
              {...register('nim')}
            />

            <SelectField
              label="Angkatan"
              required
              error={errors.angkatan?.message}
              shakeKey={shakeKey}
              {...register('angkatan')}
            >
              {angkatanOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </SelectField>
          </div>

          <SelectField
            label="Jurusan"
            required
            error={errors.jurusan?.message}
            shakeKey={shakeKey}
            {...register('jurusan')}
          >
            <option value="">Pilih jurusan…</option>
            {JURUSAN_OPTIONS.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </SelectField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Kata sandi"
              required
              type="password"
              placeholder="Min. 8 karakter"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              shakeKey={shakeKey}
              {...register('password')}
            />
            <Field
              label="Konfirmasi kata sandi"
              required
              type="password"
              placeholder="Ulangi kata sandi"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.confirmPassword?.message}
              shakeKey={shakeKey}
              {...register('confirmPassword')}
            />
          </div>

          <Field
            label="Nomor WhatsApp"
            required
            placeholder="Contoh: 081234567890"
            inputMode="tel"
            leftIcon={<Phone className="h-4 w-4" />}
            helperText="Hanya terlihat oleh admin, kecuali Anda aslab."
            error={errors.whatsapp?.message}
            shakeKey={shakeKey}
            {...register('whatsapp')}
          />

          {/* Conditional Aslab */}
          <fieldset className="space-y-2">
            <legend className="type-small font-semibold text-ink-900">
              Apakah Anda asisten laboratorium (aslab)?
              <span className="ml-1 text-danger-600" aria-hidden="true">
                *
              </span>
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Choice
                name="isAslab"
                value="ya"
                checked={isAslab === 'ya'}
                onChange={() => handleAslabChange('ya')}
                label="Ya"
              />
              <Choice
                name="isAslab"
                value="tidak"
                checked={isAslab === 'tidak'}
                onChange={() => handleAslabChange('tidak')}
                label="Tidak"
              />
            </div>
          </fieldset>

          <AnimatePresence initial={false}>
            {isAslab === 'ya' && (
              <motion.div
                key="aslab-box"
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                animate={prefersReduced ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={
                  prefersReduced
                    ? REDUCED_TRANSITION
                    : { duration: DURATION.medium, ease: EASING.enter }
                }
                className="overflow-hidden"
              >
                <div className="rounded-lg border border-cream-200 bg-white p-4 space-y-4">
                  <p className="type-small font-semibold text-ink-900">Detail asisten lab</p>
                  <SelectField
                    label="Fakultas"
                    required
                    value={selectedFakultas}
                    onChange={(e) => handleFakultasChange(e.target.value)}
                    error={errors.fakultas?.message}
                    shakeKey={shakeKey}
                  >
                    <option value="">Pilih fakultas…</option>
                    {facultyNames.map((fak) => (
                      <option key={fak} value={fak}>
                        {fak}
                      </option>
                    ))}
                  </SelectField>

                  <motion.div
                    animate={{ opacity: selectedFakultas ? 1 : 0.75 }}
                    transition={{ duration: DURATION.fast }}
                  >
                    <SelectField
                      label="Laboratorium"
                      required
                      disabled={!selectedFakultas}
                      error={errors.lab?.message}
                      shakeKey={shakeKey}
                      {...register('lab')}
                    >
                      <option value="">
                        {selectedFakultas ? 'Pilih laboratorium…' : 'Pilih fakultas dulu…'}
                      </option>
                      {availableLabs.map((lab) => (
                        <option key={lab} value={lab}>
                          {lab}
                        </option>
                      ))}
                    </SelectField>
                  </motion.div>

                  <Field
                    label="Jadwal jaga"
                    placeholder="Contoh: Sen & Rab · 13.00–16.00"
                    helperText="Opsional, memudahkan teman mencari waktu asistensi."
                    error={errors.jadwalAslab?.message}
                    {...register('jadwalAslab')}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <SelectField
            label="Jabatan di HIMASRI"
            helperText="Jabatan BPH aktif setelah diverifikasi admin."
            {...register('requestedPosition')}
          >
            {REQUESTED_POSITION_OPTIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </SelectField>

          <Field
            label="Kode referal"
            required
            placeholder="Contoh: HMS-NOV26-7K4M"
            leftIcon={<KeyRound className="h-4 w-4" />}
            state={
              referralCheck.status === 'valid'
                ? 'success'
                : referralCheck.status === 'invalid'
                  ? 'error'
                  : 'default'
            }
            successText={
              referralCheck.status === 'checking'
                ? 'Memeriksa kode…'
                : referralCheck.validUntilText
            }
            error={errors.referralCode?.message || referralCheck.errorMessage}
            shakeKey={shakeKey}
            {...referralCodeField}
            onChange={(e) => {
              referralCodeField.onChange(e);
              if (referralCheck.status !== 'idle') {
                setReferralCheck({ status: 'idle' });
              }
            }}
            onBlur={(e) => {
              referralCodeField.onBlur(e);
              void verifyReferralOnServer(e.target.value);
            }}
          />

          <div className="pt-2 space-y-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!isValid}
              loading={isSubmitting}
              loadingLabel="Mendaftarkan akun…"
            >
              Daftar
            </Button>
            <p className="text-center type-caption text-ink-600">
              Lengkapi seluruh kolom bertanda * untuk mengaktifkan tombol Daftar.
            </p>
          </div>
        </form>

        <p className="text-center type-small text-ink-600">
          Sudah punya akun?{' '}
          <Link to="/masuk" className="font-semibold text-maroon-700 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
