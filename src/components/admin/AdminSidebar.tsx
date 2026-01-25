'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, ShoppingBag, Settings, 
  ClipboardList, CloudUpload, Library, MessageSquare, 
  Activity, X, LucideIcon 
} from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  active: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, path, active, onClick }) => (
  <Link href={path} onClick={onClick}>
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
      active 
      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20 translate-x-1' 
      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:white hover:bg-gray-100 dark:hover:bg-zinc-800'
    }`}>
      <Icon className={`w-5 h-5 ${active ? 'text-white' : ''}`} />
      <span>{label}</span>
    </div>
  </Link>
);

interface AdminSidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ mobileOpen, onClose }) => {
  // pathname can be null, so we handle it with a fallback
  const pathname = usePathname() || '';

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:block h-full shadow-2xl md:shadow-none
        `}>
          <div className="flex flex-col h-full">
             
             {/* Header */}
             <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></div>
                  <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Admin Panel</h2>
               </div>
               <button 
                 onClick={onClose}
                 className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>

             {/* Nav Items */}
             <div className="p-4 flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-800">
               <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Overview</div>
               <SidebarItem 
                 icon={LayoutDashboard} 
                 label="Dashboard" 
                 path="/mb/admin" 
                 active={pathname === '/mb/admin'} 
                 onClick={onClose}
               />
               <SidebarItem 
                 icon={Activity} 
                 label="Analytics" 
                 path="/mb/admin/analytics" 
                 active={pathname === '/mb/admin/analytics'}
                 onClick={onClose}
               />
               <SidebarItem 
                 icon={Users} 
                 label="Users" 
                 path="/mb/admin/users" 
                 // Updated: Added optional chaining and fallback check
                 active={pathname ? pathname.includes('/mb/admin/users') : false}
                 onClick={onClose}
               />

               <div className="mt-6 px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Content</div>
               <SidebarItem 
                 icon={CloudUpload} 
                 label="Upload Content" 
                 path="/mb/admin/upload" 
                 active={pathname === '/mb/admin/upload'}
                 onClick={onClose}
               />
               <SidebarItem 
                 icon={Library} 
                 label="Manage Library" 
                 path="/mb/admin/manage" 
                 active={pathname === '/mb/admin/manage'}
                 onClick={onClose}
               />
               <SidebarItem 
                 icon={ShoppingBag} 
                 label="Products Grid" 
                 path="/mb/admin/products" 
                 active={pathname ? pathname.includes('/mb/admin/products') : false}
                 onClick={onClose}
               />

               <div className="mt-6 px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sales & Support</div>
               <SidebarItem 
                 icon={ClipboardList} 
                 label="Orders" 
                 path="/mb/admin/orders" 
                 active={pathname ? pathname.includes('/mb/admin/orders') : false}
                 onClick={onClose}
               />
               <SidebarItem 
                 icon={MessageSquare} 
                 label="Reviews" 
                 path="/mb/admin/reviews" 
                 active={pathname === '/mb/admin/reviews'}
                 onClick={onClose}
               />
               <SidebarItem 
                 icon={Settings} 
                 label="Settings" 
                 path="/mb/admin/settings" 
                 active={pathname ? pathname.includes('/mb/admin/settings') : false}
                 onClick={onClose}
               />
             </div>
             
             {/* Footer Info */}
             <div className="p-6 border-t border-gray-100 dark:border-zinc-800">
                <div className="text-xs text-gray-400 font-medium">
                   A.S STUDIO Admin<br/>
                   <span className="opacity-50">v2.0.1</span>
                </div>
             </div>
          </div>
        </aside>
    </>
  );
};
