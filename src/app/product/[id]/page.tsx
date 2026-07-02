import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebaseAdmin';
import ProductDetailContent from "@/components/product/ProductDetailContent";

interface Product {
  id: string;
  name?: string;
  description?: string;
  image?: string;
  slug?: string;
  [key: string]: unknown;
}

const SITE_URL = 'https://asstudio.com.ng';

const stripHtml = (html: string) =>
  html?.replace(/<[^>]*>?/gm, '').substring(0, 160) || '';

async function getProduct(id: string): Promise<Product | null> {
  try {
    const docRef = adminDb.collection('products').doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }

    const querySnapshot = await adminDb
      .collection('products')
      .where('slug', '==', id)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Product;
    }

    return null;
  } catch (error) {
    console.error('Admin Firestore Error:', error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;

  const product = await getProduct(id);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const productName = product.name || 'Premium Audio Tool';
  const title = `${productName} | Asstudio`;
  const description = stripHtml(
    product.description || 'Download premium audio tools, sample packs, and VST presets on Asstudio.'
  );
  
  // Update fallback URL to your permanent domain
  const imageUrl = product.image || `${SITE_URL}/android-chrome-512x512.png`;

  // Dynamically generate targeted keywords matching the product name
  const dynamicKeywords = [
    productName.toLowerCase(),
    `${productName.toLowerCase()} download`,
    "asstudio",
    "sample packs",
    "vst presets",
    "sound kits",
    "music production"
  ];

  return {
    title,
    description,
    keywords: dynamicKeywords,
    
    // Allow Google to index all your unique product pages
    robots: {
      index: true,
      follow: true,
    },
    
    openGraph: {
      title,
      description,
      url: product.slug ? `${SITE_URL}/product/${product.slug}` : `${SITE_URL}`,
      siteName: 'Asstudio',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: productName }],
      type: 'website',
    },
    
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function Page(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await getProduct(id);

  if (!product) {
    console.log(product);
    notFound();
  }

  return (
    <main>
      <ProductDetailContent />
    </main>
  );
}
