import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Check, Copy } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/feedback/Modal';
import { EmptyState } from '@/components/feedback/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader';
import { DURATION, EASING } from '@/components/motion';
import { Badge } from '@/components/ui/Badge';
import { Button, WhatsAppGlyph } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import {
  callRegenerateReferralCode,
  subscribeActiveReferral,
  subscribeReferralHistory,
} from '@/services/memberService';
import type { ReferralDoc, ReferralHistoryDoc } from '@/types/models';
import { formatDateId, maskReferralCode, toDate } from '@/utils/format';
import { can } from '@/utils/permissions';
import { buildWhatsappShareUrl } from '@/utils/whatsapp';

export default function ReferralCodePage() {
  const { role } = useAuth();
  const prefersReduced = useReducedMotion();
  const canRegenerate = can(role, 'referral:regenerate');

  const [referral, setReferral] = useState<ReferralDoc | null>(null);
  const [history, setHistory] = useState<ReferralHistoryDoc[]>([]);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    document.title = 'Kode Referal — HIMASRI IT PLN';
    const u1 = subscribeActiveReferral(setReferral);
    const u2 = subscribeReferralHistory(setHistory);
    return () => {
      u1();
      u2();
    };
  }, []);

  const periodStats = useMemo(() => {
    const start = toDate(referral?.validFrom);
    const end = toDate(referral?.validUntil);
    if (!start || !end) {
      return {
        daysLeft: 0,
        progress: 0,
        startText: '—',
        endText: '—',
      };
    }
    const now = Date.now();
    const totalMs = Math.max(1, end.getTime() - start.getTime());
    const elapsedMs = Math.min(totalMs, Math.max(0, now - start.getTime()));
    const remainingMs = Math.max(0, end.getTime() - now);
    const daysLeft = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    const progress = elapsedMs / totalMs;
    return {
      daysLeft,
      progress,
      startText: formatDateId(start),
      endText: formatDateId(end),
    };
  }, [referral]);

  const handleCopy = async () => {
    if (!referral?.code) return;
    try {
      await navigator.clipboard.writeText(referral.code);
      setCopied(true);
      toast.success('Kode disalin');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Gagal menyalin kode.');
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await callRegenerateReferralCode();
      toast.success(`Kode baru dibuat: ${res.code}`);
      setConfirmOpen(false);
    } catch {
      toast.error('Gagal membuat ulang kode referal.');
    } finally {
      setRegenerating(false);
    }
  };

  const shareUrl = referral
    ? buildWhatsappShareUrl(
        `Kode referal pendaftaran anggota HIMASRI periode ${referral.periodLabel}: *${referral.code}* (berlaku hingga ${periodStats.endText}). Daftar di ${window.location.origin}/daftar`,
      )
    : '#';

  return (
    <div className="space-y-6">
      <PageHeader
        tone="dark"
        label="Keamanan & Akses"
        title="Kode Referal"
        description="Kode referal wajib diisi calon anggota saat mendaftar dan berotasi otomatis tiap 2 bulan."
      />

      {/* Main Clean Workspace Card */}
      <div className="space-y-2.5">
        <div className="overflow-hidden rounded-lg bg-white border border-cream-200">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left: Active Code */}
            <div className="lg:col-span-7 p-6 flex flex-col justify-between gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="type-label leading-5 font-semibold text-ink-600">
                  Kode aktif
                </span>
                <Badge variant="maroon">{referral?.periodLabel || 'Memuat…'}</Badge>
              </div>

              <div className="space-y-1.5">
                <p
                  className="font-mono font-bold tabular-nums tracking-tight text-ink-900 select-all break-all sm:whitespace-nowrap"
                  style={{ fontSize: 'clamp(22px, 3vw, 34px)', lineHeight: 1.2 }}
                >
                  {referral?.code || '—'}
                </p>
                <p className="type-small leading-5 text-ink-600 tabular-nums">
                  Berlaku {periodStats.startText} – {periodStats.endText}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="primary"
                  onClick={handleCopy}
                  disabled={!referral?.code}
                  leftIcon={
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={copied ? 'check' : 'copy'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: DURATION.fast }}
                        className="flex items-center"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </motion.span>
                    </AnimatePresence>
                  }
                >
                  {copied ? 'Tersalin' : 'Salin kode'}
                </Button>

                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="secondary"
                    leftIcon={<WhatsAppGlyph className="h-4 w-4 text-success-600" />}
                  >
                    Bagikan ke grup
                  </Button>
                </a>
              </div>
            </div>

            {/* Right: Countdown & Progress */}
            <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-cream-200 bg-cream-50/50 p-6 flex flex-col justify-between gap-5">
              <div>
                <p className="type-label leading-5 font-semibold text-ink-600">
                  Berganti dalam
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl leading-none font-bold text-ink-900 tabular-nums">
                    {periodStats.daysLeft}
                  </span>
                  <span className="type-small text-ink-600">hari</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream-200">
                  <motion.div
                    initial={prefersReduced ? { scaleX: periodStats.progress } : { scaleX: 0 }}
                    animate={{ scaleX: periodStats.progress }}
                    transition={{ duration: prefersReduced ? 0 : 0.6, ease: EASING.enter }}
                    className="h-full w-full origin-left rounded-full bg-maroon-700"
                  />
                </div>

                <div className="flex justify-between type-label text-ink-600 tabular-nums">
                  <span>Mulai: {periodStats.startText}</span>
                  <span>Berakhir: {periodStats.endText}</span>
                </div>
                <p className="type-label text-ink-600">
                  Jadwal rotasi berikutnya: tanggal 1 bulan ganjil pukul 00.00 WIB.
                </p>
              </div>
            </div>
          </div>

          {/* Inline Warning Row (Admin Only) */}
          {canRegenerate && (
            <div className="border-t border-cream-200 bg-cream-50 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="type-label leading-5 text-ink-600">
                <span className="font-semibold text-ink-900">Kode bocor ke luar anggota?</span>{' '}
                Membuat ulang kode akan langsung menonaktifkan kode lama.
              </p>

              <Button
                variant="danger"
                size="sm"
                className="shrink-0"
                onClick={() => setConfirmOpen(true)}
              >
                Buat ulang kode
              </Button>
            </div>
          )}
        </div>

        {/* Consolidated 1-Line Meta */}
        <p className="type-label leading-5 text-ink-600 tabular-nums">
          Masa berlaku {periodStats.startText} – {periodStats.endText} · Rotasi otomatis tiap 2
          bulan · Dipakai {referral?.usedCount ?? 0} pendaftar periode ini
        </p>
      </div>

      {/* History Table */}
      <section className="space-y-4">
        <h2 className="type-app-h2 text-ink-900">Riwayat Kode Referal</h2>
        {history.length > 0 ? (
          <div className="overflow-x-auto rounded-lg bg-white border border-cream-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-100 type-label font-medium text-ink-600">
                  <th className="px-5 py-3">Periode</th>
                  <th className="px-5 py-3">Kode</th>
                  <th className="px-5 py-3">Pemakaian</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200 type-small">
                {history.map((item) => (
                  <tr key={item.id} className="h-14">
                    <td className="px-5 py-3 font-medium text-ink-900 tabular-nums">
                      {item.periodLabel}
                    </td>
                    <td className="px-5 py-3 font-sans font-medium text-ink-900 tabular-nums">
                      {maskReferralCode(item.code)}
                    </td>
                    <td className="px-5 py-3 text-ink-600 tabular-nums">
                      {item.usedCount} pendaftar
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={item.endedReason === 'regenerated' ? 'danger' : 'neutral'}>
                        {item.endedReason === 'regenerated' ? 'Dibuat ulang' : 'Rotasi otomatis'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<CalendarClock className="h-6 w-6" />}
            title="Belum ada riwayat rotasi"
            description="Kode referal lama akan tercatat di sini saat sistem melakukan rotasi 2-bulanan atau ketika admin membuat ulang kode."
          />
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleRegenerate}
        loading={regenerating}
        title="Buat ulang kode referal sekarang?"
        description="Kode yang sedang aktif akan langsung tidak berlaku dan dipindahkan ke riwayat."
        confirmLabel="Ya, buat ulang kode"
      />
    </div>
  );
}
