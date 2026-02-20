'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Pause, Play, ShoppingCart, Share2, Check, 
  Tag, Download, ShieldCheck, Zap, Heart 
} from 'lucide-react'; 
import { ExtendedProduct } from './ProductDetailContent';
import { StarRating } from './ProductInfo';

// --- NEW FIREBASE IMPORTS ---
import { doc, setDoc, deleteDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface ProductHeroProps {
  product: ExtendedProduct;
  reviewsCount: number;
  isPlaying: boolean;
  togglePlay: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
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

  // Calculate progress percentage for the slider background
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // --- NEW STATE FOR AUTH & FAVORITES ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // 1. Check Auth & Load Initial Favorite Status
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser && product?.id) {
        // Check if this product is in the user's favorites subcollection
        const favRef = doc(db, 'users', fbUser.uid, 'favorites', product.id);
        const favSnap = await getDoc(favRef);
        if (favSnap.exists()) {
          setIsFavorite(true);
        }
      } else {
        setIsFavorite(false);
      }
    });
    return () => unsub();
  }, [product?.id]);

  // --- NEW ACTIONS ---

  // Handle Favorite Toggle
  const toggleFavorite = async () => {
    if (!user) {
      alert("Please log in to save this to your favorites.");
      return;
    }
    if (!product?.id) return;

    const favRef = doc(db, 'users', user.uid, 'favorites', product.id);
    
    try {
      if (isFavorite) {
        setIsFavorite(false);
        await deleteDoc(favRef); // Remove from favorites
      } else {
        setIsFavorite(true);
        await setDoc(favRef, {
          userId: user.uid,
          productId: product.id,
          savedAt: new Date().toISOString()
        }); // Save to favorites
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert UI state if database fails
      setIsFavorite(!isFavorite); 
    }
  };

  // Wrapper for Download to increment count
  const onDownloadClick = async (isDemo: boolean) => {
    handleDownload(isDemo); // Run your original prop function
    
    if (product?.id) {
      try {
        const productRef = doc(db, 'products', product.id);
        await updateDoc(productRef, { 
          downloads: increment(1) 
        });
      } catch (error) {
        console.error("Failed to increment download count:", error);
      }
    }
  };

  // Wrapper for Add to Cart to increment count
  const onAddToCartClick = async (prod: ExtendedProduct) => {
    handleAddToCart(prod); // Run your original prop function

    if (product?.id) {
      try {
        const productRef = doc(db, 'products', product.id);
        await updateDoc(productRef, { 
          cartAdds: increment(1) 
        });
      } catch (error) {
        console.error("Failed to increment cart count:", error);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-32 items-center">
      
      {/* --- Left: Immersive Media Area --- */}
      <div className="lg:col-span-6 relative group">
        <div className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-gray-100 dark:bg-zinc-900 shadow-2xl shadow-gray-200 dark:shadow-black/50 border border-gray-100 dark:border-zinc-800">
          
          {/* Main Image */}
          {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            // Instead of 'fill', we use CSS classes to cover the container
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isPlaying ? 'scale-105' : 'group-hover:scale-105'
            }`}
            loading="eager" // Use 'eager' for Hero images to prevent flickering
          />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-zinc-800 text-gray-300">
              <Zap className="w-20 h-20" />
            </div>
          )}

          {/* Overlay Gradient (for text readability if needed) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

          {/* Floating Audio Player Glass Card */}
          {product.demoUrl && (
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <div className="bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 p-5 rounded-3xl shadow-lg ring-1 ring-black/5 overflow-hidden relative">
                
                {/* Visualizer Animation (Decorative) */}
                {isPlaying && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1 h-full w-full opacity-10 justify-center items-center pointer-events-none">
                     {[...Array(12)].map((_, i) => (
                       <div key={i} className="w-2 bg-white rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }} />
                     ))}
                  </div>
                )}

                <div className="flex items-center gap-5 relative z-10">
                  {/* Play Button */}
                  <button 
                    onClick={togglePlay} 
                    className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center flex-shrink-0 hover:scale-110 active:scale-95 transition-all shadow-xl shadow-black/20"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 fill-current" />
                    ) : (
                      <Play className="ml-1 w-6 h-6 fill-current" />
                    )}
                  </button>

                  {/* Scrubber & Time */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-white/90 tracking-wide">
                      <span>{formatTime(currentTime)}</span>
                      <span className="opacity-70">PREVIEW</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    
                    <div className="relative h-2 w-full rounded-full bg-white/20 cursor-pointer group/slider">
                      {/* Interactive Range Input */}
                      <input 
                        type="range" 
                        min="0" 
                        max={duration || 0} 
                        value={currentTime} 
                        onChange={handleSeek} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                      />
                      {/* Visible Progress Bar */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-100 ease-linear pointer-events-none" 
                        style={{ width: `${progressPercent}%` }}
                      >
                        {/* Thumb Knob */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-md scale-0 group-hover/slider:scale-100 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hidden Audio Element */}
                <audio 
                  ref={audioRef} 
                  src={product.demoUrl} 
                  onTimeUpdate={handleTimeUpdate} 
                  onEnded={() => setIsPlaying(false)} 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Right: Product Info & Actions --- */}
      <div className="lg:col-span-6 flex flex-col justify-center relative">
        
        {/* Header Tags */}
        <div className="flex items-center gap-3 mb-6">
          <span className="px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px] tracking-[0.2em] uppercase rounded-lg">
            {product.category}
          </span>
          {product.rating && product.rating >= 4.5 && (
            <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] tracking-wider uppercase rounded-lg border border-amber-100 dark:border-amber-500/20">
              <StarRating rating={1} size="w-3 h-3" /> Top Rated
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tighter text-gray-900 dark:text-white leading-[0.9]">
          {product.name}
        </h1>
        
        {/* Meta Data Row */}
        <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex text-amber-400">
              <StarRating rating={product.rating || 5} />
            </div>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 underline decoration-gray-300 dark:decoration-zinc-700 underline-offset-4 cursor-pointer hover:text-rose-500 transition-colors">
              {reviewsCount} Customer Reviews
            </span>
          </div>
          
          <div className="h-4 w-px bg-gray-200 dark:bg-zinc-800 hidden sm:block" />
          
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Instant Delivery</span>
          </div>

          <div className="ml-auto">
             <button 
              onClick={handleShare} 
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" /> <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" /> Share
                </>
              )}
            </button>
          </div>
        </div>

        {/* Features Grid */}
        {product.features && product.features.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-10">
            {product.features.map((feature, index) => (
              <span 
                key={index} 
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 text-xs font-bold rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-zinc-700 transition-colors cursor-default"
              >
                <Tag className="w-3 h-3 text-rose-500" />
                {feature}
              </span>
            ))}
          </div>
        )}

        {/* Pricing & CTA Zone */}
        <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-zinc-800">
          <div className="flex items-end gap-2 mb-8">
            <div className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              {product.price === 0 ? 'Free' : `₦${product.price.toLocaleString()}`}
            </div>
            {product.price === 0 && (
               <span className="mb-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded">
                 Limited Time
               </span>
            )}
            {product.price > 0 && (
              <span className="text-gray-400 text-lg font-medium mb-1.5 line-through decoration-rose-500/50">
                 ₦{(product.price * 1.2).toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {product.price === 0 ? (
              /* --- FREE DOWNLOAD STATE --- */
              <div className="space-y-4">
                <button 
                  onClick={() => onDownloadClick(false)} // UPDATED HERE
                  disabled={isDownloading} 
                  className="group relative w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-lg rounded-2xl flex items-center justify-center gap-3 overflow-hidden transition-all hover:shadow-2xl hover:shadow-gray-900/20 dark:hover:shadow-white/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <Download className={`w-6 h-6 ${isDownloading ? 'animate-bounce' : ''}`} />
                  {isDownloading ? "Starting Download..." : "Download For Free"}
                </button>
                <p className="flex items-center justify-center gap-2 text-center text-xs text-gray-400 font-medium">
                  <ShieldCheck className="w-3 h-3" /> Secure direct download • No signup required
                </p>
              </div>
            ) : (
              /* --- PAID STATE --- */
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => onAddToCartClick(product)} // UPDATED HERE
                  className="flex-[2] py-5 bg-rose-600 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-3 hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-600/30 transition-all active:scale-[0.98]"
                >
                  <ShoppingCart className="w-5 h-5" /> 
                  Add To Cart
                </button>
                {product.demoUrl && (
                  <button 
                    onClick={() => onDownloadClick(true)} // UPDATED HERE
                    className="flex-1 py-5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 font-bold text-lg rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5 opacity-50" />
                    Demo
                  </button>
                )}
                {/* --- UPDATED FAVORITE BUTTON --- */}
                <button 
                  onClick={toggleFavorite}
                  className="p-5 rounded-2xl bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                >
                  <Heart className={`w-6 h-6 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom Trust Indicators */}
        <div className="mt-8 flex items-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
           {/* You can add payment icons here (Visa, MC, etc) if available in your project */}
           <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
             Guaranteed Safe Checkout
           </div>
        </div>
      </div>
    </div>
  );
};
