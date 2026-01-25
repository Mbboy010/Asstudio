import React from 'react';
import type { Metadata } from 'next';
import AdminUsersView from '@/components/views/admin/UsersView';

export const metadata: Metadata = {
  title: "Manage Users | Asstudio Admin",
  description: "User management dashboard.",
};

export default function AdminUsersPage() {
  return <AdminUsersView />;
}