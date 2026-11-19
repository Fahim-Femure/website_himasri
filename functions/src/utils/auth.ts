import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

export type Role =
  | 'anggota'
  | 'psdm'
  | 'minat_bakat'
  | 'akademik'
  | 'kominfo'
  | 'inti'
  | 'admin';

export const ALL_ROLES: readonly Role[] = [
  'anggota',
  'psdm',
  'minat_bakat',
  'akademik',
  'kominfo',
  'inti',
  'admin',
];

export function assertActiveRole(request: CallableRequest, allowedRoles: readonly Role[]) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Anda harus masuk terlebih dahulu.');
  }
  const token = request.auth.token;
  if (token.status !== 'active') {
    throw new HttpsError('permission-denied', 'Akun Anda belum aktif.');
  }
  const role = token.role as Role | undefined;
  if (!role || !allowedRoles.includes(role)) {
    throw new HttpsError('permission-denied', 'Anda tidak memiliki izin untuk aksi ini.');
  }
  return { uid: request.auth.uid, role };
}
