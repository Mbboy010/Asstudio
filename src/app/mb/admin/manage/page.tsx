import React from 'react';
import type { Metadata } from 'next';
import AdminManageView from '@/components/views/admin/ManageContentView';

export const metadata: Metadata = {
  title: "Manage Content | Asstudio Admin",
  description: "Content management dashboard.",
};

export default function AdminManageContentPage() {
  return <AdminManageView />;
}