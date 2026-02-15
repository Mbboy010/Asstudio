'use client';

import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, Trash2, Edit2, X, Save, Star, 
  MessageSquare, MoreHorizontal, CornerDownRight ,ShieldCheck} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

// --- Types ---
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

// --- Components ---

const StarRating = ({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`${size} transition-colors ${
          star <= rating 
            ? 'fill-amber-400 text-amber-400' 
            : 'fill-gray-200 dark:fill-zinc-800 text-gray-200 dark:text-zinc-800'
        }`}
      />
    ))}
  </div>
);

// --- Rating Summary Bar (New Feature) ---
const RatingSummary = ({ reviews }: { reviews: Review[] }) => {
  const total = reviews.length || 1;
  const counts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percent: (reviews.filter(r => r.rating === star).length / total) * 100
  }));

  const average = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 mb-8">
      <div className="flex items-center gap-6 mb-6">
        <div className="text-center">
          <div className="text-5xl font-black text-gray-900 dark:text-white">{average}</div>
          <div className="flex justify-center my-2">
            <StarRating rating={Math.round(Number(average))} size="w-3 h-3" />
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">{reviews.length} Reviews</p>
        </div>
        <div className="h-16 w-px bg-gray-200 dark:bg-zinc-800" />
        <div className="flex-1 space-y-1.5">
          {counts.map((item) => (
            <div key={item.star} className="flex items-center gap-3 text-xs">
              <span className="font-bold w-3">{item.star}</span>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full" 
                  style={{ width: `${item.percent}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Individual Review Card with Optimistic Updates ---
const ReviewItem: React.FC<{
  review: Review;
  currentUser: AuthUser | null;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
}> = ({ review, currentUser, onLike, onDelete, onUpdate }) => {
  // 1. Local Optimistic State
  const [optimisticReview, setOptimisticReview] = useState(review);
  const [userData, setUserData] = useState({ name: review.user, avatar: review.avatar });
  
  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(review.content);
  const [isDeleted, setIsDeleted] = useState(false); // For optimistic delete

  // Sync with Firestore updates (if other users change things), 
  // but only if we aren't currently optimistically modifying it.
  useEffect(() => {
    setOptimisticReview(review);
  }, [review]);

  // Sync User Data
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
  }, [review.userId]);

  // --- Optimistic Handlers ---

  const handleLike = () => {
    if (!currentUser) return;
    
    // Immediate UI Update
    setOptimisticReview(prev => ({
      ...prev,
      isLiked: !prev.isLiked,
      likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1
    }));

    // Server Call
    onLike(review.id);
  };

  const handleSave = () => {
    // Immediate UI Update
    setOptimisticReview(prev => ({
      ...prev,
      content: editContent
    }));
    setIsEditing(false);

    // Server Call
    onUpdate(review.id, editContent);
  };

  const handleDelete = () => {
    // Immediate UI Update (Hide it)
    setIsDeleted(true);
    
    // Server Call
    onDelete(review.id);
  };

  if (isDeleted) return null;

  return (
    <div className="group relative bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-6 md:p-8 rounded-[2rem] transition-all hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none hover:border-gray-200 dark:hover:border-zinc-700">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-800 ring-2 ring-white dark:ring-zinc-900 shadow-sm">
              <img
                src={userData.avatar || '/placeholder-avatar.png'}
                alt={userData.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Verified Badge decoration could go here */}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{userData.name}</h4>
            <div className="flex items-center gap-3 mt-1">
              <StarRating rating={optimisticReview.rating} size="w-3.5 h-3.5" />
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-700" />
              <span className="text-xs font-medium text-gray-400">{optimisticReview.date}</span>
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        {currentUser?.id === review.userId && !isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-gray-50 dark:bg-zinc-800/50 p-1 rounded-xl">
            <button 
              onClick={() => setIsEditing(true)} 
              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleDelete} 
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-6 pl-16">
        {isEditing ? (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30"
          >
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 min-h-[80px] text-gray-800 dark:text-gray-200 placeholder-gray-400"
              placeholder="Update your review..."
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-zinc-800">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-rose-600/20 hover:scale-105 transition-transform"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        ) : (
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
            {optimisticReview.content}
          </p>
        )}
      </div>

      {/* Footer / Likes */}
      <div className="pl-16 flex items-center gap-4">
        <button
          onClick={handleLike}
          disabled={!currentUser}
          className={`group/like flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
            optimisticReview.isLiked 
              ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800' 
              : 'bg-gray-50 dark:bg-zinc-800 text-gray-500 border border-transparent hover:bg-gray-100'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 transition-transform group-active/like:scale-75 ${
            optimisticReview.isLiked ? 'fill-rose-600 dark:fill-rose-400' : ''
          }`} /> 
          <span>Helpful {optimisticReview.likes > 0 && <span className="opacity-60 ml-1">({optimisticReview.likes})</span>}</span>
        </button>
        
        {/* Only show "Share" or extra buttons if needed */}
      </div>
    </div>
  );
};

// --- Main Section ---

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
    <div className="border-t border-gray-100 dark:border-zinc-800 pt-20 pb-20">
      
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-12">
        <div className="p-3 bg-rose-100 dark:bg-rose-900/20 rounded-2xl text-rose-600">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Customer Reviews
        </h3>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Left Column: Stats & Review List */}
        <div className="flex-1 order-2 lg:order-1">
          <RatingSummary reviews={props.reviews} />
          
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {props.reviews.length > 0 ? (
                props.reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
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
                <div className="py-20 text-center bg-gray-50 dark:bg-zinc-900/50 rounded-[2rem] border border-dashed border-gray-200 dark:border-zinc-800">
                  <div className="inline-block p-4 rounded-full bg-white dark:bg-zinc-800 mb-4 shadow-sm">
                    <Star className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">No reviews yet</h4>
                  <p className="text-gray-500">Be the first to share your experience!</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Sticky "Write Review" Card */}
        <div className="w-full lg:w-[400px] order-1 lg:order-2">
          <div className="sticky top-28 space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-zinc-800 relative overflow-hidden">
              {/* Decorative Blur */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/20 to-purple-500/20 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

              <h3 className="text-xl font-black mb-1 relative z-10">Write a Review</h3>
              <p className="text-sm text-gray-500 mb-6 relative z-10">Share your thoughts with other customers.</p>
              
              {props.currentUser ? (
                <form onSubmit={props.onSubmit} className="space-y-6 relative z-10">
                  <div className="flex justify-center bg-gray-50 dark:bg-zinc-950/50 py-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => props.setUserRating(star)}
                          className="transition-all hover:scale-125 active:scale-95 focus:outline-none"
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              star <= props.userRating
                                ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                                : 'text-gray-300 dark:text-zinc-700 hover:text-gray-400'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      value={props.newReview}
                      onChange={(e) => props.setNewReview(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 text-sm min-h-[140px] outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all resize-none"
                      placeholder="What did you like or dislike? How was the quality?"
                    />
                    <div className="absolute bottom-4 right-4 pointer-events-none">
                      <CornerDownRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>

                  <button
                    disabled={props.isSubmittingReview || !props.newReview.trim()}
                    className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:shadow-lg hover:shadow-gray-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                  >
                    {props.isSubmittingReview ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Posting...
                      </span>
                    ) : (
                      'Post Review'
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-6">Please log in to write a review and rate this product.</p>
                  <button
                    onClick={props.onLoginRedirect}
                    className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/30"
                  >
                    Log In Now
                  </button>
                </div>
              )}
            </div>
            
            {/* Trust Badge */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold opacity-60">
               Verified Reviews
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
