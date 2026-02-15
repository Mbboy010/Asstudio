'use client';
import React from 'react';
import { Pause, Play, ShoppingCart, Share2, Check } from 'lucide-react';
import { ExtendedProduct } from './ProductDetailContent';
import { StarRating } from './ProductInfo';

interface ProductHeroProps {
  product: ExtendedProduct;
  reviewsCount: number;
  isPlaying: boolean;
  togglePlay: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  currentTime: number;
  duration: number;
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatTime: (time: number) => string;
  handleTimeUpdate: () => void;
  setIsPlaying: (playing: boolean) => void;
  handleShare: () => void;
  copied: boolean;
  isDownloading: boolean;
  handleDownload: (isDemo: boolean) => void;
  handleAddToCart: (product: ExtendedProduct) => void;

}

export const ProductHero = ({
  product, reviewsCount, isPlaying, togglePlay, audioRef,
  currentTime, duration, handleSeek, formatTime, handleTimeUpdate,
  setIsPlaying, handleShare, copied, isDownloading, handleDownload, handleAddToCart
}: ProductHeroProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
      <div className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 shadow-xl">
        <img src={product.image ?? ''} alt={product.name} className="w-full aspect-square object-cover" />
        {product.demoUrl && (
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-4 rounded-xl flex items-center gap-4 border border-gray-200 dark:border-zinc-800">
              <audio ref={audioRef} src={product.demoUrl} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} />
              <button onClick={togglePlay} className="w-12 h-12 bg-rose-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="ml-1 w-5 h-5 fill-current" />}
              </button>
              <div className="flex-1">
                <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="w-full h-1 bg-gray-200 accent-rose-600" />
                <div className="flex justify-between text-[10px] mt-1 text-gray-400"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center">
        <span className="px-3 py-1 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-500 font-bold text-xs rounded-full uppercase w-fit mb-4">{product.category}</span>
        <h1 className="text-4xl md:text-6xl font-black mb-4">{product.name}</h1>
        <div className="flex items-center justify-between mb-8 pb-8 border-b dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <StarRating rating={product.rating || 5} />
            <span className="text-gray-500 text-sm">{reviewsCount} reviews</span>
          </div>
          <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800">
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5" />}
          </button>
        </div>
        <div className="text-4xl font-bold mb-8">{product.price === 0 ? "FREE" : `₦${product.price.toLocaleString()}`}</div>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {product.price === 0 ? (
            <button onClick={() => handleDownload(false)} disabled={isDownloading} className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-xl">{isDownloading ? "..." : "Download Now"}</button>
          ) : (
            <>
              <button onClick={() => handleAddToCart(product)} className="flex-[2] py-4 bg-rose-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"><ShoppingCart className="w-5 h-5" /> Add To Cart</button>
              {product.demoUrl && (
                <button onClick={() => handleDownload(true)} className="flex-1 py-4 bg-white dark:bg-zinc-900 border dark:border-zinc-700 font-bold rounded-xl">Demo</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
