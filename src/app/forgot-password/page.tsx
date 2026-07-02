import React from 'react';
import type { Metadata } from 'next';
import ForgotPasswordView from '@/components/views/auth/ForgotPasswordView';

const SITE_URL = 'https://asstudio.com.ng';

export const metadata: Metadata = {
  title: "Reset Password | Asstudio",
  description: "Securely recover your Asstudio creator account. Reset your password to regain instant access to your premium sound packs, production tools, and digital wallet.",
  
  // High-value search keywords targeted for the recovery portal
  keywords: [
    "asstudio forgot password", "reset password asstudio", "recover asstudio account", 
    "forgot password sound kits", "asstudio help"
  ],

  // ALLOW Google to crawl and display this account recovery page in search results
  robots: {
    index: true,
    follow: true,
  },

  // OPEN GRAPH (Facebook, WhatsApp, Telegram, Discord)
  openGraph: {
    title: "Reset Password | Asstudio",
    description: "Securely recover your creator account and regain access to your music assets.",
    url: `${SITE_URL}/forgot-password`,
    siteName: "Asstudio",
    images: [
      {
        url: `${SITE_URL}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
        alt: "Asstudio Password Recovery",
      },
    ],
    type: "website",
  },

  // X / TWITTER CONFIGURATION
  twitter: {
    card: "summary",
    title: "Reset Password | Asstudio",
    description: "Recover your Asstudio account access safely.",
    images: [`${SITE_URL}/android-chrome-512x512.png`],
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
