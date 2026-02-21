import React from 'react';
import { Metadata } from 'next';
import UserDashboardContent from "@/Dashboard/dashboard";

// Define your base URL (replace with your actual domain)
const SITE_URL = 'https://asstudio.vercel.app/';

export const metadata: Metadata = {
  title: 'My Account | A.S STUDIO',
  description: 'Manage your digital assets, downloads, and profile settings at A.S STUDIO.',
  
  // 1. PRIVACY: Keep dashboard out of Google Search
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },

  // 2. FACEBOOK / WHATSAPP / DISCORD (Open Graph)
  openGraph: {
    title: 'User Dashboard | A.S STUDIO',
    description: 'Access your premium beats, kits, and exclusive content.',
    url: `${SITE_URL}/dashboard`,
    siteName: 'A.S STUDIO',
    images: [
      {
        url: `${SITE_URL}/android-chrome-512x512.png`, // A clean, professional dashboard preview image
        width: 1200,
        height: 630,
        alt: 'A.S STUDIO User Portal',
      },
    ],
    type: 'website',
  },

  // 3. X / TWITTER
  twitter: {
    card: 'summary_large_image',
    title: 'My Dashboard | A.S STUDIO',
    description: 'Manage your music production assets.',
    images: [`${SITE_URL}/android-chrome-512x512.png`],
    creator: '@asstudio_official',
  },
};

export default function page() {
  return (
    <main>
       <UserDashboardContent />
    </main>
  );
}
