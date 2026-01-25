import React from 'react';

export const SkeletonBase: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-zinc-800 rounded ${className}`} style={style}></div>
);

export const ProductSkeleton = () => (
  <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm p-4 h-[380px] flex flex-col gap-4">
    <SkeletonBase className="w-full h-48 rounded-lg" />
    <div className="flex flex-col gap-2">
      <SkeletonBase className="w-3/4 h-6" />
      <SkeletonBase className="w-1/2 h-4" />
    </div>
    <div className="mt-auto flex justify-between items-center">
      <SkeletonBase className="w-20 h-8" />
      <SkeletonBase className="w-10 h-10 rounded-full" />
    </div>
  </div>
);

export const TableSkeleton = () => (
  <div className="w-full space-y-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-zinc-800 rounded-lg">
        <SkeletonBase className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="w-1/3 h-4" />
          <SkeletonBase className="w-1/4 h-3" />
        </div>
        <SkeletonBase className="w-20 h-6" />
      </div>
    ))}
  </div>
);

export const ChartSkeleton = () => (
  <div className="w-full h-64 bg-gray-50 dark:bg-zinc-900/30 rounded-xl border border-gray-200 dark:border-zinc-800 flex items-end justify-between p-4 gap-2">
     {[1,2,3,4,5,6,7].map(i => (
        <SkeletonBase key={i} className={`w-full rounded-t-sm`} style={{ height: `${Math.random() * 80 + 20}%` }} />
     ))}
  </div>
);

export const HeroSkeleton = () => (
  <div className="min-h-screen bg-white dark:bg-black pt-20">
     <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
           <SkeletonBase className="w-40 h-8 rounded-full" />
           <div className="space-y-4">
              <SkeletonBase className="w-full h-20 rounded-xl" />
              <SkeletonBase className="w-3/4 h-20 rounded-xl" />
           </div>
           <SkeletonBase className="w-full h-24" />
           <div className="flex gap-4">
              <SkeletonBase className="w-40 h-14 rounded-lg" />
              <SkeletonBase className="w-40 h-14 rounded-lg" />
           </div>
        </div>
        <div className="hidden lg:block">
           <SkeletonBase className="w-full aspect-square rounded-3xl" />
        </div>
     </div>
  </div>
);

export const DetailSkeleton = () => (
  <div className="max-w-7xl mx-auto py-12 px-4">
     <SkeletonBase className="w-32 h-6 mb-8" />
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <SkeletonBase className="w-full aspect-square rounded-2xl" />
        <div className="space-y-8 flex flex-col justify-center">
           <div className="flex justify-between items-center">
              <SkeletonBase className="w-24 h-6" />
              <SkeletonBase className="w-32 h-6" />
           </div>
           <SkeletonBase className="w-3/4 h-16" />
           <div className="flex gap-4 items-center">
              <SkeletonBase className="w-32 h-6" />
              <SkeletonBase className="w-24 h-6" />
           </div>
           <SkeletonBase className="w-24 h-10" />
           <SkeletonBase className="w-full h-40" />
           <div className="flex gap-4">
              <SkeletonBase className="flex-1 h-16 rounded-lg" />
              <SkeletonBase className="flex-1 h-16 rounded-lg" />
           </div>
        </div>
     </div>
  </div>
);

export const DashboardSkeleton = () => (
   <div className="max-w-7xl mx-auto px-4 py-12">
      <SkeletonBase className="w-full h-64 rounded-2xl mb-12" />
      <div className="flex flex-col md:flex-row gap-8">
         <div className="w-full md:w-64 space-y-2">
            {[1,2,3,4,5].map(i => <SkeletonBase key={i} className="w-full h-12 rounded-xl" />)}
         </div>
         <div className="flex-1 space-y-6">
            <SkeletonBase className="w-48 h-10" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {[1,2,3,4].map(i => <SkeletonBase key={i} className="w-full h-40 rounded-xl" />)}
            </div>
         </div>
      </div>
   </div>
);

export const TextPageSkeleton = () => (
   <div className="max-w-4xl mx-auto py-16 px-4 space-y-12">
      <div className="text-center space-y-6">
         <SkeletonBase className="w-64 h-12 mx-auto" />
         <SkeletonBase className="w-96 h-6 mx-auto" />
      </div>
      <div className="space-y-6">
         {[1,2,3,4,5].map(i => <SkeletonBase key={i} className="w-full h-24 rounded-xl" />)}
      </div>
   </div>
);

export const FormSkeleton = () => (
   <div className="max-w-6xl mx-auto py-8 space-y-8">
      <SkeletonBase className="w-64 h-10" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <SkeletonBase className="w-full h-64 rounded-xl" />
            <div className="space-y-4">
               <SkeletonBase className="w-full h-12 rounded-lg" />
               <SkeletonBase className="w-full h-32 rounded-lg" />
            </div>
         </div>
         <div className="space-y-6">
            <SkeletonBase className="w-full aspect-square rounded-xl" />
            <SkeletonBase className="w-full h-64 rounded-xl" />
            <SkeletonBase className="w-full h-14 rounded-xl" />
         </div>
      </div>
   </div>
);