import React from 'react';
import type { Metadata } from 'next';
import AdminManageContentView from '@/components/views/admin/ManageContentView';

export const metadata: Metadata = {
  title: "Manage Content | Asstudio Admin",
  description: "Content management dashboard.",
};

export default function AdminManageContentPage() {
  return <AdminManageContentView />;
}