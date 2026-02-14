import React from 'react';
import type { Metadata } from 'next';
import AdminProductsView from '@/components/views/admin/ProductsView';

export const metadata: Metadata = {
  title: "Manage Products | Asstudio Admin",
  description: "Products management dashboard.",
};

export default function AdminProductsPage() {
  return <AdminProductsView />;
}