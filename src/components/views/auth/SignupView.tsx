'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Phone, FileText, Lock, Eye, EyeOff, Loader, ArrowRight } from 'lucide-react';
import { auth, db } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile as updateFirebaseProfile, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { AuthLayout, SocialLogin } from '@/components/AuthShared';

// Define a type for Firebase errors to avoid 'any'
interface FirebaseError {
  message: string;
  code?: string;
}

const SignupView: React.FC = () => {
  const router = useRouter();
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
        setError("Passwords do not match.");
        return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateFirebaseProfile(user, { displayName: name });
      await sendEmailVerification(user);

      const role = email === 'admin@asstudio.com' ? 'admin' : 'user';

      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        name: name,
        email: email,
        phone: phone,
        bio: bio,
        role: role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        joinedAt: new Date().toISOString()
      });

      window.location.href = '/dashboard';
    } catch (err: unknown) { // Changed 'any' to 'unknown'
      const firebaseError = err as FirebaseError;
      let msg = firebaseError.message.replace('Firebase: ', '');
      if (msg.includes('email-already-in-use')) msg = 'This email is already registered.';
      if (msg.includes('weak-password')) msg = 'Password should be at least 6 characters.';
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
            phone: '',
            bio: '',
            role: isDevAdmin ? 'admin' : 'user',
            avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random`,
            joinedAt: new Date().toISOString()
        });
      }

      router.push('/dashboard');
    } catch (err: unknown) { // Changed 'any' to 'unknown'
      const firebaseError = err as FirebaseError;
      setError(firebaseError.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join the future of sound design">
       
       {error && (
        <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-6 border border-red-100 dark:border-red-900/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            {error}
        </div>
       )}

       <form onSubmit={handleSignup} className="space-y-4">
        
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Full Name</label>
          <div className="relative group">
            <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors">
                <User className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3.5 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600" 
            />
          </div>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Phone (Optional)</label>
              <div className="relative group">
                 <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors">
                    <Phone className="w-5 h-5" />
                 </div>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+234..."
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3.5 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Role (Optional)</label>
              <div className="relative group">
                 <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors">
                    <FileText className="w-5 h-5" />
                 </div>
                <input 
                  type="text" 
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Producer..."
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3.5 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600" 
                />
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Password</label>
            <div className="relative group">
              <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors">
                  <Lock className="w-5 h-5" />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 chars"
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-10 pr-10 py-3.5 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Confirm</label>
            <div className="relative group">
              <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors">
                  <Lock className="w-5 h-5" />
              </div>
              <input 
                type={showConfirm ? "text" : "password"}
                required 
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-10 pr-10 py-3.5 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600" 
              />
              <button 
                type="button" 
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        
        <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
        >
          {loading ? (
             <><Loader className="w-5 h-5 animate-spin" /> Creating Account...</>
          ) : (
             <>Create Account <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </form>

      <div className="my-8 flex items-center gap-4">
         <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1"></div>
         <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Or register with</span>
         <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1"></div>
      </div>

      <SocialLogin onClick={handleGoogleLogin} />

      <div className="text-center text-sm text-gray-500 mt-8">
         Already have an account? <a href="/login" className="text-rose-600 font-bold hover:underline">Log In</a>
      </div>
    </AuthLayout>
  );
};

export default SignupView;
