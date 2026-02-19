'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, updateProfile } from '@/store';
import { 
  Clock, Download, Settings, Box, Package, Camera, Heart, 
  Save, Loader, CheckCircle, ZoomIn, ZoomOut, X, Upload, 
  User, Shield, Trash2, LucideIcon, HeartOff, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { doc, updateDoc, collection, query, where, onSnapshot, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';

const CROP_SIZE = 280;

interface LibraryItem {
    id: string;
    name: string;
    image: string;
    category: string;
    size?: string;
    orderDate?: string;
    productUrl?: string;
    isDeleted?: boolean; 
}

interface OrderItem {
    id: string;
    createdAt: string;
    status: string;
    total: number;
    items: LibraryItem[]; 
}

interface RawOrderItem {
    id: string;
    createdAt: string;
    status: string;
    total: number;
    items: { id: string; savedAt: string }[];
}

const UserDashboardContent: React.FC = () => {
  const dispatch = useDispatch();
  const { user, loading: authLoading } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState('My Library');
  const [isSaving, setIsSaving] = useState(false);
  
  const [rawOrders, setRawOrders] = useState<RawOrderItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  
  const [favoriteItems, setFavoriteItems] = useState<LibraryItem[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || '');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropImgSrc, setCropImgSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cropImgRef = useRef<HTMLImageElement>(null);
  const [baseScale, setBaseScale] = useState(1);

  useEffect(() => {
    if (user?.name) setDisplayName(user.name);
  }, [user]);

  // --- Logic remains completely unchanged ---
  useEffect(() => {
    if (!user?.id) return;
    setLoadingFavorites(true);
    const favColRef = collection(db, "users", user.id, "favorites");
    const unsubscribe = onSnapshot(favColRef, async (snapshot) => {
        const favoriteIds = snapshot.docs.map(doc => doc.id);
        if (favoriteIds.length === 0) {
            setFavoriteItems([]);
            setLoadingFavorites(false);
            return;
        }
        try {
            const favDetails = await Promise.all(
                favoriteIds.map(async (prodId: string) => {
                    const productSnap = await getDoc(doc(db, 'products', prodId));
                    if (productSnap.exists()) {
                        const pData = productSnap.data();
                        return { id: prodId, name: pData.name || 'Unknown Product', image: pData.image || '', category: pData.category || 'Uncategorized', isDeleted: false };
                    }
                    return { id: prodId, name: 'Item Unavailable', image: '', category: 'N/A', isDeleted: true };
                })
            );
            setFavoriteItems(favDetails);
        } catch (err) {
            console.error("Error fetching favorites:", err);
        } finally {
            setLoadingFavorites(false);
        }
    });
    return () => unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    setLoadingOrders(true);
    const q = query(collection(db, "orders"), where("userId", "==", user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
            const fetchedOrders = snapshot.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, createdAt: data.createdAt, status: data.status, total: data.total, items: data.items || [] };
            }) as RawOrderItem[];
            fetchedOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            setRawOrders(fetchedOrders);
            if (fetchedOrders.length === 0) setLoadingOrders(false);
        } catch (err) { setLoadingOrders(false); }
    }, (error) => { setLoadingOrders(false); });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const enrichOrders = async () => {
        if (rawOrders.length === 0) return;
        try {
            const productIds = new Set<string>();
            rawOrders.forEach(order => order.items?.forEach(item => productIds.add(item.id)));
            const productsData: Record<string, any> = {};
            await Promise.all(
                Array.from(productIds).map(async (id) => {
                    const productSnap = await getDoc(doc(db, 'products', id));
                    productsData[id] = productSnap.exists() ? productSnap.data() : null;
                })
            );
            const enrichedOrders: OrderItem[] = rawOrders.map(order => ({
                ...order,
                items: (order.items || []).map(item => {
                    const productInfo = productsData[item.id];
                    if (!productInfo) return { id: item.id, name: 'Data is deleted', image: '', category: 'Unavailable', orderDate: item.savedAt || order.createdAt, isDeleted: true };
                    return { id: item.id, name: productInfo.name || 'Unknown', image: productInfo.image || '', category: productInfo.category || 'N/A', productUrl: productInfo.demoUrl || productInfo.productUrl, orderDate: item.savedAt || order.createdAt, isDeleted: false };
                })
            }));
            setOrders(enrichedOrders);
            const allItems: LibraryItem[] = [];
            const seenIds = new Set();
            enrichedOrders.forEach((order) => {
                if (order.status === 'Completed') {
                    order.items.forEach((item) => {
                        if (!seenIds.has(item.id)) {
                            seenIds.add(item.id);
                            allItems.push(item);
                        }
                    });
                }
            });
            setLibraryItems(allItems);
        } catch (error) { console.error("Enrichment error:", error); } 
        finally { setLoadingOrders(false); }
    };
    enrichOrders();
  }, [rawOrders]);

  const handleRemoveFavorite = async (productId: string) => {
    if (!user) return;
    try { await deleteDoc(doc(db, "users", user.id, "favorites", productId)); } 
    catch (error) { console.error("Error removing favorite:", error); }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.id), { name: displayName });
      dispatch(updateProfile({ name: displayName }));
    } catch (error) { console.error("Error updating profile:", error); } 
    finally { setIsSaving(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            setCropImgSrc(reader.result as string);
            setIsCropOpen(true);
            setCropZoom(1);
            setCropOffset({ x: 0, y: 0 });
            setImgDimensions({ width: 0, height: 0 });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      setImgDimensions({ width: naturalWidth, height: naturalHeight });
      const scale = Math.max(CROP_SIZE / naturalWidth, CROP_SIZE / naturalHeight);
      setBaseScale(scale);
      setCropOffset({
          x: (CROP_SIZE - (naturalWidth * scale)) / 2,
          y: (CROP_SIZE - (naturalHeight * scale)) / 2
      });
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      setDragStart({ x: clientX - cropOffset.x, y: clientY - cropOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      const rawX = clientX - dragStart.x;
      const rawY = clientY - dragStart.y;
      const scaledWidth = imgDimensions.width * baseScale * cropZoom;
      const scaledHeight = imgDimensions.height * baseScale * cropZoom;
      setCropOffset({
          x: Math.min(Math.max(rawX, CROP_SIZE - scaledWidth), 0),
          y: Math.min(Math.max(rawY, CROP_SIZE - scaledHeight), 0)
      });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
     if (imgDimensions.width === 0) return;
     const scaledWidth = imgDimensions.width * baseScale * cropZoom;
     const scaledHeight = imgDimensions.height * baseScale * cropZoom;
     setCropOffset(prev => ({
        x: Math.min(Math.max(prev.x, CROP_SIZE - scaledWidth), 0),
        y: Math.min(Math.max(prev.y, CROP_SIZE - scaledHeight), 0)
    }));
  }, [cropZoom, baseScale, imgDimensions]);

  const compressImage = async (canvas: HTMLCanvasElement, quality: number): Promise<string> => {
       return new Promise((resolve) => resolve(canvas.toDataURL('image/jpeg', quality)));
  };

  const handleSaveCrop = async () => {
      if (!cropImgRef.current || !user) return;
      setIsSaving(true);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = CROP_SIZE;
        canvas.height = CROP_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);
        const img = cropImgRef.current;
        const renderedWidth = img.naturalWidth * baseScale * cropZoom;
        const renderedHeight = img.naturalHeight * baseScale * cropZoom;
        ctx.drawImage(img, cropOffset.x, cropOffset.y, renderedWidth, renderedHeight);
        
        let quality = 0.9;
        let dataUrl = await compressImage(canvas, quality);
        while (dataUrl.length > 68000 && quality > 0.1) {
            quality -= 0.1;
            dataUrl = await compressImage(canvas, quality);
        }
        dispatch(updateProfile({ avatar: dataUrl }));
        await updateDoc(doc(db, "users", user.id), { avatar: dataUrl });
        setIsCropOpen(false);
        setCropImgSrc(null);
      } catch (error) { console.error("Error saving image:", error); } 
      finally { setIsSaving(false); }
  };

  const handleDownloadItem = (item: LibraryItem) => {
    if (item.isDeleted) return;
    if (item.productUrl) {
        window.open(item.productUrl, '_blank');
    } else {
        const element = document.createElement("a");
        const fileContent = `Product: ${item.name}\nDownload ID: ${item.id}`;
        const file = new Blob([fileContent], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `${(item.name || 'product').replace(/\s+/g, '_')}_License.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
  };

  const tabs = [
    { id: 'library', label: 'My Library', icon: Box },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'downloads', label: 'Downloads', icon: Download },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
      case 'Processing': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
      case 'Failed': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700';
    }
  };

  if (authLoading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white transition-colors duration-300 font-sans">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* --- Premium Profile Header --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-16 rounded-[2.5rem] overflow-hidden bg-white dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800/80 shadow-2xl shadow-gray-200/50 dark:shadow-none"
        >
          {/* Abstract Gradient Background */}
          <div className="h-56 md:h-64 bg-gradient-to-br from-rose-600 via-rose-950 to-black relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
              {/* Decorative Glow */}
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-500/30 rounded-full blur-[100px] -translate-y-1/2"></div>
          </div>
          
          <div className="px-6 pb-10 flex flex-col md:flex-row items-center md:items-end gap-6 relative z-10 -mt-24 md:-mt-20 md:pl-12">
              <div className="relative group">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-white dark:border-zinc-900 overflow-hidden bg-zinc-800 shadow-xl relative z-10">
                    <img 
                      src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=random"} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                </div>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-rose-600 text-white p-2.5 rounded-full border-[4px] border-white dark:border-zinc-900 z-20 hover:scale-105 transition-transform shadow-lg cursor-pointer"
                    title="Change Profile Picture"
                >
                    <Camera className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
              </div>
              
              <div className="text-center md:text-left space-y-1 flex-1 mb-4 md:mb-6">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white">{user?.name || "Guest User"}</h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium">{user?.email}</p>
              </div>

              {/* Floating Stat Cards */}
              <div className="flex gap-4 w-full md:w-auto mb-4 md:mb-6 md:pr-12">
                <div className="flex-1 md:flex-none flex flex-col items-center justify-center px-8 py-4 bg-white/80 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
                    <div className="font-black text-2xl text-gray-900 dark:text-white">{orders.length}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Orders</div>
                </div>
                <div className="flex-1 md:flex-none flex flex-col items-center justify-center px-8 py-4 bg-rose-50/80 dark:bg-rose-500/10 backdrop-blur-xl rounded-2xl border border-rose-100 dark:border-rose-500/20 shadow-sm">
                    <div className="font-black text-2xl text-rose-600 dark:text-rose-400">Free</div>
                    <div className="text-[10px] text-rose-600/60 dark:text-rose-400/60 uppercase tracking-widest font-bold mt-1">Plan</div>
                </div>
              </div>
          </div>
        </motion.div>

        {/* --- Main Content Area --- */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <nav className="space-y-1 sticky top-24 bg-white/50 dark:bg-zinc-900/30 p-2 rounded-3xl border border-gray-100 dark:border-zinc-800/50 backdrop-blur-md">
              {tabs.map(item => {
                const isActive = activeTab === item.label;
                return (
                  <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.label)}
                    className={`relative w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 text-left font-bold overflow-hidden group ${
                      isActive 
                      ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    {isActive && (
                      <motion.div layoutId="activeTabIndicator" className="absolute left-0 top-0 bottom-0 w-1 bg-rose-600 rounded-r-full" />
                    )}
                    <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 dark:text-zinc-600 group-hover:text-gray-900 dark:group-hover:text-white'}`} /> 
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-8 px-2">
                   <div className="p-2.5 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
                      {tabs.find(t => t.label === activeTab)?.icon && React.createElement(tabs.find(t => t.label === activeTab)!.icon, { className: "w-6 h-6" })}
                   </div>
                   <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                     {activeTab}
                   </h2>
                </div>
                
                {activeTab === 'My Library' && (
                  <div>
                      {loadingOrders ? (
                          <div className="flex justify-center py-32"><Loader className="w-8 h-8 animate-spin text-rose-600" /></div>
                      ) : libraryItems.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {libraryItems.map((item, idx) => (
                                  <div key={`${item.id}-${idx}`} className={`group p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 dark:hover:shadow-black/40 transition-all duration-300 flex gap-5 items-center ${item.isDeleted ? 'opacity-50 grayscale' : 'hover:border-rose-200 dark:hover:border-rose-900/50'}`}>
                                      <div className="w-24 h-24 bg-gray-50 dark:bg-zinc-800 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center relative">
                                          {item.isDeleted ? <Box className="w-8 h-8 text-gray-300" /> : <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />}
                                          {!item.isDeleted && <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />}
                                      </div>
                                      <div className="flex-1 min-w-0 pr-2">
                                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{item.category}</p>
                                          <h3 className="font-bold text-lg leading-tight truncate text-gray-900 dark:text-white mb-3">{item.name}</h3>
                                          {!item.isDeleted && (
                                            <button onClick={() => handleDownloadItem(item)} className="px-4 py-2 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs font-bold rounded-xl hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-colors flex items-center gap-2 w-fit">
                                              <Download className="w-3.5 h-3.5" /> Download
                                            </button>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : <EmptyState icon={Box} title="Your library is empty" text="Purchased and free downloads will appear here." actionText="Browse Catalog" />}
                  </div>
                )}

                {activeTab === 'History' && (
                    <div className="space-y-4">
                      {loadingOrders ? (
                          <div className="flex justify-center py-32"><Loader className="w-8 h-8 animate-spin text-rose-600" /></div>
                      ) : orders.length > 0 ? (
                          orders.map((order) => (
                              <div key={order.id} className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                  <div className="flex items-center gap-5">
                                      <div className={`p-4 rounded-2xl ${order.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-gray-50 dark:bg-zinc-800 text-gray-500'}`}>
                                        <Package className="w-6 h-6" />
                                      </div>
                                      <div>
                                          <div className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">Order ID</div>
                                          <div className="font-bold text-lg text-gray-900 dark:text-white">#{order.id.slice(0, 8)}</div>
                                          <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-700" />
                                            <span>{order.items?.length || 0} Items</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex flex-row-reverse md:flex-col items-center md:items-end gap-3 w-full md:w-auto justify-between">
                                      <span className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold border flex items-center gap-1.5 ${getStatusColor(order.status || 'Pending')}`}>
                                          {order.status === 'Completed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                          {order.status || 'Pending'}
                                      </span>
                                      <div className="font-black text-xl text-gray-900 dark:text-white">₦{(order.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                  </div>
                              </div>
                          ))
                      ) : <EmptyState icon={Clock} title="No order history" text="You haven't made any purchases yet." actionText="Start Shopping" />}
                    </div>
                )}

                {activeTab === 'Downloads' && (
                   <div>
                    {libraryItems.length > 0 ? (
                        <div className="space-y-3">
                            {libraryItems.map((item, idx) => (
                                <div key={`${item.id}-${idx}-dl`} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-50 dark:bg-zinc-800 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                                            {item.isDeleted ? <Box className="w-5 h-5 text-gray-300" /> : <img src={item.image} className="w-full h-full object-cover" />}
                                        </div>
                                        <div>
                                          <h3 className="font-bold text-gray-900 dark:text-white">{item.name}</h3>
                                          <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                                        </div>
                                    </div>
                                    {!item.isDeleted && (
                                      <button onClick={() => handleDownloadItem(item)} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-all shadow-sm">
                                        <Download className="w-4 h-4" />
                                      </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : <EmptyState icon={Download} title="No downloads available" text="Items you unlock will appear here for direct download." actionText="Browse Catalog" />}
                  </div>
                )}

                {activeTab === 'Favorites' && (
                    <div>
                        {loadingFavorites ? (
                            <div className="flex justify-center py-32"><Loader className="w-8 h-8 animate-spin text-rose-600" /></div>
                        ) : favoriteItems.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {favoriteItems.map((item) => (
                                    <div key={item.id} className={`group p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 shadow-sm transition-all flex flex-col gap-4 ${item.isDeleted ? 'opacity-50' : 'hover:shadow-xl hover:shadow-rose-500/5 hover:border-rose-100 dark:hover:border-rose-900/30'}`}>
                                        <div className="w-full aspect-video bg-gray-50 dark:bg-zinc-800 rounded-2xl overflow-hidden relative">
                                            {!item.isDeleted ? (
                                              <>
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                              </>
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center"><Box className="w-8 h-8 text-gray-300" /></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 px-1">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{item.category}</p>
                                            <h3 className={`font-bold text-lg truncate mb-4 ${item.isDeleted ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>{item.name}</h3>
                                            <div className="flex items-center justify-between mt-auto">
                                                {!item.isDeleted && (
                                                  <Link href={`/product/${item.id}`} className="text-sm font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors">
                                                    View Details
                                                  </Link>
                                                )}
                                                <button onClick={() => handleRemoveFavorite(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors ml-auto">
                                                  <HeartOff className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <EmptyState icon={Heart} title="No favorites yet" text="Save items you like by clicking the heart icon on products." actionText="Explore Products" />}
                    </div>
                )}

                {activeTab === 'Settings' && (
                    <div className="max-w-2xl">
                      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-sm">
                        <form onSubmit={handleSaveProfile} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Display Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                                        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-black/50 border border-transparent dark:border-zinc-800 focus:border-rose-500 focus:bg-white dark:focus:bg-black outline-none transition-all font-semibold text-gray-900 dark:text-white shadow-inner shadow-gray-100/50 dark:shadow-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="relative">
                                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 opacity-50" />
                                        <input type="email" readOnly defaultValue={user?.email} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-100 dark:bg-zinc-800/50 border border-transparent text-gray-400 cursor-not-allowed font-semibold" />
                                    </div>
                                    <p className="text-xs text-gray-400 ml-1 mt-1">Email cannot be changed directly for security reasons.</p>
                                </div>
                            </div>
                            <button disabled={isSaving} type="submit" className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-2xl hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-gray-200 dark:shadow-none flex items-center gap-2 disabled:opacity-70 w-full md:w-auto mt-4">
                                {isSaving ? <Loader className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />} Save Changes
                            </button>
                        </form>
                      </div>

                      <div className="mt-8 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                          <div>
                              <h4 className="font-black text-red-600 dark:text-red-400 text-lg">Danger Zone</h4>
                              <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1 font-medium">Permanently remove your account and all associated data.</p>
                          </div>
                          <button className="px-6 py-3 bg-white dark:bg-black text-red-600 dark:text-red-500 font-bold rounded-xl border border-red-100 dark:border-red-900/50 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-colors text-sm flex items-center gap-2 shrink-0">
                            <Trash2 className="w-4 h-4" /> Delete Account
                          </button>
                      </div>
                    </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      <AnimatePresence>
        {isCropOpen && cropImgSrc && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl p-6 md:p-8 w-full max-w-md border border-gray-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black flex items-center gap-2 text-gray-900 dark:text-white"><Upload className="w-5 h-5 text-rose-600" /> Adjust Image</h3>
                        <button onClick={() => { setIsCropOpen(false); setCropImgSrc(null); }} className="p-2 bg-gray-50 dark:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="relative w-full flex justify-center mb-8 overflow-hidden bg-gray-50 dark:bg-black/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 p-4">
                        <div className="relative overflow-hidden rounded-full shadow-[0_0_0_100px_rgba(255,255,255,0.8)] dark:shadow-[0_0_0_100px_rgba(0,0,0,0.8)] cursor-move touch-none ring-4 ring-rose-500/20" style={{ width: CROP_SIZE, height: CROP_SIZE }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}>
                            <img ref={cropImgRef} src={cropImgSrc} onLoad={handleImageLoad} alt="Crop Preview" draggable={false} className="absolute max-w-none origin-top-left pointer-events-none" style={{ transform: `translate3d(${cropOffset.x}px, ${cropOffset.y}px, 0) scale(${baseScale * cropZoom})`, transition: isDragging ? 'none' : 'transform 0.1s ease-out' }} />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 px-2 bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-2xl">
                            <ZoomOut className="w-4 h-4 text-gray-500" />
                            <input type="range" min="1" max="3" step="0.1" value={cropZoom} onChange={(e) => setCropZoom(parseFloat(e.target.value))} className="flex-1 accent-rose-600 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer" />
                            <ZoomIn className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => { setIsCropOpen(false); setCropImgSrc(null); }} className="flex-1 py-4 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-2xl font-bold text-gray-600 dark:text-gray-300 transition-colors">Cancel</button>
                            <button onClick={handleSaveCrop} disabled={isSaving} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-70">{isSaving ? <Loader className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />} Save Image</button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface EmptyStateProps { icon: LucideIcon; title: string; text: string; actionText?: string; }
const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, text, actionText }) => (
    <div className="text-center py-20 px-4 bg-gray-50/50 dark:bg-zinc-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
        <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 dark:border-zinc-700">
          <Icon className="w-8 h-8 text-gray-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-8 max-w-sm mx-auto">{text}</p>
        {actionText && (
          <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:bg-rose-600 dark:hover:bg-rose-500 transition-colors shadow-md">
            {actionText} <ChevronRight className="w-4 h-4" />
          </Link>
        )}
    </div>
);

export default UserDashboardContent;
