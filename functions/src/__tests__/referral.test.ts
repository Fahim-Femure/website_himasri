import { describe, expect, it } from 'vitest';
import { nimToEmail, normalizeReferralCode, normalizeWhatsapp } from '../utils/nim';
import { generateReferralPayload, getBimonthlyWindow } from '../utils/referral';
import { registerMemberSchema } from '../utils/validation';

describe('Functions Utilities & Validation', () => {
  it('mengubah NIM menjadi email sintetis dengan benar', () => {
    expect(nimToEmail(' 202431001 ')).toBe('202431001@anggota.himasri.id');
  });

  it('menormalisasi nomor WhatsApp Indonesia ke format 62', () => {
    expect(normalizeWhatsapp('0812-3456-7890')).toBe('6281234567890');
    expect(normalizeWhatsapp('+62 812 3456 7890')).toBe('6281234567890');
    expect(normalizeWhatsapp('81234567890')).toBe('6281234567890');
  });

  it('menormalisasi kode referal tanpa spasi dan uppercase', () => {
    expect(normalizeReferralCode(' hms-nov26-7k4m ')).toBe('HMS-NOV26-7K4M');
  });

  it('menghitung jendela 2-bulanan dan format kode HMS-MMMYY-XXXX', () => {
    const novDate = new Date('2026-11-18T10:00:00+07:00');
    const win = getBimonthlyWindow(novDate);
    expect(win.codePrefix).toBe('HMS-NOV26');
    expect(win.periodLabel).toBe('Nov – Des 2026');

    const payload = generateReferralPayload(novDate);
    expect(payload.code).toMatch(/^HMS-NOV26-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
  });

  it('memvalidasi skema pendaftaran aslab bersyarat dengan benar', () => {
    const missingLab = registerMemberSchema.safeParse({
      nama: 'Budi Santoso',
      nim: '202431001',
      angkatan: 2024,
      jurusan: 'S1 Teknik Informatika',
      password: 'Password123',
      whatsapp: '081234567890',
      isAslab: true,
      fakultas: '',
      lab: '',
      referralCode: 'HMS-NOV26-7K4M',
    });
    expect(missingLab.success).toBe(false);

    const validNonAslab = registerMemberSchema.safeParse({
      nama: 'Budi Santoso',
      nim: '202431001',
      angkatan: 2024,
      jurusan: 'S1 Teknik Informatika',
      password: 'Password123',
      whatsapp: '081234567890',
      isAslab: false,
      referralCode: 'HMS-NOV26-7K4M',
    });
    expect(validNonAslab.success).toBe(true);
    if (validNonAslab.success) {
      expect(validNonAslab.data.whatsapp).toBe('6281234567890');
    }
  });
});
