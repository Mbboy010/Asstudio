'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image'; 
import { Upload as UploadIcon, X, FileAudio, Image as ImageIcon, Check, Loader, CloudUpload, Info, Calendar, HardDrive, Link as LinkIcon, Music, ZoomIn, ZoomOut, Plus, Layers } from 'lucide-react';
import { ProductCategory } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import DescriptionEditor from './DescriptionEditor'; 
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { v4 as uuidv4 } from 'uuid';

// --- APPWRITE IMPORTS ---
import { storage, BUCKET_ID, ID } from '@/appwrite'; 

const CROP_SIZE = 400;

/**
 * HELPER: Converts a Base64/DataURL string into a File object 
 * so it can be uploaded like a normal image.
 */
const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[arr.length - 1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const AdminUploadView: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);

  // Product File State
  const [productType, setProductType] = useState<'file' | 'link'>('file');
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productUrl, setProductUrl] = useState('');
  const [isProductDragActive, setIsProductDragActive] = useState(false);

  // Demo Audio State
  const [demoType, setDemoType] = useState<'file' | 'link'>('file');
  const [demoFile, setDemoFile] = useState<File | null>(null);
  const [demoUrl, setDemoUrl] = useState('');
  const [isDemoDragActive, setIsDemoDragActive] = useState(false);

  // Cover Image State
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Screenshot State
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

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
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    category: ProductCategory.SAMPLE_PACK,
    price: '',
    description: '',
    tags: '',
    size: '',
    rating: '5.0',
    uploadDate: new Date().toISOString().split('T')[0]
  });
  
  const iduu = uuidv4();
  const productInputRef = useRef<HTMLInputElement>(null);
  const demoInputRef = useRef<HTMLInputElement>(null);

  // --- HELPER: Upload to Appwrite ---
  const uploadToAppwrite = async (file: File): Promise<string> => {
    try {
        const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), file);
        // Get the public preview/view URL
        return storage.getFileView(BUCKET_ID, uploaded.$id).toString(); 
    } catch (error) {
        console.error("Appwrite Upload Error:", error);
        throw error;
    }
  };

  const handleProductDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsProductDragActive(true);
    else if (e.type === 'dragleave') setIsProductDragActive(false);
  };

  const handleProductDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsProductDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setProductFile(file);
      setFormData(prev => ({ ...prev, size: (file.size / (1024 * 1024)).toFixed(2) + ' MB' }));
    }
  };

  const handleDemoDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDemoDragActive(true);
    else if (e.type === 'dragleave') setIsDemoDragActive(false);
  };

  const handleDemoDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDemoDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        setDemoFile(file);
      } else {
        alert("Please upload an audio file for the demo.");
      }
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files);
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));

        setScreenshotFiles(prev => [...prev, ...newFiles]);
        setScreenshotPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshotFiles(prev => prev.filter((_, i) => i !== index));
    setScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        let quality = 0.9;
        let dataUrl = await compressImage(canvas, quality);

        // Compress until it's under a reasonable size for Base64 preview
        while (dataUrl.length > 68000 && quality > 0.1) {
            quality -= 0.1;
            dataUrl = await compressImage(canvas, quality);
        }

        setCoverPreview(dataUrl);
        setIsCropOpen(false);
        setCropImgSrc(null);
      } catch (error) {
        console.error("Error cropping image:", error);
        alert("Failed to process image.");
      } finally {
        setIsProcessingCrop(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
        alert("Please fill in all required fields.");
        return;
    }

    setIsUploading(true);
    try {
      let finalProductUrl = productUrl;
      let finalDemoUrl = demoUrl;
      let finalCoverUrl = ""; // This will hold the Appwrite URL

      // 1. Upload Product File
      if (productType === 'file' && productFile) {
        finalProductUrl = await uploadToAppwrite(productFile);
      }

      // 2. Upload Demo Track
      if (demoType === 'file' && demoFile) {
        finalDemoUrl = await uploadToAppwrite(demoFile);
      }

      // 3. Upload Screenshots
      const screenshotUrls = await Promise.all(
        screenshotFiles.map(file => uploadToAppwrite(file))
      );
      
      // 4. CONVERT BASE64 COVER TO FILE & UPLOAD TO APPWRITE
      if (coverPreview && coverPreview.startsWith('data:image')) {
        const coverFile = dataURLtoFile(coverPreview, `cover-${iduu}.jpg`);
        finalCoverUrl = await uploadToAppwrite(coverFile);
      }
      
      function replaceWhiteWithDash(str: string): string {
            return str.replace(/\s+/g, '-');
      }
                
      const dataId = `${replaceWhiteWithDash(formData.name)}-${iduu}`;
      
      // 5. Save to Firestore (with Appwrite URL instead of Base64)
      await setDoc(doc(collection(db, "products"), dataId), {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        description: formData.description,
        size: formData.size || "N/A",
        rating: Number(formData.rating),
        sales: 0,
        uploadDate: formData.uploadDate,
        features: formData.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        image: finalCoverUrl, // Now a standard Appwrite URL
        screenshots: screenshotUrls,
        downloadType: productType,
        productUrl: finalProductUrl || null,
        demoUrl: finalDemoUrl || null,
      });

      alert("Product successfully published!");

      // Reset Form
      setProductFile(null); setProductUrl('');
      setDemoFile(null); setDemoUrl('');
      setScreenshotFiles([]); setScreenshotPreviews([]);
      setCoverPreview(null);
      setFormData({
        name: '', category: ProductCategory.SAMPLE_PACK, price: '',
        description: '', tags: '', size: '', rating: '5.0',
        uploadDate: new Date().toISOString().split('T')[0]
      });

    } catch (error) {
      console.error("Error uploading product:", error);
      alert("Failed to upload. Please check your connection.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen py-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-gray-200 dark:border-zinc-800 pb-6">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-500 rounded-xl">
                <CloudUpload className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">Upload Content</h1>
                <p className="text-gray-500 font-medium">Add new products to your digital marketplace.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <div className="lg:col-span-2 space-y-6">

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                        <FileAudio className="w-5 h-5 text-rose-600" /> Product Source
                    </h3>
                    <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
                        <button
                        type="button"
                        onClick={() => setProductType('file')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${productType === 'file' ? 'bg-white dark:bg-zinc-700 text-rose-600 shadow-md' : 'text-gray-500'}`}
                        >File Upload</button>
                        <button
                        type="button"
                        onClick={() => setProductType('link')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${productType === 'link' ? 'bg-white dark:bg-zinc-700 text-rose-600 shadow-md' : 'text-gray-500'}`}
                        >External Link</button>
                    </div>
                </div>

                {productType === 'file' ? (
                    <div 
                        className={`relative h-48 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden ${
                        isProductDragActive 
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' 
                        : 'border-gray-200 dark:border-zinc-700 hover:border-rose-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                        }`}
                        onDragEnter={handleProductDrag} onDragLeave={handleProductDrag} onDragOver={handleProductDrag} onDrop={handleProductDrop}
                        onClick={() => productInputRef.current?.click()}
                    >
                        <input ref={productInputRef} type="file" className="hidden" onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setProductFile(e.target.files[0]);
                                setFormData(prev => ({...prev, size: (e.target.files![0].size / (1024*1024)).toFixed(2) + ' MB'}));
                            }
                        }} accept=".zip,.rar,.vst,.dmg,.exe" />

                        {productFile ? (
                            <div className="flex flex-col items-center z-10">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center mb-3 shadow-sm">
                                    <Check className="w-6 h-6" />
                                </div>
                                <p className="font-bold text-gray-900 dark:text-white text-base">{productFile.name}</p>
                                <p className="text-gray-500 text-sm mb-3">{(productFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setProductFile(null); }} className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors">
                                    Remove File
                                </button>
                            </div>
                        ) : (
                            <>
                            <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-full mb-3">
                                <CloudUpload className="w-8 h-8 text-rose-500" />
                            </div>
                            <p className="font-bold text-gray-900 dark:text-white">Click or Drag Product File</p>
                            <p className="text-gray-500 text-xs mt-1">Supports ZIP, RAR, VST, DMG</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">External Download URL</label>
                        <div className="relative group">
                            <LinkIcon className="absolute left-4 top-3.5 text-gray-400 w-5 h-5 group-focus-within:text-rose-600 transition-colors" />
                            <input 
                            type="url" 
                            placeholder="https://dropbox.com/..." 
                            value={productUrl}
                            onChange={(e) => setProductUrl(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all font-medium"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                        <Music className="w-5 h-5 text-rose-600" /> Audio Preview
                    </h3>
                    <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
                        <button
                        type="button"
                        onClick={() => setDemoType('file')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${demoType === 'file' ? 'bg-white dark:bg-zinc-700 text-rose-600 shadow-md' : 'text-gray-500'}`}
                        >File Upload</button>
                        <button
                        type="button"
                        onClick={() => setDemoType('link')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${demoType === 'link' ? 'bg-white dark:bg-zinc-700 text-rose-600 shadow-md' : 'text-gray-500'}`}
                        >External Link</button>
                    </div>
                </div>

                {demoType === 'file' ? (
                    <div 
                        className={`relative h-32 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden ${
                        isDemoDragActive 
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' 
                        : 'border-gray-200 dark:border-zinc-700 hover:border-rose-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                        }`}
                        onDragEnter={handleDemoDrag} onDragLeave={handleDemoDrag} onDragOver={handleDemoDrag} onDrop={handleDemoDrop}
                        onClick={() => demoInputRef.current?.click()}
                    >
                        <input ref={demoInputRef} type="file" className="hidden" onChange={(e) => {
                            if (e.target.files?.[0]) setDemoFile(e.target.files[0]);
                        }} accept="audio/*" />

                        {demoFile ? (
                            <div className="flex flex-col items-center z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center"><Music className="w-3 h-3" /></div>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{demoFile.name}</p>
                                </div>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setDemoFile(null); }} className="text-red-500 hover:text-red-600 hover:underline text-xs font-bold">Remove Track</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                                    <Music className="w-6 h-6 text-gray-400" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">Upload Demo Track</p>
                                    <p className="text-gray-500 text-xs">MP3, WAV, OGG</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">External Audio URL</label>
                        <div className="relative group">
                            <LinkIcon className="absolute left-4 top-3.5 text-gray-400 w-5 h-5 group-focus-within:text-rose-600 transition-colors" />
                            <input 
                            type="url" 
                            placeholder="https://soundcloud.com/.../demo.mp3" 
                            value={demoUrl}
                            onChange={(e) => setDemoUrl(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all font-medium"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-8 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg mb-6">
                    <Layers className="w-5 h-5 text-rose-600" /> Product Screenshots
                </h3>

                <div className="space-y-4">
                    <div 
                        onClick={() => screenshotInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:border-rose-400 transition-all"
                    >
                        <input 
                            ref={screenshotInputRef} 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleScreenshotChange} 
                        />
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-full mb-3 text-rose-600">
                            <ImageIcon className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white">Add Screenshots</p>
                        <p className="text-gray-500 text-xs">PNG, JPG (Max 5 recommended)</p>
                    </div>

                    {screenshotPreviews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <AnimatePresence>
                                {screenshotPreviews.map((src, index) => (
                                    <motion.div 
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700"
                                    >
                                        <Image 
                                          src={src} 
                                          alt={`Screenshot ${index}`} 
                                          fill
                                          className="object-cover" 
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => removeScreenshot(index)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-8 shadow-sm space-y-8">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                    <Info className="w-5 h-5 text-rose-600" /> Product Details
                </h3>

                <div className="space-y-6">
                    <div className="space-y-2.5">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Product Name</label>
                        <input 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        type="text" 
                        placeholder="e.g. Neon Nights Vol. 1" 
                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3.5 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all font-bold text-lg" 
                        />
                    </div>

                    <div className="space-y-2.5 flex flex-col h-full min-h-[300px]">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Description</label>
                        <div className="flex-1 rounded-xl overflow-hidden focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10 transition-all z-10">
                            <DescriptionEditor 
                                value={formData.description}
                                onChange={(val) => setFormData({...formData, description: val})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Tags</label>
                        <input 
                        value={formData.tags}
                        onChange={e => setFormData({...formData, tags: e.target.value})}
                        type="text" 
                        placeholder="e.g. Bass, Serum, 140BPM, Trap (Comma separated)" 
                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all" 
                        />
                    </div>
                </div>
            </div>
            </div>

            <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <ImageIcon className="w-5 h-5 text-rose-600" /> Cover Art
                </h3>
                <div 
                    onClick={() => coverInputRef.current?.click()}
                    className="aspect-square w-full rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border-2 border-dashed border-gray-200 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all overflow-hidden relative group"
                >
                    <input ref={coverInputRef} type="file" className="hidden" onChange={handleCoverChange} accept="image/*" />
                    {coverPreview ? (
                        <>
                        <Image 
                          src={coverPreview} 
                          alt="Cover" 
                          fill
                          className="object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-all backdrop-blur-sm z-10">
                            <UploadIcon className="w-5 h-5 mr-2" /> Change Image
                        </div>
                        </>
                    ) : (
                        <>
                        <div className="p-4 bg-white dark:bg-zinc-800 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6 text-gray-400 group-hover:text-rose-500" />
                        </div>
                        <span className="text-sm font-bold text-gray-500 group-hover:text-rose-600">Upload Image</span>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-6 space-y-5 shadow-sm">
                <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400">Technical Specs</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5"/> File Size</label>
                        <input 
                        value={formData.size}
                        onChange={e => setFormData({...formData, size: e.target.value})}
                        type="text" 
                        placeholder="e.g. 1.2 GB" 
                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Release Date</label>
                        <input 
                        value={formData.uploadDate}
                        onChange={e => setFormData({...formData, uploadDate: e.target.value})}
                        type="date" 
                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all" 
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-6 space-y-6 shadow-sm">
                <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400">Publishing</h3>

                <div className="space-y-2.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Price (₦)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-3 text-gray-400 font-bold text-lg">₦</span>
                        <input 
                            required
                            value={formData.price}
                            onChange={e => setFormData({...formData, price: e.target.value})}
                            type="number" 
                            min="0" 
                            step="0.01" 
                            placeholder="29.99" 
                            className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl pl-8 pr-4 py-2.5 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all font-mono text-xl font-black text-gray-900 dark:text-white" 
                        />
                    </div>
                </div>

                <div className="space-y-2.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Category</label>
                    <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value as ProductCategory})}
                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all cursor-pointer font-medium"
                    >
                        {Object.values(ProductCategory).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={isUploading}
                className="w-full py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 hover:shadow-xl hover:shadow-rose-600/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
            >
                {isUploading ? (
                    <>
                    <Loader className="w-5 h-5 animate-spin" /> Uploading...
                    </>
                ) : (
                    <>
                    <CloudUpload className="w-5 h-5" /> Publish Product
                    </>
                )}
            </button>
            </div>
        </form>

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
                        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2"><UploadIcon className="w-6 h-6 text-rose-600" /> Adjust Image</h3>
                        <button onClick={() => { setIsCropOpen(false); setCropImgSrc(null); if (coverInputRef.current) coverInputRef.current.value = ''; }} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="relative w-full flex justify-center mb-6 overflow-hidden bg-gray-100 dark:bg-black rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-700">
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
                            alt="Crop Preview"
                            draggable={false}
                            onLoad={handleImageLoad}
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
                                onClick={() => { setIsCropOpen(false); setCropImgSrc(null); if (coverInputRef.current) coverInputRef.current.value = ''; }}
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
    </div>
  );
};

export default AdminUploadView;
