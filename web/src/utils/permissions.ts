import type { Role } from '@/types/models';

export type Permission =
  | 'public:view'
  | 'structure:view'
  | 'materials:view'
  | 'materials:edit'
  | 'aslab:view'
  | 'aslab:manage'
  | 'store:view'
  | 'hero:edit'
  | 'journey:edit'
  | 'content:edit'
  | 'faculties:edit'
  | 'products:edit'
  | 'referral:view'
  | 'referral:regenerate'
  | 'periods:edit'
  | 'users:manage'
  | 'audit:view';

export const ROLE_LABELS: Record<Role, string> = {
  anggota: 'Anggota',
  psdm: 'PSDM',
  minat_bakat: 'Minat & Bakat',
  akademik: 'Akademik & Keilmuan',
  kominfo: 'Kominfo & KWU',
  inti: 'Pengurus Inti',
  admin: 'Admin',
};

export const ROLE_FULL_LABELS: Record<Role, string> = {
  anggota: 'Anggota',
  psdm: 'Pemberdayaan Sumber Daya Manusia (PSDM)',
  minat_bakat: 'Minat & Bakat',
  akademik: 'Akademik & Keilmuan',
  kominfo: 'Kominfo & Kewirausahaan',
  inti: 'Ketua · Wakil · Sekretaris · Bendahara (Pengurus Inti)',
  admin: 'Admin',
};

export const ALL_ROLES: Role[] = [
  'anggota',
  'psdm',
  'minat_bakat',
  'akademik',
  'kominfo',
  'inti',
  'admin',
];

export const PERMISSIONS: Record<Role, readonly Permission[]> = {
  anggota: ['public:view', 'structure:view', 'materials:view', 'aslab:view', 'store:view'],
  psdm: ['public:view', 'structure:view', 'materials:view', 'aslab:view', 'store:view'],
  minat_bakat: ['public:view', 'structure:view', 'materials:view', 'aslab:view', 'store:view'],
  akademik: [
    'public:view',
    'structure:view',
    'materials:view',
    'materials:edit',
    'faculties:edit',
    'aslab:view',
    'store:view',
  ],
  kominfo: [
    'public:view',
    'structure:view',
    'materials:view',
    'aslab:view',
    'store:view',
    'hero:edit',
    'journey:edit',
    'content:edit',
    'products:edit',
  ],
  inti: [
    'public:view',
    'structure:view',
    'materials:view',
    'materials:edit',
    'faculties:edit',
    'aslab:view',
    'store:view',
    'hero:edit',
    'journey:edit',
    'content:edit',
    'products:edit',
    'referral:view',
    'periods:edit',
  ],
  admin: [
    'public:view',
    'structure:view',
    'materials:view',
    'materials:edit',
    'faculties:edit',
    'aslab:view',
    'aslab:manage',
    'store:view',
    'hero:edit',
    'journey:edit',
    'content:edit',
    'products:edit',
    'referral:view',
    'referral:regenerate',
    'periods:edit',
    'users:manage',
    'audit:view',
  ],
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) {
    return permission === 'public:view';
  }
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccessManageGroup(role: Role | null | undefined): boolean {
  return (
    can(role, 'hero:edit') ||
    can(role, 'journey:edit') ||
    can(role, 'content:edit') ||
    can(role, 'faculties:edit') ||
    can(role, 'aslab:manage') ||
    can(role, 'products:edit')
  );
}

export function canAccessAdminGroup(role: Role | null | undefined): boolean {
  return (
    can(role, 'referral:view') ||
    can(role, 'periods:edit') ||
    can(role, 'users:manage') ||
    can(role, 'audit:view')
  );
}
