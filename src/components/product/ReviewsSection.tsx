'use client';

import React, { useState, useEffect } from 'react';
import { ThumbsUp, Trash2, Edit2, X, Save, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

// Interfaces (Ensure these match your main ProductDetailContent types)
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

// --- Helper Component: Star Display ---
const StarRating = ({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'fill-gray-200 dark:fill-zinc-800 text-gray-200 dark:text-zinc-800'
          }`}
        />
      ))}
    </div>
  );
};

// --- Sub-Component: The Individual Review Card ---
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

  // Sync user data real-time (in case they change their name/avatar)
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
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold transition-all ${
              review.isLiked 
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' 
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <ThumbsUp className={`w-3 h-3 ${review.isLiked ? 'fill-current' : ''}`} /> {review.likes}
          </button>

          {currentUser?.id === review.userId && !isEditing && (
            <div className="flex items-center gap-1 border-l border-gray-200 dark:border-zinc-700 pl-2">
              <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-rose-500 transition-colors">
                <Edit2 className="w-3 h-3" />
              </button>
              <button onClick={() => onDelete(review.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-white dark:bg-black border border-rose-500 rounded-lg p-3 text-sm outline-none min-h-[80px] focus:ring-1 focus:ring-rose-500"
          />
          <div className="flex gap-2 justify-end">
            <button 
              onClick={() => { setIsEditing(false); setEditContent(review.content); }} 
              className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
            <button 
              onClick={handleSave} 
              className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded hover:bg-rose-700 transition-colors flex items-center gap-1"
            >
              <Save className="w-3 h-3" /> Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
          &quot;{review.content}&quot;
        </p>
      )}
    </div>
  );
};

// --- Main Component: The Reviews Section ---
interface ReviewsSectionProps {
  reviews: Review[];
  currentUser: AuthUser | null;
  userRating: number;
  setUserRating: (r: number) => void;
  newReview: string;
  setNewReview: (t: string) => void;
  isSubmittingReview: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  onLoginRedirect: () => void;
}

export const ReviewsSection = (props: ReviewsSectionProps) => {
  return (
    <div className="border-t dark:border-zinc-800 pt-16">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Rating Sidebar */}
        <div className="w-full md:w-1/3">
          <div className="bg-gray-50 dark:bg-zinc-900 p-6 rounded-2xl sticky top-24 border border-gray-100 dark:border-zinc-800">
            <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Rate this product</h3>
            {props.currentUser ? (
              <form onSubmit={props.onSubmit} className="space-y-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => props.setUserRating(star)}
                      className="transition-transform active:scale-90"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= props.userRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 dark:text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={props.newReview}
                  onChange={(e) => props.setNewReview(e.target.value)}
                  className="w-full bg-white dark:bg-black border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-sm min-h-[100px] outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="Share your thoughts..."
                />
                <button
                  disabled={props.isSubmittingReview}
                  className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  {props.isSubmittingReview ? 'Posting...' : 'Post Review'}
                </button>
              </form>
            ) : (
              <button
                onClick={props.onLoginRedirect}
                className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors"
              >
                Log In to Review
              </button>
            )}
          </div>
        </div>

        {/* Reviews List */}
        <div className="flex-1 space-y-6">
          <AnimatePresence mode="popLayout">
            {props.reviews.length > 0 ? (
              props.reviews.map((review) => (
                <motion.div
                  key={review.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <ReviewItem
                    review={review}
                    currentUser={props.currentUser}
                    onLike={props.onLike}
                    onDelete={props.onDelete}
                    onUpdate={props.onUpdate}
                  />
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                No reviews yet. Be the first to rate this product!
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
