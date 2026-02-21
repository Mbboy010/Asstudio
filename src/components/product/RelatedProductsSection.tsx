import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Product } from '@/types';

const RelatedProductCard = ({ item }: { item: Product }) => (
  <Link href={`/product/${item.id}`} className="flex-shrink-0 w-32 md:w-40 group">  
    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-900 mb-2 border border-gray-100 dark:border-zinc-800">  
      <img   
        src={item.image ?? ''}   
        alt={item.name}   
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"   
      />  
    </div>  
    <h4 className="text-xs font-bold truncate dark:text-white">{item.name}</h4>  
    <p className="text-[10px] text-rose-600 font-bold">
      {item.price === 0 ? 'Free' : `₦${item.price.toLocaleString()}`}
    </p>  
  </Link>  
);

export const RelatedProductsSection = ({ products }: { products: Product[] }) => {
  if (products.length === 0) return null;
  return (
    <div className="mb-12">
      <h3 className="text-xl font-black flex items-center gap-2 mb-6">
        You may also like <ChevronRight className="w-5 h-5 text-rose-600" />
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar touch-pan-x">
        {products.map(item => <RelatedProductCard key={item.id} item={item} />)}
      </div>
    </div>
  );
};
