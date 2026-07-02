import React from 'react';
import type { Metadata } from 'next';
import FAQView from '@/components/views/support/FAQView';

const SITE_URL = 'https://asstudio.com.ng';

export const metadata: Metadata = {
  title: "FAQ | Asstudio Support",
  description: "Find answers to frequently asked questions about Asstudio. Learn about file downloads, license agreements, payment methods, and how to load our sample packs or VST presets.",
  
  // High-value search keywords targeted for the FAQ and Help section
  keywords: [
    "asstudio faq", "asstudio help", "how to load sample packs", 
    "vst license agreement", "asstudio refund policy", "download issues"
  ],

  // ALLOW Google to crawl and index your FAQ page for search snippets
  robots: {
    index: true,
    follow: true,
  },

  // OPEN GRAPH (Facebook, WhatsApp, Telegram, Discord)
  openGraph: {
    title: "Frequently Asked Questions | Asstudio Support",
    description: "Got questions? Find instant answers regarding accounts, sound licenses, and product downloads.",
    url: `${SITE_URL}/faq`,
    siteName: "Asstudio",
    images: [
      {
        url: `${SITE_URL}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
        alt: "Asstudio Help & FAQ Portal",
      },
    ],
    type: "website",
  },

  // X / TWITTER CONFIGURATION
  twitter: {
    card: "summary",
    title: "FAQ | Asstudio Help Center",
    description: "Quick answers to help you get back to creating music without interruptions.",
    images: [`${SITE_URL}/android-chrome-512x512.png`],
  },
};

export default function FAQPage() {
  return <FAQView />;
}
