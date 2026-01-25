import React from 'react';
import type { Metadata } from 'next';
import AdminSettingsView from '@/components/views/admin/SettingsView';

export const metadata: Metadata = {
  title: "Settings | Asstudio Admin",
  description: "System configuration.",
};

export default function AdminSettingsPage() {
  return <AdminSettingsView />;
}