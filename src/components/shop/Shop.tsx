'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react'; 
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Eye, ChevronLeft, ChevronRight, Cpu, Star, Download, RefreshCcw, Image as ImageIcon, Loader, Filter, CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { Product, ProductCategory } from '@/types';
import { ProductSkeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, getDocs, query, orderBy, addDoc, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';

const ITEMS_PER_PAGE = 12;

interface DownloadableProduct extends Product {
  demoUrl?: string;
  productUrl?: string;
}

const ShopContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Custom Alert State ---
  const [alertConfig, setAlertConfig] = useState({ 
    show: false, 
    message: '', 
    type: 'success' as 'success' | 'error' | 'info' 
  });

  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertConfig({ show: true, message, type });
  };

  const [loading, setLoading] = useState(true);
  const selectedCategory = searchParams?.get('category') ?? 'All';
  const urlSearchTerm = searchParams?.get('search') ?? '';

  const [localSearchTerm, setLocalSearchTerm] = useState(urlSearchTerm);
  const [products, setProducts] = useState<Product[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      // Logic for user state if needed later
    });
    return () => unsubscribe();
  }, []);

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
      showAlert("Failed to load products.", "error");
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
            showAlert(`Account not verified. Link sent to ${currentUser.email}.`, "error");
          } catch (error: unknown) {
                const firebaseError = error as { code?: string }; 
                if (firebaseError.code === 'auth/too-many-requests') {
                    showAlert("Verification email already sent.", "error");
                } else {
                    showAlert("Verification failed.", "error");
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
            showAlert(`${product.name} added to cart!`, "success");
          } catch (error) {
            console.error("Add to cart failed:", error);
            showAlert("Failed to add item to cart.", "error");
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

      const p = product as DownloadableProduct;
      if (isDemo && p?.demoUrl) {
        window.open(p.demoUrl, '_blank');
      } else if (!isDemo && p?.productUrl) {
        window.open(p.productUrl, '_blank');
      } else {
        showAlert("Download link missing.", "error");
      }
      
    } catch (error) {
      console.error("Download action failed:", error);
      showAlert("Download failed.", "error");
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

      {/* Product Display Grid formatted exactly like 1000632389.jpg */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 min-h-[600px]">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
        ) : currentItems.length > 0 ? (
          currentItems.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col p-3 sm:p-4"
            >
              {/* Image Frame Wrapper with internal padding matching 1000632389.jpg */}
              <Link href={`/product/${product.id}`} className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-zinc-800/50 rounded-xl block cursor-pointer p-4 flex items-center justify-center">
                {product.image ? (
                   <img 
                    src={product.image} 
                    alt={product.name}
                    className="object-contain max-w-full max-h-full rounded-md group-hover:scale-102 transition-transform duration-500" 
                   />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50 dark:bg-zinc-800">
                      <ImageIcon className="w-10 h-10 opacity-40" />
                   </div>
                )}

                {/* Category Pill Tag */}
                <div className="absolute top-2 left-2 z-10">
                  <div className="bg-black/75 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                    {product.category === ProductCategory.VST_PLUGIN ? 'VST Plugin' : 'Sample Pack'}
                  </div>
                </div>

                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px] z-20">
                   <div className="p-2 bg-white text-black rounded-full shadow-lg">
                      <Eye className="w-4 h-4" />
                   </div>
                </div>
              </Link>

              {/* Text Layout Matching 1000632389.jpg */}
              <div className="pt-4 flex flex-col flex-grow">
                <Link href={`/product/${product.id}`} className="hover:text-rose-500 transition-colors block mb-3">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base line-clamp-1">
                    {product.name}
                  </h3>
                </Link>

                {/* Bottom Row: Price Left, Star Rating Right */}
                <div className="mt-auto flex justify-between items-center text-sm font-bold">
                   <span className="text-rose-600 dark:text-rose-500 tracking-wide font-mono">
                      {product.price === 0 ? 'FREE' : `₦${product.price}`}
                   </span>
                   <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                     <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" /> 
                     {product.rating || 5}
                   </span>
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

      {/* --- Centered Modal Alert --- */}
      <AnimatePresence>
        {alertConfig.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setAlertConfig(prev => ({ ...prev, show: false }))}
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm flex flex-col items-center text-center gap-3 p-8 rounded-3xl shadow-2xl border bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800"
            >
              {/* Close Button (Top Right) */}
              <button 
                onClick={() => setAlertConfig(prev => ({ ...prev, show: false }))} 
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Centered Icon */}
              <div className={`p-4 rounded-full mb-2 ${
                alertConfig.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                alertConfig.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {alertConfig.type === 'success' && <CheckCircle className="w-10 h-10" />}
                {alertConfig.type === 'error' && <AlertCircle className="w-10 h-10" />}
                {alertConfig.type === 'info' && <Info className="w-10 h-10" />}
              </div>
              
              {/* Text Content */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {alertConfig.type === 'success' ? 'Success!' : alertConfig.type === 'error' ? 'Oops!' : 'Notice'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                {alertConfig.message}
              </p>
              
              {/* Action Button */}
              <button 
                onClick={() => setAlertConfig(prev => ({ ...prev, show: false }))}
                className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                   alertConfig.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                   alertConfig.type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                   'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Okay
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
