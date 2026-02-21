'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader } from 'lucide-react';
import { auth, db } from '@/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { AuthLayout, SocialLogin } from '@/components/AuthShared';

// Interface for Firebase errors to replace 'any'
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard'); 
    } catch (err: unknown) { // Changed 'any' to 'unknown'
      const firebaseError = err as FirebaseError;
      // Clean up Firebase error messages for better UX
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
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const isDevAdmin = user.email === 'admin@asstudio.com'; 
        await setDoc(doc(db, "users", user.uid), {
            id: user.uid,
            name: user.displayName || 'User',
            email: user.email,
            role: isDevAdmin ? 'admin' : 'user',
            // Added encodeURIComponent to handle spaces in names
            avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random`,
            joinedAt: new Date().toISOString()
        });
      }

      window.location.href = '/dashboard';
    } catch (err: unknown) { // Changed 'any' to 'unknown'
      const firebaseError = err as FirebaseError;
      setError(firebaseError.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Enter your credentials to access your studio">
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-6 border border-red-100 dark:border-red-900/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        
        {/* Email Input */}
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
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3.5 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600" 
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Password</label>
            <a href="/forgot-password" className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline transition-colors">
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
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-10 pr-12 py-3.5 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600" 
            />
            <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Login Button */}
        <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <>
               <Loader className="w-5 h-5 animate-spin" /> Logging in...
            </>
          ) : (
            <>
               Log In <ArrowRight className="w-5 h-5" />
            </>
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
         {/* Fixed: Escaped apostrophe here */}
         Don&apos;t have an account? <a href="/signup" className="text-rose-600 font-bold hover:underline">Create Account</a>
      </div>
    </AuthLayout>
  );
};

export default LoginView;
