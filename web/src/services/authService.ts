import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '@/lib/firebase/client';
import { identifierToEmail } from '@/utils/nim';

export interface CheckReferralResponse {
  valid: boolean;
  validUntil?: string;
}

export interface RegisterMemberInput {
  nama: string;
  nim: string;
  angkatan: number;
  jurusan: string;
  password: string;
  whatsapp: string;
  isAslab: boolean;
  fakultas?: string | null;
  lab?: string | null;
  jadwalAslab?: string | null;
  requestedPosition?: string | null;
  referralCode: string;
}

export interface RegisterMemberResponse {
  uid: string;
  status: 'pending';
}

export async function loginWithNim(identifier: string, password: string, rememberMe: boolean) {
  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence,
  );
  return signInWithEmailAndPassword(auth, identifierToEmail(identifier), password);
}

export const loginWithIdentifier = loginWithNim;

export async function logoutAccount() {
  await signOut(auth);
}

export async function checkReferralCode(code: string): Promise<CheckReferralResponse> {
  const fn = httpsCallable<{ code: string }, CheckReferralResponse>(
    functions,
    'checkReferralCode',
  );
  const res = await fn({ code });
  return res.data;
}

export async function registerMember(
  payload: RegisterMemberInput,
): Promise<RegisterMemberResponse> {
  const fn = httpsCallable<RegisterMemberInput, RegisterMemberResponse>(
    functions,
    'registerMember',
  );
  const res = await fn(payload);
  return res.data;
}

export async function updateUserPhoto(photoURL: string | null): Promise<{ ok: boolean; photoURL: string | null }> {
  const fn = httpsCallable<{ photoURL: string | null }, { ok: boolean; photoURL: string | null }>(
    functions,
    'updateUserPhoto',
  );
  const res = await fn({ photoURL });
  return res.data;
}

export function mapFirebaseAuthError(error: unknown): string {
  const errObj = error as { code?: string; message?: string; details?: { reason?: string } };
  const code = errObj?.code || '';
  const reason = errObj?.details?.reason;

  if (reason === 'invalid-referral') {
    return 'Kode referal tidak valid atau sudah kedaluwarsa. Minta kode terbaru ke pengurus.';
  }
  if (reason === 'nim-exists') {
    return 'NIM sudah terdaftar. Silakan masuk atau hubungi admin.';
  }

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'NIM/username atau kata sandi salah.';
    case 'auth/user-disabled':
      return 'Akun dinonaktifkan. Hubungi admin HIMASRI.';
    case 'auth/too-many-requests':
    case 'functions/resource-exhausted':
      return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.';
    case 'functions/already-exists':
      return 'NIM sudah terdaftar. Silakan masuk atau hubungi admin.';
    case 'functions/invalid-argument':
      return errObj.message || 'Periksa kembali data yang Anda isi.';
    default:
      return errObj?.message || 'Terjadi kesalahan. Silakan coba lagi.';
  }
}
