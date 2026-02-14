import React from 'react';
import type { Metadata } from 'next';
import SignupView from '@/components/views/auth/SignupView';

export const metadata: Metadata = {
  title: "Signup | Asstudio",
  description: "Create an account to join the community.",
};

export default function SignupPage() {
  return <SignupView />;
}