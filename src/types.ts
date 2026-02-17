
export enum ProductCategory {
  SAMPLE_PACK = 'Sample Pack',
  PRESET_PACK = 'Preset Pack',
  VST_PLUGIN = 'VST Plugin',
  DESKTOP_APP = 'Desktop App',
  MOBILE_APP = 'Mobile App'
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  image: string | null;
  file?: string | null; // Legacy field
  productUrl?: string | null; // New: External link or file URL
  downloadType?: 'file' | 'link';
  demoUrl?: string | null; // New: Audio demo URL
  description: string;
  rating: number;
  sales: number;
  features?: string[];
  isNew?: boolean;
  size?: string;
  tags?: string[];
  fileSize?: string;
  releaseDate?: string;
  uploadDate?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
  joinedAt: string;
  emailVerified: boolean;
  phone?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface AnalyticsData {
  name: string;
  value: number;
}