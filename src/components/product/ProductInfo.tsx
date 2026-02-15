import React from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({ rating, size = "w-4 h-4" }: { rating: number, size?: string }) => {
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
