'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Wallet, CreditCard, User, Check, Loader } from 'lucide-react';
import { collection, query, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

interface AdminUser {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  totalSpent?: number;
  balance?: number;
}

const AdminManageView: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Tracks editing balance values locally before saving
  const [editingBalances, setEditingBalances] = useState<{ [userId: string]: string }>({});
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const q = query(collection(db, "users"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          email: data.email,
          name: data.name,
          avatar: data.avatar,
          totalSpent: data.totalSpent ?? 0,
          balance: data.balance ?? 0
        } as AdminUser;
      });
      setUsers(docs);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsub = fetchUsers();
    return () => unsub();
  }, [fetchUsers]);

  // Handle local balance field changes
  const handleBalanceChange = (userId: string, value: string) => {
    setEditingBalances(prev => ({ ...prev, [userId]: value }));
  };

  // Persist updated balance to Firestore
  const handleUpdateBalance = async (userId: string) => {
    const updatedValue = editingBalances[userId];
    if (updatedValue === undefined || updatedValue.trim() === '') return;

    const parsedBalance = parseFloat(updatedValue);
    if (isNaN(parsedBalance)) {
      alert("Please enter a valid numeric value.");
      return;
    }

    setUpdatingUserId(userId);
    try {
      const userRef = doc(db, "users", userId);
      // Updated field key to match 'balance' from schema image
      await updateDoc(userRef, {
        balance: parsedBalance
      });
      
      // Clear editing input state on success
      setEditingBalances(prev => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    } catch (err) {
      console.error("Failed to update user balance:", err);
      alert("Error updating database.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050505] p-4 md:p-8">
      {/* Header and Search */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight dark:text-white uppercase">User Financials</h1>
          <p className="text-zinc-500 font-medium">Manage user account balances and monitor system-wide customer expenditures.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search user ID, name or email..."
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 transition-all w-72 text-sm text-zinc-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Users Financials Table */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4">Current Balance</th>
                <th className="px-6 py-4 text-right">Modify Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <Loader className="animate-spin mx-auto text-rose-600" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-zinc-400 font-medium">
                    No matching user records found.
                  </td>
                </tr>
              ) : filteredUsers.map((user) => {
                const isEditing = editingBalances[user.id] !== undefined;
                const currentInputValue = editingBalances[user.id] ?? user.balance?.toString() ?? '0';

                return (
                  <tr key={user.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    {/* Display name & email info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0 text-rose-600 dark:text-rose-400">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold dark:text-white text-sm">
                            {user.name || 'Unnamed Profile'}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {user.email || 'No email payload'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Firestore Doc ID */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-600 dark:text-zinc-300">
                        {user.id}
                      </span>
                    </td>

                    {/* Expenses Tracked */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-semibold text-sm">
                        <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                        <span>₦{(user.totalSpent ?? 0).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Current Account Balance */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-bold text-sm">
                        <Wallet className="w-3.5 h-3.5" />
                        <span>₦{(user.balance ?? 0).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Inline Modifier Form Input */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">₦</span>
                          <input 
                            type="number" 
                            step="any"
                            placeholder="0.00"
                            className="pl-6 pr-2 py-1.5 w-32 text-right text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-rose-500 transition-colors text-zinc-900 dark:text-white"
                            value={currentInputValue}
                            onChange={(e) => handleBalanceChange(user.id, e.target.value)}
                          />
                        </div>
                        <button
                          disabled={!isEditing || updatingUserId === user.id}
                          onClick={() => handleUpdateBalance(user.id)}
                          className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                            isEditing 
                              ? 'bg-rose-600 border-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer' 
                              : 'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-400 opacity-40 cursor-not-allowed'
                          }`}
                          title="Save balance configuration"
                        >
                          {updatingUserId === user.id ? (
                            <Loader className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminManageView;
