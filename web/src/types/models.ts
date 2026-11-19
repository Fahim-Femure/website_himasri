export type Role =
  | 'anggota'
  | 'psdm'
  | 'minat_bakat'
  | 'akademik'
  | 'kominfo'
  | 'inti'
  | 'admin';

export type UserStatus = 'pending' | 'active' | 'rejected' | 'disabled';

export type UnitStripColor = 'maroon-700' | 'gold-400' | 'maroon-500' | 'gold-300' | 'maroon-950';

export interface UserDoc {
  uid: string;
  nama: string;
  nim: string;
  angkatan: number;
  jurusan: string;
  whatsapp: string;
  isAslab: boolean;
  fakultas: string | null;
  lab: string | null;
  jadwalAslab: string | null;
  requestedPosition: string | null;
  photoURL?: string | null;
  role: Role;
  status: UserStatus;
  activePeriods: string[];
  referralCodeId: string;
  rejectReason?: string | null;
  claimsUpdatedAt?: unknown;
  createdAt?: unknown;
  approvedAt?: unknown;
  approvedBy?: string | null;
  isSample?: boolean;
}

export interface MemberDoc {
  uid: string;
  nama: string;
  jurusan: string;
  angkatan: number;
  isAslab: boolean;
  fakultas: string | null;
  lab: string | null;
  jadwalAslab: string | null;
  whatsappAslab?: string | null;
  role: Role;
  activePeriods: string[];
  photoURL?: string | null;
  searchName: string;
  isSample?: boolean;
}

export interface IntiOfficer {
  position: string;
  nama: string;
  jurusan: string;
  uid?: string;
  photoUrl?: string;
  photoPath?: string;
}

export interface UnitHead {
  kind: 'DEPARTEMEN' | 'BIRO';
  unit: string;
  jabatan: string;
  nama: string;
  jurusan: string;
  color: UnitStripColor;
  photoUrl?: string;
  photoPath?: string;
  leaderPhotoUrl?: string;
  leaderPhotoPath?: string;
}

export interface PeriodDoc {
  id: string;
  label: string;
  isCurrent: boolean;
  startYear: number;
  inti: IntiOfficer[];
  heads: UnitHead[];
  groupPhotoUrl?: string;
  groupPhotoPath?: string;
  updatedAt?: unknown;
}

export interface UnitLeader {
  jabatan: string;
  nama: string;
  jurusan: string;
  uid?: string;
  photoUrl?: string;
  photoPath?: string;
}

export interface UnitMember {
  nama: string;
  jurusan: string;
  uid?: string;
  photoUrl?: string;
  photoPath?: string;
}

export interface UnitDoc {
  id: string;
  kind: 'DEPARTEMEN' | 'BIRO';
  name: string;
  color: UnitStripColor;
  order: number;
  photoUrl?: string;
  photoPath?: string;
  leaders: UnitLeader[];
  members: UnitMember[];
}

export interface PublicSettings {
  kahimWhatsapp: string;
  wakahimWhatsapp: string;
  adminWhatsapp: string;
  email: string;
  instagram: string;
  alamat: string;
  isSample?: boolean;
}

export interface HeroSettings {
  durationSec: 4 | 5 | 7;
  transition: 'fade' | 'slide';
  autoplay: boolean;
  respectReducedMotion: boolean;
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  storagePath: string;
  caption: string;
  order: number;
  active: boolean;
  width: number;
  height: number;
  focalY?: number;
  uploadedBy?: string;
  createdAt?: unknown;
}

export interface JourneyItemDoc {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
  year: number;
  badge?: string;
  imageUrl: string;
  storagePath: string;
  order: number;
  active: boolean;
  highlight?: boolean;
  width?: number;
  height?: number;
  uploadedBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isSample?: boolean;
}

export interface ReferralDoc {
  code: string;
  periodLabel: string;
  validFrom: unknown;
  validUntil: unknown;
  usedCount: number;
  rotatedAt?: unknown;
  rotatedBy?: string;
}

export interface ReferralHistoryDoc {
  id: string;
  code: string;
  periodLabel: string;
  validFrom: unknown;
  validUntil: unknown;
  usedCount: number;
  endedReason: 'rotated' | 'regenerated';
}

export interface CourseDoc {
  id: string;
  jurusan: string;
  name: string;
  semester: number;
  materialCount: number;
  createdBy?: string;
  createdAt?: unknown;
  isSample?: boolean;
}

export interface MaterialDoc {
  id: string;
  courseId: string;
  jurusan: string;
  semester: number;
  title: string;
  type: 'file' | 'link';
  fileUrl?: string;
  storagePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  linkUrl?: string;
  description?: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface EventDoc {
  id: string;
  name: string;
  contactWhatsapp: string;
  active: boolean;
  order: number;
  isSample?: boolean;
}

export interface ProductDoc {
  id: string;
  eventId: string;
  eventName: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  storagePath?: string;
  description?: string;
  status: 'published' | 'draft';
  createdBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isSample?: boolean;
}

export interface HomeContentDoc {
  hero: {
    badgeDesktop: string;
    badgeMobile: string;
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  about: {
    title: string;
    statement: string;
    leftLead: string;
    paragraph: string;
    pillars: Array<{
      id: string;
      title: string;
      description: string;
      variant: 'maroon' | 'gold' | 'creamGold';
    }>;
  };
  culture: {
    title: string;
    description: string;
    items: Array<{
      id: string;
      icon: 'songket' | 'utensils' | 'ampera' | 'landmark' | 'music' | 'waves';
      category: string;
      title: string;
      description: string;
      surface?: 'white' | 'cream';
      imageUrl?: string;
      storagePath?: string;
      imageCredit?: string;
    }>;
  };
  bph: {
    title: string;
    description: string;
    lockNotice: string;
  };
  contact: {
    title: string;
    description: string;
    defaultWhatsappMessage: string;
  };
  ctaBand: {
    title: string;
    description: string;
  };
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface AgendaDoc {
  id: string;
  title: string;
  tag: string;
  dateLabel?: string;
  description: string;
  imageUrl?: string;
  highlight: boolean;
  order: number;
  periodId: string;
  active: boolean;
  updatedAt?: unknown;
}

export interface FacultyDoc {
  id: string;
  name: string;
  labs: string[];
  order: number;
  updatedAt?: unknown;
}

export interface AuditLogDoc {
  id: string;
  actorUid: string;
  actorName?: string;
  action: string;
  target: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  createdAt?: unknown;
}
