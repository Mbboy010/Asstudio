'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ShoppingBag, User as UserIcon, Sun, Moon, Menu, X, 
  LogOut, ShieldAlert 
} from 'lucide-react'; // Removed unused ShieldCheck
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase';
import { onSnapshot, collection } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { useTheme } from 'next-themes';
import { CartDrawer } from './CartDrawer'; 

// Define a proper interface for the User state
interface AppUser {
  id: string;
  displayName: string | null;
  email: string | null;
  avatar: string | null;
  role: 'admin' | 'user';
}

export const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [user, setUser] = useState<AppUser | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  // 1. Listen to Auth
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL,
          role: firebaseUser.email === 'admin@as-studio.com' ? 'admin' : 'user' 
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubAuth();
  }, []);

  // 2. Listen to Cart Count
  useEffect(() => {
    if (!user?.id) {
      setCartCount(0);
      return;
    }
    const cartRef = collection(db, "users", user.id, "cart");
    const unsubCart = onSnapshot(cartRef, (snapshot) => {
      setCartCount(snapshot.docs.length);
    });
    return () => unsubCart();
  }, [user?.id]);

  const handleLogout = async () => {
    await signOut(auth);
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  if (!mounted) return null;

  return (
    <>
      <nav className="sticky top-0 z-[60] w-full backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* LOGO */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 flex items-center justify-center bg-black dark:bg-zinc-900 rounded-lg border border-rose-500/30 group-hover:border-rose-500 transition-colors">
                <span className="text-rose-600 font-black text-xl">A</span>
              </div>
              <span className="font-black text-lg text-gray-900 dark:text-white uppercase tracking-tighter">A.S STUDIO</span>
            </Link>

            {/* DESKTOP LINKS */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className={`text-sm font-bold uppercase hover:text-rose-600 transition-colors ${pathname === '/' ? 'text-rose-600' : ''}`}>Home</Link>
              <Link href="/shop" className={`text-sm font-bold uppercase hover:text-rose-600 transition-colors ${pathname === '/shop' ? 'text-rose-600' : ''}`}>Shop</Link>
              {user?.role === 'admin' && (
                 <Link href="/mb/admin" className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                   <ShieldAlert className="w-3 h-3" /> ADMIN
                 </Link>
              )}
            </div>

            {/* DESKTOP ACTIONS */}
            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400 transition-colors">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button 
                onClick={() => setIsCartOpen(true)} 
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400 transition-colors"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-lg">
                    {cartCount}
                  </span>
                )}
              </button>

              {user ? (
                <div className="relative">
                  <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="block p-0.5 rounded-full border-2 border-rose-500 transition-transform active:scale-95">
                    <img 
                      src={user?.avatar ?? `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}`} 
                      alt={user?.displayName || 'User profile'} 
                      className="w-8 h-8 rounded-full bg-gray-200 object-cover" 
                    />
                  </button>
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-4 w-56 bg-white dark:bg-zinc-950 rounded-xl shadow-2xl py-2 border border-gray-100 dark:border-zinc-800 z-50">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 mb-2">
                          <p className="text-sm font-bold truncate">{user?.displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <Link href="/dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-900"><UserIcon size={16}/> Profile</Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"><LogOut size={16}/> Sign out</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/login" className="px-6 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-80 transition-opacity">Login</Link>
              )}
            </div>

            {/* MOBILE TOGGLE */}
            <div className="flex md:hidden items-center gap-2">
              <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-gray-900 dark:text-white">
                <ShoppingBag size={24} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-900 dark:text-white">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-white dark:bg-black border-b border-gray-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-4 pt-2 pb-6 space-y-1">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-4 text-base font-bold">Home</Link>
                <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-4 text-base font-bold">Shop</Link>
                {user ? (
                   <button onClick={handleLogout} className="w-full text-left px-3 py-4 text-base font-bold text-red-500">Sign Out</button>
                ) : (
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-4 text-base font-bold text-rose-600">Login</Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
    </>
  );
};
