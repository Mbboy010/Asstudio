'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MoreHorizontal, Eye, Ban, CheckCircle, RefreshCcw, 
  Trash2, UserCheck, ArrowLeft, ArrowRight, User 
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import Image from 'next/image'; // Optimized Next.js Image
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { User as UserType } from '@/types';

// Defined literal types to replace 'any'
type UserStatus = 'Active' | 'Suspended';

interface UserData extends UserType {
  status: UserStatus;
  spent: number;
}

const AdminUsersView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
        const q = query(collection(db, "users"), orderBy("joinedAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedUsers: UserData[] = [];
        querySnapshot.forEach((snapDoc) => {
            const data = snapDoc.data();
            fetchedUsers.push({
                id: snapDoc.id,
                name: data.name || 'Unknown',
                email: data.email,
                role: data.role,
                avatar: data.avatar,
                joinedAt: data.joinedAt,
                status: (data.status as UserStatus) || 'Active', 
                spent: 0,
                emailVerified: data.emailVerified || false
            });
        });
        setUsers(fetchedUsers);
    } catch (error: unknown) {
        console.error("Error fetching users:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUserStatus = async (userId: string, currentStatus: UserStatus) => {
      const newStatus: UserStatus = currentStatus === 'Suspended' ? 'Active' : 'Suspended';
      try {
          await updateDoc(doc(db, "users", userId), {
              status: newStatus
          });
          // Removed 'as any' and used proper type assignment
          setUsers(users.map(user => user.id === userId ? { ...user, status: newStatus } : user));
          setActiveMenu(null);
      } catch (error: unknown) {
          console.error("Error updating user status:", error);
          alert("Failed to update status");
      }
  };

  const deleteUser = async (userId: string) => {
      if(!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
      try {
          await deleteDoc(doc(db, "users", userId));
          setUsers(users.filter(user => user.id !== userId));
          setActiveMenu(null);
      } catch (error: unknown) {
          console.error("Error deleting user:", error);
          alert("Failed to delete user");
      }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(filter.toLowerCase()) || 
    user.email.toLowerCase().includes(filter.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

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
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 font-medium mt-1">Manage accounts, permissions, and status.</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none group">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4 group-focus-within:text-rose-600 transition-colors" />
            <input 
                type="text" 
                placeholder="Search name or email..." 
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl w-full sm:w-64 focus:ring-2 focus:ring-rose-500 outline-none transition-all shadow-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            />
            </div>
            <button 
                onClick={fetchUsers} 
                className="p-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-rose-600 transition-colors shadow-sm"
                title="Refresh Data"
            >
                <RefreshCcw className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {loading ? (
            <div className="p-8"><TableSkeleton /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User Details</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {currentItems.length > 0 ? (
                        currentItems.map((user) => (
                            <tr key={user.id} className="group hover:bg-rose-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 shrink-0">
                                        {/* Performance Fix: Replaced <img> with Next.js Image */}
                                        <Image 
                                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} 
                                            width={40}
                                            height={40}
                                            className="rounded-full object-cover border border-gray-200 dark:border-zinc-700" 
                                            alt={`${user.name}'s avatar`} 
                                        />
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${user.status === 'Suspended' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="font-bold text-gray-900 dark:text-white text-sm truncate">{user.name}</div>
                                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                    </div>
                                </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${
                                        user.role === 'admin' 
                                        ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400' 
                                        : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-zinc-800 dark:text-gray-300'
                                    }`}>
                                    {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-500">
                                    {new Date(user.joinedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                    user.status === 'Suspended'
                                    ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400' 
                                    : 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-500'
                                }`}>
                                    {user.status === 'Suspended' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                    {user.status}
                                </span>
                                </td>
                                <td className="px-6 py-4 text-right relative">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link 
                                            href={`/mb/admin/users/${user.id}`}
                                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg transition-colors" 
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        <div className="relative">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === user.id ? null : user.id);
                                                }}
                                                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                            >
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                            
                                            {activeMenu === user.id && (
                                                <div 
                                                    ref={menuRef}
                                                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                                                >
                                                    <div className="py-1">
                                                        <button 
                                                            onClick={() => toggleUserStatus(user.id, user.status)}
                                                            className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors ${user.status === 'Suspended' ? 'text-green-600' : 'text-orange-500'}`}
                                                        >
                                                            {user.status === 'Suspended' ? (
                                                                <><UserCheck className="w-4 h-4" /> Activate User</>
                                                            ) : (
                                                                <><Ban className="w-4 h-4" /> Suspend User</>
                                                            )}
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteUser(user.id)}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Delete Account
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                                <div className="flex flex-col items-center justify-center gap-3">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 opacity-40" />
                                    </div>
                                    <p className="font-medium">No users found.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-zinc-900">
                <div className="text-sm text-gray-500 font-medium">
                    Showing <span className="font-bold text-gray-900 dark:text-white">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)}</span> of {filteredUsers.length} users
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-900 dark:text-white" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => handlePageChange(idx + 1)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                    currentPage === idx + 1
                                    ? 'bg-rose-600 text-white shadow-md'
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
                        className="p-2 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                    >
                        <ArrowRight className="w-4 h-4 text-gray-900 dark:text-white" />
                    </button>
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUsersView;
