import React from 'react';
import type { Metadata } from 'next';
import SignupView from '@/components/views/auth/SignupView';

const SITE_URL = 'https://asstudio.com.ng';

export const metadata: Metadata = {
  title: "Create an Account",
  description: "Join the Asstudio community today. Create your creator account to download premium sample packs, unlock exclusive VST presets, and access next-gen music production tools.",
  
  // High-value search keywords optimized for your audio registration page
  keywords: [
    "register asstudio", "create asstudio account", "sign up asstudio", 
    "join music production marketplace", "free sound kits download"
  ],

  // ALLOW Google to crawl and list your sign-up portal in search results
  robots: {
    index: true,
    follow: true,
  },

  // OPEN GRAPH (Facebook, WhatsApp, Telegram, Discord)
  openGraph: {
    title: "Join Asstudio | Next-Gen Sound Marketplace",
    description: "Create your account today and unlock a futuristic platform built for modern music producers.",
    url: `${SITE_URL}/register`,
    siteName: "Asstudio",
    images: [
      {
        url: `${SITE_URL}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
        alt: "Asstudio Account Registration",
      },
    ],
    type: "website",
  },

  // X / TWITTER CONFIGURATION
  twitter: {
    card: "summary",
    title: "Join Asstudio | Registration Portal",
    description: "Sign up to start expanding your audio library with premium, high-end production assets.",
    images: [`${SITE_URL}/android-chrome-512x512.png`],
  },
};

export default function SignupPage() {
  return <SignupView />;
}
