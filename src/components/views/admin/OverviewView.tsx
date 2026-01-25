'use client';

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar 
} from 'recharts';
import { ChartSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { Users, DollarSign, Activity, Package, LucideIcon } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, DocumentData } from 'firebase/firestore';
import { db } from '@/firebase';
import Link from 'next/link';

// --- Types ---
interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    joinedAt: string;
    avatar: string;
}

interface OrderItem {
    category?: string;
    [key: string]: unknown;
}

interface OrderData {
    status?: string;
    total?: number;
    userId?: string;
    items?: OrderItem[];
    createdAt?: string;
}

interface TrafficData {
    name: string;
    orders: number;
}

interface SalesData {
    name: string;
    sales: number;
}

interface CardProps {
    title: string;
    value: string | number;
    icon: LucideIcon | React.ElementType;
    colorClass: string;
}

const AdminOverviewView: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
      users: 0,
      revenue: 0,
      activeUsers: 0,
      totalProducts: 0
  });
  const [recentUsers, setRecentUsers] = useState<UserData[]>([]);
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
        try {
            // Fetch Users
            const usersRef = collection(db, "users");
            const recentUsersQuery = query(usersRef, orderBy("joinedAt", "desc"), limit(5));
            
            // Fetch Products
            const productsRef = collection(db, "products");

            // Fetch Orders
            const ordersRef = collection(db, "orders");

            const [usersSnap, recentUsersSnap, productsSnap, ordersSnap] = await Promise.all([
                getDocs(usersRef),
                getDocs(recentUsersQuery),
                getDocs(productsRef),
                getDocs(ordersRef)
            ]);

            // 1. General Stats
            const totalUsers = usersSnap.size;
            const recent = recentUsersSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as UserData[];

            // 2. Process Orders
            let totalRevenue = 0;
            const uniqueBuyers = new Set<string>();
            const categoryCount: Record<string, number> = {};
            
            // Last 7 Days Bucket
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d.toISOString().split('T')[0];
            });
            const dailyOrders: Record<string, number> = {};
            last7Days.forEach(day => dailyOrders[day] = 0);

            ordersSnap.forEach((doc) => {
                const data = doc.data() as OrderData;
                const orderDate = data.createdAt ? data.createdAt.split('T')[0] : '';
                
                if (last7Days.includes(orderDate)) {
                    dailyOrders[orderDate] = (dailyOrders[orderDate] || 0) + 1;
                }

                if (data.status === 'Completed') {
                    totalRevenue += (data.total || 0);
                    if (data.userId) uniqueBuyers.add(data.userId);

                    if (data.items && Array.isArray(data.items)) {
                        data.items.forEach((item) => {
                            const cat = item.category || 'Other';
                            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
                        });
                    }
                }
            });

            const realTrafficData: TrafficData[] = last7Days.map(date => ({
                name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                orders: dailyOrders[date]
            }));

            const realSalesData: SalesData[] = Object.keys(categoryCount).map(cat => ({
                name: cat,
                sales: categoryCount[cat]
            }));
            
            if (realSalesData.length === 0) realSalesData.push({ name: 'No Sales', sales: 0 });

            setStats({
                users: totalUsers,
                revenue: totalRevenue,
                activeUsers: uniqueBuyers.size,
                totalProducts: productsSnap.size
            });

            setRecentUsers(recent);
            setTrafficData(realTrafficData);
            setSalesData(realSalesData);

        } catch (error) {
            console.error("Error fetching admin stats:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, []);

  const Card: React.FC<CardProps> = ({ title, value, icon: Icon, colorClass }) => (
     <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:border-rose-200 dark:hover:border-zinc-700 transition-colors">
        <div className="flex justify-between items-start mb-4">
           <div className={`p-3 rounded-xl ${colorClass}`}>
              <Icon className="w-6 h-6" />
           </div>
        </div>
        <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{value}</h3>
        <p className="text-gray-500 font-medium text-sm">{title}</p>
     </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 bg-gray-50 dark:bg-black min-h-screen py-6  transition-colors duration-300">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
             <span className="text-rose-600 font-bold text-xs uppercase tracking-wider bg-rose-50 dark:bg-rose-900/10 px-2 py-1 rounded">Analytics</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-500 font-medium">Performance metrics and platform activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <Card 
            title="Total Revenue" 
            value={`₦${stats.revenue.toLocaleString()}`} 
            icon={DollarSign} 
            colorClass="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-500" 
         />
         <Card 
            title="Total Users" 
            value={stats.users.toLocaleString()} 
            icon={Users} 
            colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-500" 
         />
         <Card 
            title="Active Buyers" 
            value={stats.activeUsers.toLocaleString()} 
            icon={Activity} 
            colorClass="bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-500" 
         />
         <Card 
            title="Live Products" 
            value={stats.totalProducts} 
            icon={Package} 
            colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-500" 
         />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Traffic Chart */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
           <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-lg text-gray-900 dark:text-white">Order Traffic</h3>
             <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md">Last 7 Days</span>
           </div>
           
           {loading ? <ChartSkeleton /> : (
             <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={trafficData}>
                   <defs>
                     <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-zinc-800" vertical={false} />
                   <XAxis 
                      dataKey="name" 
                      stroke="currentColor" 
                      className="text-gray-400 text-xs" 
                      tick={{fill: 'currentColor'}}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                   />
                   <YAxis 
                      stroke="currentColor" 
                      className="text-gray-400 text-xs" 
                      tick={{fill: 'currentColor'}}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false} 
                      dx={-10}
                   />
                   <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#fb7185' }}
                      cursor={{ stroke: '#e11d48', strokeWidth: 1 }}
                   />
                   <Area type="monotone" dataKey="orders" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
           )}
        </div>

        {/* Sales Chart */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
           <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-lg text-gray-900 dark:text-white">Sales Distribution</h3>
             <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md">All Time</span>
           </div>

           {loading ? <ChartSkeleton /> : (
             <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-zinc-800" vertical={false} />
                    <XAxis 
                        dataKey="name" 
                        stroke="currentColor" 
                        className="text-gray-400 text-xs" 
                        tick={{fill: 'currentColor'}}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                    />
                    <YAxis 
                        stroke="currentColor" 
                        className="text-gray-400 text-xs" 
                        tick={{fill: 'currentColor'}}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                        dx={-10}
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(225, 29, 72, 0.1)'}}
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fff' }}
                    />
                    <Bar dataKey="sales" fill="#e11d48" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
           )}
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
         <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">New Members</h3>
            <Link href="/mb/admin/users" className="text-sm font-bold text-rose-600 hover:text-rose-700 hover:underline">View All Users</Link>
         </div>
         {loading ? <div className="p-6"><TableSkeleton /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 uppercase text-xs">
                    <tr>
                       <th className="px-6 py-4 font-bold tracking-wider">User Profile</th>
                       <th className="px-6 py-4 font-bold tracking-wider">Role</th>
                       <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                       <th className="px-6 py-4 font-bold tracking-wider">Joined Date</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {recentUsers.map((user) => (
                       <tr key={user.id} className="hover:bg-rose-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <img src={user.avatar} className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-zinc-700" alt="User" />
                                <div>
                                   <div className="font-bold text-sm text-gray-900 dark:text-white">{user.name}</div>
                                   <div className="text-xs text-gray-500">{user.email}</div>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                 user.role === 'admin' 
                                 ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' 
                                 : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                             }`}>
                                {user.role}
                             </span>
                          </td>
                          <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-900/50">
                                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active
                              </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 font-medium">{new Date(user.joinedAt).toLocaleDateString()}</td>
                       </tr>
                    ))}
                    {recentUsers.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No recent signups.</td>
                        </tr>
                    )}
                 </tbody>
              </table>
            </div>
         )}
      </div>
    </div>
  );
};

export default AdminOverviewView;
