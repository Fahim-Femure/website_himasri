import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { FullScreenLoader } from '@/components/feedback/Skeleton';
import { AppLayout } from '@/layouts/AppLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import {
  RequireActiveMember,
  RequireGuest,
  RequirePendingMember,
  RequireRole,
} from '@/routes/guards';

const HomePage = lazy(() => import('@/pages/public/HomePage'));
const JourneyPage = lazy(() => import('@/pages/public/JourneyPage'));
const PublicStructurePage = lazy(() => import('@/pages/public/PublicStructurePage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const WaitingVerificationPage = lazy(() => import('@/pages/auth/WaitingVerificationPage'));
const StructurePage = lazy(() => import('@/pages/members/StructurePage'));
const MaterialsPage = lazy(() => import('@/pages/members/MaterialsPage'));
const LabAssistantsPage = lazy(() => import('@/pages/members/LabAssistantsPage'));
const StorePage = lazy(() => import('@/pages/members/StorePage'));
const ManageHeroPage = lazy(() => import('@/pages/manage/ManageHeroPage'));
const ManageHomeContentPage = lazy(() => import('@/pages/manage/ManageHomeContentPage'));
const ManageAgendaPage = lazy(() => import('@/pages/manage/ManageAgendaPage'));
const ManageFacultiesPage = lazy(() => import('@/pages/manage/ManageFacultiesPage'));
const ManageAslabPage = lazy(() => import('@/pages/manage/ManageAslabPage'));
const ManageJourneyPage = lazy(() => import('@/pages/manage/ManageJourneyPage'));
const ManageProductsPage = lazy(() => import('@/pages/manage/ManageProductsPage'));
const ReferralCodePage = lazy(() => import('@/pages/admin/ReferralCodePage'));
const UsersAccessPage = lazy(() => import('@/pages/admin/UsersAccessPage'));
const PeriodsBphPage = lazy(() => import('@/pages/admin/PeriodsBphPage'));
const AuditLogPage = lazy(() => import('@/pages/admin/AuditLogPage'));
const ForbiddenPage = lazy(() => import('@/pages/errors/ForbiddenPage'));
const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage'));
const UiShowcasePage = lazy(() => import('@/pages/dev/UiShowcasePage'));

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<FullScreenLoader />}>{node}</Suspense>;
}

const devRoutes = import.meta.env.DEV
  ? [
      {
        path: '/_dev/ui',
        element: withSuspense(<UiShowcasePage />),
      },
    ]
  : [];

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: withSuspense(<HomePage />) },
      { path: '/journey', element: withSuspense(<JourneyPage />) },
      { path: '/struktur', element: withSuspense(<PublicStructurePage />) },
      { path: '/403', element: withSuspense(<ForbiddenPage />) },
    ],
  },
  {
    element: <RequireGuest />,
    children: [
      { path: '/masuk', element: withSuspense(<LoginPage />) },
      { path: '/daftar', element: withSuspense(<RegisterPage />) },
    ],
  },
  {
    element: <RequirePendingMember />,
    children: [
      { path: '/daftar/menunggu', element: withSuspense(<WaitingVerificationPage />) },
    ],
  },
  {
    path: '/anggota',
    element: (
      <RequireActiveMember>
        <AppLayout />
      </RequireActiveMember>
    ),
    children: [
      { index: true, element: <Navigate to="/anggota/struktur" replace /> },
      { path: 'struktur', element: withSuspense(<StructurePage />) },
      { path: 'materi', element: withSuspense(<MaterialsPage />) },
      { path: 'asisten-lab', element: withSuspense(<LabAssistantsPage />) },
      { path: 'toko', element: withSuspense(<StorePage />) },
    ],
  },
  {
    path: '/kelola',
    element: (
      <RequireActiveMember>
        <AppLayout />
      </RequireActiveMember>
    ),
    children: [
      { index: true, element: <Navigate to="/kelola/foto-beranda" replace /> },
      {
        path: 'foto-beranda',
        element: (
          <RequireRole roles={['kominfo', 'inti', 'admin']}>
            {withSuspense(<ManageHeroPage />)}
          </RequireRole>
        ),
      },
      {
        path: 'konten-beranda',
        element: (
          <RequireRole roles={['kominfo', 'inti', 'admin']}>
            {withSuspense(<ManageHomeContentPage />)}
          </RequireRole>
        ),
      },
      {
        path: 'agenda',
        element: (
          <RequireRole roles={['kominfo', 'inti', 'admin']}>
            {withSuspense(<ManageAgendaPage />)}
          </RequireRole>
        ),
      },
      {
        path: 'fakultas',
        element: (
          <RequireRole roles={['akademik', 'inti', 'admin']}>
            {withSuspense(<ManageFacultiesPage />)}
          </RequireRole>
        ),
      },
      {
        path: 'asisten-lab',
        element: (
          <RequireRole roles={['admin']}>{withSuspense(<ManageAslabPage />)}</RequireRole>
        ),
      },
      {
        path: 'journey',
        element: (
          <RequireRole roles={['kominfo', 'inti', 'admin']}>
            {withSuspense(<ManageJourneyPage />)}
          </RequireRole>
        ),
      },
      {
        path: 'produk',
        element: (
          <RequireRole roles={['kominfo', 'inti', 'admin']}>
            {withSuspense(<ManageProductsPage />)}
          </RequireRole>
        ),
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireActiveMember>
        <AppLayout />
      </RequireActiveMember>
    ),
    children: [
      {
        path: 'journey',
        element: <Navigate to="/kelola/journey" replace />,
      },
      {
        path: 'kode-referal',
        element: (
          <RequireRole roles={['inti', 'admin']}>
            {withSuspense(<ReferralCodePage />)}
          </RequireRole>
        ),
      },
      {
        path: 'pengguna',
        element: (
          <RequireRole roles={['admin']}>{withSuspense(<UsersAccessPage />)}</RequireRole>
        ),
      },
      {
        path: 'periode',
        element: (
          <RequireRole roles={['inti', 'admin']}>
            {withSuspense(<PeriodsBphPage />)}
          </RequireRole>
        ),
      },
      {
        path: 'log',
        element: (
          <RequireRole roles={['admin']}>{withSuspense(<AuditLogPage />)}</RequireRole>
        ),
      },
    ],
  },
  ...devRoutes,
  {
    element: <PublicLayout />,
    children: [{ path: '*', element: withSuspense(<NotFoundPage />) }],
  },
]);
