import React from 'react';
import type { Metadata } from 'next';
import LicensingView from '@/components/views/support/LicensingView';

const SITE_URL = 'https://asstudio.com.ng';

export const metadata: Metadata = {
  title: "Licensing Agreement | Asstudio",
  description: "Review our clear, royalty-free license agreements. Learn how you can safely use Asstudio sample packs, loops, sound kits, and VST configurations in your commercial music productions.",
  
  // High-value legal and production search keywords
  keywords: [
    "asstudio licensing", "royalty free license agreement", "commercial use sound kits", 
    "music sample clearance", "asstudio terms of use", "beat license rules"
  ],

  // ALLOW Google to crawl and index your license terms for clear search results
  robots: {
    index: true,
    follow: true,
  },

  // OPEN GRAPH (Facebook, WhatsApp, Telegram, Discord)
  openGraph: {
    title: "Royalty-Free Licensing Terms | Asstudio",
    description: "Understand your rights. Read our straightforward music licensing agreement for commercial and personal audio projects.",
    url: `${SITE_URL}/licensing`,
    siteName: "Asstudio",
    images: [
      {
        url: `${SITE_URL}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
        alt: "Asstudio Licensing and Rights Management",
      },
    ],
    type: "website",
  },

  // X / TWITTER CONFIGURATION
  twitter: {
    card: "summary",
    title: "Licensing Agreement | Asstudio",
    description: "Clear and secure commercial usage guidelines for modern music producers.",
    images: [`${SITE_URL}/android-chrome-512x512.png`],
  },
};

export default function LicensingPage() {
  return <LicensingView />;
}
