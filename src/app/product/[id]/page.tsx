'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, addToCart, setError } from '@/store';
import { 
  Pause, Play, Download, ShoppingCart, Check, ArrowLeft, Calendar, 
  HardDrive, Star, MessageSquare, ThumbsUp, User, Trash2, Edit2, X, 
  Image as ImageIcon, Loader, Volume2, 
  VolumeX, Share2, Info, Save
} from 'lucide-react';
import Link from 'next/link';
// Removed: import Image from 'next/image'; 
import { Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { DetailSkeleton } from '@/components/ui/Skeleton';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { sendEmailVerification } from 'firebase/auth';

// --- Interfaces ---
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
                        {/* UPDATE 1: Standard img for user avatar */}
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
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${review.isLiked ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
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
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth) as { user: AuthUser | null };
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState('');
  const [userRating, setUserRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const docRef = doc(db, "products", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
            }
        } catch (error) {
            console.error("Error fetching product:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "products", id, "reviews"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews: Review[] = [];
      snapshot.forEach((snapDoc) => {
        const data = snapDoc.data();
        fetchedReviews.push({
          id: snapDoc.id,
          userId: data.userId,
          user: data.user,
          rating: data.rating,
          date: new Date(data.createdAt).toLocaleDateString(),
          content: data.content,
          avatar: data.avatar,
          likes: data.likes || 0,
          isLiked: false
        });
      });
      setReviews(fetchedReviews);
    });
    return () => unsubscribe();
  }, [id]);

  const togglePlay = () => {
    if (audioRef.current) {
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play().catch(e => console.error("Audio play failed", e));
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

  const toggleMute = () => {
      if (audioRef.current) {
          audioRef.current.muted = !isMuted;
          setIsMuted(!isMuted);
      }
  };

  const isFree = product?.price === 0;

  const checkAuthAndVerification = useCallback(async () => {
    if (!user) {
        router.push('/login');
        return false;
    }
    const currentUser = auth.currentUser;
    if (currentUser) {
        try { await currentUser.reload(); } catch(e) { console.error(e); }
        if (!currentUser.emailVerified) {
            try {
                await sendEmailVerification(currentUser);
                dispatch(setError(`Account not verified. A verification link has been sent to ${currentUser.email}.`));
            } catch (error: unknown) {
                 const err = error as { message?: string };
                 dispatch(setError(err.message || "Verification failed."));
            }
            return false;
        }
    } else {
         dispatch(setError("Session invalid. Please log in again."));
         router.push('/login');
         return false;
    }
    return true;
  }, [user, router, dispatch]);

  const handleAddToCart = async (selectedProduct: Product) => {
      const allowed = await checkAuthAndVerification();
      if (allowed) dispatch(addToCart(selectedProduct));
  };

  const handleDownload = async (isDemo: boolean = false) => {
      const allowed = await checkAuthAndVerification();
      if (!allowed) return;

      setIsDownloading(true);
      try {
          if (!isDemo && isFree && user && product) {
               await addDoc(collection(db, "orders"), {
                  userId: user.id,
                  userEmail: user.email,
                  items: [{...product, quantity: 1}],
                  total: 0,
                  status: 'Completed',
                  createdAt: new Date().toISOString()
              });
          }
          
          if (!isDemo && product?.productUrl) {
              window.open(product.productUrl, '_blank');
              setIsDownloading(false);
              return;
          }

          const element = document.createElement("a");
          const fileName = isDemo ? `${product?.name}_Demo.txt` : `${product?.name}_License.txt`;
          const fileContent = isDemo 
            ? `This is a demo placeholder for ${product?.name}.` 
            : `Thank you for downloading ${product?.name} from A.S Studio!`;
          
          const file = new Blob([fileContent], {type: 'text/plain'});
          element.href = URL.createObjectURL(file);
          element.download = fileName;
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);

      } catch (error) {
          console.error("Download failed:", error);
          dispatch(setError("Failed to process download."));
      } finally {
          setIsDownloading(false);
      }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.trim() || !user || !id) return;
    setIsSubmittingReview(true);
    try {
        await addDoc(collection(db, "products", id, "reviews"), {
            userId: user.id,
            user: user.name,
            rating: userRating,
            content: newReview,
            avatar: user.avatar,
            createdAt: new Date().toISOString(),
            likes: 0
        });
        setNewReview('');
    } catch (error) {
        console.error("Error submitting review:", error);
    } finally {
        setIsSubmittingReview(false);
    }
  };

  const handleLike = (reviewId: string) => {
    setReviews(reviews.map(review => review.id === reviewId ? { ...review, isLiked: !review.isLiked, likes: review.isLiked ? review.likes - 1 : review.likes + 1 } : review));
  };

  const handleDelete = async (reviewId: string) => {
    if (window.confirm('Delete review?')) {
      await deleteDoc(doc(db, "products", id, "reviews", reviewId));
    }
  };

  const handleUpdate = async (reviewId: string, content: string) => {
    await updateDoc(doc(db, "products", id, "reviews", reviewId), { content });
  };

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const shareUrl = window.location.href;
    const shareData = {
        title: product?.name || 'A.S Studio',
        text: `Check out ${product?.name} on A.S Studio!`,
        url: shareUrl
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (clipboardErr) {
             console.error('Clipboard copy failed:', clipboardErr);
        }
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err: unknown) {
            const error = err as { name?: string };
            if (error.name === 'AbortError') return;
            await copyToClipboard();
        }
    } else {
        await copyToClipboard();
    }
  };

  if (loading || !product) return <DetailSkeleton />;

  return (
    <div className="min-h-screen py-12 px-4 max-w-7xl mx-auto bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}>
        <Link href="/shop" className="inline-flex items-center gap-2 text-gray-500 hover:text-rose-600 mb-8 transition-colors group">
            <div className="p-1 rounded-full bg-gray-100 dark:bg-zinc-900 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/20">
               <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Catalog
        </Link>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 shadow-xl">
           <div className="aspect-square relative">
               {/* UPDATE 2: Standard img for product main image */}
               {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover" 
                  />
               ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-zinc-700">
                     <ImageIcon className="w-24 h-24 opacity-50" />
                  </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
           </div>
           
           {product.demoUrl && (
               <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-4 rounded-xl flex items-center gap-4 border border-gray-200 dark:border-zinc-800 shadow-lg">
                     <audio ref={audioRef} src={product.demoUrl} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} />
                     <button onClick={togglePlay} className="w-12 h-12 bg-rose-600 text-white rounded-full flex items-center justify-center hover:bg-rose-700 hover:scale-105 transition-all flex-shrink-0 shadow-lg shadow-rose-600/30">
                        {isPlaying ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current ml-1 w-5 h-5" />}
                     </button>
                     <div className="flex-1 flex flex-col gap-1.5">
                        <div className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden relative group cursor-pointer">
                           <div className="h-full bg-rose-600 relative z-10 rounded-full" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}></div>
                           <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 font-mono">
                           <span>{formatTime(currentTime)}</span>
                           <span>{formatTime(duration)}</span>
                        </div>
                     </div>
                     <button onClick={toggleMute} className="text-gray-400 hover:text-rose-600 transition-colors">
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                     </button>
                  </div>
               </div>
           )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} className="flex flex-col justify-center">
           <div className="mb-4 flex items-center justify-between">
              <span className="inline-block px-3 py-1 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-500 font-bold text-xs rounded-full uppercase tracking-wider border border-rose-100 dark:border-rose-900/20">
                  {product.category || 'Product'}
              </span>
              <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                  <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> {product.size || 'N/A'}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {product.uploadDate || 'Recent'}</span>
              </div>
           </div>
           
           <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 text-gray-900 dark:text-white">{product.name}</h1>
           
           <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                  <StarRating rating={product.rating || 5} size="w-5 h-5" />
                  <span className="text-gray-500 text-sm font-medium">{reviews.length} reviews</span>
                  <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-700"></div>
                  <span className="text-gray-900 dark:text-white text-sm font-bold flex items-center gap-1">
                     <Check className="w-4 h-4 text-green-500" /> {product.sales || 0} Sold
                  </span>
              </div>
              <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 transition-colors">
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5" />}
              </button>
           </div>

           <div className="mb-8">
               <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  {isFree ? <span className="text-green-600">FREE</span> : <span>₦{product.price}</span>}
               </div>
           </div>
           
           <div className="text-gray-600 dark:text-gray-300 mb-8 text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />

           <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {isFree ? (
                  <button onClick={() => handleDownload(false)} disabled={isDownloading} className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                     {isDownloading ? <Loader className="w-5 h-5 animate-spin"/> : <Download className="w-5 h-5" />} Download Now
                  </button>
              ) : (
                  <>
                      <button onClick={() => handleAddToCart(product)} className="flex-[2] py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                         <ShoppingCart className="w-5 h-5" /> Add To Cart
                      </button>
                      <button onClick={() => handleDownload(true)} disabled={isDownloading} className="flex-1 py-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white font-bold rounded-xl hover:border-rose-500 transition-all">
                         {isDownloading ? <Loader className="w-5 h-5 animate-spin"/> : "Demo"}
                      </button>
                  </>
              )}
           </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} className="border-t border-gray-100 dark:border-zinc-800 pt-16">
        <div className="flex flex-col md:flex-row gap-12">
           <div className="w-full md:w-1/3 space-y-8">
              <div className="bg-gray-50 dark:bg-zinc-900 p-6 rounded-2xl">
                 <h3 className="font-bold mb-4">Write a Review</h3>
                 {user ? (
                   <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div className="flex gap-2">
                         {[1,2,3,4,5].map(star => (
                            <button type="button" key={star} onClick={() => setUserRating(star)}>
                               <Star className={`w-8 h-8 ${star <= userRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            </button>
                         ))}
                      </div>
                      <textarea value={newReview} onChange={(e) => setNewReview(e.target.value)} className="w-full bg-white dark:bg-black border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-sm min-h-[100px]" placeholder="Feedback..." />
                      <button disabled={isSubmittingReview} className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl">
                         {isSubmittingReview ? 'Posting...' : 'Post Review'}
                      </button>
                   </form>
                 ) : (
                    <Link href="/login" className="block w-full py-3 bg-rose-600 text-white font-bold rounded-xl text-center">Log In to Review</Link>
                 )}
              </div>
           </div>
           
           <div className="flex-1 space-y-6">
              <AnimatePresence>
                {reviews.map((review) => (
                    <motion.div key={review.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                        <ReviewItem review={review} currentUser={user} onLike={handleLike} onDelete={handleDelete} onUpdate={handleUpdate} />
                    </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </div>
      </motion.div>
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
