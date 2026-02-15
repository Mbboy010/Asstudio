'use client';
import React from 'react';
import { 
  Info, 
  Tag, 
  Folder, 
  Calendar, 
  Maximize, 
  Star, 
  ArrowRight 
} from 'lucide-react';
import { ExtendedProduct } from './ProductDetailContent';

export const DescriptionSection = ({ product }: { product: ExtendedProduct }) => {
  const detailItems = [
    { label: 'Price', value: product.price === 0 ? 'Free' : `₦${product.price.toLocaleString()}`, icon: Tag },
    { label: 'Category', value: product.category, icon: Folder },
    { label: 'Date', value: product.uploadDate, icon: Calendar },
    { label: 'Size', value: product.size, icon: Maximize },
    { label: 'Rating', value: `${product.rating || 5.0} / 5.0`, icon: Star },
  ];

  return (
    <div className="mb-20 grid grid-cols-1 lg:grid-cols-12 gap-16">
      {/* Sidebar Details - Sticky for better UX */}
      <div className="lg:col-span-4">
        <div className="sticky top-24 space-y-6">
          <div className="relative p-8 rounded-3xl bg-white dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 shadow-sm backdrop-blur-sm">
            {/* Accent Decoration */}
            <div className="absolute top-0 right-0 -mt-2 -mr-2 h-16 w-16 bg-rose-500/5 blur-3xl rounded-full" />
            
            <h4 className="flex items-center gap-2 font-bold text-xs uppercase tracking-[0.2em] mb-8 text-rose-600 dark:text-rose-400">
              <span className="h-1 w-4 bg-rose-500 rounded-full" />
              Product Specifications
            </h4>
            
            <div className="space-y-6">
              {detailItems.map((item, i) => (
                <div key={i} className="group flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 group-hover:text-rose-500 transition-colors">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-zinc-100 bg-gray-50 dark:bg-zinc-800/50 px-3 py-1 rounded-lg border border-transparent group-hover:border-rose-200 dark:group-hover:border-rose-900/30 transition-all">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Subtle CTA or Hint */}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800">
              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                Verified Listing • Secure Transaction
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Description Area */}
      <div className="lg:col-span-8"> 
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
            <Info className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight">About this {product.category}</h3>
            <p className="text-sm text-gray-400">Detailed product breakdown and features</p>
          </div>
        </div>
        
        <div className="relative">
          {/* Subtle gradient overlay to make text feel more "high-end" */}
          <div 
            className="prose prose-lg prose-rose dark:prose-invert max-w-none 
                       text-gray-600 dark:text-gray-400 leading-relaxed 
                       break-words selection:bg-rose-100 dark:selection:bg-rose-900/30
                       prose-headings:font-black prose-headings:tracking-tight
                       prose-a:text-rose-600 prose-strong:text-gray-900 dark:prose-strong:text-white
                       prose-img:rounded-3xl prose-img:shadow-2xl
                       prose-table:rounded-xl prose-table:overflow-hidden"
            dangerouslySetInnerHTML={{ __html: product.description || '' }} 
          />
        </div>

        {/* Tags or Footer section could go here */}
      </div>
    </div>
  );
};
