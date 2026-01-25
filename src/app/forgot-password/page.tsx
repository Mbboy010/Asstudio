import React from 'react';
import type { Metadata } from 'next';
import ForgotPasswordView from '@/components/views/auth/ForgotPasswordView';

export const metadata: Metadata = {
  title: "Reset Password | Asstudio",
  description: "Recover your account access.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}