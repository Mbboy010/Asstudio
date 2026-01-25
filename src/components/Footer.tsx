'use client';

import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ProductCategory } from '../types';
import { Facebook, Instagram, Youtube, MessageCircle, Mail, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-zinc-900 pt-20 pb-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          
          {/* Brand & Socials */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white flex items-center gap-2">
                A.S STUDIO <div className="w-2 h-2 bg-rose-600 rounded-full animate-pulse"></div>
              </h3>
              <p className="text-gray-500 font-medium text-sm mt-4 max-w-xs leading-relaxed">
                Empowering creators with the sound of tomorrow. Premium samples, presets, and tools for the modern producer.
              </p>
            </div>
            <div className="flex gap-3">
              <a 
                href="https://facebook.com" 
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-gray-100 dark:bg-zinc-900 rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-gray-600 dark:text-gray-400 transition-all hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-gray-100 dark:bg-zinc-900 rounded-xl hover:bg-pink-600 hover:text-white dark:hover:bg-pink-600 dark:hover:text-white text-gray-600 dark:text-gray-400 transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-gray-100 dark:bg-zinc-900 rounded-xl hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white text-gray-600 dark:text-gray-400 transition-all hover:scale-110"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a 
                href="https://wa.me/" 
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-gray-100 dark:bg-zinc-900 rounded-xl hover:bg-green-500 hover:text-white dark:hover:bg-green-500 dark:hover:text-white text-gray-600 dark:text-gray-400 transition-all hover:scale-110"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-gray-900 dark:text-white">Explore Sounds</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-500 dark:text-gray-400">
              <li><Link href="/shop" className="hover:text-rose-600 dark:hover:text-rose-500 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-700 group-hover:bg-rose-600 transition-colors"></span> All Products</Link></li>
              <li><Link href={`/shop?category=${encodeURIComponent(ProductCategory.SAMPLE_PACK)}`} className="hover:text-rose-600 dark:hover:text-rose-500 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-700 group-hover:bg-rose-600 transition-colors"></span> Sample Packs</Link></li>
              <li><Link href={`/shop?category=${encodeURIComponent(ProductCategory.PRESET_PACK)}`} className="hover:text-rose-600 dark:hover:text-rose-500 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-700 group-hover:bg-rose-600 transition-colors"></span> Presets</Link></li>
              <li><Link href={`/shop?category=${encodeURIComponent(ProductCategory.VST_PLUGIN)}`} className="hover:text-rose-600 dark:hover:text-rose-500 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-700 group-hover:bg-rose-600 transition-colors"></span> VST Plugins</Link></li>
              <li><Link href={`/shop?category=${encodeURIComponent(ProductCategory.MOBILE_APP)}`} className="hover:text-rose-600 dark:hover:text-rose-500 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-700 group-hover:bg-rose-600 transition-colors"></span> Mobile Apps</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-gray-900 dark:text-white">Support & Account</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-500 dark:text-gray-400">
              <li>
                <Link href={isAuthenticated ? "/dashboard" : "/login"} className="hover:text-rose-600 dark:hover:text-rose-500 transition-colors font-bold flex items-center gap-2">
                  {isAuthenticated ? "My Dashboard" : "User Login"}
                </Link>
              </li>
              <li><Link href="/support/faq" className="hover:text-rose-600 dark:hover:text-rose-500 transition-colors">Help Center (FAQ)</Link></li>
              <li><Link href="/support/licensing" className="hover:text-rose-600 dark:hover:text-rose-500 transition-colors">Royalty Free License</Link></li>
              <li>
                 <a href="mailto:support@asstudio.com" className="flex items-center gap-2 hover:text-rose-600 dark:hover:text-rose-500 transition-colors">
                    Report an Issue
                 </a>
              </li>
              <li>
                 <a href="mailto:contact@asstudio.com" className="flex items-center gap-2 hover:text-rose-600 dark:hover:text-rose-500 transition-colors">
                    <Mail className="w-4 h-4" /> Send Message
                 </a>
              </li>
              {isAuthenticated && user?.role === 'admin' && (
                <li className="pt-2">
                    <Link href="/mb/admin" className="inline-block px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-md hover:bg-rose-700 transition-colors">
                        Admin Panel
                    </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-gray-200 dark:border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="text-sm font-medium text-gray-500 text-center md:text-left">
              &copy; {currentYear} A.S Studio. All rights reserved.
           </div>
           
           <div className="flex flex-col md:flex-row items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5 font-medium">
                 Made with <Heart className="w-3 h-3 text-rose-600 fill-current animate-pulse" /> by <a href="#" className="text-gray-900 dark:text-white font-bold hover:text-rose-600 dark:hover:text-rose-500 transition-colors">mbboy</a>
              </span>
              <span className="hidden md:inline text-gray-200 dark:text-zinc-800">|</span>
              <div className="flex gap-2 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                 <div className="h-6 w-10 bg-gray-200 dark:bg-zinc-800 rounded flex items-center justify-center text-[8px] font-black tracking-tighter text-gray-500 dark:text-gray-400">VISA</div>
                 <div className="h-6 w-10 bg-gray-200 dark:bg-zinc-800 rounded flex items-center justify-center text-[8px] font-black tracking-tighter text-gray-500 dark:text-gray-400">MC</div>
                 <div className="h-6 w-10 bg-gray-200 dark:bg-zinc-800 rounded flex items-center justify-center text-[8px] font-black tracking-tighter text-gray-500 dark:text-gray-400">AMEX</div>
              </div>
           </div>
        </div>
      </div>
    </footer>
  );
};
