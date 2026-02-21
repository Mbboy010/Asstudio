'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

// FIX: Changed return type from 'any' to 'React.ReactNode'
export default function AuthGuard({ children }: AuthGuardProps): React.ReactNode {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    const isAdminRoute = pathname?.startsWith('/mb/admin');
    const isUserProtectedRoute = pathname?.startsWith('/dashboard');
    const isAuthRoute = ['/login', '/signup', '/forgot-password'].includes(pathname || '');

    if (user && isAuthRoute) {
      router.replace('/dashboard');
      return;
    }

    if (!user && (isUserProtectedRoute || isAdminRoute)) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname || '/')}`);
      return;
    }

    if (user && isAdminRoute && !isAdmin) {
      router.replace('/shop');
      return;
    }

    setAuthorized(true);
  }, [user, loading, isAdmin, pathname, router]);

  if (loading || !authorized) return null;

  return children;
}
