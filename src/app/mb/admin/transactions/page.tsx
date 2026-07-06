'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { 
  Search, CreditCard, ArrowUpRight, ArrowDownLeft, 
  Clock, CheckCircle2, XCircle, Loader, Filter, Calendar
} from 'lucide-react';

interface TransactionRecord {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  type: 'credit' | 'debit';
  description?: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: any;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Format timestamp safely if it hasn't synced from server yet
          createdAt: data.createdAt?.toDate() ? data.createdAt.toDate() : new Date()
        } as TransactionRecord;
      });
      setTransactions(records);
      setLoading(false);
    }, (error) => {
      console.error("Error streaming transaction logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter Logic
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate Metrics
  const totalCredited = transactions
    .filter(tx => tx.type === 'credit' && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalDebited = transactions
    .filter(tx => tx.type === 'debit' && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050505] p-4 md:p-8">
      
      {/* Header Info */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-black tracking-tight dark:text-white uppercase">Transaction History</h1>
        <p className="text-zinc-500 font-medium">Monitor system-wide ledger entries, user balance additions, and purchase logs.</p>
      </div>

      {/* Metrics Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Volume Injected</span>
            <div className="p-2 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black dark:text-white">₦{totalCredited.toLocaleString()}</h3>
          <p className="text-xs text-zinc-400 mt-1">Sum of all active administrative credits</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Volume Processed</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black dark:text-white">₦{totalDebited.toLocaleString()}</h3>
          <p className="text-xs text-zinc-400 mt-1">Sum of all customer storefront purchases</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Operations logged</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black dark:text-white">{transactions.length}</h3>
          <p className="text-xs text-zinc-400 mt-1">Total system logging actions tracked</p>
        </div>
      </div>

      {/* Control Filters Hub */}
      <div className="max-w-7xl mx-auto mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search by ID, email, name, description..."
            className="pl-10 pr-4 py-2 w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select 
              className="bg-transparent border-none text-xs font-semibold text-zinc-600 dark:text-zinc-300 outline-none cursor-pointer"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="credit">Credits (+)</option>
              <option value="debit">Debits (-)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <select 
              className="bg-transparent border-none text-xs font-semibold text-zinc-600 dark:text-zinc-300 outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Interface */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4">Transaction ID / Date</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <Loader className="animate-spin mx-auto text-rose-600" />
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-zinc-400 font-medium">
                    No matching transaction records tracked.
                  </td>
                </tr>
              ) : filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  
                  {/* ID and Date context */}
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-0.5">
                      {tx.id.substring(0, 12)}...
                    </div>
                    <div className="text-xs text-zinc-400">
                      {tx.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>

                  {/* Profile target */}
                  <td className="px-6 py-4">
                    <div className="font-semibold dark:text-white text-xs">
                      {tx.userName || 'Unknown User'}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400">
                      ID: {tx.userId.substring(0, 8)}...
                    </div>
                  </td>

                  {/* Purpose content description */}
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300 max-w-xs truncate text-xs font-medium">
                    {tx.description || 'System interaction log'}
                  </td>

                  {/* Operational validation statuses */}
                  <td className="px-6 py-4">
                    {tx.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                    {tx.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                        <Clock className="w-3 h-3 animate-pulse" /> Pending
                      </span>
                    )}
                    {tx.status === 'failed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
                        <XCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
                  </td>

                  {/* Financial Evaluation Math value */}
                  <td className={`px-6 py-4 text-right font-mono font-bold text-sm ${
                    tx.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-white'
                  }`}>
                    {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
