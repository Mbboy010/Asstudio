'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ShoppingBag, Sun, Moon, Menu, X, LogOut, ShieldAlert, 
  Search, LayoutDashboard, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase';
import { 
  onSnapshot, collection, query, getDocs, 
  addDoc, orderBy, limit, serverTimestamp, deleteDoc, doc 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { useTheme } from 'next-themes';
import { CartDrawer } from './CartDrawer'; 

// --- Types ---
interface AppUser {
  id: string;
  displayName: string | null;
  email: string | null;
  avatar: string | null;
  role: 'admin' | 'user';
}

interface ProductResult {
  id: string;
  name: string;
  category?: string;
  image?: string;
}

interface SearchHistoryItem {
  id: string;
  term: string;
}

export const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // --- State ---
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<AppUser | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  // 1. Auth Listener
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
        setSearchHistory([]); // Clear history on logout
      }
    });
    return () => unsubAuth();
  }, []);

  // 2. Cart Listener
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

  // 3. Fetch Search History (Only if logged in)
  useEffect(() => {
    if (!user?.id) return;
    
    const historyRef = collection(db, "users", user.id, "search_history");
    const q = query(historyRef, orderBy("createdAt", "desc"), limit(5));

    const unsubHistory = onSnapshot(q, (snapshot) => {
      setSearchHistory(snapshot.docs.map(doc => ({
        id: doc.id,
        term: doc.data().term
      })));
    });

    return () => unsubHistory();
  }, [user?.id]);

  // 4. Live Search Logic
  useEffect(() => {
    const fetchProducts = async () => {
      // 1. Only search if there are 2+ characters
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const productsRef = collection(db, "products");
        
        // 2. Fetch products (you can add a limit here to save on reads)
        const snapshot = await getDocs(productsRef);
        
        const searchTerms = searchQuery.toLowerCase().split(' '); // Split query into words

        const results = snapshot.docs
          .map(doc => ({
            id: doc.id,
            name: doc.data().name,
            category: doc.data().category,
            image: doc.data().image
          } as ProductResult))
          .filter(product => {
            const productName = product.name.toLowerCase();
            // 3. Check if EVERY word in the search query exists somewhere in the product name
            return searchTerms.every(term => productName.includes(term));
          })
          .slice(0, 5); // 4. Limit to top 5 results for the dropdown

        setSearchResults(results);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);


  // Focus input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // --- Handlers ---

  const saveSearchTerm = async (term: string) => {
    if (!user?.id || !term.trim()) return;
    try {
      await addDoc(collection(db, "users", user.id, "search_history"), {
        term: term.trim(),
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Could not save history", error);
    }
  };

  const executeSearch = (term: string) => {
    if (!term.trim()) return;
    saveSearchTerm(term);
    setSearchQuery('');
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    router.push(`/shop?q=${encodeURIComponent(term)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsProfileOpen(false);
    router.push('/');
  };

  const removeHistoryItem = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!user?.id) return;
    await deleteDoc(doc(db, "users", user.id, "search_history", itemId));
  };

  if (!mounted) return null;

  return (
    <>
      <nav className="sticky top-0 z-[60] w-full backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-gray-200 dark:border-zinc-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* LOGO */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0 z-50">
              <div className="w-10 h-10 flex items-center justify-center bg-black dark:bg-zinc-900 rounded-lg border border-rose-500/30 group-hover:border-rose-500 transition-colors">
                <span className="text-rose-600 font-black text-xl">A</span>
              </div>
              <span className="font-black text-lg text-gray-900 dark:text-white uppercase tracking-tighter">A.S STUDIO</span>
            </Link>

            {/* DESKTOP NAV */}
            <div className="hidden md:flex items-center justify-end flex-1 gap-6">
              
              <Link href="/shop" className={`text-xs font-bold uppercase hover:text-rose-600 transition-colors ${pathname === '/shop' ? 'text-rose-600' : 'text-gray-600 dark:text-gray-400'}`}>
                Shop
              </Link>

              {/* ICONS CONTAINER */}
              <div className="flex items-center gap-3 border-l border-gray-200 dark:border-zinc-800 pl-6">
                
                {/* 1. SEARCH ICON (Left of Cart) */}
                <button 
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={`p-2 rounded-full transition-colors ${isSearchOpen ? 'bg-gray-100 dark:bg-zinc-800 text-rose-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                  aria-label="Search"
                >
                  {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                </button>

                {/* 2. CART ICON */}
                <button 
                  onClick={() => setIsCartOpen(true)} 
                  className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400 transition-colors"
                  aria-label="Open Cart"
                >
                  <ShoppingBag size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-black">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* 3. PROFILE DROPDOWN */}
                {user ? (
                  <div className="relative ml-2">
                    <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="p-0.5 rounded-full border-2 border-rose-500 hover:scale-105 transition-transform">
                      {/* Using img tag to avoid domain config issues with Next/Image during build */}
                      <img 
                        src={user?.avatar ?? `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}`} 
                        className="w-8 h-8 rounded-full object-cover" 
                        alt="Profile"
                      />
                    </button>
                    
                    {/* PROFILE MENU */}
                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-4 w-64 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl py-3 border border-gray-100 dark:border-zinc-800 z-50">
                          {/* User Info */}
                          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 mb-2">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{user.displayName || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                          
                          {/* Theme Toggle */}
                          <button 
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 transition-colors"
                          >
                            {theme === 'dark' ? <Sun size={16} className="text-orange-500" /> : <Moon size={16} className="text-blue-500" />}
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                          </button>

                          {/* Dashboard Link */}
                          <Link href="/dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300">
                            <LayoutDashboard size={16}/> User Dashboard
                          </Link>

                          {/* Admin Link (Conditional) */}
                          {user.role === 'admin' && (
                            <Link href="/mb/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 font-semibold">
                              <ShieldAlert size={16}/> Admin Panel
                            </Link>
                          )}
                          
                          {/* Logout */}
                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                              <LogOut size={16}/> Sign out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link href="/login" className="ml-2 px-6 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-80 transition-opacity">Login</Link>
                )}
              </div>
            </div>

            {/* MOBILE HEADER ACTIONS */}
            <div className="flex md:hidden items-center gap-2">
              <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 text-gray-900 dark:text-white">
                 <Search size={24} />
              </button>
              <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-gray-900 dark:text-white">
                <ShoppingBag size={24} />
                {cartCount > 0 && <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-600 text-[10px] text-white flex items-center justify-center font-bold">{cartCount}</span>}
              </button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-900 dark:text-white">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* --- SEARCH DROPDOWN --- */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute top-20 left-0 w-full bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 shadow-2xl z-40 overflow-hidden"
            >
              <div className="max-w-4xl mx-auto p-4">
                {/* Search Input */}
                <div className="relative flex items-center bg-gray-100 dark:bg-zinc-900 rounded-xl px-4 py-3 mb-4">
                  <Search className="text-gray-400 w-5 h-5 mr-3" />
                  <form onSubmit={handleSearchSubmit} className="flex-1">
                    <input 
                      ref={searchInputRef}
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for beats, kits, or presets..." 
                      className="w-full bg-transparent border-none text-base text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-0"
                    />
                  </form>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <X size={18} />
                    </button>
                  )}
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto px-2">
                  
                  {/* 1. Live Suggestions */}
                  {searchQuery.trim().length > 0 && searchResults.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Top Suggestions</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {searchResults.map((result) => (
                          <Link 
                            key={result.id} 
                            href={`/product/${result.id}`} 
                            onClick={() => {
                              saveSearchTerm(result.name);
                              setIsSearchOpen(false);
                            }}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-zinc-900 rounded-lg transition-colors group"
                          >
                            <div className="w-12 h-12 bg-gray-200 dark:bg-zinc-800 rounded-md overflow-hidden flex-shrink-0">
                               {result.image ? (
                                 <img src={result.image} alt={result.name} className="w-full h-full object-cover" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBag size={16}/></div>
                               )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 transition-colors line-clamp-1">{result.name}</p>
                              <p className="text-xs text-gray-500">{result.category || 'Asset'}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Search History */}
                  {user && searchHistory.length > 0 && searchQuery.trim().length === 0 && (
                    <div className="mb-2">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Searches</h3>
                      <div className="space-y-1">
                        {searchHistory.map((item) => (
                          <div 
                            key={item.id} 
                            onClick={() => executeSearch(item.term)}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer group transition-colors"
                          >
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                              <Clock size={16} className="text-gray-400" />
                              <span className="text-sm font-medium">{item.term}</span>
                            </div>
                            <button 
                              onClick={(e) => removeHistoryItem(e, item.id)} 
                              className="text-gray-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                              title="Remove from history"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Empty State */}
                  {searchQuery.trim().length > 1 && searchResults.length === 0 && (
                     <div className="text-center py-10 text-gray-500">
                       {/* FIXED: Escaped quotes below to prevent build failure */}
                       <p className="text-sm">No results found for &quot;{searchQuery}&quot;</p>
                     </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- MOBILE MENU --- */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-white dark:bg-black border-b border-gray-200 dark:border-zinc-800 overflow-hidden">
               <div className="px-4 pt-2 pb-6 space-y-1">
                 <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-4 text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-zinc-900">Home</Link>
                 <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-4 text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-zinc-900">Shop</Link>
                 
                 {user && (
                   <>
                     <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-4 text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-zinc-900">Dashboard</Link>
                     {user.role === 'admin' && (
                        <Link href="/mb/admin" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-4 text-base font-bold text-rose-600 border-b border-gray-100 dark:border-zinc-900">Admin Panel</Link>
                     )}
                   </>
                 )}

                 {/* Mobile Theme Toggle */}
                 <button 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="w-full flex items-center gap-2 px-3 py-4 text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-zinc-900"
                  >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                 </button>

                 {user ? (
                   <button onClick={handleLogout} className="w-full text-left px-3 py-4 text-red-500 font-bold">Sign Out</button>
                 ) : (
                   <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-4 text-rose-600 font-bold">Login</Link>
                 )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* --- CART DRAWER COMPONENT --- */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
