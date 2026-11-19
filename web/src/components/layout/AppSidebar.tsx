import { useEffect, useState } from 'react';
import {
  BookOpen,
  Building2,
  Calendar,
  CalendarCog,
  ChevronDown,
  ClipboardList,
  Compass,
  ExternalLink,
  FileText,
  FlaskConical,
  ImagePlus,
  KeyRound,
  LogOut,
  Network,
  Package,
  ShoppingBag,
  UserCog,
  X,
} from 'lucide-react';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { NavItem, SIDEBAR_ACTIVE_SPRING } from '@/components/ui/NavItem';
import { useAuth } from '@/contexts/AuthContext';
import { logoutAccount } from '@/services/authService';
import { subscribePendingUsersCount } from '@/services/cmsService';
import {
  can,
  canAccessAdminGroup,
  canAccessManageGroup,
  ROLE_LABELS,
} from '@/utils/permissions';

interface AppSidebarProps {
  onNavigate?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
  layoutGroupId?: string;
}

export function AppSidebar({
  onNavigate,
  showCloseButton = false,
  onClose,
  layoutGroupId = 'desktop-sidebar',
}: AppSidebarProps) {
  const { profile, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();
  const [pendingCount, setPendingCount] = useState(0);
  const [kelolaOpen, setKelolaOpen] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem('himasri_sidebar_kelola_open');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const toggleKelola = () => {
    setKelolaOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem('himasri_sidebar_kelola_open', String(next));
      } catch {
        // Ignore storage restrictions
      }
      return next;
    });
  };

  useEffect(() => {
    if (!can(role, 'users:manage')) {
      setPendingCount(0);
      return;
    }
    return subscribePendingUsersCount(setPendingCount);
  }, [role]);

  const handleLogout = async () => {
    await logoutAccount();
    navigate('/', { replace: true });
  };

  const displayName = profile?.nama || 'Anggota HIMASRI';
  const roleLabel = role ? ROLE_LABELS[role] : 'Anggota';

  return (
    <aside className="relative flex h-full w-64 flex-col bg-maroon-950 text-cream-50 select-none overflow-hidden border-r border-white/10">
      {/* Header Brand (single subtle brand gradient area) */}
      <div className="g-maroon px-5 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/anggota/struktur"
            onClick={onNavigate}
            className="flex items-center gap-3 min-h-[44px]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-50 p-1">
              <img
                src="/assets/images/logo-himasri.png"
                alt="Logo HIMASRI"
                className="h-7 w-7 object-contain"
              />
            </div>
            <div>
              <p className="type-app-body font-bold text-cream-50 leading-tight">HIMASRI</p>
              <p className="type-caption leading-4 font-medium text-gold-300">Ruang Anggota</p>
            </div>
          </Link>

          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup sidebar"
              className="flex h-11 w-11 items-center justify-center rounded-md text-cream-100/80 hover:bg-white/10 hover:text-cream-50"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Groups */}
      <nav
        aria-label="Menu ruang anggota"
        className="relative z-10 scrollbar-dark flex-1 overflow-y-auto px-3 py-4"
      >
        <LayoutGroup id={layoutGroupId}>
        <div className="space-y-1">
          <p className="px-3 pb-1 type-caption leading-4 font-semibold uppercase tracking-[0.06em] text-maroon-300">
            Jelajahi
          </p>
          <NavItem
            to="/anggota/struktur"
            label="Struktur & Anggota"
            icon={<Network />}
            active={location.pathname.startsWith('/anggota/struktur')}
            onClick={onNavigate}
          />
          <NavItem
            to="/anggota/materi"
            label="Materi Kuliah"
            icon={<BookOpen />}
            active={location.pathname.startsWith('/anggota/materi')}
            onClick={onNavigate}
          />
          <NavItem
            to="/anggota/asisten-lab"
            label="Asisten Lab"
            icon={<FlaskConical />}
            active={location.pathname.startsWith('/anggota/asisten-lab')}
            onClick={onNavigate}
          />
          <NavItem
            to="/anggota/toko"
            label="Toko HIMASRI"
            icon={<ShoppingBag />}
            active={location.pathname.startsWith('/anggota/toko')}
            onClick={onNavigate}
          />
        </div>

        {canAccessManageGroup(role) && (
          <div className="mt-6 space-y-1">
            {(() => {
              const kelolaCollapsedActive = !kelolaOpen && location.pathname.startsWith('/kelola/');
              return (
                <button
                  type="button"
                  onClick={toggleKelola}
                  aria-expanded={kelolaOpen}
                  className={[
                    'relative flex w-full items-center justify-between rounded-md px-3 py-1.5 type-caption leading-4 font-semibold uppercase tracking-[0.06em] transition-colors duration-150 cursor-pointer',
                    kelolaCollapsedActive
                      ? 'text-white'
                      : 'text-maroon-300 hover:text-cream-50',
                  ].join(' ')}
                >
                  {kelolaCollapsedActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      aria-hidden="true"
                      transition={prefersReduced ? { duration: 0 } : SIDEBAR_ACTIVE_SPRING}
                      className="pointer-events-none absolute inset-0 rounded-md bg-white/10"
                    >
                      <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r bg-gold-400" />
                    </motion.span>
                  )}
                  <span className="relative z-10">Kelola</span>
                  <ChevronDown
                    className={[
                      'relative z-10 h-3.5 w-3.5 transition-transform duration-150',
                      kelolaOpen ? 'rotate-0' : '-rotate-90',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                </button>
              );
            })()}
            {kelolaOpen && (
              <div className="space-y-1">
            {can(role, 'hero:edit') && (
              <NavItem
                to="/kelola/foto-beranda"
                label="Foto Beranda"
                icon={<ImagePlus />}
                active={location.pathname.startsWith('/kelola/foto-beranda')}
                onClick={onNavigate}
              />
            )}
            {can(role, 'content:edit') && (
              <NavItem
                to="/kelola/konten-beranda"
                label="Konten Beranda"
                icon={<FileText />}
                active={location.pathname.startsWith('/kelola/konten-beranda')}
                onClick={onNavigate}
              />
            )}
            {can(role, 'content:edit') && (
              <NavItem
                to="/kelola/agenda"
                label="Agenda Tahunan"
                icon={<Calendar />}
                active={location.pathname.startsWith('/kelola/agenda')}
                onClick={onNavigate}
              />
            )}
            {can(role, 'journey:edit') && (
              <NavItem
                to="/kelola/journey"
                label="Journey HIMASRI"
                icon={<Compass />}
                active={location.pathname.startsWith('/kelola/journey')}
                onClick={onNavigate}
              />
            )}
            {can(role, 'products:edit') && (
              <NavItem
                to="/kelola/produk"
                label="Produk Event"
                icon={<Package />}
                active={location.pathname.startsWith('/kelola/produk')}
                onClick={onNavigate}
              />
            )}
            {can(role, 'faculties:edit') && (
              <NavItem
                to="/kelola/fakultas"
                label="Fakultas & Lab"
                icon={<Building2 />}
                active={location.pathname.startsWith('/kelola/fakultas')}
                onClick={onNavigate}
              />
            )}
            {can(role, 'aslab:manage') && (
              <NavItem
                to="/kelola/asisten-lab"
                label="Kelola Asisten Lab"
                icon={<FlaskConical />}
                active={location.pathname.startsWith('/kelola/asisten-lab')}
                onClick={onNavigate}
              />
            )}
              </div>
            )}
          </div>
        )}

        {canAccessAdminGroup(role) && (
          <div className="mt-6 space-y-1">
            <p className="px-3 pb-1 type-caption leading-4 font-semibold uppercase tracking-[0.06em] text-maroon-300">
              Admin
            </p>
            {can(role, 'referral:view') && (
              <NavItem
                to="/admin/kode-referal"
                label="Kode Referal"
                icon={<KeyRound />}
                active={location.pathname.startsWith('/admin/kode-referal')}
                onClick={onNavigate}
              />
            )}
            {can(role, 'users:manage') && (
              <NavItem
                to="/admin/pengguna"
                label="Pengguna & Hak Akses"
                icon={<UserCog />}
                active={location.pathname.startsWith('/admin/pengguna')}
                badgeCount={pendingCount}
                onClick={onNavigate}
              />
            )}
            {can(role, 'periods:edit') && (
              <NavItem
                to="/admin/periode"
                label="Periode & BPH"
                icon={<CalendarCog />}
                active={location.pathname.startsWith('/admin/periode')}
                onClick={onNavigate}
              />
            )}
            {can(role, 'audit:view') && (
              <NavItem
                to="/admin/log"
                label="Log Audit"
                icon={<ClipboardList />}
                active={location.pathname.startsWith('/admin/log')}
                onClick={onNavigate}
              />
            )}
          </div>
        )}
        </LayoutGroup>
      </nav>

      {/* Bottom Profile Row & Actions */}
      <div className="relative z-10 border-t border-white/10 p-3 space-y-1.5">
        <div className="flex items-center gap-2.5 rounded-lg bg-white/6 border border-white/10 px-2.5 py-2">
          <Avatar name={displayName} photoURL={profile?.photoURL} size="XS" />
          <div className="min-w-0 flex-1">
            <p className="type-small leading-5 font-semibold text-cream-50 truncate">
              {displayName}
            </p>
            <p className="type-label leading-4 text-cream-200/80 truncate">{roleLabel}</p>
          </div>
        </div>

        <Link
          to="/"
          onClick={onNavigate}
          className="flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 type-small font-medium text-cream-100/85 hover:bg-white/6 hover:text-cream-50"
        >
          <ExternalLink className="h-[18px] w-[18px] shrink-0 text-cream-200/80" aria-hidden="true" />
          <span>Lihat situs publik</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full min-h-[44px] items-center gap-3 rounded-md px-3 py-2 type-small font-medium text-gold-300 hover:bg-white/6 cursor-pointer"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
