/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, Edit2, Trash2, Image as ImageIcon, X, Upload, Save, 
  Loader, Music, ZoomIn, ZoomOut, Tag, DollarSign, Layers
} from 'lucide-react';
import { ProductCategory, Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';

// --- Appwrite Imports ---
import { storage, BUCKET_ID, ID } from '@/appwrite'; 

const CROP_SIZE = 400;

/**
 * FIX: Extended interface to handle potential nulls from Database
 * Omit standard productUrl/demoUrl to redefine them with null safety.
 */
interface ProductFormState extends Partial<Omit<Product, 'productUrl' | 'demoUrl'>> {
  screenshots?: string[];
  productUrl?: string | null;
  demoUrl?: string | null;
  downloadType?: 'file' | 'link';
}

const AdminProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [productFile, setProductFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProductFormState>({
    name: '',
    category: ProductCategory.SAMPLE_PACK,
    price: 0,
    description: '',
    image: '',
    screenshots: [],
    features: [],
    size: '',
    rating: 5.0,
    uploadDate: new Date().toISOString().split('T')[0],
    productUrl: '',
    demoUrl: '',
    downloadType: 'file'
  });

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
  const productFileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
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
  }, []);

  useEffect(() => { 
    fetchProducts(); 
  }, [fetchProducts]);

  /**
   * FIX: The "Property screenshots does not exist" error.
   * We cast 'product' to 'any' here because the central Product type 
   * is likely missing the screenshots definition.
   */
  const handleEdit = (product: Product) => {
    const rawProduct = product as any;
    setEditingId(product.id);
    setFormData({
        ...product,
        productUrl: product.productUrl ?? '',
        demoUrl: product.demoUrl ?? '',
        screenshots: rawProduct.screenshots || []
    });
    setProductFile(null);
    setAudioFile(null);
    setScreenshotFiles([]);
    setScreenshotPreviews([]);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setProductFile(null);
    setAudioFile(null);
    setScreenshotFiles([]);
    setScreenshotPreviews([]);
    setFormData({
      name: '',
      category: ProductCategory.SAMPLE_PACK,
      price: 0,
      description: '',
      image: '',
      screenshots: [],
      features: [],
      size: '',
      rating: 5.0,
      uploadDate: new Date().toISOString().split('T')[0],
      productUrl: '',
      demoUrl: '',
      downloadType: 'file'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this product?')) {
      try {
        await deleteDoc(doc(db, "products", id));
        setProducts(products.filter(p => p.id !== id));
      } catch (error) { console.error(error); }
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setScreenshotFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setScreenshotPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeExistingScreenshot = (urlToRemove: string) => {
    setFormData(prev => ({
        ...prev,
        screenshots: prev.screenshots?.filter(url => url !== urlToRemove)
    }));
  };

  const removeNewScreenshot = (index: number) => {
    setScreenshotFiles(prev => prev.filter((_, i) => i !== index));
    setScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadToAppwrite = async (file: File) => {
    const response = await storage.createFile(BUCKET_ID, ID.unique(), file);
    const fileUrl = storage.getFileView(BUCKET_ID, response.$id);
    return fileUrl.toString();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalProductUrl = formData.productUrl;
      let finalDemoUrl = formData.demoUrl;

      if (productFile && formData.downloadType === 'file') {
        finalProductUrl = await uploadToAppwrite(productFile);
      }

      if (audioFile) {
        finalDemoUrl = await uploadToAppwrite(audioFile);
      }

      const newScreenshotUrls = await Promise.all(
        screenshotFiles.map(file => uploadToAppwrite(file))
      );

      const combinedScreenshots = [
        ...(formData.screenshots || []),
        ...newScreenshotUrls
      ];

      const submissionData = {
        ...formData,
        productUrl: finalProductUrl || '',
        demoUrl: finalDemoUrl || '',
        screenshots: combinedScreenshots,
        uploadDate: new Date().toISOString().split('T')[0]
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), submissionData);
      } else {
        await addDoc(collection(db, "products"), { ...submissionData, sales: 0 });
      }
      
      fetchProducts();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to save product.");
    } finally { setIsSaving(false); }
  };

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
          setCropImgSrc(reader.result as string);
          setIsCropOpen(true);
          setCropZoom(1);
          setCropOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const scale = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
      setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setBaseScale(scale);
      setCropOffset({
          x: (CROP_SIZE - img.naturalWidth * scale) / 2,
          y: (CROP_SIZE - img.naturalHeight * scale) / 2
      });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
      
      const scaledWidth = imgDimensions.width * baseScale * cropZoom;
      const scaledHeight = imgDimensions.height * baseScale * cropZoom;

      setCropOffset({
          x: Math.min(Math.max(clientX - dragStart.x, CROP_SIZE - scaledWidth), 0),
          y: Math.min(Math.max(clientY - dragStart.y, CROP_SIZE - scaledHeight), 0)
      });
  };

  const handleSaveCrop = async () => {
      if (!cropImgRef.current) return;
      setIsProcessingCrop(true);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = CROP_SIZE; canvas.height = CROP_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);
        ctx.drawImage(cropImgRef.current, cropOffset.x, cropOffset.y, imgDimensions.width * baseScale * cropZoom, imgDimensions.height * baseScale * cropZoom);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormData({...formData, image: dataUrl});
        setIsCropOpen(false);
      } finally { setIsProcessingCrop(false); }
  };

  return (
    <div className="space-y-8 bg-gray-50 dark:bg-black min-h-screen py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Product Management</h1>
          <p className="text-gray-500 font-medium">Manage your digital inventory and Appwrite assets.</p>
        </div>
        <button onClick={handleAdd} className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 active:scale-95 transition-all">
          <Plus className="w-5 h-5" /> Add New Product
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-rose-600" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="group bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 overflow-hidden hover:shadow-xl transition-all">
              <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-zinc-800">
                <img src={product.image || undefined} alt={product.name || 'Product'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3 flex gap-2">
                   <button onClick={() => handleEdit(product)} className="p-2 bg-white/90 dark:bg-zinc-900/90 rounded-full shadow-lg hover:text-rose-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                   <button onClick={() => handleDelete(product.id)} className="p-2 bg-white/90 dark:bg-zinc-900/90 rounded-full shadow-lg hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{product.name}</h3>
                  <span className="text-rose-600 font-black">₦{product.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {product.category}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {product.sales || 0} Sales</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-20">
                 <h2 className="text-2xl font-black text-gray-900 dark:text-white">{editingId ? 'Edit Product' : 'New Product'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                  <form onSubmit={handleSave} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                         <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Cover Art</label>
                            <div onClick={() => imageInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center cursor-pointer hover:border-rose-500 overflow-hidden relative bg-gray-50 dark:bg-zinc-800/50 group">
                               <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageInput} />
                               {formData.image ? <img src={formData.image || undefined} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="w-10 h-10 text-gray-300" />}
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity">Change Image</div>
                            </div>
                         </div>

                         <div className="bg-gray-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-4">
                            <label className="text-sm font-bold flex items-center gap-2"><Layers className="w-4 h-4" /> Screenshots</label>
                            <div className="grid grid-cols-3 gap-2">
                                {formData.screenshots?.map((url, idx) => (
                                    <div key={`exist-${idx}`} className="relative aspect-video rounded-lg overflow-hidden border border-zinc-700">
                                        <img src={url || undefined} alt="screenshot" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeExistingScreenshot(url)} className="absolute top-1 right-1 p-1 bg-red-600 rounded-full text-white"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                                {screenshotPreviews.map((url, idx) => (
                                    <div key={`new-${idx}`} className="relative aspect-video rounded-lg overflow-hidden border border-rose-500">
                                        <img src={url || undefined} alt="new screenshot" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeNewScreenshot(idx)} className="absolute top-1 right-1 p-1 bg-red-600 rounded-full text-white"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => screenshotInputRef.current?.click()} className="aspect-video rounded-lg border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center hover:border-rose-500 transition-colors">
                                    <Plus className="w-4 h-4 text-zinc-500" />
                                    <span className="text-[10px] font-bold text-zinc-500">Add</span>
                                    <input type="file" multiple ref={screenshotInputRef} className="hidden" accept="image/*" onChange={handleScreenshotChange} />
                                </button>
                            </div>
                         </div>

                         <div className="bg-gray-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-4">
                            <div className="flex items-center justify-between">
                               <span className="font-bold text-sm">Product File (Appwrite)</span>
                               <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-lg">
                                  <button type="button" onClick={() => setFormData({...formData, downloadType: 'file'})} className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${formData.downloadType === 'file' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-500'}`}>File</button>
                                  <button type="button" onClick={() => setFormData({...formData, downloadType: 'link'})} className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${formData.downloadType === 'link' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-500'}`}>Link</button>
                               </div>
                            </div>
                            
                            {formData.downloadType === 'file' ? (
                                <div onClick={() => productFileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-900/10 cursor-pointer">
                                    <input type="file" ref={productFileInputRef} className="hidden" onChange={(e) => setProductFile(e.target.files?.[0] || null)} />
                                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                    <span className="text-xs font-bold text-gray-500">{productFile ? productFile.name : 'Select ZIP/RAR file'}</span>
                                </div>
                            ) : (
                                <input type="url" placeholder="Direct Download Link" value={formData.productUrl || ''} onChange={e => setFormData({...formData, productUrl: e.target.value})} className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm" />
                            )}
                         </div>

                         <div className="bg-gray-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-3">
                            <label className="text-sm font-bold flex items-center gap-2"><Music className="w-4 h-4" /> Audio Demo</label>
                            <input type="file" accept="audio/*" className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
                            {audioFile && <p className="text-[10px] font-bold text-green-600">Selected: {audioFile.name}</p>}
                         </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold">Product Name</label>
                          <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-rose-500 outline-none" placeholder="Sample Pack Name" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <label className="text-sm font-bold">Price (₦)</label>
                             <input type="number" required value={formData.price || 0} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 font-mono font-bold" />
                           </div>
                           <div className="space-y-2">
                             <label className="text-sm font-bold">Category</label>
                             <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as ProductCategory})} className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 outline-none appearance-none cursor-pointer">
                                {Object.values(ProductCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                             </select>
                           </div>
                        </div>
                        <div className="space-y-2 flex flex-col">
                          <label className="text-sm font-bold">Description</label>
                          <RichTextEditor value={formData.description || ''} onChange={(val) => setFormData({...formData, description: val})} className="min-h-[200px] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl" />
                        </div>
                      </div>
                    </div>
                  </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-4 sticky bottom-0 z-20">
                 <button type="button" disabled={isSaving} onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-gray-200 dark:border-zinc-700 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
                 <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2">
                   {isSaving ? <Loader className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />} 
                   {editingId ? 'Update Product' : 'Publish Product'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCropOpen && cropImgSrc && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl max-w-lg w-full">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black">Adjust Cover Art</h3>
                        <X onClick={() => setIsCropOpen(false)} className="cursor-pointer text-gray-400" />
                    </div>
                    <div className="relative overflow-hidden bg-black rounded-xl mb-6 flex justify-center items-center" style={{ width: '100%', height: CROP_SIZE }}>
                        <div 
                          className="relative overflow-hidden shadow-[0_0_0_1000px_rgba(0,0,0,0.5)] cursor-move touch-none" 
                          style={{ width: CROP_SIZE, height: CROP_SIZE }} 
                          onMouseDown={(e) => { setIsDragging(true); setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y }); }} 
                          onMouseMove={handleMouseMove} 
                          onMouseUp={() => setIsDragging(false)}
                        >
                            <img ref={cropImgRef} src={cropImgSrc || undefined} alt="Crop Preview" onLoad={handleImageLoad} draggable={false} className="absolute max-w-none origin-top-left pointer-events-none" style={{ transform: `translate3d(${cropOffset.x}px, ${cropOffset.y}px, 0) scale(${baseScale * cropZoom})` }} />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                        <ZoomOut className="text-gray-400" />
                        <input type="range" min="1" max="3" step="0.1" value={cropZoom} onChange={(e) => setCropZoom(parseFloat(e.target.value))} className="flex-1 accent-rose-600" />
                        <ZoomIn className="text-gray-400" />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsCropOpen(false)} className="flex-1 py-3 border border-gray-200 dark:border-zinc-700 rounded-xl font-bold">Cancel</button>
                        <button onClick={handleSaveCrop} disabled={isProcessingCrop} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                           {isProcessingCrop ? <Loader className="w-4 h-4 animate-spin"/> : 'Apply'}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProductsView;
