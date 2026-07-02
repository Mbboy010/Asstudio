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
  // Tell Next.js your domain so it can find images in the /public folder
  metadataBase: new URL('https://asstudio.vercel.app'), 
  
  title: "Asstudio | Future of Sound",
  description: "A high-end, futuristic marketplace for music studio tools, offering sample packs, presets, and audio software with a cyber-aesthetic interface.",
  keywords: ["vst plugins", "sample packs", "presets", "audio software", "music production"],
  
  openGraph: {
    title: "Asstudio | Future of Sound",
    description: "Premium audio tools for modern producers.",
    url: "https://asstudio.vercel.app",
    siteName: "Asstudio",
    images: [
      {
        // Point to the image in your public folder
        url: "/android-chrome-512x512.png", 
        width: 512,
        height: 512,
        alt: "Asstudio Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  
  // Twitter/X requires its own object to display properly
  twitter: {
    card: "summary", // Use "summary" for square images like your 512x512 logo
    title: "Asstudio | Future of Sound",
    description: "Premium audio tools for modern producers.",
    images: ["/android-chrome-512x512.png"],
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
