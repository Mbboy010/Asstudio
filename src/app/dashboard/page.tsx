import React from 'react';
import type { Metadata } from 'next';
import DashboardContent from '@/pages/UserDashboard';

export const metadata: Metadata = {
  title: "Dashboard | Asstudio",
  description: "Manage your library and account.",
  robots: {
    index: false, // Don't index user dashboards
    follow: false,
  }
};

export default function DashboardPage() {
  return <DashboardContent />;
}