import React from 'react';
import type { Metadata } from 'next';
import AdminOrdersView from '@/components/views/admin/OrdersView';

export const metadata: Metadata = {
  title: "Manage Orders | Asstudio Admin",
  description: "Orders management dashboard.",
};

export default function AdminOrdersPage() {
  return <AdminOrdersView />;
}