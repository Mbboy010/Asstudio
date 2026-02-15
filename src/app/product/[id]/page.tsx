import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebaseAdmin';
import ProductDetailContent from "@/components/ProductDetailContent";

interface Product {
  id: string;
  name?: string;
  description?: string;
  image?: string;
  slug?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Allows for other dynamic firestore fields
}

type Props = {
  params: Promise<{ id: string }>;
};

const stripHtml = (html: string) => html?.replace(/<[^>]*>?/gm, '').substring(0, 160) || '';

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) return { title: 'Product Not Found' };

  const title = `${product.name || 'Product'} | AS Studio`;
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
      <ProductDetailContent />
    </main>
  );
}
