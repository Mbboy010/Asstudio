'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, Loader } from 'lucide-react';
import { auth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { AuthLayout } from '@/components/AuthShared';

// Define an interface for the Firebase error to satisfy the compiler
interface AuthError {
  message: string;
  code?: string;
}

const ForgotPasswordView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
        await sendPasswordResetEmail(auth, email);
        setSubmitted(true);
    } catch (err: unknown) { // Changed 'any' to 'unknown'
        const firebaseError = err as AuthError;
        let msg = firebaseError.message.replace('Firebase: ', '');
        if (msg.includes('user-not-found')) msg = 'No account found with this email.';
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  // Success State
  if (submitted) {
    return (
      <AuthLayout title="Check your inbox" subtitle="We&apos;ve sent you a secure link">
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
             <CheckCircle className="w-10 h-10" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
            We have sent a password reset link to <span className="font-bold text-gray-900 dark:text-white">{email}</span>. Please check your email.
          </p>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 text-rose-600 font-bold hover:underline transition-all hover:gap-3">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email to receive instructions">
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-6 border border-red-100 dark:border-red-900/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
        
        <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-600/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
             <><Loader className="w-5 h-5 animate-spin" /> Sending...</>
          ) : (
             'Send Reset Link'
          )}
        </button>
      </form>
      
      <div className="text-center mt-8">
         <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-rose-600 transition-colors flex items-center justify-center gap-2 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Login
         </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordView;
