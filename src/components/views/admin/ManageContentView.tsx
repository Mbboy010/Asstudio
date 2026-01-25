'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trash2, Search, FileAudio, CheckCircle, HardDrive, Calendar, 
  RefreshCcw, Image as ImageIcon, Filter, Eye, MoreHorizontal, ArrowLeft, ArrowRight
} from 'lucide-react';
import { ProductCategory, Product } from '@/types';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import { TableSkeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';

const AdminManageContentView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

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
        console.error("Error fetching products:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        try {
            await deleteDoc(doc(db, "products", id));
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Failed to delete product.");
        }
    }
  };

  // Filtering Logic
  const filteredContent = products.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredContent.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredContent.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
        setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-8 bg-gray-50 dark:bg-black min-h-screen py-6 transition-colors duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-gray-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="text-rose-600 font-bold text-xs uppercase tracking-wider bg-rose-50 dark:bg-rose-900/10 px-2 py-1 rounded">Admin Panel</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Content Manager</h1>
          <p className="text-gray-500 font-medium mt-1">Total Items: <span className="text-gray-900 dark:text-white font-bold">{products.length}</span></p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
           <div className="relative group w-full sm:w-auto">
             <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4 group-focus-within:text-rose-600 transition-colors" />
             <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl w-full sm:w-64 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all shadow-sm" 
             />
           </div>
           
           <div className="flex gap-2">
               <div className="relative">
                 <Filter className="absolute left-3 top-3 text-gray-400 w-4 h-4 pointer-events-none" />
                 <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="pl-10 pr-8 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer appearance-none shadow-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
                 >
                    <option value="All">All Categories</option>
                    {Object.values(ProductCategory).map(cat => (
                       <option key={cat} value={cat}>{cat}</option>
                    ))}
                 </select>
               </div>
               
               <button 
                  onClick={fetchProducts} 
                  className="p-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-rose-600 transition-colors shadow-sm"
                  title="Refresh Data"
               >
                    <RefreshCcw className="w-5 h-5" />
               </button>
           </div>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
         {loading ? (
             <div className="p-8"><TableSkeleton /></div>
         ) : (
             <>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product Info</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">File Details</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pricing</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Performance</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.id} className="group hover:bg-rose-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 shrink-0 border border-gray-200 dark:border-zinc-700">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <ImageIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">{item.name}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                    <FileAudio className="w-3 h-3" /> Digital ID: {item.id.slice(0,6)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded-md text-xs font-bold border border-gray-200 dark:border-zinc-700">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-xs text-gray-500 font-medium">
                                            <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-gray-400" /> {item.size || 'N/A'}</span>
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> {new Date(item.uploadDate).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-sm text-gray-900 dark:text-white">
                                       {item.price === 0 ? <span className="text-green-600 dark:text-green-500">FREE</span> : `₦${item.price}`}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{item.sales} Sales</span>
                                            <div className="flex items-center gap-1 text-xs text-yellow-500 font-medium">
                                                ★ {item.rating}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-500 border border-green-200 dark:border-green-900/30">
                                            <CheckCircle className="w-3 h-3" /> Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/product/${item.id}`} className="p-2 bg-white dark:bg-zinc-800 text-gray-500 hover:text-rose-600 border border-gray-200 dark:border-zinc-700 hover:border-rose-200 dark:hover:border-rose-900/30 rounded-lg transition-all shadow-sm" title="View Product">
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 bg-white dark:bg-zinc-800 text-gray-500 hover:text-red-600 border border-gray-200 dark:border-zinc-700 hover:border-red-200 dark:hover:border-red-900/30 rounded-lg transition-all shadow-sm" title="Delete Product">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center py-16">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                            <Search className="w-8 h-8 opacity-50" />
                                        </div>
                                        <p className="font-medium">No products found matching your search.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-zinc-900">
                    <div className="text-sm text-gray-500 font-medium">
                        Showing <span className="font-bold text-gray-900 dark:text-white">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredContent.length)}</span> of {filteredContent.length} products
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-white dark:hover:bg-zinc-800 hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }).map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handlePageChange(idx + 1)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                        currentPage === idx + 1
                                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                                        : 'text-gray-500 hover:bg-white dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-white dark:hover:bg-zinc-800 hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
             </>
         )}
      </div>
    </div>
  );
};

export default AdminManageContentView;
