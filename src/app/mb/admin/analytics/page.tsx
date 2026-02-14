import React from 'react';
import type { Metadata } from 'next';
import AdminAnalyticsView from '@/components/views/admin/AnalyticsView';

export const metadata: Metadata = {
  title: "Traffic Analytics | Asstudio Admin",
  description: "Monitor live traffic and user activity.",
};

export default function AdminAnalyticsPage() {
  return <AdminAnalyticsView />;
}