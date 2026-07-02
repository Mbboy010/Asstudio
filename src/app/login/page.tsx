import React from 'react';
import type { Metadata } from 'next';
import LoginView from '@/components/views/auth/LoginView';

const SITE_URL = 'https://asstudio.com.ng';

export const metadata: Metadata = {
  title: "Sign In to Asstudio",
  description: "Access your Asstudio account to manage your music production assets, download premium sample packs, and continue your creative journey. Sign in to your dashboard here.",
  
  // High-value search keywords targeted for the entry portal
  keywords: [
    "asstudio login", "sign in asstudio", "music producer login", 
    "sample pack downloads", "sound kits", "vst presets"
  ],

  // ALLOW Google to crawl and index your login page
  robots: {
    index: true,
    follow: true,
  },

  // OPEN GRAPH (Facebook, WhatsApp, Telegram, Discord)
  openGraph: {
    title: "Sign In to Asstudio | Creator Access",
    description: "Log into your portal to instantly access your premium sound kits, audio samples, and account balance.",
    url: `${SITE_URL}/login`,
    siteName: "ASstudio",
    images: [
      {
        url: `${SITE_URL}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
        alt: "Asstudio Portal Login",
      },
    ],
    type: "website",
  },

  // X / TWITTER CONFIGURATION
  twitter: {
    card: "summary",
    title: "Sign In to Asstudio",
    description: "Log into your account to manage your custom sound templates and music creation files.",
    images: [`${SITE_URL}/android-chrome-512x512.png`],
  },
};

export default function LoginPage() {
  return <LoginView />;
}
