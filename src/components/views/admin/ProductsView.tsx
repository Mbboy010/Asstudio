'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  Plus, Edit2, Trash2, Image as ImageIcon, X, Save, 
  Loader, Music, CloudUpload, HardDrive, Calendar, Tag
} from 'lucide-react';
import { ProductCategory, Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import DescriptionEditor from './DescriptionEditor'; 
import { collection, updateDoc, deleteDoc, doc, getDocs, query, orderBy, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { storage, BUCKET_ID, ID } from '@/appwrite'; 
import { v4 as uuidv4 } from 'uuid';

const CROP_SIZE = 400;

/**
 * HELPER: Converts Base64/DataURL to a File object for Appwrite upload
 */
const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[arr.length - 1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
};

const AdminProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [productFile, setProductFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Standardized Form Data to match Upload View
  const [formData, setFormData] = useState({
    name: '',
    category: ProductCategory.SAMPLE_PACK,
    price: '',
    description: '',
    image: '', 
    size: '', 
    uploadDate: new Date().toISOString().split('T')[0],
    tagsInput: '', 
    productUrl: '',
    demoUrl: '',
    rating: '5.0'
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

  const cropImgRef = useRef<HTMLImageElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      description: product.description,
      image: product.image || '', // Fixed TypeScript null error
      size: product.size || '',
      uploadDate: product.uploadDate,
      tagsInput: product.features ? product.features.join(', ') : '',
      productUrl: product.productUrl || '',
      demoUrl: product.demoUrl || '',
      rating: product.rating?.toString() || '5.0'
    });
    setProductFile(null);
    setAudioFile(null);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      name: '', category: ProductCategory.SAMPLE_PACK, price: '',
      description: '', image: '', size: '', 
      uploadDate: new Date().toISOString().split('T')[0],
      tagsInput: '', productUrl: '', demoUrl: '', rating: '5.0'
    });
    setProductFile(null);
    setAudioFile(null);
    setIsModalOpen(true);
  };

  const uploadToAppwrite = async (file: File): Promise<string> => {
    try {
      const response = await storage.createFile(BUCKET_ID, ID.unique(), file);
      return storage.getFileView(BUCKET_ID, response.$id).toString();
    } catch (error) {
      console.error("Appwrite Upload Error", error);
      throw error;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalProductUrl = formData.productUrl;
      let finalDemoUrl = formData.demoUrl;
      let finalImageUrl = formData.image;

      if (productFile) finalProductUrl = await uploadToAppwrite(productFile);
      if (audioFile) finalDemoUrl = await uploadToAppwrite(audioFile);
      
      // If image is a fresh crop (base64), upload it to Appwrite
      if (formData.image.startsWith('data:image')) {
        const imageFile = dataURLtoFile(formData.image, `edit-${uuidv4()}.jpg`);
        finalImageUrl = await uploadToAppwrite(imageFile);
      }

      const submissionData = {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        description: formData.description,
        image: finalImageUrl,
        size: formData.size,
        features: formData.tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        uploadDate: formData.uploadDate,
        productUrl: finalProductUrl,
        demoUrl: finalDemoUrl,
        rating: Number(formData.rating),
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), submissionData);
      } else {
        const newId = `${formData.name.replace(/\s+/g, '-').toLowerCase()}-${uuidv4().substring(0,8)}`;
        await setDoc(doc(db, "products", newId), { ...submissionData, sales: 0 });
      }
      
      await fetchProducts();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally { setIsSaving(false); }
  };

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

  const handleSaveCrop = () => {
    if (!cropImgRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = CROP_SIZE; canvas.height = CROP_SIZE;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);
        ctx.drawImage(cropImgRef.current, cropOffset.x, cropOffset.y, imgDimensions.width * baseScale * cropZoom, imgDimensions.height * baseScale * cropZoom);
        setFormData(prev => ({...prev, image: canvas.toDataURL('image/jpeg', 0.8)}));
    }
    setIsCropOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, "products", id));
        setProducts(products.filter(p => p.id !== id));
      } catch (error) { console.error(error); }
    }
  };

  return (
    <div className="space-y-8 bg-gray-50 dark:bg-black min-h-screen py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Product Management</h1>
          <p className="text-gray-500 font-medium">Manage and edit your digital store inventory.</p>
        </div>
        <button onClick={handleAdd} className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20">
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
                {product.image && (
                  <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                   <button onClick={() => handleEdit(product)} className="p-2 bg-white/90 dark:bg-zinc-900/90 rounded-full shadow-lg hover:text-rose-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                   <button onClick={() => handleDelete(product.id)} className="p-2 bg-white/90 dark:bg-zinc-900/90 rounded-full shadow-lg hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{product.name}</h3>
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-rose-600 font-black text-sm">₦{product.price.toLocaleString()}</span>
                  <span className="text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md">{product.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-zinc-800">
                 <h2 className="text-2xl font-black">{editingId ? 'Edit Product' : 'New Product'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Media Column */}
                  <div className="md:col-span-4 space-y-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Cover Image</label>
                       <div onClick={() => imageInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-700 flex items-center justify-center cursor-pointer hover:border-rose-500 overflow-hidden relative bg-gray-50 dark:bg-zinc-800 group">
                          <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageInput} />
                          {formData.image ? <Image src={formData.image} alt="Preview" fill className="object-cover" /> : <ImageIcon className="w-10 h-10 text-gray-300" />}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity">Change Image</div>
                       </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-4">
                       <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Files</label>
                       <div onClick={() => productFileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-900/10 cursor-pointer">
                           <input type="file" ref={productFileInputRef} className="hidden" onChange={(e) => setProductFile(e.target.files?.[0] || null)} />
                           <CloudUpload className="w-6 h-6 text-rose-500 mb-1" />
                           <span className="text-[10px] font-bold text-center truncate w-full">{productFile ? productFile.name : 'Replace Product File (ZIP)'}</span>
                       </div>
                       
                       <div className="space-y-2">
                         <div className="flex items-center gap-2 text-xs font-bold text-gray-500"><Music className="w-3.5 h-3.5"/> Audio Demo</div>
                         <input type="file" accept="audio/*" className="w-full text-[10px] file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-rose-600 file:text-white" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
                       </div>
                    </div>
                  </div>

                  {/* Details Column */}
                  <div className="md:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Name</label>
                        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-rose-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Category</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as ProductCategory})} className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none cursor-pointer">
                          {Object.values(ProductCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold flex items-center gap-2"><Tag className="w-3.5 h-3.5"/> Price (₦)</label>
                        <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-mono font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold flex items-center gap-2"><HardDrive className="w-3.5 h-3.5"/> Size</label>
                        <input placeholder="1.2 GB" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold flex items-center gap-2"><Calendar className="w-3.5 h-3.5"/> Date</label>
                        <input type="date" value={formData.uploadDate} onChange={e => setFormData({...formData, uploadDate: e.target.value})} className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold">Tags (Comma separated)</label>
                      <input placeholder="Serum, Bass, Trap..." value={formData.tagsInput} onChange={e => setFormData({...formData, tagsInput: e.target.value})} className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3" />
                    </div>

                    <div className="space-y-2 min-h-[300px] flex flex-col">
                      <label className="text-sm font-bold">Description</label>
                      <DescriptionEditor value={formData.description} onChange={(val) => setFormData({...formData, description: val})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-gray-500">Cancel</button>
                 <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2">
                   {isSaving ? <Loader className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />} 
                   {editingId ? 'Update Product' : 'Create Product'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CROP MODAL */}
      <AnimatePresence>
        {isCropOpen && cropImgSrc && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl max-w-lg w-full">
                    <h3 className="text-xl font-black mb-6 dark:text-white">Adjust Image</h3>
                    <div className="relative overflow-hidden bg-black rounded-xl mb-6 flex justify-center items-center" style={{ width: '100%', height: CROP_SIZE }}>
                        <div 
                          className="relative overflow-hidden shadow-[0_0_0_1000px_rgba(0,0,0,0.5)] cursor-move" 
                          style={{ width: CROP_SIZE, height: CROP_SIZE }} 
                          onMouseDown={(e) => { setIsDragging(true); setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y }); }}
                          onMouseMove={(e) => {
                             if (!isDragging) return;
                             setCropOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                          }}
                          onMouseUp={() => setIsDragging(false)}
                        >
                            <img ref={cropImgRef} src={cropImgSrc} alt="Crop" onLoad={(e) => {
                               const img = e.currentTarget;
                               const scale = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
                               setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                               setBaseScale(scale);
                            }} draggable={false} className="absolute max-w-none origin-top-left" style={{ transform: `translate3d(${cropOffset.x}px, ${cropOffset.y}px, 0) scale(${baseScale * cropZoom})` }} />
                        </div>
                    </div>
                    <input type="range" min="1" max="3" step="0.1" value={cropZoom} onChange={(e) => setCropZoom(parseFloat(e.target.value))} className="w-full accent-rose-600 mb-6" />
                    <div className="flex gap-3">
                        <button onClick={() => setIsCropOpen(false)} className="flex-1 py-3 border border-gray-200 dark:border-zinc-700 rounded-xl font-bold dark:text-white">Cancel</button>
                        <button onClick={handleSaveCrop} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold">Apply</button>
                    </div>
                </div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProductsView;
