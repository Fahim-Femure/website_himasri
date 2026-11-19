export function nimToEmail(nim: string): string {
  return `${nim.trim()}@anggota.himasri.id`;
}

export function normalizeWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function normalizeReferralCode(code: string): string {
  return code.replace(/\s+/g, '').toUpperCase();
}
