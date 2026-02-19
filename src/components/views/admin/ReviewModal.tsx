'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, User, Star, Loader } from 'lucide-react';
import { collection, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, productId }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !productId) return;

    setLoading(true);
    // Path: products -> [id] -> reviews
    const q = query(collection(db, "products", productId, "reviews"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(reviewData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, productId]);

  const deleteReview = async (reviewId: string) => {
    if (confirm("Delete this user review?") && productId) {
      await deleteDoc(doc(db, "products", productId, "reviews", reviewId));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black dark:text-white">User Reviews</h3>
                <p className="text-xs text-zinc-500 font-medium">{reviews.length} feedback entries</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X className="w-5 h-5 dark:text-white" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="py-10 text-center"><Loader className="animate-spin mx-auto text-rose-600" /></div>
              ) : reviews.length === 0 ? (
                <div className="py-10 text-center text-zinc-500 font-medium">No reviews for this product yet.</div>
              ) : (
                reviews.map((review) => (
                  <ReviewItem key={review.id} review={review} onDelete={() => deleteReview(review.id)} />
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- Single Review Item with Live User Fetching ---
const ReviewItem = ({ review, onDelete }: { review: any, onDelete: () => void }) => {
  const [userData, setUserData] = useState({ name: review.user || 'User', avatar: review.avatar || null });

  useEffect(() => {
    if (!review.userId) return;

    // Use your specific snippet for fetching user data live
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

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex gap-4 items-start group">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex-shrink-0">
        {userData.avatar ? <img src={userData.avatar} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-zinc-400" />}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-bold dark:text-white">{userData.name}</div>
            <div className="flex gap-0.5 mt-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-zinc-300 dark:text-zinc-600'}`} />
              ))}
            </div>
          </div>
          <button onClick={onDelete} className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg opacity-0 group-hover:opacity-100">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic">"{review.comment}"</p>
      </div>
    </div>
  );
};
export default ReviewModal