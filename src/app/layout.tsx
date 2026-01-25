import React from 'react';
import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Layout as MainLayout } from "@/components/Layout"; 

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const firaCode = Fira_Code({ subsets: ["latin"], variable: '--font-fira-code' });

export const metadata: Metadata = {
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
        url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
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
            {/* Note: You might need to refactor Layout.tsx to remove BrowserRouter if it exists inside it */}
            <MainLayout> 
              {children}
            </MainLayout>
        </Providers>
      </body>
    </html>
  );
}