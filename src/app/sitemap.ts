import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

const SITE_URL = 'https://asstudio.com.ng';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Define your static, public routes that you want Google to index
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0, // Primary landing page
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9, // Main storefront hub
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/forgot-password`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/licensing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 2. Fetch all dynamic product slugs from Firestore to add them automatically
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const snapshot = await adminDb.collection('products').get();
    
    productRoutes = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Fallback to document ID if slug field isn't set
      const identifier = data.slug || doc.id; 
      
      return {
        url: `${SITE_URL}/product/${identifier}`,
        lastModified: new Date(), // If you have an updatedAt timestamp field, use new Date(data.updatedAt) instead
        changeFrequency: 'weekly',
        priority: 0.8, // Product pages are high value for search intent
      };
    });
  } catch (error) {
    console.error('Sitemap Firestore generation error:', error);
  }

  // 3. Combine your static routes and dynamic product pages
  // NOTE: Private /dashboard routes are explicitly skipped to keep user accounts secure and unindexed.
  return [...staticRoutes, ...productRoutes];
}
