'use client';

import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store, setUser, setLoading } from '@/redux/store';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { ThemeProvider } from 'next-themes';

interface AuthListenerProps {
  children: React.ReactNode;
}

const AuthListener: React.FC<AuthListenerProps> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      dispatch(setLoading(true));
      if (firebaseUser) {
        const isDevAdmin = firebaseUser.email === 'admin@asstudio.com';
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            dispatch(setUser({
              ...userData,
              id: firebaseUser.uid,
              email: firebaseUser.email || userData.email,
              role: isDevAdmin ? 'admin' : userData.role,
              emailVerified: firebaseUser.emailVerified,
              name: userData.name || firebaseUser.displayName || 'User',
              avatar: userData.avatar || firebaseUser.photoURL || '',
              joinedAt: userData.joinedAt || new Date().toISOString()
            } as any));
          } else {
             // Fallback
             dispatch(setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'User',
                avatar: firebaseUser.photoURL || 'https://picsum.photos/100/100',
                role: isDevAdmin ? 'admin' : 'user',
                joinedAt: new Date().toISOString(),
                emailVerified: firebaseUser.emailVerified
            } as any));
          }
        } catch (error) {
          console.error("Auth Error", error);
        }
      } else {
        dispatch(setUser(null));
      }
      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthListener>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </AuthListener>
    </Provider>
  );
}