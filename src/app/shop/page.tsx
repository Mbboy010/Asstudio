import React from 'react';
import { Metadata } from 'next';
import Shop from "@/components/shop/Shop";

type Props = {
  searchParams: Promise<{ 
    q?: string; 
    category?: string; 
    search?: string; 
    page?: string;
  }>;
};

const SITE_URL = 'https://asstudio.com.ng'; 
const DEFAULT_OG_IMAGE = '/android-chrome-512x512.png';

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const { q, category, search } = params;
  const searchTerm = q || search;
  
  let title = 'Shop Premium Sounds, Kits & Plugins';
  if (searchTerm && category) {
    title = `Searching "${searchTerm}" in ${category} | Asstudio`;
  } else if (searchTerm) {
    title = `Results for "${searchTerm}" | Asstudio`;
  } else if (category) {
    title = `Browse ${category} | Asstudio`;
  }

  const description = category 
    ? `Explore our professional collection of ${category}. ${searchTerm ? `Found items for "${searchTerm}".` : ''} Elevate your music production with Asstudio assets.`
    : `Download industry-standard sample packs, drum kits, and VST presets. The ultimate marketplace for mobile and desktop producers.`;

  const url = `${SITE_URL}/shop${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ''}`;

  return {
    title,
    description,
    keywords: [
      "asstudio shop", "buy sample packs", "vst presets", "drum kits", 
      "music tools marketplace", "audio plugins"
    ],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Asstudio',
      images: [{ url: DEFAULT_OG_IMAGE, width: 512, height: 512, alt: 'Asstudio Digital Marketplace' }],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
    manifest: `${SITE_URL}/site.webmanifest`,
  };
}

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main>
       <Shop 
         initialSearch={params.q || params.search || ''} 
         initialCategory={params.category || ''} 
         initialPage={params.page ? parseInt(params.page, 10) : 1}
       />
    </main>
  );
}
