'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const trackVisit = async () => {
      try {
        // 1. Reconstruct full path URL if query params exist (e.g., /products?id=123)
        const currentParams = searchParams?.toString();
        const fullPath = currentParams ? `${pathname}?${currentParams}` : pathname;

        // 2. Ignore admin paths so you don't pollute your own analytics data
        if (pathname.startsWith('/mb/admin')) return;

        // 3. Gather local storage or context state for authenticated users if available
        // Replace these fallbacks with your actual Auth state/context if you use Firebase Auth
        const userName = localStorage.getItem('userName') || 'Guest';
        const userPhone = localStorage.getItem('userPhone') || 'N/A';
        const userId = localStorage.getItem('userId') || 'Anonymous';

        // 4. Send layout data to Firestore
        await addDoc(collection(db, "page_visits"), {
          path: fullPath,
          timestamp: new Date().toISOString(), // Kept string format to match your previous code
          createdAt: serverTimestamp(), // Added server timestamp for cleaner query sorting
          userName,
          userPhone,
          userId,
          location: 'Nigeria', // If using an IP location API, insert it dynamically here
          userAgent: window.navigator.userAgent,
        });
      } catch (error) {
        console.error("Failed to log real-time footprint:", error);
      }
    };

    trackVisit();
  }, [pathname, searchParams]); // Fires instantly whenever the path or query configuration changes

  return null; // This component runs silently; it renders nothing visually
}
