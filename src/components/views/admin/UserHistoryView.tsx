'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; // Fixed: Import optimized Image component
import { ArrowLeft, Package, Clock, Mail, Calendar, Loader, Phone, FileText, ShoppingBag } from 'lucide-react';
// Removed unused imports: UserIcon, Wallet
import { motion } from 'framer-motion';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

interface UserDetail {
    id: string;
    name: string;
    email: string;
    avatar: string;
    joinedAt: string;
    phone?: string;
    bio?: string;
    role: string;
}

// Fixed: Defined OrderItem to replace 'any'
interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface Order {
    id: string;
    createdAt: string;
    items: OrderItem[]; 
    total: number;
    status: string;
}

const AdminUserHistoryView: React.FC = () => {
  const { id } = useParams() as { id: string };
  const [user, setUser] = useState<UserDetail | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalSpent: 0, orderCount: 0 });

  useEffect(() => {
    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const userRef = doc(db, "users", id);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                setUser({ id: userSnap.id, ...userSnap.data() } as UserDetail);
            }

            const q = query(collection(db, "orders"), where("userId", "==", id));
            const querySnapshot = await getDocs(q);
            const fetchedOrders: Order[] = [];
            let spent = 0;

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                fetchedOrders.push({
                    id: docSnap.id,
                    createdAt: data.createdAt,
                    items: data.items || [],
                    total: data.total || 0,
                    status: data.status || 'Pending'
                });
                if (data.status !== 'Failed' && data.status !== 'Refunded') {
                    spent += (data.total || 0);
                }
            });

            fetchedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setOrders(fetchedOrders);
            setStats({ totalSpent: spent, orderCount: fetchedOrders.length });

        } catch (error: unknown) {
            console.error("Error fetching user history:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black"><Loader className="w-10 h-10 animate-spin text-rose-600" /></div>;
  if (!user) return <div className="max-w-5xl mx-auto py-12 px-4 text-center">User not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4">
            <Link 
                href="/mb/admin/users" 
                className="p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-gray-500 hover:text-rose-600 hover:border-rose-200 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Profile</h1>
                <p className="text-sm text-gray-500">View customer details and order history.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-rose-500 to-rose-700 opacity-10"></div>
                    
                    <div className="relative text-center">
                        <div className="w-32 h-32 mx-auto mb-4 relative">
                            <Image 
                                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} 
                                alt={user.name} 
                                width={128}
                                height={128}
                                className="rounded-full border-4 border-white dark:border-zinc-900 object-cover shadow-lg" 
                            />
                            <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900"></div>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{user.name}</h2>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 ${
                            user.role === 'admin' 
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' 
                            : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400'
                        }`}>
                            {user.role}
                        </span>
                        
                        <div className="flex justify-center gap-6 border-t border-gray-100 dark:border-zinc-800 pt-6">
                            <div className="text-center">
                                <div className="text-2xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-1">
                                    {stats.orderCount}
                                </div>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Orders</div>
                            </div>
                            <div className="w-px bg-gray-100 dark:bg-zinc-800"></div>
                            <div className="text-center">
                                <div className="text-2xl font-black text-green-600 dark:text-green-500 flex items-center justify-center gap-1">
                                    ₦{stats.totalSpent.toFixed(0)}
                                </div>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Spent</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 space-y-5">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400">Contact Details</h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 group">
                            <div className="p-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl text-gray-400 group-hover:text-rose-600 transition-colors">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs text-gray-400 font-medium">Email Address</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.email}</p>
                            </div>
                        </div>

                        {user.phone && (
                            <div className="flex items-center gap-4 group">
                                <div className="p-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl text-gray-400 group-hover:text-rose-600 transition-colors">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Phone Number</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{user.phone}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 group">
                            <div className="p-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl text-gray-400 group-hover:text-rose-600 transition-colors">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium">Joined On</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{new Date(user.joinedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        {user.bio && (
                            <div className="flex items-start gap-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                                <div className="p-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl text-gray-400 shrink-0">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Bio</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                        &quot;{user.bio}&quot;
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                            <Clock className="w-5 h-5 text-rose-600" /> Order History
                        </h2>
                        <span className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-full text-xs font-bold text-gray-500">
                            {orders.length} Records
                        </span>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        {orders.length > 0 ? (
                            orders.map((order, idx) => (
                                <motion.div 
                                    key={order.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group relative bg-gray-50 dark:bg-zinc-800/30 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-zinc-700 transition-all hover:bg-white dark:hover:bg-zinc-800"
                                >
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl shrink-0 ${
                                                order.status === 'Completed' 
                                                ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-500' 
                                                : order.status === 'Failed'
                                                ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500'
                                                : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500'
                                            }`}>
                                                <ShoppingBag className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono font-bold text-gray-900 dark:text-white">#{order.id.slice(0, 8)}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        order.status === 'Completed' 
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                        : 'bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-gray-400'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-500 font-medium">
                                                    {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="text-right pl-4 sm:border-l border-gray-200 dark:border-zinc-700 sm:h-10 flex flex-col justify-center min-w-[100px]">
                                            <div className="text-xs text-gray-400 font-bold uppercase mb-0.5">Total</div>
                                            <div className="font-mono font-black text-lg text-gray-900 dark:text-white">₦{order.total.toFixed(2)}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700/50 flex items-center gap-2 text-xs text-gray-500 font-medium">
                                        <Package className="w-3.5 h-3.5" />
                                        <span>Includes {order.items.length} items</span>
                                        {order.items.length > 0 && (
                                            <span className="text-gray-400">- {order.items[0].name} {order.items.length > 1 && `+${order.items.length - 1} more`}</span>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Package className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Orders Yet</h3>
                                <p className="text-gray-500 text-sm">This user hasn&apos;t made any purchases.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </div>
    </div>
  );
};

export default AdminUserHistoryView;
