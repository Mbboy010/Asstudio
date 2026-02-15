'use client';
import React from 'react';
import { 
  Info, Tag, Folder, Calendar, 
  Maximize, Star, ShieldCheck, Share2 
} from 'lucide-react';
import { ExtendedProduct } from './ProductDetailContent';

export const DescriptionSection = ({ product }: { product: ExtendedProduct }) => {
  const detailItems = [
    { label: 'Price', value: product.price === 0 ? 'Free' : `₦${product.price.toLocaleString()}`, icon: Tag, highlight: true },
    { label: 'Category', value: product.category, icon: Folder },
    { label: 'Updated', value: product.uploadDate, icon: Calendar },
    { label: 'Dimensions', value: product.size, icon: Maximize },
    { label: 'Rating', value: `${product.rating || 5.0} / 5.0`, icon: Star },
  ];

  return (
    <div className="mb-32 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
      {/* Sidebar Details - Expanded & Elevated */}
      <div className="lg:col-span-5 xl:col-span-4">
        <div className="sticky top-28">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-2xl shadow-gray-200/50 dark:shadow-none p-10">
            {/* Background Accent Glow */}
            <div className="absolute -top-24 -right-24 h-48 w-48 bg-rose-500/10 blur-[100px] rounded-full" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mb-2">Technical Specs</h4>
                  <p className="text-2xl font-bold tracking-tight">Product Details</p>
                </div>
                <button className="p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-400 hover:text-rose-600 transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-8">
                {detailItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-all duration-300 ${
                        item.highlight 
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 dark:shadow-none' 
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/30 group-hover:text-rose-600'
                      }`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-base font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
                    </div>
                    <span className={`text-base font-bold tracking-tight ${item.highlight ? 'text-rose-600 dark:text-rose-400 text-lg' : 'text-gray-900 dark:text-white'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Quality Assured</p>
                  <p className="text-[11px] text-emerald-600/80 dark:text-emerald-500/60 leading-tight">This product has been manually verified by our team.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Description - Large Typography */}
      <div className="lg:col-span-7 xl:col-span-8"> 
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 mb-8">
            <Info className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Overview</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-10 leading-[1.1]">
            Experience the <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-500">Full Potential</span> of this {product.category}
          </h2>
          
          <div className="relative">
            <div 
              className="prose prose-xl prose-rose dark:prose-invert max-w-none 
                         text-gray-600 dark:text-gray-400 leading-[1.8] 
                         break-words
                         prose-p:mb-8
                         prose-headings:font-black prose-headings:tracking-tighter
                         prose-strong:text-gray-900 dark:prose-strong:text-white
                         prose-img:rounded-[2rem] prose-img:shadow-2xl
                         prose-ul:list-none prose-ul:pl-0
                         prose-li:relative prose-li:pl-8 prose-li:before:content-[''] 
                         prose-li:before:absolute prose-li:before:left-0 prose-li:before:top-4
                         prose-li:before:h-1.5 prose-li:before:w-4 prose-li:before:bg-rose-500
                         prose-li:before:rounded-full"
              dangerouslySetInnerHTML={{ __html: product.description || '' }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
