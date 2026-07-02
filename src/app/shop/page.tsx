import React from 'react';
import { Metadata } from 'next';
import Shop from "@/components/shop/Shop";

type Props = {
  searchParams: Promise<{ 
    q?: string; 
    category?: string; 
    search?: string; 
  }>;
};

// Target domain for clean search indexing
const SITE_URL = 'https://asstudio.com.ng'; 
const DEFAULT_OG_IMAGE = '/android-chrome-512x512.png';

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const { q, category, search } = params;
  const searchTerm = q || search;
  
  // 1. Dynamic Title Logic with Asstudio Casing
  let title = 'Shop Premium Sounds, Kits & Plugins';
  if (searchTerm && category) {
    title = `Searching "${searchTerm}" in ${category} | Asstudio`;
  } else if (searchTerm) {
    title = `Results for "${searchTerm}" | Asstudio`;
  } else if (category) {
    title = `Browse ${category} | Asstudio`;
  }

  // 2. Dynamic Description Logic
  const description = category 
    ? `Explore our professional collection of ${category}. ${searchTerm ? `Found items for "${searchTerm}".` : ''} Elevate your music production with Asstudio assets.`
    : `Download industry-standard sample packs, drum kits, and VST presets. The ultimate marketplace for mobile and desktop producers.`;

  // 3. Construct the URL for Canonical
  const url = `${SITE_URL}/shop${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ''}`;

  return {
    title,
    description,
    keywords: [
      "asstudio shop", "buy sample packs", "vst presets", "drum kits", 
      "music tools marketplace", "audio plugins"
    ],
    alternates: {
      canonical: url,
    },
    // --- FACEBOOK / WHATSAPP / DISCORD / LINKEDIN (OpenGraph) ---
    openGraph: {
      title,
      description,
      url,
      siteName: 'Asstudio',
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 512,
          height: 512,
          alt: 'Asstudio Digital Marketplace',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    // --- X / TWITTER ---
    twitter: {
      card: 'summary',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    // --- SEARCH ENGINE INSTRUCTIONS ---
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // --- APP & MOBILE FAVICONS ---
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
    manifest: `${SITE_URL}/site.webmanifest`,
  };
}

export default async function ShopPage() {
  return (
    <main>
       <Shop />
    </main>
  );
}
