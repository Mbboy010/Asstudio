import React from 'react';
import type { Metadata } from 'next';
import AdminReviewsView from '@/components/views/admin/ReviewsView';

export const metadata: Metadata = {
  title: "User Reviews | Asstudio Admin",
  description: "Moderate user reviews.",
};

export default function AdminReviewsPage() {
  return <AdminReviewsView />;
}