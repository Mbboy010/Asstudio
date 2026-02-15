import React from 'react';
import { Maximize2 } from 'lucide-react';

interface ScreenshotsSectionProps {
  screenshots: string[];
  onSelect: (url: string) => void;
}

export const ScreenshotsSection = ({ screenshots, onSelect }: ScreenshotsSectionProps) => {
  return (
    <div className="mb-16">
      <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">Screenshots</h3>
      <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar ">
        {screenshots.map((shot, index) => (
          <div 
            key={index} 
            className="relative flex-shrink-0 h-64 md:h-80 aspect-video rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-lg transition-shadow snap-center group cursor-pointer" 
            
          >
            <img src={shot} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
