import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebaseAdmin';
import ProductDetailContent from "@/pages/ProductDetailContent";

type Props = {
  params: Promise<{ id: string }>;
};

// Helper to clean HTML for Meta Tags
const stripHtml = (html: string) => html?.replace(/<[^>]*>?/gm, '').substring(0, 160) || '';

async function getProduct(id: string) {
  try {
    // 1. Try fetching by Document ID
    const docRef = adminDb.collection('products').doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() };
    }

    // 2. Fallback: Search by "slug" field (matches your Appwrite style)
    const querySnapshot = await adminDb
      .collection('products')
      .where('slug', '==', id)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }

    return null;
  } catch (error) {
    console.error('Admin Firestore Error:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product: any = await getProduct(id);

  if (!product) return { title: 'Product Not Found' };

  const title = `${product.name} | AS Studio`;
  const description = stripHtml(product.description || 'Exclusive digital assets.');
  const imageUrl = product.image || 'https://asbeatcloud.vercel.app/og-default.jpg';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
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

export default async function Page({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) notFound();

  return (
    <main>
      {/* Pass the server-fetched data to your Client Component */}
      <ProductDetailContent product={product} />
    </main>
  );
}
