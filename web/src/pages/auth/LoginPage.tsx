import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Info, Lock, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Modal } from '@/components/feedback/Modal';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { AuthLayout } from '@/layouts/AuthLayout';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { loginWithIdentifier, logoutAccount, mapFirebaseAuthError } from '@/services/authService';
import { DEFAULT_PUBLIC_SETTINGS, fetchPublicSettings } from '@/services/publicService';
import type { PublicSettings } from '@/types/models';
import { isValidLoginIdentifier } from '@/utils/nim';
import { buildWhatsappUrl } from '@/utils/whatsapp';

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .refine(isValidLoginIdentifier, 'Masukkan NIM (9–12 digit angka) atau username yang valid.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
  rememberMe: z.boolean().default(true),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [shakeKey, setShakeKey] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const [publicSettings, setPublicSettings] = useState<PublicSettings>(DEFAULT_PUBLIC_SETTINGS);

  useEffect(() => {
    document.title = 'Masuk — HIMASRI IT PLN';
    void fetchPublicSettings().then(setPublicSettings);
  }, []);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    try {
      const cred = await loginWithIdentifier(values.identifier, values.password, values.rememberMe);
      const tokenRes = await cred.user.getIdTokenResult(true);
      const status = tokenRes.claims.status as string | undefined;

      if (status === 'disabled') {
        await logoutAccount();
        setAuthError('Akun dinonaktifkan. Hubungi admin HIMASRI.');
        setShakeKey((k) => k + 1);
        return;
      }

      if (status === 'pending' || status === 'rejected') {
        navigate('/daftar/menunggu', { replace: true });
        return;
      }

      toast.success('Berhasil masuk ke Ruang Anggota');
      navigate('/anggota/struktur', { replace: true });
    } catch (err) {
      if (auth.currentUser) {
        await logoutAccount().catch(() => {});
      }
      setAuthError(mapFirebaseAuthError(err));
      setShakeKey((k) => k + 1);
    }
  };

  const onInvalid = () => {
    setShakeKey((k) => k + 1);
    const firstField = Object.keys(errors)[0] as keyof LoginFormValues | undefined;
    if (firstField) setFocus(firstField);
  };

  const adminWaHref = buildWhatsappUrl(
    publicSettings.adminWhatsapp,
    'Halo Admin HIMASRI, saya lupa kata sandi akun Ruang Anggota. Mohon bantuannya untuk reset kata sandi.',
  );

  return (
    <AuthLayout quote="Selamat datang kembali, wong kito.">
      <div className="space-y-6">
        <div>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 type-small-medium font-medium text-ink-600 hover:text-maroon-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Beranda</span>
          </Link>
          <h1 className="mt-3 type-app-h1 text-ink-900">Masuk ke Ruang Anggota</h1>
          <p className="mt-1 type-small leading-5 text-ink-600">
            Gunakan NIM atau username dan kata sandi akun HIMASRI Anda.
          </p>
        </div>

        {authError && (
          <div
            role="alert"
            className="rounded-md border border-danger-600/30 bg-danger-50 px-4 py-3 type-small font-medium text-danger-600"
          >
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4" noValidate>
          <Field
            label="NIM atau username"
            required
            placeholder="Contoh: 202431001 atau AdminHimasri"
            autoComplete="username"
            leftIcon={<User className="h-4 w-4" />}
            error={errors.identifier?.message}
            shakeKey={shakeKey}
            {...register('identifier')}
          />

          <Field
            label="Kata sandi"
            required
            type="password"
            placeholder="Masukkan kata sandi"
            autoComplete="current-password"
            leftIcon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            shakeKey={shakeKey}
            {...register('password')}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex min-h-11 items-center gap-2.5 cursor-pointer select-none py-1">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-cream-300 text-maroon-700 focus:ring-maroon-700"
                {...register('rememberMe')}
              />
              <span className="type-small text-ink-900">Ingat saya</span>
            </label>

            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="min-h-[40px] px-1 type-small font-medium text-maroon-700 hover:underline cursor-pointer"
            >
              Lupa kata sandi?
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            loadingLabel="Memeriksa akun…"
          >
            Masuk
          </Button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-cream-200" />
          <span className="bg-cream-50 px-3 type-label text-ink-600 whitespace-nowrap">
            Belum punya akun?
          </span>
          <div className="w-full border-t border-cream-200" />
        </div>

        <Link to="/daftar" className="block">
          <Button variant="secondary" size="lg" fullWidth arrowRight>
            Daftar dengan kode referal
          </Button>
        </Link>

        <div className="rounded-md bg-white border border-cream-200 p-3.5 flex items-start gap-2.5">
          <Info className="h-4 w-4 shrink-0 text-ink-600 mt-0.5" aria-hidden="true" />
          <p className="type-label leading-5 text-ink-600">
            Hak akses di Ruang Anggota mengikuti jabatan yang diverifikasi oleh admin HIMASRI.
          </p>
        </div>
      </div>

      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Lupa kata sandi?"
        description="Reset mandiri lewat email terverifikasi atau hubungi admin HIMASRI sebagai cadangan."
      >
        <div className="space-y-5">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!resetEmail.trim()) {
                toast.error('Masukkan alamat email yang terdaftar.');
                return;
              }
              setSendingReset(true);
              try {
                await sendPasswordResetEmail(auth, resetEmail.trim());
                toast.success('Tautan reset kata sandi telah dikirim ke email Anda.');
                setResetEmail('');
                setForgotOpen(false);
              } catch {
                toast.error(
                  'Email tidak ditemukan atau belum terverifikasi. Gunakan WhatsApp admin sebagai cadangan.',
                );
              } finally {
                setSendingReset(false);
              }
            }}
            className="space-y-3"
          >
            <Field
              label="Email terverifikasi"
              type="email"
              placeholder="nama@email.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
            <Button type="submit" variant="primary" fullWidth loading={sendingReset}>
              Kirim tautan reset ke email
            </Button>
          </form>

          <div className="border-t border-cream-200 pt-4 space-y-3">
            <p className="type-label leading-5 text-ink-600">
              Belum memiliki email terverifikasi di akun NIM Anda? Hubungi admin HIMASRI untuk
              mendapatkan kata sandi sementara.
            </p>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setForgotOpen(false)}>
                Tutup
              </Button>
              <a href={adminWaHref} target="_blank" rel="noopener noreferrer">
                <Button variant="whatsapp">Chat Admin HIMASRI</Button>
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </AuthLayout>
  );
}
