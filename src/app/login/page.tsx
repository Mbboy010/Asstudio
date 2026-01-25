import React from 'react';
import type { Metadata } from 'next';
import LoginView from '@/components/views/auth/LoginView';

export const metadata: Metadata = {
  title: "Login | Asstudio",
  description: "Sign in to your account.",
};

export default function LoginPage() {
  return <LoginView />;
}