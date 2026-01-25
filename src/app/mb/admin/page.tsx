import React from 'react';
import type { Metadata } from 'next';
import AdminOverviewView from '@/components/views/admin/OverviewView';

export const metadata: Metadata = {
  title: "Admin Dashboard | Asstudio",
  description: "Manage your store.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminOverviewView />;
}