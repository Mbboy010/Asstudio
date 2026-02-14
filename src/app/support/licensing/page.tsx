import React from 'react';
import type { Metadata } from 'next';
import LicensingView from '@/components/views/support/LicensingView';

export const metadata: Metadata = {
  title: "Licensing | Asstudio",
  description: "Read our royalty-free license agreement.",
};

export default function LicensingPage() {
  return <LicensingView />;
}