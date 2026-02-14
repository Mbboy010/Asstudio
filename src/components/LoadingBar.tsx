"use client"

import React from 'react';
import { motion } from 'framer-motion';

export const LoadingBar = () => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-black/95 backdrop-blur-md transition-colors duration-300">
      <div className="flex flex-col items-center gap-8">
        
        {/* Geometric Spinner */}
        <div className="relative w-24 h-24">
          
          {/* Track Ring (Subtle Background) */}
          <div className="absolute inset-0 border-4 border-gray-100 dark:border-zinc-800 rounded-full" />

          {/* Outer Ring (Primary Rose) */}
          <motion.div 
            className="absolute inset-0 border-4 border-t-rose-600 border-r-transparent border-b-transparent border-l-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, ease: "linear", repeat: Infinity }}
            style={{ filter: "drop-shadow(0 0 8px rgba(225, 29, 72, 0.4))" }}
          />
          
          {/* Middle Ring (Darker/Lighter Accent) */}
          <motion.div 
            className="absolute inset-3 border-4 border-b-rose-400 dark:border-b-rose-700 border-t-transparent border-l-transparent border-r-transparent rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
          />

          {/* Inner Ring (Core) */}
           <motion.div 
            className="absolute inset-6 border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
          />
          
          {/* Center Pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
             <motion.div
               animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.1, 0.8] }}
               transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
               className="w-2 h-2 bg-rose-600 rounded-full shadow-[0_0_10px_rgba(225,29,72,0.8)]"
             />
          </div>
        </div>

        {/* Text Interface */}
        <div className="flex flex-col items-center gap-3">
           <div className="flex items-center gap-2">
             <motion.span 
               className="w-1.5 h-1.5 bg-rose-600 rounded-full"
               animate={{ opacity: [0, 1, 0] }}
               transition={{ duration: 0.8, repeat: Infinity }}
             />
             <span className="font-bold text-xs tracking-[0.2em] text-gray-400 dark:text-gray-500 uppercase">
               Loading Studio
             </span>
           </div>
           
           {/* Progress Line */}
           <div className="h-0.5 w-32 bg-gray-100 dark:bg-zinc-800 overflow-hidden relative rounded-full">
              <motion.div 
                className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-rose-600 to-transparent opacity-80"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              />
           </div>
        </div>
      </div>
    </div>
  );
};
