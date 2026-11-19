import { ExternalLink, FileText, Link2, Pencil, Trash2 } from 'lucide-react';
import { Badge } from './Badge';
import { Button } from './Button';
import { formatDateId, formatFileSize } from '@/utils/format';
import type { MaterialDoc } from '@/types/models';

interface MateriRowProps {
  material: MaterialDoc;
  mode: 'viewer' | 'editor';
  onEdit?: (material: MaterialDoc) => void;
  onDelete?: (material: MaterialDoc) => void;
}

function getFileTypeBadge(material: MaterialDoc): string {
  if (material.type === 'link') return 'Tautan';
  const name = material.fileName?.toLowerCase() ?? '';
  if (name.endsWith('.pdf') || material.mimeType === 'application/pdf') return 'PDF';
  if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'PPT';
  if (name.endsWith('.doc') || name.endsWith('.docx')) return 'DOCX';
  return 'Berkas';
}

export function MateriRow({ material, mode, onEdit, onDelete }: MateriRowProps) {
  const targetUrl = material.type === 'link' ? material.linkUrl : material.fileUrl;
  const typeLabel = getFileTypeBadge(material);

  return (
    <div className="rounded-lg bg-white border border-cream-200 p-4 shadow-card hover:shadow-lift transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span className="mt-0.5 text-ink-600 shrink-0" aria-hidden="true">
          {material.type === 'link' ? (
            <Link2 className="h-5 w-5" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="type-app-body leading-6 font-semibold text-ink-900 break-words">
              {material.title}
            </h4>
            <Badge variant="neutral">{typeLabel}</Badge>
          </div>
          {material.description && (
            <p className="mt-1 type-small leading-5 text-ink-600 line-clamp-2">
              {material.description}
            </p>
          )}
          <p className="mt-1 type-label leading-5 text-ink-600 tabular-nums">
            Diunggah oleh {material.uploadedByName} · {formatDateId(material.createdAt)}
            {material.type === 'file' && material.fileSize
              ? ` · ${formatFileSize(material.fileSize)}`
              : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {targetUrl && (
          <a href={targetUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm" rightIcon={<ExternalLink className="h-4 w-4" />}>
              Buka
            </Button>
          </a>
        )}
        {mode === 'editor' && (
          <>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Pencil className="h-4 w-4" />}
              onClick={() => onEdit?.(material)}
            >
              Ubah
            </Button>
            <Button
              variant="danger"
              size="sm"
              aria-label={`Hapus materi ${material.title}`}
              onClick={() => onDelete?.(material)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
