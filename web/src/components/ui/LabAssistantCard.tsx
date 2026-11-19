import { Clock, FlaskConical } from 'lucide-react';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button, WhatsAppGlyph } from './Button';
import { formatWhatsappDisplay, getFirstName } from '@/utils/format';
import { buildWhatsappUrl } from '@/utils/whatsapp';
import type { MemberDoc } from '@/types/models';

export function LabAssistantCard({ assistant }: { assistant: MemberDoc }) {
  const firstName = getFirstName(assistant.nama);
  const labName = assistant.lab || 'Laboratorium';
  const waText = `Halo Kak ${firstName}, saya ingin bertanya seputar praktikum di ${labName}.`;
  const waHref = assistant.whatsappAslab ? buildWhatsappUrl(assistant.whatsappAslab, waText) : '';

  return (
    <article className="overflow-hidden rounded-lg bg-white border border-cream-200 transition-colors hover:border-cream-300 flex flex-col justify-between">
      {/* Top 48px Solid Maroon Strip */}
      <div className="h-12 bg-maroon-900 px-4 flex items-center justify-end">
        <Badge variant="gold">
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{labName}</span>
        </Badge>
      </div>

      <div className="px-5 pb-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-3">
          {/* Overlapping 56px Avatar */}
          <div className="-mt-7 flex items-end gap-3">
            <Avatar
              name={assistant.nama}
              photoURL={assistant.photoURL}
              size="L"
              className="!h-14 !w-14 !text-base ring-[3px] ring-cream-50 shrink-0"
            />
          </div>

          <div>
            <h3 className="type-body leading-6 font-bold text-ink-900 break-words">
              {assistant.nama}
            </h3>
            <p className="type-label leading-5 text-ink-600 tabular-nums">
              {assistant.jurusan} · {assistant.angkatan}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {assistant.fakultas && (
              <Badge variant="neutral" className="!whitespace-normal text-left">
                {assistant.fakultas}
              </Badge>
            )}
            {assistant.jadwalAslab && (
              <span className="inline-flex items-center gap-1.5 type-label leading-5 text-ink-600">
                <Clock className="h-4 w-4 shrink-0 text-maroon-500" aria-hidden="true" />
                <span>Jadwal: {assistant.jadwalAslab}</span>
              </span>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-cream-200 flex items-center justify-between gap-3">
          <div>
            <p className="type-caption leading-4 text-ink-600">Kontak Aslab</p>
            <p className="type-label leading-5 font-semibold text-ink-900 tabular-nums">
              {assistant.whatsappAslab ? formatWhatsappDisplay(assistant.whatsappAslab) : '—'}
            </p>
          </div>

          {waHref ? (
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<WhatsAppGlyph className="h-4 w-4 text-whatsapp-600" />}
              >
                Tanya Kakak
              </Button>
            </a>
          ) : (
            <Button variant="secondary" size="sm" disabled>
              Kontak belum ada
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
