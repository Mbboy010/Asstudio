'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader } from 'lucide-react';
import { auth, db } from '@/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { AuthLayout, SocialLogin } from '@/components/AuthShared';

interface FirebaseError {
  message: string;
  code?: string;
}

const LoginView: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  if (!isClientReady) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-rose-600" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard'); 
    } catch (err: unknown) { 
      const firebaseError = err as FirebaseError;
      let msg = firebaseError.message.replace('Firebase: ', '');
      if (msg.includes('auth/invalid-credential')) msg = 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      // Using Popup ensures the authentication happens entirely within a safe browser window layer
      const result = await signInWithPopup(auth, provider);

      if (result) {
        const user = result.user;
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          const isDevAdmin = user.email === 'admin@asstudio.com';
          await setDoc(doc(db, "users", user.uid), {
              id: user.uid,
              name: user.displayName || 'User',
              email: user.email,
              phone: '',
              role: isDevAdmin ? 'admin' : 'user',
              balance: 600,
              avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random`,
              joinedAt: new Date().toISOString()
          });
        }
        router.push('/dashboard');
      }
    } catch (err: unknown) { 
      const firebaseError = err as FirebaseError;
      let msg = firebaseError.message || 'Google authentication failed.';
      if (msg.includes('auth/popup-closed-by-user')) msg = 'Sign-in window closed.';
      setError(msg.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Enter your credentials to access your studio">

      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-6 border border-red-100 dark:border-red-900/20 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span className="flex-1">{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Email Address</label>
          <div className="relative group">
            <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors">
                <Mail className="w-5 h-5" />
            </div>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="producer@studio.com"
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3.5 focus:border-rose-500 outline-none transition-all font-medium text-gray-900 dark:text-white" 
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Password</label>
            <a href="/forgot-password" className="text-xs font-bold text-rose-600 hover:underline">
                Forgot password?
            </a>
          </div>
          <div className="relative group">
            <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors">
                <Lock className="w-5 h-5" />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-10 pr-12 py-3.5 focus:border-rose-500 outline-none transition-all font-medium text-gray-900 dark:text-white" 
            />
            <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 p-1 text-gray-400 hover:text-gray-200"
            >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl hover:bg-rose-700 flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
        >
          {loading ? (
            <><Loader className="w-5 h-5 animate-spin" /> Logging in...</>
          ) : (
            <>Log In <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </form>

      {/* Social Login Divider */}
      <div className="my-8 flex items-center gap-4">
         <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1"></div>
         <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Or continue with</span>
         <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1"></div>
      </div>

      <SocialLogin onClick={handleGoogleLogin} />

      <div className="text-center text-sm text-gray-500 mt-8">
         Don&apos;t have an account? <Link href="/signup" className="text-rose-600 font-bold hover:underline">Create Account</Link>
      </div>
    </AuthLayout>
  );
};

export default LoginView;