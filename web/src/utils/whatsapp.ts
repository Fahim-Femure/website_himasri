import { normalizeWhatsapp } from './format';

export function buildWhatsappUrl(phone: string, text?: string): string {
  const normalized = normalizeWhatsapp(phone);
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  if (!normalized) {
    return `https://wa.me/${query}`;
  }
  return `https://wa.me/${normalized}${query}`;
}

export function buildWhatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
