import React from 'react';

interface UploadProgressProps {
  progress: number;
  fileName: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ progress, fileName }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3 shadow-sm">
      <div className="flex justify-between items-center text-sm">
        <span className="font-bold text-gray-900 dark:text-white truncate max-w-[250px]">{fileName}</span>
        <span className="font-mono font-bold text-rose-600">{progress}%</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
        <div 
          className="bg-rose-600 h-full transition-all duration-200 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};