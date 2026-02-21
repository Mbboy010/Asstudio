'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react'; 
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Eye, ChevronLeft, ChevronRight, Cpu, Star, Download, RefreshCcw, Image as ImageIcon, Loader, Filter, CheckCircle, XCircle } from 'lucide-react';
import { Product, ProductCategory } from '@/types';
import { ProductSkeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import Image from 'next/image'; // 1. Added Next.js Image component
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, getDocs, query, orderBy, addDoc, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';

const ITEMS_PER_PAGE = 12;

// 2. Define an interface for Product that includes optional download URLs 
// to avoid using 'any'
interface DownloadableProduct extends Product {
  demoUrl?: string;
  productUrl?: string;
}

const ShopContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Removed unused 'user' state to clear linting warning
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const selectedCategory = searchParams?.get('category') ?? 'All';
  const urlSearchTerm = searchParams?.get('search') ?? '';

  const [localSearchTerm, setLocalSearchTerm] = useState(urlSearchTerm);
  const [products, setProducts] = useState<Product[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Auth Listener (Simplified)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      // Logic for user state if needed later
    });
    return () => unsubscribe();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    setLocalSearchTerm(urlSearchTerm);
  }, [urlSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchTerm !== urlSearchTerm) {
        const params = new URLSearchParams(searchParams?.toString() ?? '');
        if (localSearchTerm) {
          params.set('search', localSearchTerm);
        } else {
          params.delete('search');
        }
        router.replace(`/shop?${params.toString()}`);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearchTerm, searchParams, router, urlSearchTerm]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "products"), orderBy("uploadDate", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedProducts: Product[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedProducts.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setProducts(fetchedProducts);
    } catch (error: unknown) {
      console.error("Error fetching products: ", error);
      showNotification('error', "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const checkAuthAndVerification = async () => {
    if (!auth.currentUser) {
        router.push('/login');
        return false;
    }
    const currentUser = auth.currentUser;
    try { await currentUser.reload(); } catch(e) { console.error("User reload failed", e); }
    
    if (!currentUser.emailVerified) {
        try {
            await sendEmailVerification(currentUser);
            showNotification('error', `Account not verified. Link sent to ${currentUser.email}.`);
          } catch (error: unknown) {
                const firebaseError = error as { code?: string }; // Cast the type here instead
                if (firebaseError.code === 'auth/too-many-requests') {
                    showNotification('error', "Verification email already sent.");
                } else {
                    showNotification('error', "Verification failed.");
                }
          }

        return false;
    }
    return true;
  };

  const handleAddToCart = async (product: Product) => {
      const allowed = await checkAuthAndVerification();
      const currentUser = auth.currentUser;
      
      if (allowed && currentUser) {
          try {
            const cartItemRef = doc(db, 'users', currentUser.uid, 'cart', product.id);
            await setDoc(cartItemRef, {
                ...product,
                quantity: 1,
                addedAt: new Date().toISOString()
            });
            showNotification('success', `${product.name} added to cart!`);
          } catch (error) {
            console.error("Add to cart failed:", error);
            showNotification('error', "Failed to add item to cart.");
          }
      }
  };

  const handleDownload = async (product: Product, isDemo: boolean = false) => {
    const isFree = product?.price === 0;
    const needsAuth = !isDemo && !isFree;

    if (needsAuth) {
      const allowed = await checkAuthAndVerification();
      if (!allowed) return;
    }

    setDownloadingId(product.id);
    
    try {
      const currentUser = auth.currentUser;

      if (!isDemo && isFree && currentUser && product) {
        try {
          await addDoc(collection(db, "orders"), {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            items: [{...product, quantity: 1}],
            total: 0,
            status: 'Completed',
            createdAt: new Date().toISOString()
          });
        } catch (e) {
          console.error("Background order recording failed:", e);
        }
      }

      // 3. FIXED: Cast to DownloadableProduct instead of 'any'
      const p = product as DownloadableProduct;
      if (isDemo && p?.demoUrl) {
        window.open(p.demoUrl, '_blank');
      } else if (!isDemo && p?.productUrl) {
        window.open(p.productUrl, '_blank');
      } else {
        showNotification('error', "Download link missing.");
      }
      
    } catch (error) {
      console.error("Download action failed:", error);
      showNotification('error', "Download failed.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCategoryChange = (cat: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      if (cat === 'All') {
          params.delete('category');
      } else {
          params.set('category', cat);
      }
      router.push(`/shop?${params.toString()}`);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(urlSearchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [urlSearchTerm, selectedCategory]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    router.push('/shop');
    setLocalSearchTerm('');
    fetchProducts();
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gray-50 dark:bg-black transition-colors duration-300 relative">
      
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold ${
              notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
         initial={{ opacity: 0, y: -20 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: false }}
         className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 border-b border-gray-200 dark:border-zinc-800 pb-8"
      >
        <div className="w-full text-left">
           <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 uppercase">Explore Sounds</h1>
           <p className="text-gray-500 font-medium">Over {products.length}+ premium tools available.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
           <div className="relative w-full sm:w-auto">
             <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
             <input 
               type="text" 
               placeholder="Search plugins, packs..." 
               value={localSearchTerm}
               onChange={(e) => setLocalSearchTerm(e.target.value)}
               className="pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl w-full sm:w-64 focus:ring-2 focus:ring-rose-500 outline-none transition-all shadow-sm"
             />
           </div>

           <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto no-scrollbar">
             {['All', ...Object.values(ProductCategory)].map(cat => (
               <button
                 key={cat}
                 onClick={() => handleCategoryChange(cat)}
                 className={`px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                   selectedCategory === cat 
                   ? 'bg-rose-600 text-white shadow-lg' 
                   : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-800 hover:text-gray-900 dark:hover:text-white'
                 }`}
               >
                 {cat === ProductCategory.VST_PLUGIN && <Cpu className="w-4 h-4" />}
                 {cat}
               </button>
             ))}
           </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
        ) : currentItems.length > 0 ? (
          currentItems.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <Link href={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-zinc-800 block cursor-pointer">
                {product.image ? (
                   // 4. FIXED: Replaced <img> with optimized <Image />
                   <Image 
                    src={product.image} 
                    alt={product.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" 
                   />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50 dark:bg-zinc-800">
                      <ImageIcon className="w-12 h-12 opacity-50" />
                   </div>
                )}

                <div className="absolute top-3 left-3">
                    {product.category === ProductCategory.VST_PLUGIN && (
                        <div className="bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 uppercase tracking-wider flex items-center gap-1">
                            <Cpu className="w-3 h-3" /> VST
                        </div>
                    )}
                </div>

                {product.price === 0 && (
                     <div className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                        Free
                    </div>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                   <div className="p-3 bg-white text-black rounded-full shadow-xl">
                      <Eye className="w-5 h-5" />
                   </div>
                </div>
              </Link>

              <div className="p-5 flex flex-col flex-grow">
                 <div className="flex justify-between items-start mb-3">
                   <div className="flex-1 pr-2 overflow-hidden">
                      <Link href={`/product/${product.id}`} className="hover:text-rose-600 transition-colors block">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">{product.name}</h3>
                      </Link>
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mt-1 uppercase">
                         {product.category}
                         <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-700"></span>
                         <span className="flex items-center gap-0.5 text-yellow-500"><Star className="w-3 h-3 fill-current" /> {product.rating}</span>
                      </div>
                   </div>
                   <span className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                      {product.price === 0 ? 'FREE' : `₦${product.price}`}
                   </span>
                 </div>

                 <div className="mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800">
                    {product.price === 0 ? (
                        <button 
                            onClick={() => handleDownload(product)}
                            disabled={downloadingId === product.id}
                            className="w-full py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-rose-600 hover:text-white transition-all rounded-lg font-bold flex items-center justify-center gap-2 text-sm"
                        >
                            {downloadingId === product.id ? <Loader className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />} Download
                        </button>
                    ) : (
                        <button 
                            onClick={() => handleAddToCart(product)}
                            className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white dark:hover:text-white transition-all rounded-lg font-bold flex items-center justify-center gap-2 text-sm"
                        >
                            <ShoppingCart className="w-4 h-4" /> Add to Cart
                        </button>
                    )}
                 </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-white dark:bg-zinc-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 text-center">
             <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Filter className="w-10 h-10 text-gray-400" />
             </div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No products found</h2>
             <p className="text-gray-500 mb-8">We couldn&apos;t find any items matching your filters.</p>
             <button onClick={handleResetFilters} className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors">
               <RefreshCcw className="w-4 h-4" /> Clear Filters
             </button>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-16 flex justify-center items-center gap-2">
            <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-3 rounded-xl border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
                <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>

            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-1.5 shadow-sm">
                {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                        key={idx + 1}
                        onClick={() => handlePageChange(idx + 1)}
                        className={`w-10 h-10 rounded-lg font-bold transition-all ${
                            currentPage === idx + 1
                            ? 'bg-rose-600 text-white shadow-lg'
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
                        }`}
                    >
                        {idx + 1}
                    </button>
                ))}
            </div>

            <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-3 rounded-xl border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
                <ChevronRight className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>
        </div>
      )}
    </div>
  );
};

export default function Shop() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black"><Loader className="w-8 h-8 animate-spin text-rose-600" /></div>}>
      <ShopContent />
    </Suspense>
  );
}
