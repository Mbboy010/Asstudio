import React from 'react';
import { Info } from 'lucide-react';
import { ExtendedProduct } from './ProductDetailContent';

export const DescriptionSection = ({ product }: { product: ExtendedProduct }) => {
  return (
    <div className="mb-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-4 space-y-6">
        <div className="p-6 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
          <h4 className="font-black text-sm uppercase tracking-wider mb-4 text-gray-400">Details</h4>
          <div className="space-y-3">
            {[
              { label: 'Price', value: product.price === 0 ? 'Free' : `₦${product.price.toLocaleString()}` },
              { label: 'Category', value: product.category },
              { label: 'Date', value: product.uploadDate },
              { label: 'Size', value: product.size },
              { label: 'Rating', value: `${product.rating || 5.0} / 5.0` },
            ].map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-8">
        <div className="flex items-center gap-2 mb-6">
          <Info className="w-5 h-5 text-rose-600" />
          <h3 className="text-2xl font-black">About this {product.category}</h3>
        </div>
        <div 
          className="prose prose-rose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 leading-relaxed text-lg"
          dangerouslySetInnerHTML={{ __html: product.description || '' }} 
        />
      </div>
    </div>
  );
};
