'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Image as ImageIcon, X, Upload, Save, 
  Music, Loader, ZoomIn, ZoomOut, Edit2, Trash2, Tag, DollarSign
} from 'lucide-react';
import { ProductCategory, Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { storage, BUCKET_ID, ID } from '@/appwrite'; 

const CROP_SIZE = 400;

const AdminProductsView: React.FC = () => {
  // --- States ---
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [productFile, setProductFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

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

  // --- Crop States ---
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

  // --- Data Actions ---
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

  useEffect(() => { fetchProducts(); }, []);

  const handleAdd = () => {
    setEditingId(null);
    setProductFile(null);
    setAudioFile(null);
    setFormData({
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
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
        try {
            await deleteDoc(doc(db, "products", id));
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            console.error("Delete error:", error);
        }
    }
  };

  // --- Upload & Save Logic ---
  const uploadToAppwrite = async (file: File) => {
    const response = await storage.createFile(BUCKET_ID, ID.unique(), file);
    return storage.getFileView(BUCKET_ID, response.$id).toString();
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

      const submissionData = {
        ...formData,
        productUrl: finalProductUrl,
        demoUrl: finalDemoUrl,
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), submissionData);
      } else {
        await addDoc(collection(db, "products"), { ...submissionData, sales: 0 });
      }
      
      fetchProducts();
      setIsModalOpen(false);
    } catch (error) {
      alert("Failed to save product.");
    } finally { setIsSaving(false); }
  };

  // --- Image Handling & Crop Helpers ---
  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => {
          setCropImgSrc(reader.result as string);
          setIsCropOpen(true);
          setCropZoom(1);
          setCropOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const scale = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
      setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setBaseScale(scale);
      setCropOffset({ x: (CROP_SIZE - img.naturalWidth * scale) / 2, y: (CROP_SIZE - img.naturalHeight * scale) / 2 });
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
      const canvas = document.createElement('canvas');
      canvas.width = CROP_SIZE; canvas.height = CROP_SIZE;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);
        ctx.drawImage(cropImgRef.current, cropOffset.x, cropOffset.y, imgDimensions.width * baseScale * cropZoom, imgDimensions.height * baseScale * cropZoom);
        setFormData({...formData, image: canvas.toDataURL('image/jpeg', 0.8)});
      }
      setIsCropOpen(false);
      setIsProcessingCrop(false);
  };

  return (
    <div className="space-y-8 bg-gray-50 dark:bg-black min-h-screen py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Product Management</h1>
          <p className="text-gray-500 font-medium">Manage your digital inventory and Appwrite assets.</p>
        </div>
        <button onClick={handleAdd} className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 transition-all">
          <Plus className="w-5 h-5" /> Add New Product
        </button>
      </div>

      {/* --- Product Grid Section --- */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-rose-600" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="group bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 overflow-hidden hover:shadow-xl transition-all">
              <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-zinc-800">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                 <h2 className="text-2xl font-black">{editingId ? 'Edit Product' : 'New Product'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                  <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Form inputs same as before... */}
                      <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-sm font-bold">Cover Art</label>
                           <div onClick={() => imageInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center cursor-pointer overflow-hidden relative group">
                              <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageInput} />
                              {formData.image ? <img src={formData.image} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="w-10 h-10 text-gray-300" />}
                           </div>
                        </div>
                        {/* Audio & File Section */}
                        <div className="space-y-4">
                           <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-800 p-3 rounded-xl">
                              <span className="text-sm font-bold">Download Type</span>
                              <div className="flex gap-2">
                                 <button type="button" onClick={() => setFormData({...formData, downloadType: 'file'})} className={`px-3 py-1 text-xs rounded-lg font-bold ${formData.downloadType === 'file' ? 'bg-rose-600 text-white' : 'text-gray-500'}`}>File</button>
                                 <button type="button" onClick={() => setFormData({...formData, downloadType: 'link'})} className={`px-3 py-1 text-xs rounded-lg font-bold ${formData.downloadType === 'link' ? 'bg-rose-600 text-white' : 'text-gray-500'}`}>Link</button>
                              </div>
                           </div>
                           {formData.downloadType === 'file' ? (
                              <div onClick={() => productFileInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer">
                                 <input type="file" ref={productFileInputRef} className="hidden" onChange={(e) => setProductFile(e.target.files?.[0] || null)} />
                                 <Upload className="mx-auto mb-2 text-gray-400" />
                                 <span className="text-xs text-gray-500 font-bold">{productFile ? productFile.name : 'Choose File'}</span>
                              </div>
                           ) : (
                              <input type="url" placeholder="Paste link here" value={formData.productUrl ?? ''} onChange={e => setFormData({...formData, productUrl: e.target.value})} className="w-full p-3 rounded-xl border dark:bg-zinc-900 dark:border-zinc-800" />
                           )}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <input required placeholder="Product Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 rounded-xl border font-bold dark:bg-zinc-900 dark:border-zinc-800" />
                        <div className="grid grid-cols-2 gap-4">
                           <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="p-3 rounded-xl border dark:bg-zinc-900 dark:border-zinc-800" />
                           <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as ProductCategory})} className="p-3 rounded-xl border dark:bg-zinc-900 dark:border-zinc-800">
                              {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>
                        <RichTextEditor value={formData.description || ''} onChange={(val) => setFormData({...formData, description: val})} />
                      </div>
                  </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-4">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-gray-500">Cancel</button>
                 <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-4 bg-rose-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                   {isSaving ? <Loader className="animate-spin" /> : <Save />} {editingId ? 'Update' : 'Publish'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Crop Modal remains the same as previous logic... */}
    </div>
  );
};

export default AdminProductsView;
