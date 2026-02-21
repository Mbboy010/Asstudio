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
    // 1. Wait until Firebase Auth has finished determining the user's state
    if (loading) return;

    // 2. Define your route categories based on the URL path
    const isAdminRoute = pathname?.startsWith('/mb/admin');
    const isUserProtectedRoute = pathname?.startsWith('/dashboard');
    const isAuthRoute = ['/login', '/signup', '/forgot-password'].includes(pathname || '');

    // 3. Rule: Logged-in users should not access Auth pages (login, signup, etc.)
    if (isAuthRoute && user) {
      router.push('/dashboard');
      return;
    }

    // 4. Rule: Guests cannot access protected user routes or admin routes
    if ((isUserProtectedRoute || isAdminRoute) && !user) {
      router.push(`/login?returnUrl=${encodeURIComponent(pathname || '/')}`);
      return;
    }

    // 5. Rule: Regular logged-in users cannot access the admin panel
    if (isAdminRoute && user && !isAdmin) {
      router.push('/shop'); // Or send them to '/dashboard'
      return;
    }

    // 6. If no redirect rules were triggered, authorize the render
    setAuthorized(true);
  }, [pathname, user, loading, isAdmin, router]);

  // Render absolutely nothing (null) while loading or if unauthorized 
  // This completely eliminates UI flickering and ensures strictly NO JSX is output
  if (loading || !authorized) {
    return null;
  }

  // Render the page's actual content once authorized
  return children;
}
