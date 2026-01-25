import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import ProductDetailContent from '@/pages/ProductDetail'; 
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

// 1. Update Props: params and searchParams are now Promises
type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Generate Dynamic SEO Metadata
export async function generateMetadata(
  { params }: Props, // Note: You can also keep this as 'props: Props' and destructure inside
  parent: ResolvingMetadata
): Promise<Metadata> {
  // 2. Await the params before accessing the id
  const { id } = await params;
  
  try {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const product = docSnap.data();
        return {
            title: `${product.name} | Asstudio`,
            description: product.description ? product.description.substring(0, 160) : "Check out this product on Asstudio.",
            openGraph: {
                images: product.image ? [product.image] : [],
            },
        };
    }
  } catch (error) {
    console.error("Metadata fetch error", error);
  }

  return {
    title: "Product Details | Asstudio",
    description: "View product details.",
  };
}

// 3. Make the Page component async and await params (if you need to use them here)
export default async function ProductPage({ params }: Props) {
  // Even if you don't use 'id' right here, it is good practice to await it
  // to satisfy the type definition if strict mode is on.
  const { id } = await params; 
  
  // If ProductDetailContent needs the ID, pass it as a prop:
  // return <ProductDetailContent id={id} />;
  
  return <ProductDetailContent />;
}
