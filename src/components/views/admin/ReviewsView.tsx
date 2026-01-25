'use client';

import React, { useState, useEffect } from 'react';
import { collectionGroup, getDocs, deleteDoc, doc, getDoc, query } from 'firebase/firestore';
import { db } from '@/firebase';
import { MessageSquare, Trash2, Star, ExternalLink, Image as ImageIcon, Calendar, Clock, Search, RefreshCcw } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import Image from 'next/image'; // Fixed: Optimized Image component

interface ReviewData {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  userName: string;
  userAvatar: string;
  content: string;
  rating: number;
  createdAt: string;
  fullPath: string; 
}

const AdminReviewsView: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const reviewsSnapshot = await getDocs(query(collectionGroup(db, 'reviews')));
      
      const reviewsData: ReviewData[] = [];
      const productCache: Record<string, {name: string, image: string | null}> = {};

      for (const reviewDoc of reviewsSnapshot.docs) {
          const data = reviewDoc.data();
          const productRef = reviewDoc.ref.parent.parent;
          
          if (!productRef) continue;
          
          const productId = productRef.id;
          
          if (!productCache[productId]) {
              try {
                  const productSnap = await getDoc(productRef);
                  if (productSnap.exists()) {
                      const pData = productSnap.data();
                      productCache[productId] = { name: pData.name, image: pData.image };
                  } else {
                      productCache[productId] = { name: 'Unknown Product', image: null };
                  }
              } catch (err: unknown) { // Fixed: Implicit any
                   console.error(err);
                   productCache[productId] = { name: 'Product Deleted', image: null };
              }
          }

          reviewsData.push({
              id: reviewDoc.id,
              productId: productId,
              productName: productCache[productId].name,
              productImage: productCache[productId].image,
              userName: data.user || 'Anonymous',
              userAvatar: data.avatar || '',
              content: data.content,
              rating: data.rating,
              createdAt: data.createdAt,
              fullPath: reviewDoc.ref.path
          });
      }

      reviewsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(reviewsData);
    } catch (error: unknown) { // Fixed: Implicit any
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (review: ReviewData) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
        try {
            const pathSegments = review.fullPath.split('/');
            if (pathSegments.length === 4) {
                 await deleteDoc(doc(db, pathSegments[0], pathSegments[1], pathSegments[2], pathSegments[3]));
                 setReviews(reviews.filter(r => r.id !== review.id));
            }
        } catch (error: unknown) { // Fixed: Implicit any
            console.error("Error deleting review:", error);
            alert("Failed to delete review");
        }
    }
  };

  const filteredReviews = reviews.filter(r => 
      r.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 bg-gray-50 dark:bg-black min-h-screen py-6 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-gray-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="text-rose-600 font-bold text-xs uppercase tracking-wider bg-rose-50 dark:bg-rose-900/10 px-2 py-1 rounded">Feedback</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">User Reviews</h1>
          <p className="text-gray-500 font-medium mt-1">Monitor and moderate product comments.</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto group">
               <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4 group-focus-within:text-rose-600 transition-colors" />
               <input 
                  type="text" 
                  placeholder="Search reviews..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl w-full sm:w-64 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all shadow-sm" 
               />
            </div>
            <button 
                onClick={fetchReviews} 
                className="p-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-rose-600 transition-colors shadow-sm"
                title="Refresh Reviews"
            >
                <RefreshCcw className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
         {loading ? <div className="p-8"><TableSkeleton /></div> : (
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 text-gray-500 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4 font-bold tracking-wider">User</th>
                        <th className="px-6 py-4 font-bold tracking-wider w-1/3">Comment</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Product</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Rating</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Date</th>
                        <th className="px-6 py-4 font-bold tracking-wider text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {filteredReviews.length > 0 ? (
                        filteredReviews.map((review) => (
                            <tr key={review.id} className="group hover:bg-rose-50/30 dark:hover:bg-zinc-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-9 h-9">
                                            <Image 
                                                src={review.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}`}
                                                alt={review.userName}
                                                fill
                                                className="rounded-full object-cover border border-gray-200 dark:border-zinc-700" 
                                            />
                                        </div>
                                        <div className="font-bold text-sm text-gray-900 dark:text-white">{review.userName}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {/* Fixed: Escaped quotes */}
                                    <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed italic relative pl-3 border-l-2 border-rose-200 dark:border-rose-900/50" title={review.content}>
                                        &quot;{review.content}&quot;
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-zinc-700">
                                            {review.productImage ? (
                                                <Image src={review.productImage} alt={review.productName} fill className="object-cover" />
                                            ) : (
                                                <ImageIcon className="w-full h-full p-2.5 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{review.productName}</span>
                                            <Link href={`/product/${review.productId}`} className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 mt-0.5">
                                                View Product <ExternalLink className="w-2.5 h-2.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/10 px-2 py-1 rounded-lg w-fit">
                                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                                        <span className="text-sm font-bold text-yellow-700 dark:text-yellow-500">{review.rating}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col text-xs font-medium text-gray-500">
                                        <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(review.createdAt).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1.5 mt-0.5"><Clock className="w-3 h-3" /> {new Date(review.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(review)} 
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                        title="Delete Review"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="text-center py-16 text-gray-500">
                                <div className="flex flex-col items-center justify-center gap-3">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                                        <MessageSquare className="w-6 h-6 opacity-40" />
                                    </div>
                                    <p className="font-medium">No reviews found matching your search.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
                </table>
             </div>
         )}
         
         <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900 text-xs text-gray-500 flex justify-between items-center">
            <span>Showing {filteredReviews.length} reviews</span>
         </div>
      </div>
    </div>
  );
};

export default AdminReviewsView;
