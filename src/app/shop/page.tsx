import React from 'react';
import type { Metadata } from 'next';
import ShopContent from '@/pages/Shop'; // We reuse the existing page component

export const metadata: Metadata = {
  title: "Shop | Asstudio",
  description: "Browse our catalog of high-quality VST plugins, sample packs, and presets.",
};

export default function ShopPage() {
  // ShopContent uses client-side hooks (useSearchParams), so it must be a client component.
  // We can wrap it here or ensure Shop.tsx has 'use client'
  return <ShopContent />;
}