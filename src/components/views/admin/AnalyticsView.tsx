'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { 
  Activity, Globe, Smartphone, Clock, MapPin, User as UserIcon, 
  RefreshCcw, Monitor, Laptop, Tablet, ChevronLeft, ChevronRight, BarChart 
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/Skeleton';

interface PageVisit {
  id: string;
  path: string;
  timestamp: string;
  userName: string;
  userPhone: string;
  location: string;
  userAgent: string;
}

const AdminAnalyticsView: React.FC = () => {
  const [visits, setVisits] = useState<PageVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageStats, setPageStats] = useState<Record<string, number>>({});
  
  // Pagination State
  const ITEMS_PER_PAGE = 15;
  const [lastDocs, setLastDocs] = useState<DocumentSnapshot[]>([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Helper to detect device from User Agent
  const getDeviceInfo = (ua: string) => {
    const lowerUA = (ua || '').toLowerCase();
    if (lowerUA.includes('iphone')) return { name: 'iPhone', icon: Smartphone, color: 'text-rose-600 dark:text-rose-500' };
    if (lowerUA.includes('ipad')) return { name: 'iPad', icon: Tablet, color: 'text-blue-500' };
    if (lowerUA.includes('android')) return { name: 'Android', icon: Smartphone, color: 'text-green-600 dark:text-green-500' };
    if (lowerUA.includes('windows')) return { name: 'Windows PC', icon: Monitor, color: 'text-blue-600 dark:text-blue-400' };
    if (lowerUA.includes('mac') && !lowerUA.includes('iphone') && !lowerUA.includes('ipad')) return { name: 'Mac', icon: Laptop, color: 'text-gray-600 dark:text-gray-400' };
    if (lowerUA.includes('linux')) return { name: 'Linux', icon: Monitor, color: 'text-yellow-600 dark:text-yellow-500' };
    if (lowerUA.includes('mobile')) return { name: 'Mobile', icon: Smartphone, color: 'text-rose-600 dark:text-rose-500' };
    return { name: 'Desktop', icon: Monitor, color: 'text-gray-500' };
  };

  const fetchVisits = async (direction: 'initial' | 'next' | 'prev' = 'initial') => {
    setLoading(true);
    try {
        let q;
        const visitsRef = collection(db, "page_visits");

        if (direction === 'initial' || direction === 'prev') {
            if (currentPage === 1) {
                q = query(visitsRef, orderBy("timestamp", "desc"), limit(ITEMS_PER_PAGE));
            } else {
                const prevCursor = lastDocs[currentPage - 2];
                q = query(visitsRef, orderBy("timestamp", "desc"), startAfter(prevCursor), limit(ITEMS_PER_PAGE));
            }
        } else if (direction === 'next') {
            const lastVisible = lastDocs[currentPage - 1];
            q = query(visitsRef, orderBy("timestamp", "desc"), startAfter(lastVisible), limit(ITEMS_PER_PAGE));
        }

        if (!q) return;

        const snapshot = await getDocs(q);
        const fetchedVisits: PageVisit[] = [];
        const stats: Record<string, number> = {}; 

        snapshot.forEach((doc) => {
            const data = doc.data();
            fetchedVisits.push({
                id: doc.id,
                path: data.path,
                timestamp: data.timestamp,
                userName: data.userName || 'Guest',
                userPhone: data.userPhone || 'N/A',
                location: data.location || 'Unknown',
                userAgent: data.userAgent || ''
            });
            const pathKey = data.path;
            stats[pathKey] = (stats[pathKey] || 0) + 1;
        });

        setVisits(fetchedVisits);
        setPageStats(stats);
        
        if (snapshot.docs.length > 0) {
            const lastVisible = snapshot.docs[snapshot.docs.length - 1];
            if (direction === 'next') {
                setLastDocs(prev => [...prev, lastVisible]);
            } else if (direction === 'initial') {
                setLastDocs([lastVisible]);
            }
        }
        
        setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);

    } catch (error) {
        console.error("Error fetching analytics:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits('initial');
  }, []);

  const handleNext = () => {
    if (!hasMore) return;
    setCurrentPage(prev => prev + 1);
    fetchVisits('next');
  };

  const handlePrev = () => {
    if (currentPage === 1) return;
    setCurrentPage(prev => prev - 1);
    fetchVisits('prev');
  };

  const sortedStats = Object.entries(pageStats)
    .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="space-y-8 bg-gray-50 dark:bg-black min-h-screen py-6 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-gray-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="text-rose-600 font-bold text-xs uppercase tracking-wider bg-rose-50 dark:bg-rose-900/10 px-2 py-1 rounded">Insights</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Traffic Analytics</h1>
          <p className="text-gray-500 font-medium mt-1">Monitor real-time user activity and demographics.</p>
        </div>
        <button 
            onClick={() => { setCurrentPage(1); setLastDocs([]); fetchVisits('initial'); }} 
            className="p-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-rose-600 transition-colors flex items-center gap-2 text-sm font-bold shadow-sm"
        >
            <RefreshCcw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Top Pages Card */}
         <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm h-fit">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                <Activity className="w-5 h-5 text-rose-600" /> Trending Pages
            </h3>
            <div className="space-y-3">
                {sortedStats.length > 0 ? (
                    sortedStats.map(([path, count], idx) => (
                        <div key={path} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-transparent hover:border-rose-200 dark:hover:border-zinc-700 transition-all">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className="font-mono text-xs font-bold text-gray-400 bg-white dark:bg-zinc-800 w-6 h-6 flex items-center justify-center rounded-md">
                                    {idx + 1}
                                </span>
                                <span className="font-medium text-sm text-gray-700 dark:text-gray-300 truncate" title={path}>{path}</span>
                            </div>
                            <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 px-2.5 py-1 rounded-lg text-xs font-bold">
                                {count}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                        <BarChart className="w-8 h-8 opacity-20 mb-2" />
                        No trend data available
                    </div>
                )}
            </div>
         </div>

         {/* Detailed Log Table */}
         <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
             <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900">
                <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                    <Globe className="w-5 h-5 text-rose-600" /> Visit Log
                </h3>
                <span className="px-3 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full text-xs font-bold text-gray-500">
                    Page {currentPage}
                </span>
             </div>
             
             {loading ? <div className="p-8"><TableSkeleton /></div> : (
                 <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 uppercase text-xs border-b border-gray-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 font-bold tracking-wider">Page Path</th>
                                <th className="px-6 py-4 font-bold tracking-wider">Visitor</th>
                                <th className="px-6 py-4 font-bold tracking-wider">Device</th>
                                <th className="px-6 py-4 font-bold tracking-wider">Location</th>
                                <th className="px-6 py-4 font-bold tracking-wider">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {visits.map((visit) => {
                                const device = getDeviceInfo(visit.userAgent);
                                return (
                                    <tr key={visit.id} className="hover:bg-rose-50/30 dark:hover:bg-zinc-800/50 transition-colors group">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 truncate max-w-[180px]" title={visit.path}>
                                            {visit.path}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                                                    <UserIcon className="w-3 h-3" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{visit.userName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md bg-gray-50 dark:bg-zinc-800 w-fit ${device.color}`}>
                                                <device.icon className="w-3.5 h-3.5" /> {device.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                                                <MapPin className="w-3.5 h-3.5" /> {visit.location}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-gray-400">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {visits.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No visit records found for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
             )}

             {/* Pagination Controls */}
             <div className="p-4 border-t border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900">
                <button 
                    onClick={handlePrev} 
                    disabled={currentPage === 1 || loading}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                    <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {visits.length} Records Shown
                </span>
                
                <button 
                    onClick={handleNext} 
                    disabled={!hasMore || loading}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                    Next <ChevronRight className="w-4 h-4" />
                </button>
             </div>
         </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsView;
