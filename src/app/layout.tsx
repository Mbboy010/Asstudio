import React from 'react';
import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Layout as MainLayout } from "@/components/Layout"; 

import { AuthProvider } from "./AuthContext";
import AuthGuard from "./AuthGuard";
import { CookieConsent } from "@/components/CookieConsent";

// 1. Import the official Google Analytics tracker tool for Next.js
import { GoogleAnalytics } from '@next/third-parties/google';

// 2. Import Next.js Script component for safe third-party scripts
import Script from 'next/script';

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const firaCode = Fira_Code({ subsets: ["latin"], variable: '--font-fira-code' });

export const metadata: Metadata = {
  // Point to your live custom domain for clean search indexing
  metadataBase: new URL('https://asstudio.com.ng'), 
  
  title: "Asstudio | Next-Gen Music Tools & Sound Packs",
  description: "The ultimate cyber-aesthetic marketplace for modern music producers. Access premium, high-end sample packs, VST presets, drum kits, and audio software designed for the future of sound.",
  keywords: [
    "asstudio", "as studio music", "futuristic sound packs", "premium sample packs", 
    "vst presets", "audio software", "music production tools", "hausa drum packs", 
    "amapiano loop kits", "cyberpunk audio marketplace"
  ],
  authors: [{ name: "Mbboy" }],
  creator: "Mbboy",
  
  openGraph: {
    title: "Asstudio | Next-Gen Music Tools & Sound Packs",
    description: "Step into the future of sound. Download premium sample packs, VST presets, and elite production software.",
    url: "https://asstudio.com.ng",
    siteName: "ASstudio",
    images: [
      {
        url: "/android-chrome-512x512.png", 
        width: 512,
        height: 512,
        alt: "Asstudio - Future of Sound",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  
  twitter: {
    card: "summary_large_image",
    title: "Asstudio | Next-Gen Music Tools & Sound Packs",
    description: "Premium sound design tools, sample packs, and custom VST presets with a high-end cyber interface.",
    images: ["/android-chrome-512x512.png"],
  },
  
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* 3. Official Google AdSense Integration */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9241182560906060"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${inter.variable} ${firaCode.variable} font-sans`}>
        
        <AuthProvider>
          <AuthGuard>
           <Providers>
            {/* We wrap the inner content with the existing Layout component for Navbar/Footer */}
            <MainLayout> 
              {children}
              <CookieConsent />
            </MainLayout>
           </Providers>
          </AuthGuard>
         </AuthProvider>

        {/* 4. Google Analytics Tracking Code */}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-JBG8LVZNR3'} />
      </body>
    </html>
  );
}
