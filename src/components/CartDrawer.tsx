'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  updateDoc, 
  getDocs, 
  writeBatch, 
  increment 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged, sendEmailVerification, User as FirebaseUser } from 'firebase/auth';

// Define the local interface
interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  // 1. Sync User Auth - Replaced 'any' with FirebaseUser
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser);
    });
    return () => unsub();
  }, []);

  // 2. Real-time Cart Listener
  useEffect(() => {
    if (!user || !isOpen) return;

    setIsLoading(true);
    const cartRef = collection(db, "users", user.uid, "cart");
    
    const unsub = onSnapshot(cartRef, (snapshot) => {
      const cartData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CartItem[];
      
      setItems(cartData);
      setIsLoading(false);
    });

    return () => unsub();
  }, [user, isOpen]);

  const subtotal = items.reduce((a, b) => a + (b.price * b.quantity), 0);

  // --- ACTIONS ---

  const updateQty = async (id: string, delta: number) => {
    if (!user) return;
    const itemRef = doc(db, "users", user.uid, "cart", id);
    const item = items.find(i => i.id === id);
    
    if (item && item.quantity + delta <= 0) {
      await deleteDoc(itemRef);
    } else {
      await updateDoc(itemRef, { quantity: increment(delta) });
    }
  };

  const removeItem = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "cart", id));
  };

  const handleCheckout = async () => {
    if (!user) {
      onClose();
      router.push('/login');
      return;
    }

    try {
      await user.reload();
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        alert(`Please verify your email. A link was sent to ${user.email}`);
        return;
      }

      setIsCheckingOut(true);

      // 1. Create Order
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        email: user.email,
        items,
        total: subtotal,
        status: 'Completed',
        createdAt: new Date().toISOString()
      });

      // 2. Clear Firestore Cart (Batch delete)
      const cartRef = collection(db, "users", user.uid, "cart");
      const snapshot = await getDocs(cartRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      onClose();
      router.push('/dashboard');
    } catch (error) {
      console.error("Checkout Error:", error);
      alert('Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 inset-y-0 w-full sm:max-w-md bg-white dark:bg-zinc-950 z-[80] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-950">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Your Cart</h2>
                <p className="text-xs text-gray-500 font-bold uppercase">{items.length} Items</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <Loader className="animate-spin mb-2" />
                  <p className="text-sm font-bold">Updating...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center">
                    <ShoppingBag className="text-gray-400" />
                  </div>
                  <p className="font-bold text-gray-500">Your cart is empty</p>
                  <button onClick={onClose} className="text-rose-600 font-black text-sm uppercase">Start Shopping</button>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-900 rounded-xl overflow-hidden flex-shrink-0 border dark:border-zinc-800">
                      <img 
                        src={item.image ?? ''} 
                        className="w-full h-full object-cover" 
                        alt={item.name || 'Product'} 
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold text-sm leading-tight mb-1">{item.name}</h4>
                        <p className="text-rose-600 font-mono font-bold text-sm">₦{item.price.toLocaleString()}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center border dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-900">
                          <button onClick={() => updateQty(item.id, -1)} className="p-1 px-2 hover:text-rose-600"><Minus size={14}/></button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="p-1 px-2 hover:text-rose-600"><Plus size={14}/></button>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 self-start"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-sm font-bold text-gray-500 uppercase">Subtotal</span>
                  <span className="text-2xl font-black">₦{subtotal.toLocaleString()}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-black uppercase tracking-widest hover:bg-rose-600 dark:hover:bg-rose-600 dark:hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCheckingOut ? <Loader className="animate-spin" size={20} /> : 'Complete Order'}
                </button>
                <p className="text-[10px] text-center mt-4 text-gray-400 font-medium">Digital delivery: Items will be available in your dashboard instantly.</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
