'use client';

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, toggleCart, setError, clearCart } from '../store';
import { ShoppingBag, X, AlertTriangle, Image as ImageIcon, Loader, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useRouter } from 'next/navigation';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { sendEmailVerification } from 'firebase/auth';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { items, isOpen } = useSelector((state: RootState) => state.cart);
  const { error, user } = useSelector((state: RootState) => state.auth);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
        dispatch(toggleCart());
        router.push('/login');
        return;
    }

    // Verification Check
    const currentUser = auth.currentUser;
    if (currentUser) {
        try {
            await currentUser.reload();
        } catch(e) { console.error("Reload failed", e); }

        if (!currentUser.emailVerified) {
            try {
                await sendEmailVerification(currentUser);
                dispatch(setError(`Account not verified. A verification link has been sent to ${currentUser.email}. Please verify and checkout again.`));
            } catch (error: unknown) {
                 // Type guard for the error object
                 const err = error as { code?: string; message?: string };
                 if (err.code === 'auth/too-many-requests') {
                     dispatch(setError("Verification email already sent. Please check your inbox."));
                 } else {
                     dispatch(setError(err.message || "An error occurred."));
                 }
            }
            return;
        }
    } else {
        dispatch(setError("Authentication session invalid. Please log in again."));
        router.push('/login');
        return;
    }
    
    // 

    setIsCheckingOut(true);
    try {
        const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        
        // Create Order Record
        await addDoc(collection(db, "orders"), {
            userId: user.id,
            userEmail: user.email,
            items: items,
            total: total,
            status: 'Completed', // Simulating successful payment
            createdAt: new Date().toISOString()
        });

        dispatch(clearCart());
        dispatch(toggleCart());
        router.push('/dashboard');
    } catch (err) {
        console.error("Checkout error:", err);
        dispatch(setError("Checkout failed. Please try again."));
    } finally {
        setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans">
      
      {/* Global Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-600 dark:bg-red-700 text-white relative z-[100]"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-bold">{error}</p>
              </div>
              <button 
                onClick={() => dispatch(setError(null))} 
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />

      <main className="flex-grow">
        {children}
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isOpen && (
           <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => dispatch(toggleCart())}
               className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />
            <motion.div
               initial={{ x: '100%' }}
               animate={{ x: 0 }}
               exit={{ x: '100%' }}
               transition={{ type: "spring", stiffness: 300, damping: 30 }}
               className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-white dark:bg-zinc-900 shadow-2xl z-[80] border-l border-gray-200 dark:border-zinc-800 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 z-10">
                 <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-rose-600" />
                    <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">YOUR CART <span className="text-gray-400 font-normal ml-1">({totalItems})</span></h2>
                 </div>
                 <button onClick={() => dispatch(toggleCart())} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-500">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Drawer Items */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                 {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                       <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                           <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-zinc-600" />
                       </div>
                       <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
                       <p className="text-gray-500 mb-8">Looks like you haven&apos;t added any sounds yet.</p>
                       <button onClick={() => dispatch(toggleCart())} className="px-8 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20">
                          Start Shopping
                       </button>
                    </div>
                 ) : (
                    items.map(item => (
                       <motion.div 
                          layout
                          key={item.id} 
                          className="flex gap-4 p-3 bg-white dark:bg-zinc-800/40 rounded-2xl border border-gray-100 dark:border-zinc-800 group"
                       >
                          <div className="w-20 h-20 shrink-0 bg-gray-100 dark:bg-zinc-800 rounded-xl overflow-hidden relative">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <ImageIcon className="w-8 h-8 opacity-50" />
                                </div>
                              )}
                          </div>
                          <div className="flex-1 flex flex-col justify-between">
                             <div>
                                <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</h3>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{item.category}</p>
                             </div>
                             <div className="flex justify-between items-end">
                               <p className="text-rose-600 dark:text-rose-500 font-black">₦{item.price}</p>
                               <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">Qty: {item.quantity}</span>
                             </div>
                          </div>
                       </motion.div>
                    ))
                 )}
              </div>

              {/* Drawer Footer */}
              {items.length > 0 && (
                  <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/95 backdrop-blur-sm">
                     <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span>₦{items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Taxes</span>
                            <span>Calculated at checkout</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-zinc-800 text-xl font-black text-gray-900 dark:text-white">
                            <span>Total</span>
                            <span>₦{items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}</span>
                        </div>
                     </div>
                     <button 
                        onClick={handleCheckout}
                        disabled={isCheckingOut}
                        className="w-full py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                     >
                        {isCheckingOut ? (
                            <><Loader className="w-5 h-5 animate-spin"/> Processing...</>
                        ) : (
                            <>Checkout Now <ArrowRight className="w-5 h-5" /></>
                        )}
                     </button>
                     <div className="text-center mt-3">
                        <button onClick={() => dispatch(clearCart())} className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1 mx-auto">
                            <Trash2 className="w-3 h-3" /> Clear Cart
                        </button>
                     </div>
                  </div>
              )}
            </motion.div>
           </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};
