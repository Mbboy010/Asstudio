'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Firebase
import {
  doc, getDoc, collection, addDoc, query, orderBy,
  onSnapshot, deleteDoc, updateDoc, setDoc, where, limit, getDocs, increment
} from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';

// Types
import { Product } from '@/types';

// UI Components
import { DetailSkeleton } from '@/components/ui/Skeleton';
import { ProductHero } from './ProductHero';
import { ScreenshotsSection } from './ScreenshotsSection';
import { DescriptionSection } from './DescriptionSection';
import { RelatedProductsSection } from './RelatedProductsSection';
import { ReviewsSection } from './ReviewsSection';
import { LightboxModal } from './LightboxModal';

// --- Shared Interfaces ---
export interface ExtendedProduct extends Product {
  screenshots?: string[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Review {
  id: string;
  userId: string;
  user: string;
  rating: number;
  date: string;
  content: string;
  avatar: string;
  likes: number;
  isLiked?: boolean;
}

const ProductDetail: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  // --- State ---
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [product, setProduct] = useState<ExtendedProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState('');
  const [userRating, setUserRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  // --- Audio State ---
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // --- Custom Alert State ---
  const [alertConfig, setAlertConfig] = useState({ 
    show: false, 
    message: '', 
    type: 'success' as 'success' | 'error' | 'info' 
  });

  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertConfig({ show: true, message, type });
    
  };

  // --- Auth Listener ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({ 
          id: user.uid, 
          name: user.displayName || 'User', 
          email: user.email || '', 
          avatar: user.photoURL || '' 
        });
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsub();
  }, []);

  // --- Data Fetching (Product & Related) ---
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const prodData = { id: docSnap.id, ...docSnap.data() } as ExtendedProduct;
          setProduct(prodData);

          const q = query(
            collection(db, "products"),
            where("category", "==", prodData.category),
            limit(11)
          );
          const relatedSnap = await getDocs(q);
          const filtered = relatedSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as Product))
            .filter(p => p.id !== id)
            .slice(0, 10);
          setRelatedProducts(filtered);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // --- Reviews Listener ---
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "products", id, "reviews"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedReviews: Review[] = [];

      for (const snapDoc of snapshot.docs) {
        const data = snapDoc.data();
        let isLiked = false;

        if (currentUser) {
          const likeDoc = await getDoc(doc(db, "products", id, "reviews", snapDoc.id, "userLikes", currentUser.id));
          isLiked = likeDoc.exists();
        }

        fetchedReviews.push({
          id: snapDoc.id,
          userId: data.userId,
          user: data.user,
          rating: data.rating,
          date: new Date(data.createdAt).toLocaleDateString(),
          content: data.content,
          avatar: data.avatar,
          likes: data.likes || 0,
          isLiked: isLiked
        });
      }
      setReviews(fetchedReviews);
    });
    return () => unsubscribe();
  }, [id, currentUser]);

  // --- Audio Handlers ---
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(e => console.error(e));
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const time = Number(e.target.value);
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // --- Action Handlers ---
  const checkAuthAndVerification = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push('/login');
      return false;
    }
    await user.reload();
    if (!user.emailVerified) {
      try { 
        await sendEmailVerification(user); 
        showAlert("Please verify your email first. A new link has been sent.", "error"); 
      } catch (e) {
        showAlert("Failed to send verification email.", "error");
      }
      return false;
    }
    return true;
  }, [router]);

  const handleAddToCart = async (selectedProduct: Product) => {
    const allowed = await checkAuthAndVerification();
    if (allowed && currentUser) {
      try {
        const cartItemRef = doc(db, "users", currentUser.id, "cart", selectedProduct.id);
        await setDoc(cartItemRef, { ...selectedProduct, addedAt: new Date().toISOString(), quantity: 1 });
        showAlert("Added to cart successfully!", "success");
      } catch (e) { 
        console.error(e); 
        showAlert("Failed to add to cart.", "error");
      }
    }
  };

  const handleDownload = async (isDemo: boolean = false) => {
    // 1. Determine if we can bypass auth
    const isFree = product?.price === 0;
    const needsAuth = !isDemo && !isFree;

    if (needsAuth) {
      const allowed = await checkAuthAndVerification();
      if (!allowed) return;
    }

    setIsDownloading(true);
    
    try {
      // 2. Optional: Record free order only if user is logged in
      // Guests can still download, but we don't try to write to Firestore for them
      if (!isDemo && isFree && currentUser && product) {
        try {
          await addDoc(collection(db, "orders"), {
            userId: currentUser.id,
            items: [{...product, quantity: 1}],
            total: 0,
            status: 'Completed',
            createdAt: new Date().toISOString()
          });
        } catch (e) {
          console.error("Background order recording failed:", e);
          // We don't 'return' here because we want them to get the file anyway
        }
      }

      // 3. Trigger Download
      if (isDemo && product?.demoUrl) {
        window.open(product.demoUrl, '_blank');
      } else if (!isDemo && product?.productUrl) {
        window.open(product.productUrl, '_blank');
      }
      
    } catch (error) {
      console.error("Download action failed:", error);
      showAlert("Failed to initiate download.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    try { 
      await navigator.share({ url: window.location.href }); 
    } catch (e) {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true); 
      showAlert("Link copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- Review Handlers ---
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.trim() || !currentUser || !id) return;
    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, "products", id, "reviews"), {
        userId: currentUser.id,
        user: currentUser.name,
        rating: userRating,
        content: newReview,
        avatar: currentUser.avatar,
        createdAt: new Date().toISOString(),
        likes: 0
      });
      setNewReview('');
      showAlert("Review submitted successfully!", "success");
    } catch (error) {
      showAlert("Failed to submit review.", "error");
    } finally { setIsSubmittingReview(false); }
  };

  const handleLike = async (reviewId: string) => {
    if (!currentUser || !id) return;
    const reviewRef = doc(db, "products", id, "reviews", reviewId);
    const userLikeRef = doc(db, "products", id, "reviews", reviewId, "userLikes", currentUser.id);
    try {
      const likeDoc = await getDoc(userLikeRef);
      if (likeDoc.exists()) {
        await deleteDoc(userLikeRef);
        await updateDoc(reviewRef, { likes: increment(-1) });
      } else {
        await setDoc(userLikeRef, { likedAt: new Date().toISOString() });
        await updateDoc(reviewRef, { likes: increment(1) });
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteDoc(doc(db, "products", id, "reviews", reviewId));
        showAlert("Review deleted.", "success");
      } catch (error) {
        showAlert("Failed to delete review.", "error");
      }
    }
  };

  const handleUpdateReview = async (reviewId: string, content: string) => {
    try {
      await updateDoc(doc(db, "products", id, "reviews", reviewId), { content });
      showAlert("Review updated.", "success");
    } catch (error) {
      showAlert("Failed to update review.", "error");
    }
  };

  if (loading || !product) return <DetailSkeleton />;

  return (
    <div className="min-h-screen py-12 px-4 max-w-7xl mx-auto bg-white dark:bg-black text-gray-900 dark:text-white transition-colors relative">
      
      <LightboxModal 
        url={selectedScreenshot} 
        onClose={() => setSelectedScreenshot(null)} 
      />

      <Link href="/shop" className="inline-flex items-center gap-2 text-gray-500 hover:text-rose-600 mb-8 transition-colors group">  
         <ArrowLeft className="w-4 h-4" /> Back to Catalog  
      </Link>  
        
      <ProductHero 
        product={product}
        reviewsCount={reviews.length}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        togglePlay={togglePlay}
        audioRef={audioRef}
        currentTime={currentTime}
        duration={duration}
        handleSeek={handleSeek}
        formatTime={formatTime}
        handleTimeUpdate={handleTimeUpdate}
        handleShare={handleShare}
        copied={copied}
        isDownloading={isDownloading}
        handleDownload={handleDownload}
        handleAddToCart={handleAddToCart}
      />

      {product.screenshots && product.screenshots.length > 0 && (
        <ScreenshotsSection 
          screenshots={product.screenshots} 
          onSelect={setSelectedScreenshot} 
        />
      )}

      <DescriptionSection product={product} />

      <RelatedProductsSection products={relatedProducts} />

      <ReviewsSection 
        reviews={reviews}
        currentUser={currentUser}
        userRating={userRating}
        setUserRating={setUserRating}
        newReview={newReview}
        setNewReview={setNewReview}
        isSubmittingReview={isSubmittingReview}
        onSubmit={handleSubmitReview}
        onLike={handleLike}
        onDelete={handleDeleteReview}
        onUpdate={handleUpdateReview}
        onLoginRedirect={() => router.push('/login')}
      />

      {/* --- Centered Modal Alert --- */}
      <AnimatePresence>
        {alertConfig.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setAlertConfig(prev => ({ ...prev, show: false }))}
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm flex flex-col items-center text-center gap-3 p-8 rounded-3xl shadow-2xl border bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800"
            >
              {/* Close Button (Top Right) */}
              <button 
                onClick={() => setAlertConfig(prev => ({ ...prev, show: false }))} 
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Centered Icon */}
              <div className={`p-4 rounded-full mb-2 ${
                alertConfig.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                alertConfig.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {alertConfig.type === 'success' && <CheckCircle className="w-10 h-10" />}
                {alertConfig.type === 'error' && <AlertCircle className="w-10 h-10" />}
                {alertConfig.type === 'info' && <Info className="w-10 h-10" />}
              </div>
              
              {/* Text Content */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {alertConfig.type === 'success' ? 'Success!' : alertConfig.type === 'error' ? 'Oops!' : 'Notice'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                {alertConfig.message}
              </p>
              
              {/* Action Button */}
              <button 
                onClick={() => setAlertConfig(prev => ({ ...prev, show: false }))}
                className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                   alertConfig.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                   alertConfig.type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                   'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Okay
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default function ProductDetailContent() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProductDetail />
    </Suspense>
  );
}
