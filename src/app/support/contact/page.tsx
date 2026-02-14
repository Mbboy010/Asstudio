import React from 'react';
import type { Metadata } from 'next';
import ContactView from '@/components/views/support/ContactView';

export const metadata: Metadata = {
  title: "Contact Us | Asstudio",
  description: "Get in touch with our support team.",
};

export default function ContactPage() {
  return <ContactView />;
}