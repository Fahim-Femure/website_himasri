import crypto from 'node:crypto';

const REFERRAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

interface BimonthlyMeta {
  codePrefix: string;
  periodLabel: string;
  validFrom: Date;
  validUntil: Date;
}

const MONTH_WINDOWS: Array<{ startCode: string; labelPair: string }> = [
  { startCode: 'JAN', labelPair: 'Jan – Feb' },
  { startCode: 'MAR', labelPair: 'Mar – Apr' },
  { startCode: 'MEI', labelPair: 'Mei – Jun' },
  { startCode: 'JUL', labelPair: 'Jul – Agu' },
  { startCode: 'SEP', labelPair: 'Sep – Okt' },
  { startCode: 'NOV', labelPair: 'Nov – Des' },
];

export function getJakartaDateParts(date: Date): { year: number; month: number; day: number } {
  const jakarta = new Date(date.getTime() + JAKARTA_OFFSET_MS);
  return {
    year: jakarta.getUTCFullYear(),
    month: jakarta.getUTCMonth() + 1,
    day: jakarta.getUTCDate(),
  };
}

export function getBimonthlyWindow(referenceDate = new Date()): BimonthlyMeta {
  const { year, month } = getJakartaDateParts(referenceDate);
  const windowIndex = Math.floor((month - 1) / 2); // 0..5
  const startMonth = windowIndex * 2 + 1; // 1, 3, 5, 7, 9, 11
  const endMonth = startMonth + 1; // 2, 4, 6, 8, 10, 12

  const lastDayOfEndMonth = new Date(Date.UTC(year, endMonth, 0)).getUTCDate();

  // Convert 00:00:00 WIB on 1st of startMonth -> UTC
  const validFrom = new Date(Date.UTC(year, startMonth - 1, 1, 0, 0, 0) - JAKARTA_OFFSET_MS);
  // Convert 23:59:59 WIB on lastDay of endMonth -> UTC
  const validUntil = new Date(
    Date.UTC(year, endMonth - 1, lastDayOfEndMonth, 23, 59, 59, 999) - JAKARTA_OFFSET_MS,
  );

  const meta = MONTH_WINDOWS[windowIndex];
  const yy = String(year).slice(-2);

  return {
    codePrefix: `HMS-${meta.startCode}${yy}`,
    periodLabel: `${meta.labelPair} ${year}`,
    validFrom,
    validUntil,
  };
}

export function generateRandomCodeSuffix(length = 4): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += REFERRAL_ALPHABET[crypto.randomInt(0, REFERRAL_ALPHABET.length)];
  }
  return out;
}

export function generateReferralPayload(referenceDate = new Date()) {
  const windowMeta = getBimonthlyWindow(referenceDate);
  const suffix = generateRandomCodeSuffix(4);
  return {
    code: `${windowMeta.codePrefix}-${suffix}`,
    periodLabel: windowMeta.periodLabel,
    validFrom: windowMeta.validFrom,
    validUntil: windowMeta.validUntil,
  };
}

export function generateTempPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[crypto.randomInt(0, chars.length)];
  }
  return out;
}
