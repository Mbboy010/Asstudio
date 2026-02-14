'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Pause, Play, ShoppingCart, Check, ArrowLeft, 
  Star, ThumbsUp, Trash2, Edit2, X, 
  Loader, Share2, Save, ChevronRight, Maximize2, Info
} from 'lucide-react';
import Link from 'next/link';
import { Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { DetailSkeleton } from '@/components/ui/Skeleton';
import { 
  doc, getDoc, collection, addDoc, query, orderBy, 
  onSnapshot, deleteDoc, updateDoc, setDoc, where, limit, getDocs, increment 
} from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';

// --- Interfaces ---
interface ExtendedProduct extends Product {
  screenshots?: string[];
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Review {
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

// --- Related Product Card Component ---
const RelatedProductCard = ({ item }: { item: Product }) => (
  <Link href={`/product/${item.id}`} className="flex-shrink-0 w-32 md:w-40 group">
    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-900 mb-2 border border-gray-100 dark:border-zinc-800">
      <img 
        src={item.image ?? ''} 
        alt={item.name || 'Product'} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
      />
    </div>
    <h4 className="text-xs font-bold truncate dark:text-white">{item.name}</h4>
    <p className="text-[10px] text-rose-600 font-bold">₦{item.price.toLocaleString()}</p>
  </Link>
);

const StarRating = ({ rating, size = "w-4 h-4" }: { rating: number, size?: string }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          className={`${size} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 dark:fill-zinc-800 text-gray-200 dark:text-zinc-800'}`} 
        />
      ))}
    </div>
  );
};

const ReviewItem: React.FC<{ 
    review: Review; 
    currentUser: AuthUser | null;
    onLike: (id: string) => void; 
    onDelete: (id: string) => void; 
    onUpdate: (id: string, content: string) => void;
}> = ({ review, currentUser, onLike, onDelete, onUpdate }) => {
    const [userData, setUserData] = useState({ name: review.user, avatar: review.avatar });
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(review.content);

    useEffect(() => {
        if (!review.userId) return;
        const unsub = onSnapshot(doc(db, "users", review.userId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData({
                    name: data.name || review.user,
                    avatar: data.avatar || review.avatar
                });
            }
        });
        return () => unsub();
    }, [review.userId, review.user, review.avatar]);

    const handleSave = () => {
        onUpdate(review.id, editContent);
        setIsEditing(false);
    };

    return (
        <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-zinc-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-800">
                        <img 
                          src={userData.avatar || '/placeholder-avatar.png'} 
                          alt={userData.name} 
                          className="w-full h-full object-cover" 
                        />
                    </div>
                    <div>
                        <div className="font-bold text-sm text-gray-900 dark:text-white">{userData.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <StarRating rating={review.rating} size="w-3 h-3" />
                            <span className="text-xs text-gray-400">{review.date}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => onLike(review.id)}
                        disabled={!currentUser}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold transition-all ${review.isLiked ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200'}`}
                    >
                        <ThumbsUp className={`w-3 h-3 ${review.isLiked ? 'fill-current' : ''}`} /> {review.likes}
                    </button>

                    {currentUser && currentUser.id === review.userId && !isEditing && (
                        <div className="flex items-center gap-1 border-l border-gray-200 dark:border-zinc-700 pl-2">
                            <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-rose-500 transition-colors" title="Edit Review"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => onDelete(review.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Delete Review"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    )}
                </div>
            </div>

            {isEditing ? (
                <div className="space-y-3">
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full bg-white dark:bg-black border border-rose-500 rounded-lg p-3 text-sm outline-none min-h-[80px] focus:ring-1 focus:ring-rose-500" />
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => { setIsEditing(false); setEditContent(review.content); }} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                        <button onClick={handleSave} className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded hover:bg-rose-700 transition-colors flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
                    </div>
                </div>
            ) : (
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">&quot;{review.content}&quot;</p>
            )}
        </div>
    );
};

const ProductDetail: React.FC = () => {
  const params = useParams();
  const id = params?.id as string; 
  const router = useRouter();

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

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({ id: user.uid, name: user.displayName || 'User', email: user.email || '', avatar: user.photoURL || '' });
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsub();
  }, []);

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
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [id]);

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

  const checkAuthAndVerification = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
        router.push('/login');
        return false;
    }
    await user.reload();
    if (!user.emailVerified) {
        try { await sendEmailVerification(user); alert("Verify email first."); } catch (e) {}
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
              alert("Added!");
          } catch (e) { console.error(e); }
      }
  };

  const handleDownload = async (isDemo: boolean = false) => {
      const allowed = await checkAuthAndVerification();
      if (!allowed) return;
      setIsDownloading(true);
      try {
          if (!isDemo && product?.price === 0 && currentUser && product) {
               await addDoc(collection(db, "orders"), {
                  userId: currentUser.id,
                  items: [{...product, quantity: 1}],
                  total: 0,
                  status: 'Completed',
                  createdAt: new Date().toISOString()
              });
          }
          if (!isDemo && product?.productUrl) { window.open(product.productUrl, '_blank'); return; }
          // Demo logic
          if (isDemo && product?.demoUrl) { window.open(product.demoUrl, '_blank'); return; }
      } finally { setIsDownloading(false); }
  };

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

  const handleDelete = async (reviewId: string) => {
    if (window.confirm('Delete?')) await deleteDoc(doc(db, "products", id, "reviews", reviewId));
  };

  const handleUpdate = async (reviewId: string, content: string) => {
    await updateDoc(doc(db, "products", id, "reviews", reviewId), { content });
  };

  const handleShare = async () => {
    try { await navigator.share({ url: window.location.href }); } catch (e) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || !product) return <DetailSkeleton />;

  return (
    <div className="min-h-screen py-12 px-4 max-w-7xl mx-auto bg-white dark:bg-black text-gray-900 dark:text-white transition-colors">
      
      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedScreenshot && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedScreenshot(null)}
          >
            <div className="relative max-w-5xl max-h-screen w-full flex items-center justify-center">
              <button onClick={() => setSelectedScreenshot(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><X className="w-6 h-6" /></button>
              <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={selectedScreenshot} alt="Fullscreen Preview" className="max-h-[85vh] w-auto object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Link href="/shop" className="inline-flex items-center gap-2 text-gray-500 hover:text-rose-600 mb-8 transition-colors group">
         <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        <div className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 shadow-xl">
           <img src={product.image ?? ''} alt={product.name || 'Product'} className="w-full aspect-square object-cover" />
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
                  <span className="text-gray-500 text-sm">{reviews.length} reviews</span>
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
                      
                      {/* --- CONDITIONAL DEMO BUTTON --- */}
                      {product.demoUrl && (
                        <button onClick={() => handleDownload(true)} className="flex-1 py-4 bg-white dark:bg-zinc-900 border dark:border-zinc-700 font-bold rounded-xl">Demo</button>
                      )}
                  </>
              )}
           </div>
        </div>
      </div>
      
       {/* --- SCREENSHOTS SECTION --- */}
      {product.screenshots && product.screenshots.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-black text-gray-900 dark:text-white">Screenshots</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar touch-pan-x cursor-grab active:cursor-grabbing snap-x">
             {product.screenshots.map((shot, index) => (
                <div key={index} className="relative flex-shrink-0 h-64 md:h-80 aspect-video rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-lg transition-shadow snap-center group" onClick={() => setSelectedScreenshot(shot)}>
                   <img src={shot} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Maximize2 className="w-8 h-8 text-white drop-shadow-lg" />
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}

      {/* --- DESCRIPTION SECTION --- */}
      {product.description && (
        <div className="mb-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8">
                <div className="flex items-center gap-2 mb-6">
                    <Info className="w-5 h-5 text-rose-600" />
                    <h3 className="text-2xl font-black">About this {product.category}</h3>
                </div>
                <div 
                    className="prose prose-rose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 leading-relaxed text-lg"
                    dangerouslySetInnerHTML={{ __html: product.description }} 
                />
            </div>
            <div className="lg:col-span-4 space-y-6">
                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                    <h4 className="font-black text-sm uppercase tracking-wider mb-4 text-gray-400">Details</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Price</span><span className="font-bold">{product.price === 0 ? 'Free' : `₦${product.price.toLocaleString()}`}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Category</span><span className="font-bold">{product.category}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Rating</span><span className="font-bold">{product.rating || 5.0} / 5.0</span></div>
                    </div>
                </div>
            </div>
        </div>
      )}



      {relatedProducts.length > 0 && (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black flex items-center gap-2">You may also like <ChevronRight className="w-5 h-5 text-rose-600" /></h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar touch-pan-x">
                {relatedProducts.map(item => (
                    <RelatedProductCard key={item.id} item={item} />
                ))}
            </div>
        </div>
      )}

      <div className="border-t dark:border-zinc-800 pt-16">
        <div className="flex flex-col md:flex-row gap-12">
           <div className="w-full md:w-1/3">
              <div className="bg-gray-50 dark:bg-zinc-900 p-6 rounded-2xl sticky top-24">
                 <h3 className="font-bold mb-4">Rate this product</h3>
                 {currentUser ? (
                   <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div className="flex gap-1">
                         {[1,2,3,4,5].map(star => (
                            <button type="button" key={star} onClick={() => setUserRating(star)}><Star key={star} className={`w-8 h-8 ${star <= userRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} /></button>
                         ))}
                      </div>
                      <textarea value={newReview} onChange={(e) => setNewReview(e.target.value)} className="w-full bg-white dark:bg-black border dark:border-zinc-700 rounded-xl p-3 text-sm min-h-[100px]" placeholder="Feedback..." />
                      <button disabled={isSubmittingReview} className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl">Post Review</button>
                   </form>
                 ) : (
                    <button onClick={() => router.push('/login')} className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl">Log In to Review</button>
                 )}
              </div>
           </div>
           
           <div className="flex-1 space-y-6">
              <AnimatePresence mode="popLayout">
                {reviews.map((review) => (
                    <motion.div key={review.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <ReviewItem review={review} currentUser={currentUser} onLike={handleLike} onDelete={handleDelete} onUpdate={handleUpdate} />
                    </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </div>
      </div>
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
