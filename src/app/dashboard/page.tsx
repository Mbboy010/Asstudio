import React from 'react';
import { Metadata } from 'next';
import UserDashboardContent from "@/components/dashboard/Dashboard";

// Updated base URL to match your permanent custom domain
const SITE_URL = 'https://asstudio.com.ng';

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Manage your digital assets, downloads, and profile settings at ASstudio.',
  
  // 1. PRIVACY: Keep dashboard pages out of public Google Search results
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },

  // 2. OPEN GRAPH (Facebook / WhatsApp / Telegram)
  openGraph: {
    title: 'User Dashboard | Asstudio',
    description: 'Access your premium sound kits, VST presets, and download history.',
    url: `${SITE_URL}/dashboard`,
    siteName: 'Asstudio',
    images: [
      {
        url: `${SITE_URL}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
        alt: 'Asstudio User Portal',
      },
    ],
    type: 'website',
  },

  // 3. X / TWITTER
  twitter: {
    card: 'summary',
    title: 'My Dashboard | Asstudio',
    description: 'Manage your music production assets.',
    images: [`${SITE_URL}/android-chrome-512x512.png`],
  },
};

export default function page() {
  return (
    <main>
       <UserDashboardContent />
    </main>
  );
}
