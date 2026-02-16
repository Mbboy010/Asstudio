'use client';
import React from 'react';
import { Maximize2, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScreenshotsSectionProps {
  screenshots: string[];
  onSelect: (url: string) => void;
}

export const ScreenshotsSection = ({ screenshots, onSelect }: ScreenshotsSectionProps) => {
  if (!screenshots || screenshots.length === 0) return null;

  return (
    <div className="mb-24">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-900/20 rounded-xl text-rose-600">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              Visual Gallery
            </h3>
            <p className="text-sm text-gray-500 font-medium">Click to expand high-resolution previews</p>
          </div>
        </div>
        
        {/* Scroll Hint for Desktop */}
        <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <span>Scroll to explore</span>
          <div className="w-12 h-px bg-gray-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative group">
        <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar snap-x snap-mandatory px-2">
          {screenshots.map((shot, index) => (
            <motion.div 
              key={index}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(shot)}
              className="relative flex-shrink-0 h-[300px] md:h-[400px] aspect-[16/10] rounded-[2rem] overflow-hidden 
                         border border-gray-100 dark:border-zinc-800 shadow-xl shadow-gray-200/40 dark:shadow-none 
                         snap-center group/card cursor-pointer bg-gray-100 dark:bg-zinc-900"
            >
              {/* Image with subtle hover zoom */}
              <img 
                src={shot} 
                alt={`Product View ${index + 1}`} 
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-110" 
              />
              
              {/* Premium Overlay Layer */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover/card:opacity-100 transition-all duration-300 flex flex-col justify-end p-8">
                <div className="flex items-center justify-between transform translate-y-4 group-hover/card:translate-y-0 transition-transform duration-300">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl">
                    <span className="text-white text-xs font-bold tracking-widest uppercase">View Fullscreen</span>
                  </div>
                  <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-2xl scale-0 group-hover/card:scale-100 transition-transform duration-300 delay-75">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Minimalist Badge (Always Visible) */}
              <div className="absolute top-4 left-4 px-3 py-1 bg-black/20 backdrop-blur-md rounded-lg border border-white/10">
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-tighter">0{index + 1}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Edge Fades (Visual polish for scroll areas) */}
        <div className="absolute top-0 right-0 bottom-8 w-24 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};
