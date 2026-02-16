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

// Replace this with your actual production domain
const SITE_URL = 'https://as-studio.com'; 
const DEFAULT_OG_IMAGE = '/og-shop-preview.jpg'; // Place this in your /public folder

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const { q, category, search } = params;
  const searchTerm = q || search;
  
  // 1. Dynamic Title Logic
  let title = 'Shop Premium Sounds, Kits & Plugins | A.S STUDIO';
  if (searchTerm && category) {
    title = `Searching "${searchTerm}" in ${category} | A.S STUDIO`;
  } else if (searchTerm) {
    title = `Results for "${searchTerm}" | A.S STUDIO`;
  } else if (category) {
    title = `Browse ${category} | A.S STUDIO`;
  }

  // 2. Dynamic Description Logic
  const description = category 
    ? `Explore our professional collection of ${category}. ${searchTerm ? `Found items for "${searchTerm}".` : ''} Elevate your music production with A.S STUDIO assets.`
    : `Download industry-standard sample packs, drum kits, and VST presets. The ultimate marketplace for FL Studio Mobile and desktop producers.`;

  // 3. Construct the URL for Canonical
  const url = `${SITE_URL}/shop${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ''}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    // --- FACEBOOK / WHATSAPP / DISCORD / LINKEDIN (OpenGraph) ---
    openGraph: {
      title,
      description,
      url,
      siteName: 'A.S STUDIO',
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: 'A.S STUDIO Digital Marketplace',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    // --- X / TWITTER ---
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
      creator: '@asstudio_official', // Replace with your actual X handle
      site: '@asstudio_official',
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
       {/* Use <h1 className="sr-only"> for Screen Readers/SEO if your Shop component doesn't have an H1 */}
       <Shop />
    </main>
  );
}
