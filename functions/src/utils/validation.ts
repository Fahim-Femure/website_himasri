import { z } from 'zod';
import { normalizeWhatsapp } from './nim';

export const roleSchema = z.enum([
  'anggota',
  'psdm',
  'minat_bakat',
  'akademik',
  'kominfo',
  'inti',
  'admin',
]);

export const registerMemberSchema = z
  .object({
    nama: z
      .string()
      .trim()
      .min(3, 'Nama lengkap minimal 3 karakter.')
      .max(80, 'Nama lengkap maksimal 80 karakter.'),
    nim: z
      .string()
      .trim()
      .regex(/^\d{9,12}$/, 'NIM harus terdiri dari 9–12 digit angka.'),
    angkatan: z.coerce
      .number()
      .int()
      .min(2015, 'Angkatan tidak valid.')
      .max(2035, 'Angkatan tidak valid.'),
    jurusan: z.string().trim().min(2, 'Jurusan wajib dipilih.'),
    password: z
      .string()
      .min(8, 'Kata sandi minimal 8 karakter.')
      .regex(/[A-Za-z]/, 'Kata sandi harus mengandung huruf.')
      .regex(/\d/, 'Kata sandi harus mengandung angka.'),
    whatsapp: z
      .string()
      .trim()
      .transform((val) => normalizeWhatsapp(val))
      .refine((val) => /^628\d{8,12}$/.test(val), {
        message: 'Nomor WhatsApp Indonesia tidak valid (contoh: 081234567890).',
      }),
    isAslab: z.boolean(),
    fakultas: z.string().trim().nullable().optional(),
    lab: z.string().trim().nullable().optional(),
    jadwalAslab: z.string().trim().max(120).nullable().optional(),
    requestedPosition: z.string().trim().max(80).nullable().optional(),
    referralCode: z.string().trim().min(4, 'Kode referal wajib diisi.'),
  })
  .superRefine((data, ctx) => {
    if (data.isAslab) {
      if (!data.fakultas || data.fakultas.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fakultas'],
          message: 'Fakultas wajib dipilih untuk asisten laboratorium.',
        });
      }
      if (!data.lab || data.lab.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lab'],
          message: 'Laboratorium wajib dipilih untuk asisten laboratorium.',
        });
      }
    }
  });
