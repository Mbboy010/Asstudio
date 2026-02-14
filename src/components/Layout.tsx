'use client';

import React, { useState, useEffect } from 'react';
// REMOVED: useSelector, useDispatch, RootState
import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. LOCAL UI STATE (Replacing Redux)
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Helper to toggle cart - you can pass this to Navbar
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  // Logic to clear error automatically after 5 seconds
  useEffect(() => {
    if (globalError) {
      const timer = setTimeout(() => setGlobalError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [globalError]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans">

      {/* Global Error Banner */}
      <AnimatePresence>
        {globalError && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-600 dark:bg-red-700 text-white relative z-[100] overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-bold">{globalError}</p>
              </div>
              <button 
                onClick={() => setGlobalError(null)} 
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. PASSING TOGGLE TO NAVBAR */}
      <Navbar />

      <main className="flex-grow">
        {children}
      </main>

      {/* 3. PASSING STATE TO DRAWER */}


      <Footer />
    </div>
  );
};
