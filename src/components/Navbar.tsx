'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, logout, toggleCart, setError } from '../store';
import { ShoppingBag, User as UserIcon, Sun, Moon, Search, Menu, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { useTheme } from 'next-themes';

export const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { items } = useSelector((state: RootState) => state.cart);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/');
  };

  const handleCartClick = async () => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    
    const currentUser = auth.currentUser;
    
    if (currentUser) {
        try {
            await currentUser.reload();
        } catch (e) {
            console.error("Failed to reload user", e);
        }

        if (!currentUser.emailVerified) {
            try {
                await sendEmailVerification(currentUser);
                dispatch(setError(`Account not verified. A new verification link has been sent to ${currentUser.email}. Please verify your email and try again.`));
            } catch (error: any) {
                if (error.code === 'auth/too-many-requests') {
                   dispatch(setError("Verification email already sent. Please check your inbox."));
                } else {
                   dispatch(setError("Failed to send verification email. " + error.message));
                }
            }
            return;
        }
    } else {
        dispatch(setError("Session expired. Please log in again."));
        router.push('/login');
        return;
    }

    dispatch(toggleCart());
  };

  return (
    <nav className="sticky top-0 z-[60] w-full backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-gray-200 dark:border-zinc-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* --- Logo --- */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-10 h-10 flex items-center justify-center bg-black dark:bg-zinc-900 rounded-lg overflow-hidden border border-rose-500/30 group-hover:border-rose-500 transition-colors">
                 <div className="absolute inset-0 bg-rose-600 opacity-20 group-hover:opacity-40 transition-opacity"></div>
                 <span className="text-rose-600 font-black text-xl relative z-10">A</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-tighter leading-none text-gray-900 dark:text-white group-hover:text-rose-600 transition-colors">
                  A.S STUDIO
                </span>
              </div>
            </Link>
          </div>

          {/* --- Desktop Nav --- */}
          <div className="hidden md:flex items-center space-x-8">
            {[
              { name: 'Home', path: '/' },
              { name: 'Shop', path: '/shop' },
            ].map((link) => (
              <Link 
                key={link.name} 
                href={link.path} 
                className={`relative font-medium text-sm uppercase tracking-wider transition-colors hover:text-rose-600 ${
                  pathname === link.path ? 'text-rose-600' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {link.name}
                {pathname === link.path && (
                  <motion.div layoutId="underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-rose-600" />
                )}
              </Link>
            ))}
            
            {isAuthenticated && user?.role === 'admin' && (
              <Link href="/mb/admin" className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 font-bold text-xs border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">
                ADMIN PANEL
              </Link>
            )}
          </div>

          {/* --- Right Icons --- */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Search Bar */}
            <div className={`relative flex items-center transition-all duration-300 ${isSearchOpen ? 'w-64' : 'w-10'}`}>
               {isSearchOpen && (
                 <input 
                    type="text" 
                    placeholder="Search packs..." 
                    autoFocus
                    onBlur={() => setIsSearchOpen(false)}
                    className="absolute right-0 w-full bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-full py-2 px-4 pl-10 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 dark:text-white transition-all"
                 />
               )}
               <button 
                 onClick={() => setIsSearchOpen(!isSearchOpen)}
                 className={`absolute right-0 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 z-10 transition-colors ${isSearchOpen ? 'text-rose-600' : 'text-gray-600 dark:text-gray-400'}`}
               >
                 <Search className="w-5 h-5" />
               </button>
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              className="p-2 ml-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-rose-600 dark:hover:text-rose-500 transition-colors"
            >
              {mounted ? (
                theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />
              ) : (
                <div className="w-5 h-5" /> // Skeleton placeholder
              )}
            </button>

            {/* Cart */}
            <button onClick={handleCartClick} className="relative p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-rose-600 dark:hover:text-rose-500 transition-colors">
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-lg shadow-rose-600/40">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User Profile */}
            {isAuthenticated ? (
              <div className="relative group ml-2">
                <Link href="/dashboard" className="block p-0.5 rounded-full border-2 border-transparent hover:border-rose-500 transition-all">
                  <img src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=random"} alt="User" className="w-8 h-8 rounded-full object-cover bg-gray-200" />
                </Link>
                
                {/* Dropdown */}
                <div className="absolute right-0 mt-4 w-56 bg-white dark:bg-black rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50 border border-gray-100 dark:border-zinc-800">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 mb-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.displayName || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-rose-600">
                    <UserIcon className="w-4 h-4" /> Profile
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="ml-2 px-6 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-80 transition-opacity shadow-lg">
                Login
              </Link>
            )}
          </div>

          {/* --- Mobile Menu Button --- */}
          <div className="flex md:hidden items-center gap-4">
             <button onClick={handleCartClick} className="relative p-2 text-gray-900 dark:text-white">
              <ShoppingBag className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="p-2 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* --- Mobile Menu Dropdown --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-2">
              <Link href="/" className="block px-4 py-3 rounded-xl text-lg font-medium text-gray-900 dark:text-white hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 transition-colors">
                Home
              </Link>
              <Link href="/shop" className="block px-4 py-3 rounded-xl text-lg font-medium text-gray-900 dark:text-white hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 transition-colors">
                Shop
              </Link>
              
              <div className="border-t border-gray-100 dark:border-zinc-800 my-4 pt-4"></div>

              {isAuthenticated ? (
                 <>
                  <div className="px-4 mb-4 flex items-center gap-3">
                    <img src={user?.avatar || "https://ui-avatars.com/api/?name=User"} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{user?.displayName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" className="block px-4 py-3 rounded-xl text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800">
                    My Dashboard
                  </Link>
                  {user?.role === 'admin' && (
                     <Link href="/mb/admin" className="block px-4 py-3 rounded-xl text-base font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/10">
                       Admin Panel
                     </Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
                    Sign Out
                  </button>
                 </>
              ) : (
                  <Link href="/login" className="block w-full text-center px-4 py-4 rounded-xl text-base font-bold bg-rose-600 text-white shadow-lg shadow-rose-600/20">
                    Login / Sign Up
                  </Link>
              )}
              
              <div className="flex items-center justify-between px-4 pt-6 mt-2">
                 <span className="text-sm font-medium text-gray-500">Switch Theme</span>
                 <button 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                    className="p-3 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white transition-transform active:scale-95"
                 >
                   {mounted && theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
