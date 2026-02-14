import React from 'react';
import type { Metadata } from 'next';
import FAQView from '@/components/views/support/FAQView';

export const metadata: Metadata = {
  title: "FAQ | Asstudio Support",
  description: "Frequently Asked Questions about our products and services.",
};

export default function FAQPage() {
  return <FAQView />;
}