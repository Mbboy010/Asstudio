'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('asstudio_cookie_consent');
    if (!consent) {
      // Small delay for better UX on initial load
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('asstudio_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('asstudio_cookie_consent', 'rejected');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 flex justify-center pointer-events-none"
        >
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 max-w-4xl w-full pointer-events-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            
            <div className="flex items-start gap-5">
              <div className="p-3.5 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-500 rounded-xl shrink-0">
                <Cookie className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">We use cookies</h3>
                <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-xl">
                  We use cookies to enhance your browsing experience, save your search preferences, and analyze our traffic. By clicking &quot;Accept&quot;, you consent to our use of cookies.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={handleReject}
                className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm"
              >
                Reject
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all text-sm whitespace-nowrap active:scale-95"
              >
                Accept All
              </button>
            </div>

            {/* Close Button */}
            <button 
                onClick={handleReject}
                className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
