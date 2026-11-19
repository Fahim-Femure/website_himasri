import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullScreenLoader } from '@/components/feedback/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types/models';

export function RequireGuest({ children }: { children?: ReactNode }) {
  const { user, status, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (user) {
    if (status === 'pending' || status === 'rejected') {
      return <Navigate to="/daftar/menunggu" replace />;
    }
    if (status === 'active') {
      return <Navigate to="/anggota/struktur" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}

export function RequirePendingMember({ children }: { children?: ReactNode }) {
  const { user, status, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/masuk" replace />;
  }

  if (status === 'active') {
    return <Navigate to="/anggota/struktur" replace />;
  }

  if (status === 'disabled') {
    return <Navigate to="/masuk" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export function RequireActiveMember({ children }: { children?: ReactNode }) {
  const { user, status, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/masuk" state={{ from: location.pathname }} replace />;
  }

  if (status === 'pending' || status === 'rejected') {
    return <Navigate to="/daftar/menunggu" replace />;
  }

  if (status !== 'active') {
    return <Navigate to="/masuk" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export function RequireRole({
  roles,
  children,
}: {
  roles: readonly Role[];
  children?: ReactNode;
}) {
  const { role, status, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (status !== 'active') {
    return <Navigate to="/masuk" replace />;
  }

  if (!role || !roles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
