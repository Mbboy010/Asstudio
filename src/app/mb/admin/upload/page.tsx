import React from 'react';
import type { Metadata } from 'next';
import AdminUploadView from '@/components/views/admin/UploadView';

export const metadata: Metadata = {
  title: "Upload Product | Asstudio Admin",
  description: "Add new products to the catalog.",
};

export default function AdminUploadPage() {
  return <AdminUploadView />;
}