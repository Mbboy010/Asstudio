import React from 'react';
import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Layout as MainLayout } from "@/components/Layout"; 

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const firaCode = Fira_Code({ subsets: ["latin"], variable: '--font-fira-code' });

export const metadata: Metadata = {
  // 1. Tell Next.js your domain so it can find images in the /public folder
  metadataBase: new URL('https://asstudio.com'), 
  
  title: "Asstudio | Future of Sound",
  description: "A high-end, futuristic marketplace for music studio tools, offering sample packs, presets, and audio software with a cyber-aesthetic interface.",
  keywords: ["vst plugins", "sample packs", "presets", "audio software", "music production"],
  
  openGraph: {
    title: "Asstudio | Future of Sound",
    description: "Premium audio tools for modern producers.",
    url: "https://asstudio.com",
    siteName: "Asstudio",
    images: [
      {
        // 2. Point to the image in your public folder
        url: "/android-chrome-512x512.png", 
        width: 512,
        height: 512,
        alt: "Asstudio Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  
  // 3. Twitter/X requires its own object to display properly
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
      <body className={`${inter.variable} ${firaCode.variable} font-sans`}>
        <Providers>
            {/* We wrap the inner content with the existing Layout component for Navbar/Footer */}
            <MainLayout> 
              {children}
            </MainLayout>
        </Providers>
      </body>
    </html>
  );
}
