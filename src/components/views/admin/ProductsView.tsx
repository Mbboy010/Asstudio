'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit2, Trash2, Image as ImageIcon, Search, X, Upload, Save, 
  FileAudio, Check, Monitor, Smartphone, Zap, Layers, HardDrive, Calendar, 
  Star, Loader, Music, Link as LinkIcon, ZoomIn, ZoomOut, Filter
} from 'lucide-react';
import { ProductCategory, Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';

const CROP_SIZE = 400;

const AdminProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: ProductCategory.SAMPLE_PACK,
    price: 0,
    description: '',
    image: '',
    features: [],
    size: '',
    rating: 5.0,
    uploadDate: new Date().toISOString().split('T')[0],
    productUrl: '',
    demoUrl: '',
    downloadType: 'file'
  });

  // Crop State
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropImgSrc, setCropImgSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);

  const cropImgRef = useRef<HTMLImageElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "products"), orderBy("uploadDate", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedProducts: Product[] = [];
      querySnapshot.forEach((doc) => {
        fetchedProducts.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      category: ProductCategory.SAMPLE_PACK,
      price: 29.99,
      description: '',
      image: '',
      features: ['High Quality Audio', 'Instant Download'],
      size: '500 MB',
      rating: 5.0,
      sales: 0,
      uploadDate: new Date().toISOString().split('T')[0],
      productUrl: '',
      demoUrl: '',
      downloadType: 'file'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, "products", id));
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting product: ", error);
        alert("Failed to delete product.");
      }
    }
  };

  // --- Crop Logic ---
  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      const renderedWidth = naturalWidth * scale;
      const renderedHeight = naturalHeight * scale;
      setCropOffset({
          x: (CROP_SIZE - renderedWidth) / 2,
          y: (CROP_SIZE - renderedHeight) / 2
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

      const minX = CROP_SIZE - scaledWidth;
      const maxX = 0;
      const minY = CROP_SIZE - scaledHeight;
      const maxY = 0;

      setCropOffset({
          x: Math.min(Math.max(rawX, minX), maxX),
          y: Math.min(Math.max(rawY, minY), maxY)
      });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
     if (imgDimensions.width === 0) return;
     const scaledWidth = imgDimensions.width * baseScale * cropZoom;
     const scaledHeight = imgDimensions.height * baseScale * cropZoom;

     const minX = CROP_SIZE - scaledWidth;
     const maxX = 0;
     const minY = CROP_SIZE - scaledHeight;
     const maxY = 0;

     setCropOffset(prev => ({
        x: Math.min(Math.max(prev.x, minX), maxX),
        y: Math.min(Math.max(prev.y, minY), maxY)
    }));
  }, [cropZoom, baseScale, imgDimensions]);

  const compressImage = async (canvas: HTMLCanvasElement, quality: number): Promise<string> => {
       return new Promise((resolve) => {
            resolve(canvas.toDataURL('image/jpeg', quality));
       });
  };

  const handleSaveCrop = async () => {
      if (!cropImgRef.current) return;
      setIsProcessingCrop(true);
      
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
        
        // Compression Loop to get < 50kb
        let quality = 0.9;
        let dataUrl = await compressImage(canvas, quality);
        
        while (dataUrl.length > 68000 && quality > 0.1) {
            quality -= 0.1;
            dataUrl = await compressImage(canvas, quality);
        }

        setFormData({...formData, image: dataUrl});
        setIsCropOpen(false);
        setCropImgSrc(null);
      } catch (error) {
        console.error("Error cropping image:", error);
        alert("Failed to process image.");
      } finally {
        setIsProcessingCrop(false);
      }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        // Update
        const productRef = doc(db, "products", editingId);
        await updateDoc(productRef, formData);
        setProducts(products.map(p => p.id === editingId ? { ...p, ...formData } as Product : p));
      } else {
        // Create
        const docRef = await addDoc(collection(db, "products"), {
            ...formData,
            sales: 0,
            uploadDate: new Date().toISOString().split('T')[0]
        });
        const newProduct = { ...formData, id: docRef.id, sales: 0 } as Product;
        setProducts([newProduct, ...products]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving product: ", error);
      alert("Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (cat: ProductCategory) => {
    switch (cat) {
      case ProductCategory.SAMPLE_PACK: return <Layers className="w-4 h-4" />;
      case ProductCategory.PRESET_PACK: return <Zap className="w-4 h-4" />;
      case ProductCategory.DESKTOP_APP: return <Monitor className="w-4 h-4" />;
      case ProductCategory.MOBILE_APP: return <Smartphone className="w-4 h-4" />;
      default: return <FileAudio className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8 bg-gray-50 dark:bg-black min-h-screen py-6 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="text-rose-600 font-bold text-xs uppercase tracking-wider bg-rose-50 dark:bg-rose-900/10 px-2 py-1 rounded">Inventory</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Product Management</h1>
          <p className="text-gray-500 font-medium">Create, edit, and manage your digital products.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-600/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Add New Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4 group-focus-within:text-rose-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl w-full focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 items-center no-scrollbar">
          {['All', ...Object.values(ProductCategory)].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedCategory === cat 
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' 
                : 'bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
            <div className="col-span-full flex justify-center py-20">
                <Loader className="w-10 h-10 animate-spin text-rose-600" />
            </div>
        ) : filteredProducts.length > 0 ? (
            <AnimatePresence>
            {filteredProducts.map((product) => (
                <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={product.id} 
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden group hover:border-rose-500/50 hover:shadow-xl hover:shadow-rose-600/5 transition-all duration-300"
                >
                    <div className="relative h-56 bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                        {product.image ? (
                            <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={product.name} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <ImageIcon className="w-12 h-12 opacity-50" />
                            </div>
                        )}
                        
                        {/* Overlay Actions */}
                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                            <button onClick={() => handleEdit(product)} className="p-2 bg-white text-gray-700 rounded-lg shadow-lg hover:text-rose-600 hover:scale-110 transition-all"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(product.id)} className="p-2 bg-white text-red-500 rounded-lg shadow-lg hover:bg-red-50 hover:scale-110 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>

                        {/* Category Badge */}
                        <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5 border border-white/10 shadow-lg">
                                {getCategoryIcon(product.category)} {product.category}
                            </span>
                        </div>
                    </div>

                    <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-1 group-hover:text-rose-600 transition-colors">{product.name}</h3>
                            <span className="font-mono font-bold text-rose-600">₦{product.price}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 line-clamp-2 h-8" dangerouslySetInnerHTML={{__html: product.description?.substring(0, 100) || ''}}></p>
                        
                        <div className="flex items-center justify-between text-xs font-medium text-gray-400 border-t border-gray-100 dark:border-zinc-800 pt-4 mt-auto">
                            <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5"/> {product.size || 'N/A'}</span>
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">
                                <Check className="w-3 h-3" /> {product.sales} Sold
                            </span>
                        </div>
                    </div>
                </motion.div>
            ))}
            </AnimatePresence>
        ) : (
            <div className="col-span-full py-20 bg-white dark:bg-zinc-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filters.</p>
            </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-zinc-800 p-6 bg-gray-50 dark:bg-zinc-900 sticky top-0 z-10">
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">{editingId ? 'Edit Product' : 'Create New Product'}</h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Fill in the details below to update your catalog.</p>
                 </div>
                 <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full text-gray-500 transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="overflow-y-auto p-6">
                  <form onSubmit={handleSave} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Column: Media & Files */}
                      <div className="space-y-6">
                         <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Cover Image</label>
                            <div 
                              onClick={() => imageInputRef.current?.click()}
                              className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all group relative overflow-hidden bg-gray-50 dark:bg-zinc-800/50"
                            >
                               <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageInput} />
                               
                               {formData.image ? (
                                 <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                               ) : (
                                 <>
                                   <div className="p-4 bg-white dark:bg-zinc-800 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                      <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-rose-500" />
                                   </div>
                                   <span className="text-sm font-medium text-gray-500 group-hover:text-rose-600">Click to upload & crop</span>
                                 </>
                               )}
                               {formData.image && (
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity backdrop-blur-sm">
                                      <Edit2 className="w-5 h-5 mr-2" /> Change Image
                                  </div>
                               )}
                            </div>
                         </div>

                         {/* File Upload Section */}
                         <div className="bg-gray-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-4">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                  <Upload className="w-4 h-4 text-rose-600" />
                                  <span className="font-bold text-sm text-gray-900 dark:text-white">Product Delivery</span>
                                </div>
                               <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-lg border border-gray-200 dark:border-zinc-700">
                                  <button 
                                     type="button" 
                                     onClick={() => setFormData({...formData, downloadType: 'file'})} 
                                     className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${formData.downloadType === 'file' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                                  >File</button>
                                  <button 
                                     type="button" 
                                     onClick={() => setFormData({...formData, downloadType: 'link'})}
                                     className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${formData.downloadType === 'link' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                                  >Link</button>
                               </div>
                            </div>
                            
                            {formData.downloadType === 'link' ? (
                                <div className="relative group">
                                    <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-rose-600 transition-colors" />
                                    <input 
                                        type="url"
                                        placeholder="https://dropbox.com/..."
                                        value={formData.productUrl || ''}
                                        onChange={e => setFormData({...formData, productUrl: e.target.value})}
                                        className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all"
                                    />
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all cursor-pointer bg-white dark:bg-zinc-900">
                                    <Upload className="w-6 h-6 text-gray-400 mb-2" />
                                    <span className="text-xs font-medium text-gray-500">Upload Product File (ZIP/RAR)</span>
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            )}
                         </div>

                         {/* Audio Demo */}
                         <div className="bg-gray-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-3">
                            <div className="flex items-center gap-2">
                               <Music className="w-4 h-4 text-rose-600" />
                               <span className="font-bold text-sm text-gray-900 dark:text-white">Audio Preview</span>
                            </div>
                            <div className="relative group">
                                <FileAudio className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-rose-600 transition-colors" />
                                <input 
                                    type="url"
                                    placeholder="https://soundcloud.com/demo.mp3"
                                    value={formData.demoUrl || ''}
                                    onChange={e => setFormData({...formData, demoUrl: e.target.value})}
                                    className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all"
                                />
                            </div>
                         </div>
                         
                         {/* Meta Grid */}
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                 <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-2"><HardDrive className="w-3.5 h-3.5 text-gray-400"/> File Size</label>
                                 <input 
                                    value={formData.size}
                                    onChange={e => setFormData({...formData, size: e.target.value})}
                                    type="text"
                                    placeholder="e.g. 1.2 GB"
                                    className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all" 
                                 />
                            </div>
                            <div>
                                 <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-2"><Calendar className="w-3.5 h-3.5 text-gray-400"/> Date</label>
                                 <input 
                                    value={formData.uploadDate}
                                    onChange={e => setFormData({...formData, uploadDate: e.target.value})}
                                    type="date"
                                    className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all" 
                                 />
                            </div>
                         </div>
                      </div>

                      {/* Right Column: Text Details */}
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Product Name</label>
                          <input 
                            required
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-lg font-bold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:font-normal" 
                            placeholder="e.g. Neon Nights Vol. 1"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Price (₦)</label>
                             <div className="relative">
                                <span className="absolute left-4 top-3 text-gray-400 font-bold">₦</span>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    value={formData.price}
                                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                                    className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl pl-8 pr-4 py-2.5 font-mono font-bold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all" 
                                />
                             </div>
                           </div>
                           <div className="space-y-2">
                             <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Category</label>
                             <div className="relative">
                                <select 
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value as ProductCategory})}
                                    className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all appearance-none cursor-pointer"
                                >
                                    {Object.values(ProductCategory).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <Filter className="absolute right-4 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                             </div>
                           </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-yellow-500 fill-current"/> Initial Rating</label>
                             <input 
                               type="number" 
                               step="0.1"
                               max="5"
                               min="0"
                               value={formData.rating}
                               onChange={e => setFormData({...formData, rating: Number(e.target.value)})}
                               className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all" 
                             />
                        </div>

                        <div className="space-y-2 flex-grow flex flex-col">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Description & Features</label>
                          <div className="flex-grow border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10 transition-all">
                             <RichTextEditor 
                                value={formData.description || ''}
                                onChange={(val) => setFormData({...formData, description: val})}
                                className="min-h-[250px] p-4 bg-white dark:bg-zinc-900 h-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Footer */}
                    <div className="pt-6 border-t border-gray-200 dark:border-zinc-800 flex gap-4 sticky bottom-0 bg-white dark:bg-zinc-900">
                       <button 
                         type="button" 
                         disabled={isSaving}
                         onClick={() => setIsModalOpen(false)}
                         className="flex-1 py-4 border border-gray-200 dark:border-zinc-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                       >
                         Cancel
                       </button>
                       <button 
                         type="submit" 
                         disabled={isSaving}
                         className="flex-[2] py-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                       >
                         {isSaving ? <Loader className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />} 
                         {editingId ? 'Update Product' : 'Publish Product'}
                       </button>
                    </div>
                  </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Crop Modal */}
      <AnimatePresence>
        {isCropOpen && cropImgSrc && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-2xl p-6 w-full max-w-lg"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white"><Upload className="w-5 h-5 text-rose-600" /> Adjust Image</h3>
                        <button onClick={() => { setIsCropOpen(false); setCropImgSrc(null); imageInputRef.current!.value = ''; }} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="relative w-full flex justify-center mb-6 overflow-hidden bg-gray-100 dark:bg-black rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-700">
                        {/* Crop Area */}
                        <div 
                            className="relative overflow-hidden rounded-lg shadow-[0_0_0_100px_rgba(255,255,255,0.9)] dark:shadow-[0_0_0_100px_rgba(0,0,0,0.8)] cursor-move touch-none"
                            style={{ width: CROP_SIZE, height: CROP_SIZE }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchStart={handleMouseDown}
                            onTouchMove={handleMouseMove}
                            onTouchEnd={handleMouseUp}
                        >
                            <img 
                                ref={cropImgRef}
                                src={cropImgSrc}
                                onLoad={handleImageLoad}
                                alt="Crop Preview"
                                draggable={false}
                                className="absolute max-w-none origin-top-left pointer-events-none select-none"
                                style={{
                                    transform: `translate3d(${cropOffset.x}px, ${cropOffset.y}px, 0) scale(${baseScale * cropZoom})`,
                                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4 px-2">
                            <ZoomOut className="w-4 h-4 text-gray-400" />
                            <input 
                                type="range" 
                                min="1" 
                                max="3" 
                                step="0.1" 
                                value={cropZoom}
                                onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                                className="flex-1 accent-rose-600 h-1 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <ZoomIn className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="text-xs text-center text-gray-400 font-medium bg-gray-50 dark:bg-zinc-800 py-2 rounded-lg">Auto-compressed to ≤ 50KB for speed</div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => { setIsCropOpen(false); setCropImgSrc(null); imageInputRef.current!.value = ''; }}
                                className="flex-1 py-3 border border-gray-200 dark:border-zinc-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveCrop}
                                disabled={isProcessingCrop}
                                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
                            >
                                {isProcessingCrop ? <Loader className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />} Apply Crop
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProductsView;
