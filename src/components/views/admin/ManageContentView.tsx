/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, Edit2, Trash2, Search, MessageSquare, 
  Download, ShoppingCart, HardDrive, Calendar,
  MoreVertical, ExternalLink, Loader, X, Save,
  Image as ImageIcon, Upload, Star, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, query, orderBy, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { ProductCategory, Product } from '@/types';

// --- Sub-Components ---
import ReviewModal from './ReviewModal';

const AdminManageView: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals State
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const q = query(collection(db, "products"), orderBy("uploadDate", "desc"));
    
    // Using onSnapshot for real-time dashboard updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(docs);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsub = fetchProducts();
    return () => unsub();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Permanent delete? This cannot be undone.")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050505] p-4 md:p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight dark:text-white">AS-STUDIO INVENTORY</h1>
          <p className="text-zinc-500 font-medium">Manage {products.length} assets and live user feedback.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search assets..."
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 transition-all w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-rose-600 hover:bg-rose-700 text-white p-2.5 rounded-xl transition-transform active:scale-95 shadow-lg shadow-rose-600/20">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Stats</th>
                <th className="px-6 py-4">Pricing</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20"><Loader className="animate-spin mx-auto text-rose-600" /></td></tr>
              ) : filteredProducts.map((product) => (
                <tr key={product.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold dark:text-white text-sm line-clamp-1">{product.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{product.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-wider">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5" title="Downloads">
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{product.downloads ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Cart Adds">
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{product.cartAdds ?? 0}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm font-black ${product.price === 0 ? 'text-green-500' : 'dark:text-white'}`}>
                      {product.price === 0 ? 'FREE' : `₦${product.price.toLocaleString()}`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-400">
                        <HardDrive className="w-3 h-3" /> {product.size}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-400">
                        <Calendar className="w-3 h-3" /> {product.uploadDate}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => { setSelectedProductId(product.id); setIsReviewOpen(true); }}
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors rounded-lg relative"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {/* You can add a badge here for review count if you have it in state */}
                      </button>
                      <button className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 transition-colors rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal Logic */}
      <ReviewModal 
        isOpen={isReviewOpen} 
        onClose={() => setIsReviewOpen(false)} 
        productId={selectedProductId} 
      />
    </div>
  );
};

export default AdminManageView;
