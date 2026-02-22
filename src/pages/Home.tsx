'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Zap, Layers, Smartphone, Cpu, Sliders, 
  Star, Image as ImageIcon, Activity, Music, Download, Monitor
} from 'lucide-react';
import { ProductCategory, Product } from '@/types';
import { HeroSkeleton } from '@/components/ui/Skeleton';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase';

// --- Animation Variants ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const HomeContent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [latestPlugins, setLatestPlugins] = useState<Product[]>([]);
  const [presetPacks, setPresetPacks] = useState<Product[]>([]);
  const [samplePacks, setSamplePacks] = useState<Product[]>([]);
  
  // NEW: State for Mobile and Desktop apps
  const [mobileApps, setMobileApps] = useState<Product[]>([]);
  const [desktopApps, setDesktopApps] = useState<Product[]>([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const productsRef = collection(db, "products");
        const q = query(productsRef, orderBy("uploadDate", "desc"), limit(60));
        const querySnapshot = await getDocs(q);
        
        const allProducts: Product[] = [];
        querySnapshot.forEach((doc) => {
           allProducts.push({ id: doc.id, ...doc.data() } as Product);
        });

        // 1. Trending (Top 3 by sales)
        setTrendingProducts([...allProducts].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 3));

        // 2. Plugins (Top 3)
        setLatestPlugins(allProducts.filter(p => p.category === ProductCategory.VST_PLUGIN).slice(0, 3));

        // 3. Presets (Top 4)
        setPresetPacks(allProducts.filter(p => p.category === ProductCategory.PRESET_PACK).slice(0, 4));

        // 4. Sample Packs (Top 3)
        setSamplePacks(allProducts.filter(p => p.category === ProductCategory.SAMPLE_PACK).slice(0, 3));

        // 5. Mobile Apps (Top 4)
        setMobileApps(allProducts.filter(p => p.category === ProductCategory.MOBILE_APP).slice(0, 4));

        // 6. Desktop Apps (Top 3) - Note: Ensure DESKTOP_APP exists in your ProductCategory enum
        setDesktopApps(allProducts.filter(p => 
          p.category === ('DESKTOP_APP' as ProductCategory) || 
          p.category === ('Desktop App' as unknown as ProductCategory)
        ).slice(0, 3));

      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) return <HeroSkeleton />;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white overflow-x-hidden transition-colors duration-300">
      
      {/* --- HERO SECTION --- */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-black">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white dark:hidden"></div>
          <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-900/20 via-black to-black"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 dark:bg-rose-600/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col items-center">
            <motion.div variants={fadeInUp} className="mb-8 relative group">
                <div className="absolute -inset-4 bg-rose-500/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-rose-500/50 flex items-center justify-center bg-white dark:bg-black shadow-2xl dark:shadow-[0_0_30px_rgba(225,29,72,0.3)]">
                   <h1 className="font-black text-rose-600 dark:text-rose-500 text-center leading-none">
                     <span className="text-3xl block">A.S</span>
                     <span className="text-sm tracking-widest text-black dark:text-white">STUDIO</span>
                   </h1>
                </div>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 text-gray-900 dark:text-white">
              DIGITAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">MASTERY</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
              Premium VST plugins, mobile applications, and sound libraries. 
              Engineered for the next generation of creators.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
              <Link href="/shop" className="px-8 py-4 bg-rose-600 text-white font-bold rounded-full hover:bg-rose-700 transition-all hover:scale-105 shadow-lg shadow-rose-500/20">
                  Browse Catalog
              </Link>
              <Link href="https://youtube.com/@a.s_studio?si=6ZpTXPcWRTyMayzk" target="_blank" className="px-8 py-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white font-bold rounded-full hover:border-rose-500 dark:hover:border-rose-500 hover:text-rose-500 transition-colors">
                A.S STUDIO YouTube
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- CATEGORIES GRID --- */}
      <section className="py-20 bg-white dark:bg-black border-b border-gray-100 dark:border-zinc-900">
         <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'VST Plugins', icon: Cpu, color: 'text-rose-500', href: ProductCategory.VST_PLUGIN },
                { label: 'Desktop Apps', icon: Monitor, color: 'text-indigo-500', href: 'DESKTOP_APP' },
                { label: 'Mobile Apps', icon: Smartphone, color: 'text-blue-500', href: ProductCategory.MOBILE_APP },
                { label: 'Sample Packs', icon: Layers, color: 'text-orange-500', href: ProductCategory.SAMPLE_PACK },
                { label: 'Presets', icon: Sliders, color: 'text-purple-500', href: ProductCategory.PRESET_PACK },
              ].map((item, i) => (
                <Link key={i} href={`/shop?category=${encodeURIComponent(item.href)}`}>
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-zinc-700 transition-all text-center h-full"
                  >
                    <div className={`p-3 rounded-full bg-white dark:bg-zinc-800 shadow-sm mb-3`}>
                        <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{item.label}</h3>
                  </motion.div>
                </Link>
              ))}
            </div>
         </div>
      </section>

      {/* --- TRENDING SECTION --- */}
      <section className="py-24 bg-gray-50 dark:bg-zinc-950">
        <div className="container mx-auto px-4">
          <SectionHeader title="Trending Now" subtitle="Most popular items this week" link="/shop" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {trendingProducts.length > 0 ? trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
             )) : (
                <EmptyState label="Trending items" />
             )}
          </div>
        </div>
      </section>

      {/* --- DESKTOP APPS SECTION (NEW) --- */}
      <section className="py-24 bg-white dark:bg-black border-t border-gray-100 dark:border-zinc-900">
        <div className="container mx-auto px-4">
          <SectionHeader title="Desktop Software" subtitle="Powerful standalone applications for Mac & Windows" link={`/shop?category=DESKTOP_APP`} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {desktopApps.length > 0 ? desktopApps.map((app) => (
                <ProductCard key={app.id} product={app} />
             )) : (
                <EmptyState label="Desktop software" />
             )}
          </div>
        </div>
      </section>

      {/* --- PRESETS SECTION --- */}
      <section className="py-24 bg-gray-50 dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-900">
         <div className="container mx-auto px-4">
            <SectionHeader title="Premium Presets" subtitle="Sound design for Serum, Vital & more" link={`/shop?category=${ProductCategory.PRESET_PACK}`} />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {presetPacks.length > 0 ? presetPacks.map((pack, idx) => (
                   <Link href={`/product/${pack.id}`} key={pack.id}>
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-900"
                      >
                         {pack.image ? (
                           <img src={pack.image} alt={pack.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center"><Sliders className="opacity-20" /></div>
                         )}
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                            <h4 className="font-bold text-white mb-1">{pack.name}</h4>
                            <span className="text-rose-500 font-mono text-sm">{pack.price === 0 ? 'FREE' : `₦${pack.price}`}</span>
                         </div>
                      </motion.div>
                   </Link>
                )) : <EmptyState label="Preset packs" />}
            </div>
         </div>
      </section>

      {/* --- PLUGINS SECTION --- */}
      <section className="py-24 bg-gray-900 dark:bg-zinc-950 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-1/2 h-full bg-rose-900/10 blur-3xl"></div>

         <div className="container mx-auto px-4 relative z-10">
            <div className="flex justify-between items-end mb-10">
               <div>
                  <h2 className="text-3xl md:text-4xl font-black text-white">LATEST PLUGINS</h2>
                  <p className="text-gray-400 mt-2">Professional audio effects and instruments</p>
               </div>
               <Link href={`/shop?category=${ProductCategory.VST_PLUGIN}`} className="text-rose-500 hover:text-white transition-colors flex items-center gap-2">
                  View All <ArrowRight className="w-4 h-4"/>
               </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {latestPlugins.map((plugin, idx) => (
                  <motion.div 
                    key={plugin.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-black/40 border border-white/10 rounded-xl overflow-hidden hover:border-rose-500/50 transition-all p-4"
                  >
                     <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-800 mb-4">
                        {plugin.image ? (
                           <img src={plugin.image} alt={plugin.name} className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center"><Cpu className="text-gray-600" /></div>
                        )}
                        <div className="absolute top-2 right-2 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded">VST3</div>
                     </div>
                     <h3 className="text-xl font-bold mb-1">{plugin.name}</h3>
                     <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">v1.0.0</span>
                        <span className="text-rose-400 font-mono font-bold">{plugin.price === 0 ? 'FREE' : `₦${plugin.price}`}</span>
                     </div>
                     <Link href={`/product/${plugin.id}`} className="mt-4 block w-full py-2 bg-white/10 hover:bg-rose-600 text-center rounded-lg transition-colors text-sm font-bold">
                        View Details
                     </Link>
                  </motion.div>
               ))}
               {latestPlugins.length === 0 && <div className="col-span-full"><EmptyState label="Plugins" /></div>}
            </div>
         </div>
      </section>

      {/* --- MOBILE APPS SECTION (NEW) --- */}
      <section className="py-24 bg-white dark:bg-black border-t border-gray-100 dark:border-zinc-900">
         <div className="container mx-auto px-4">
            <SectionHeader title="Mobile Apps" subtitle="Create and produce on the go (iOS & Android)" link={`/shop?category=${ProductCategory.MOBILE_APP}`} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {mobileApps.length > 0 ? mobileApps.map((app, idx) => (
                  <Link key={app.id} href={`/product/${app.id}`}>
                    <motion.div 
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       transition={{ delay: idx * 0.1 }}
                       className="group flex flex-col items-center text-center p-6 rounded-3xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/5"
                    >
                       <div className="w-24 h-24 mb-4 bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                          {app.image ? <img src={app.image} className="w-full h-full object-cover" /> : <Smartphone className="w-full h-full p-6 text-gray-300 dark:text-zinc-700" />}
                       </div>
                       <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors line-clamp-1">{app.name}</h4>
                       <div className="mt-2 text-sm font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 py-1 px-3 rounded-full">
                          {app.price === 0 ? 'FREE' : `₦${app.price}`}
                       </div>
                    </motion.div>
                  </Link>
               )) : <div className="col-span-full"><EmptyState label="Mobile apps" /></div>}
            </div>
         </div>
      </section>

      {/* --- SAMPLE PACKS SECTION --- */}
      <section className="py-24 bg-gray-50 dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-900">
         <div className="container mx-auto px-4">
            <SectionHeader title="Fresh Samples" subtitle="Royalty-free loops and one-shots" link={`/shop?category=${ProductCategory.SAMPLE_PACK}`} />

            <div className="flex flex-col gap-4">
               {samplePacks.length > 0 ? samplePacks.map((pack, idx) => (
                  <motion.div 
                     key={pack.id}
                     initial={{ opacity: 0, x: -20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     transition={{ delay: idx * 0.1 }}
                     className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 hover:border-rose-500/30 transition-all shadow-sm"
                  >
                     <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                        {pack.image ? <img src={pack.image} className="w-full h-full object-cover" /> : <Layers className="w-full h-full p-6 opacity-20" />}
                     </div>
                     <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-rose-500 transition-colors">{pack.name}</h4>
                        <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{pack.category || 'High quality WAV samples.'}</div>
                     </div>
                     <div className="text-right">
                        <div className="font-mono font-bold text-gray-900 dark:text-white">{pack.price === 0 ? 'FREE' : `₦${pack.price}`}</div>
                        <Link href={`/product/${pack.id}`} className="text-xs text-rose-500 hover:underline">View Pack</Link>
                     </div>
                  </motion.div>
               )) : <EmptyState label="Sample packs" />}
            </div>
         </div>
      </section>

      {/* --- NEWSLETTER --- */}
      <section className="py-24 bg-white dark:bg-black border-t border-gray-100 dark:border-zinc-900 text-center">
         <div className="container mx-auto px-4 max-w-2xl">
            <div className="inline-flex items-center justify-center p-4 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-500 rounded-full mb-6">
               <Music className="w-6 h-6" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-gray-900 dark:text-white">
               JOIN THE <span className="text-rose-600">STUDIO</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
               Get notified about new VST drops, free preset packs, and exclusive discounts.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
               <input 
                 type="email" 
                 placeholder="Enter your email address" 
                 className="flex-1 px-6 py-4 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:border-rose-500 focus:outline-none text-gray-900 dark:text-white"
               />
               <button className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all">
                  Subscribe
               </button>
            </div>
         </div>
      </section>

    </div>
  );
};

// --- Helper Components ---

const SectionHeader = ({ title, subtitle, link }: { title: string, subtitle: string, link: string }) => (
   <div className="flex justify-between items-end mb-8 md:mb-12">
      <div>
         <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white uppercase mb-2">{title}</h2>
         <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">{subtitle}</p>
         <div className="w-16 h-1 bg-rose-500 mt-4 rounded-full"></div>
      </div>
      <Link href={link} className="hidden md:flex items-center gap-2 text-rose-600 dark:text-rose-500 font-bold hover:opacity-80 transition-opacity">
         View All <ArrowRight className="w-4 h-4"/>
      </Link>
   </div>
);

const ProductCard = ({ product }: { product: Product }) => (
  <Link href={`/product/${product.id}`} className="block h-full">
    <motion.div 
      whileHover={{ y: -5 }}
      className="group relative h-full rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:shadow-xl hover:shadow-rose-500/10 dark:hover:shadow-rose-900/20 transition-all flex flex-col"
    >
       <div className="relative aspect-[4/3] bg-gray-100 dark:bg-zinc-800 overflow-hidden">
         {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
         ) : (
            <div className="flex items-center justify-center w-full h-full">
               <ImageIcon className="w-12 h-12 text-gray-300 dark:text-zinc-700" />
            </div>
         )}
         <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 dark:bg-black/80 backdrop-blur text-xs font-bold rounded-full uppercase tracking-wider text-black dark:text-white">
            {product.category}
         </div>
       </div>

       <div className="p-5 flex flex-col flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{product.name}</h3>
          
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800">
             <span className="text-lg font-bold text-rose-600 dark:text-rose-500 font-mono">
               {product.price === 0 ? 'FREE' : `₦${product.price}`}
             </span>
             <span className="flex items-center gap-1 text-yellow-500 text-sm font-medium">
                <Star className="w-4 h-4 fill-current" /> {product.rating || '5.0'}
             </span>
          </div>
       </div>
    </motion.div>
  </Link>
);

const EmptyState = ({ label }: { label: string }) => (
   <div className="w-full py-12 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-900/50">
      <Activity className="w-10 h-10 mb-3 opacity-50" />
      <p>No {label} available yet.</p>
   </div>
);

export default HomeContent;
