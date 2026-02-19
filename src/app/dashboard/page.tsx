'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, updateProfile } from '@/store';
import { 
  Clock, Download, Settings, Box, Package, Camera, Heart, 
  Save, Loader, CheckCircle, ZoomIn, ZoomOut, X, Upload, 
  User, Shield, Trash2, LucideIcon, HeartOff 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
// UPDATED: Replaced arrayRemove with deleteDoc for subcollection removal
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
  
  // Favorites States
  const [favoriteItems, setFavoriteItems] = useState<LibraryItem[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || '');

  // Crop State
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

  // --- 1. UPDATED: Fetch Favorites from Subcollection Real-time ---
  useEffect(() => {
    if (!user?.id) return;
    setLoadingFavorites(true);

    const favColRef = collection(db, "users", user.id, "favorites");
    
    const unsubscribe = onSnapshot(favColRef, async (snapshot) => {
        // Map document IDs from the subcollection
        const favoriteIds = snapshot.docs.map(doc => doc.id);

        if (favoriteIds.length === 0) {
            setFavoriteItems([]);
            setLoadingFavorites(false);
            return;
        }

        try {
            // Resolve all IDs to full product objects
            const favDetails = await Promise.all(
                favoriteIds.map(async (prodId: string) => {
                    const productSnap = await getDoc(doc(db, 'products', prodId));
                    if (productSnap.exists()) {
                        const pData = productSnap.data();
                        return {
                            id: prodId,
                            name: pData.name || 'Unknown Product',
                            image: pData.image || '',
                            category: pData.category || 'Uncategorized',
                            isDeleted: false
                        };
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

  // --- 2. Fetch Raw Orders Snapshot ---
  useEffect(() => {
    if (!user) return;
    setLoadingOrders(true);

    const q = query(collection(db, "orders"), where("userId", "==", user.id));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
            const fetchedOrders = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    createdAt: data.createdAt,
                    status: data.status,
                    total: data.total,
                    items: data.items || [] 
                };
            }) as RawOrderItem[];
            
            fetchedOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            setRawOrders(fetchedOrders);
            if (fetchedOrders.length === 0) setLoadingOrders(false);
        } catch (err) {
            setLoadingOrders(false);
        }
    }, (error) => {
        setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- 3. Enrich Orders with Live Product Data ---
  useEffect(() => {
    const enrichOrders = async () => {
        if (rawOrders.length === 0) return;
        
        try {
            const productIds = new Set<string>();
            rawOrders.forEach(order => order.items?.forEach(item => productIds.add(item.id)));

            const productsData: Record<string, {   name?: string;   image?: string;   category?: string;   demoUrl?: string;   productUrl?: string; } | null> = {};
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

                    return {
                        id: item.id,
                        name: productInfo.name || 'Unknown',
                        image: productInfo.image || '',
                        category: productInfo.category || 'N/A',
                        productUrl: productInfo.demoUrl || productInfo.productUrl,
                        orderDate: item.savedAt || order.createdAt,
                        isDeleted: false
                    };
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
        } catch (error) {
            console.error("Enrichment error:", error);
        } finally {
            setLoadingOrders(false);
        }
    };

    enrichOrders();
  }, [rawOrders]);

  // --- UPDATED: Handle Unfavorite via Subcollection ---
  const handleRemoveFavorite = async (productId: string) => {
    if (!user) return;
    try {
        const favDocRef = doc(db, "users", user.id, "favorites", productId);
        await deleteDoc(favDocRef);
    } catch (error) {
        console.error("Error removing favorite:", error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.id), { name: displayName });
      dispatch(updateProfile({ name: displayName }));
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
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
      } catch (error) {
        console.error("Error saving image:", error);
      } finally {
        setIsSaving(false);
      }
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
      case 'Completed': return 'text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-500/10 border-green-200 dark:border-green-500/20';
      case 'Processing': return 'text-blue-600 dark:text-blue-500 bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
      case 'Failed': return 'text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-zinc-700';
    }
  };

  if (authLoading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* --- Profile Header --- */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          className="relative mb-12 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="h-48 bg-gradient-to-r from-rose-900 via-black to-black relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-t from-black/80 to-transparent"></div>
          </div>
          
          <div className="px-6 pb-8 flex flex-col items-center -mt-20 gap-6 relative z-10">
              <div className="relative group">
                <div className="w-40 h-40 rounded-full border-4 border-white dark:border-zinc-900 overflow-hidden bg-zinc-800 shadow-2xl relative z-10">
                    <img 
                      src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=random"} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                </div>
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-rose-600 text-white p-2.5 rounded-full border-4 border-white dark:border-zinc-900 z-20 hover:scale-110 transition-transform shadow-lg cursor-pointer"
                    title="Change Profile Picture"
                >
                    <Camera className="w-5 h-5" />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
              </div>
              
              <div className="text-center space-y-1">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">{user?.name || "Guest User"}</h1>
                <p className="text-gray-500 font-medium">{user?.email}</p>
              </div>

              <div className="flex gap-4 justify-center w-full max-w-lg mx-auto">
                <div className="flex-1 text-center px-4 py-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-200 dark:border-zinc-700">
                    <div className="font-black text-2xl text-gray-900 dark:text-white">{orders.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Orders</div>
                </div>
                <div className="flex-1 text-center px-4 py-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-200 dark:border-zinc-700">
                    <div className="font-black text-2xl text-rose-600">Free</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Plan</div>
                </div>
              </div>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-72 flex-shrink-0">
            <nav className="space-y-2 sticky top-24">
              {tabs.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => setActiveTab(item.label)}
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all text-left font-bold ${
                    activeTab === item.label 
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20 scale-[1.02]' 
                    : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${activeTab === item.label ? 'text-white' : 'text-gray-400 dark:text-zinc-600'}`} /> 
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm"
              >
                <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-gray-900 dark:text-white">
                  {tabs.find(t => t.label === activeTab)?.icon && React.createElement(tabs.find(t => t.label === activeTab)!.icon, { className: "w-7 h-7 text-rose-600" })}
                  {activeTab}
                </h2>
                
                {activeTab === 'My Library' && (
                  <div>
                      {loadingOrders ? (
                          <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-rose-600" /></div>
                      ) : libraryItems.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {libraryItems.map((item, idx) => (
                                  <div key={`${item.id}-${idx}`} className={`group p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/50 transition-all flex gap-4 ${item.isDeleted ? 'opacity-60 grayscale' : 'hover:border-rose-500/50'}`}>
                                      <div className="w-20 h-20 bg-gray-200 dark:bg-zinc-700 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                                          {item.isDeleted ? <Box className="w-8 h-8 text-gray-400" /> : <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <h3 className="font-bold truncate text-gray-900 dark:text-white">{item.name}</h3>
                                          <p className="text-xs text-gray-500 mb-2">{item.category}</p>
                                          {!item.isDeleted && <button onClick={() => handleDownloadItem(item)} className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"><Download className="w-3 h-3" /> Download</button>}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : <EmptyState icon={Box} text="Your library is empty" actionText="Browse Shop" />}
                  </div>
                )}

                {activeTab === 'History' && (
                    <div className="space-y-4">
                      {loadingOrders ? (
                          <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-rose-600" /></div>
                      ) : orders.length > 0 ? (
                          orders.map((order) => (
                              <div key={order.id} className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/30 border border-gray-200 dark:border-zinc-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                  <div className="flex items-center gap-4">
                                      <div className={`p-3 rounded-full ${order.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'}`}><Package className="w-5 h-5" /></div>
                                      <div>
                                          <div className="font-bold font-mono text-gray-900 dark:text-white">#{order.id.slice(0, 8)}</div>
                                          <div className="text-sm text-gray-500 flex items-center gap-2"><span>{new Date(order.createdAt).toLocaleDateString()}</span><span>•</span><span>{order.items?.length || 0} Items</span></div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                                      <div className="font-bold text-lg font-mono text-rose-600">₦{(order.total || 0).toFixed(2)}</div>
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(order.status || 'Pending')}`}>
                                          {order.status === 'Completed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                          {order.status || 'Pending'}
                                      </span>
                                  </div>
                              </div>
                          ))
                      ) : <EmptyState icon={Clock} text="No order history found" actionText="Start Shopping" />}
                    </div>
                )}

                {activeTab === 'Downloads' && (
                   <div>
                    {libraryItems.length > 0 ? (
                        <div className="space-y-3">
                            {libraryItems.map((item, idx) => (
                                <div key={`${item.id}-${idx}-dl`} className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/30 border flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-200 dark:bg-zinc-700 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                            {item.isDeleted ? <Box className="w-4 h-4 text-gray-400" /> : <img src={item.image} className="w-full h-full object-cover" />}
                                        </div>
                                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">{item.name}</h3>
                                    </div>
                                    {!item.isDeleted && <button onClick={() => handleDownloadItem(item)} className="p-2 bg-white dark:bg-black rounded-lg border text-gray-500 hover:text-rose-600 transition-all"><Download className="w-4 h-4" /></button>}
                                </div>
                            ))}
                        </div>
                    ) : <EmptyState icon={Download} text="No downloads available" actionText="Browse Shop" />}
                  </div>
                )}

                {/* --- UPDATED FAVORITES TAB --- */}
                {activeTab === 'Favorites' && (
                    <div>
                        {loadingFavorites ? (
                            <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-rose-600" /></div>
                        ) : favoriteItems.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {favoriteItems.map((item) => (
                                    <div key={item.id} className={`group p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/50 transition-all flex gap-4 ${item.isDeleted ? 'opacity-60' : 'hover:border-rose-500/50'}`}>
                                        <div className="w-20 h-20 bg-gray-200 dark:bg-zinc-700 rounded-xl overflow-hidden shrink-0">
                                            {!item.isDeleted && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-bold truncate ${item.isDeleted ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>{item.name}</h3>
                                            <p className="text-xs text-gray-500 mb-3">{item.category}</p>
                                            <div className="flex gap-4">
                                                {!item.isDeleted && <Link href={`/product/${item.id}`} className="text-xs font-bold text-rose-600 hover:underline">View Item</Link>}
                                                <button onClick={() => handleRemoveFavorite(item.id)} className="text-xs font-bold text-gray-400 hover:text-red-500 flex items-center gap-1"><HeartOff className="w-3 h-3" /> Remove</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <EmptyState icon={Heart} text="No favorites yet" actionText="Explore Products" />}
                    </div>
                )}

                {activeTab === 'Settings' && (
                    <div className="max-w-2xl space-y-8">
                      <form onSubmit={handleSaveProfile} className="space-y-6">
                          <div className="grid grid-cols-1 gap-6">
                              <div className="space-y-2">
                                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Display Name</label>
                                  <div className="relative">
                                      <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                      <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border outline-none focus:border-rose-500 transition-all font-medium" />
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                                  <div className="relative">
                                      <Shield className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                      <input type="email" readOnly defaultValue={user?.email} className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-zinc-900 border text-gray-500 cursor-not-allowed font-medium" />
                                  </div>
                              </div>
                          </div>
                          <button disabled={isSaving} type="submit" className="px-8 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
                              {isSaving ? <Loader className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} Save Changes
                          </button>
                      </form>
                      <div className="pt-8 border-t border-gray-100 dark:border-zinc-800">
                          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Danger Zone</h3>
                          <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl flex items-center justify-between">
                              <div>
                                  <h4 className="font-bold text-red-600 dark:text-red-500">Delete Account</h4>
                                  <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">Permanently remove your data and access.</p>
                              </div>
                              <button className="px-5 py-2.5 bg-white dark:bg-black text-red-600 font-bold rounded-xl border hover:bg-red-50 transition-colors text-sm flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
                          </div>
                      </div>
                    </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCropOpen && cropImgSrc && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 w-full max-w-md border">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2"><Upload className="w-5 h-5 text-rose-600" /> Adjust Image</h3>
                        <button onClick={() => { setIsCropOpen(false); setCropImgSrc(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="relative w-full flex justify-center mb-6 overflow-hidden bg-gray-100 dark:bg-black rounded-2xl border-2 border-dashed">
                        <div className="relative overflow-hidden rounded-full shadow-[0_0_0_100px_rgba(255,255,255,0.9)] dark:shadow-[0_0_0_100px_rgba(0,0,0,0.8)] cursor-move touch-none" style={{ width: CROP_SIZE, height: CROP_SIZE }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}>
                            <img ref={cropImgRef} src={cropImgSrc} onLoad={handleImageLoad} alt="Crop Preview" draggable={false} className="absolute max-w-none origin-top-left pointer-events-none" style={{ transform: `translate3d(${cropOffset.x}px, ${cropOffset.y}px, 0) scale(${baseScale * cropZoom})`, transition: isDragging ? 'none' : 'transform 0.1s ease-out' }} />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 px-2">
                            <ZoomOut className="w-4 h-4 text-gray-400" />
                            <input type="range" min="1" max="3" step="0.1" value={cropZoom} onChange={(e) => setCropZoom(parseFloat(e.target.value))} className="flex-1 accent-rose-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                            <ZoomIn className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setIsCropOpen(false); setCropImgSrc(null); }} className="flex-1 py-3 border rounded-xl font-bold text-gray-600">Cancel</button>
                            <button onClick={handleSaveCrop} disabled={isSaving} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-lg">{isSaving ? <Loader className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} Save</button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface EmptyStateProps { icon: LucideIcon; text: string; actionText?: string; }
const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, text, actionText }) => (
    <div className="text-center py-20 bg-gray-50 dark:bg-zinc-800/20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800">
        <div className="w-16 h-16 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4"><Icon className="w-8 h-8 text-gray-400 dark:text-zinc-600" /></div>
        <p className="text-gray-500 font-medium mb-4">{text}</p>
        {actionText && <Link href="/shop" className="text-rose-600 font-bold hover:underline">{actionText}</Link>}
    </div>
);

export default UserDashboardContent;
