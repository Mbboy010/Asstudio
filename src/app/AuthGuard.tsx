'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps): any {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    // 1. Identify where the user is trying to go
    const isAdminRoute = pathname?.startsWith('/mb/admin');
    const isUserProtectedRoute = pathname?.startsWith('/dashboard');
    const isAuthRoute = ['/login', '/signup', '/forgot-password'].includes(pathname || '');

    // 2. THE FIX: If logged in and trying to visit /signup, /login, etc.
    if (user && isAuthRoute) {
      router.replace('/dashboard'); // Use replace so they can't go "back" to signup
      return;
    }

    // 3. If guest and trying to visit protected pages
    if (!user && (isUserProtectedRoute || isAdminRoute)) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname || '/')}`);
      return;
    }

    // 4. If logged in but trying to visit admin without permission
    if (user && isAdminRoute && !isAdmin) {
      router.replace('/shop');
      return;
    }

    // 5. Otherwise, they are allowed to see the page
    setAuthorized(true);
  }, [user, loading, isAdmin, pathname, router]);

  // Return nothing while the logic is deciding where to send the user
  if (loading || !authorized) return null;

  return children;
}
