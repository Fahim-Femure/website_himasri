export function formatRupiah(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  return `Rp${new Intl.NumberFormat('id-ID').format(safe)}`;
}

export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'object' && value !== null) {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof maybeTimestamp.toDate === 'function') {
      return maybeTimestamp.toDate();
    }
    const seconds = maybeTimestamp.seconds ?? maybeTimestamp._seconds;
    if (typeof seconds === 'number') {
      return new Date(seconds * 1000);
    }
  }
  return null;
}

export function formatDateId(value: unknown, withTime = false): string {
  const date = toDate(value);
  if (!date) return '—';
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  };
  if (withTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return new Intl.DateTimeFormat('id-ID', options).format(date);
}

export function normalizeWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function formatWhatsappDisplay(normalized: string): string {
  const digits = normalizeWhatsapp(normalized);
  if (!digits) return '—';
  if (digits.startsWith('62') && digits.length >= 10) {
    const local = `0${digits.slice(2)}`;
    return local.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3');
  }
  return digits;
}

export function isValidWhatsapp(raw: string): boolean {
  const normalized = normalizeWhatsapp(raw);
  return /^628\d{8,12}$/.test(normalized);
}

export function maskReferralCode(code: string): string {
  if (!code) return '—';
  const parts = code.split('-');
  if (parts.length >= 3) {
    return `${parts.slice(0, 2).join('-')}-••••`;
  }
  if (code.length <= 4) return '••••';
  return `${code.slice(0, code.length - 4)}••••`;
}

export function normalizePersonName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFirstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || fullName;
}
