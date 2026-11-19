import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button } from './Button';
import { formatWhatsappDisplay } from '@/utils/format';
import { buildWhatsappUrl } from '@/utils/whatsapp';

interface ContactCardProps {
  roleLabel: string;
  nama: string;
  jurusan: string;
  whatsapp: string;
  message: string;
  photoUrl?: string;
}

export function ContactCard({
  roleLabel,
  nama,
  jurusan,
  whatsapp,
  message,
  photoUrl,
}: ContactCardProps) {
  const href = buildWhatsappUrl(whatsapp, message);

  return (
    <div className="rounded-xl bg-cream-50 border border-cream-200 p-6 shadow-card flex flex-col justify-between gap-5 h-full text-ink-900">
      <div className="flex-1 flex items-start gap-4 w-full">
        <Avatar name={nama} photoURL={photoUrl} size="L" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <Badge variant="maroon">{roleLabel}</Badge>
          <h3 className="mt-2 type-body-lg leading-7 font-bold text-ink-900 break-words">
            {nama}
          </h3>
          <p className="mt-0.5 type-small leading-5 text-ink-600">{jurusan}</p>
        </div>
      </div>

      <div className="shrink-0 w-full pt-4 border-t border-cream-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="type-caption leading-4 text-ink-600">WhatsApp</p>
          <p className="type-app-body leading-6 font-semibold text-ink-900 tabular-nums">
            {formatWhatsappDisplay(whatsapp)}
          </p>
        </div>

        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block shrink-0">
          <Button variant="whatsapp" pill size="sm">
            Chat WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
}
