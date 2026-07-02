import React from 'react';
import type { Metadata } from 'next';
import ContactView from '@/components/views/support/ContactView';

const SITE_URL = 'https://asstudio.com.ng';

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Asstudio support team. Reach out for inquiries regarding your account, product licensing, or developer partnership opportunities.",
  
  // High-value search keywords targeted for the contact page
  keywords: [
    "contact asstudio", "asstudio support", "asstudio help desk", 
    "music production store support", "sound kit inquiries"
  ],

  // ALLOW Google to crawl and index your contact page
  robots: {
    index: true,
    follow: true,
  },

  // OPEN GRAPH (Facebook, WhatsApp, Telegram, Discord)
  openGraph: {
    title: "Contact Us | Asstudio Support Portal",
    description: "Have questions about our sound packs or VST presets? Contact the Asstudio help desk for fast assistance.",
    url: `${SITE_URL}/contact`,
    siteName: "Asstudio",
    images: [
      {
        url: `${SITE_URL}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
        alt: "Asstudio Customer Support",
      },
    ],
    type: "website",
  },

  // X / TWITTER CONFIGURATION
  twitter: {
    card: "summary",
    title: "Contact Us | Asstudio Support",
    description: "Reach out to Asstudio for customer help and account inquiries.",
    images: [`${SITE_URL}/android-chrome-512x512.png`],
  },
};

export default function ContactPage() {
  return <ContactView />;
}
