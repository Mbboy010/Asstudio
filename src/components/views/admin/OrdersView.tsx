'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MoreHorizontal, CheckCircle, Clock, XCircle, 
  ChevronDown, Package, RefreshCcw, ArrowLeft, ArrowRight, User 
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { TableSkeleton } from '@/components/ui/Skeleton';

// Added specific interface for order items to replace 'any'
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
    id: string;
    userId: string;
    userEmail: string;
    items: OrderItem[]; // Fixed 'any[]'
    total: number;
    status: string;
    createdAt: string;
}

const AdminOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  
  // Pagination State
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedOrders: Order[] = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            fetchedOrders.push({
                id: docSnap.id,
                userId: data.userId,
                userEmail: data.userEmail || 'Unknown',
                items: data.items || [],
                total: data.total || 0,
                status: data.status || 'Pending',
                createdAt: data.createdAt
            });
        });
        setOrders(fetchedOrders);
    } catch (error: unknown) { // Fixed implicit 'any' in catch block
        console.error("Error fetching orders:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-500/10 border-green-200 dark:border-green-500/20';
      case 'Processing': return 'text-blue-600 dark:text-blue-500 bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
      case 'Failed': return 'text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-zinc-700';
    }
  };

  const filteredOrders = orders.filter(order => 
      order.id.toLowerCase().includes(searchId.toLowerCase()) || 
      order.userEmail.toLowerCase().includes(searchId.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

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
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Order Management</h1>
          <p className="text-gray-500 font-medium mt-1">Track and manage customer purchases.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
           <div className="relative w-full sm:w-auto group">
             <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4 group-focus-within:text-rose-600 transition-colors" />
             <input 
                type="text" 
                placeholder="Search ID or Email..." 
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl w-full sm:w-64 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all shadow-sm" 
             />
           </div>
           
           <div className="flex gap-2">
               <button 
                  onClick={fetchOrders} 
                  className="p-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-rose-600 transition-colors shadow-sm"
                  title="Refresh Data"
               >
                    <RefreshCcw className="w-5 h-5" />
               </button>
               <button className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:border-rose-500 hover:text-rose-600 dark:hover:border-rose-500 dark:hover:text-rose-500 transition-all shadow-sm">
                  <Filter className="w-4 h-4" /> Filter <ChevronDown className="w-3 h-3 ml-1" />
               </button>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
         {loading ? (
             <div className="p-8"><TableSkeleton /></div>
         ) : (
             <>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {currentItems.length > 0 ? (
                            currentItems.map((order) => (
                                <tr key={order.id} className="group hover:bg-rose-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-mono font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                            <Package className="w-4 h-4 text-gray-400" />
                                            #{order.id.slice(0, 8)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-xs font-bold text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-900/30">
                                                {order.userEmail[0].toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{order.userEmail.split('@')[0]}</span>
                                                <span className="text-xs text-gray-500 truncate max-w-[150px]">{order.userEmail}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 rounded-md text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-700">
                                            {order.items.length} Items
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-sm text-gray-900 dark:text-white">
                                        ₦{order.total.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center w-fit gap-1.5 ${getStatusColor(order.status)}`}>
                                            {order.status === 'Completed' && <CheckCircle className="w-3.5 h-3.5" />}
                                            {order.status === 'Processing' && <Clock className="w-3.5 h-3.5" />}
                                            {order.status === 'Failed' && <XCircle className="w-3.5 h-3.5" />}
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-gray-500">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                        <br/>
                                        <span className="text-gray-400 text-[10px]">{new Date(order.createdAt).toLocaleTimeString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg transition-colors">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 opacity-40" />
                                        </div>
                                        <p className="font-medium">No orders found.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-zinc-900">
                    <div className="text-sm text-gray-500 font-medium">
                        Showing <span className="font-bold text-gray-900 dark:text-white">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredOrders.length)}</span> of {filteredOrders.length} orders
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

export default AdminOrdersView;
