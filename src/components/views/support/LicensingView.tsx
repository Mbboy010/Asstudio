'use client';

import React, { useState, useEffect } from 'react';
import { Check, Shield, AlertTriangle, Music, Globe, X, Download, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { TextPageSkeleton } from '@/components/ui/Skeleton';

const LicensingView: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
        setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <TextPageSkeleton />;

  return (
    <div className="min-h-screen py-20 px-4 bg-white dark:bg-black transition-colors duration-300">
       <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <motion.div 
             initial={{ opacity: 0, y: -20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: false }}
             className="text-center mb-16"
          >
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-100 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-500 text-xs font-bold tracking-widest uppercase mb-6">
                <Shield className="w-3.5 h-3.5" /> Official License Terms
             </div>
             <h1 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 dark:text-white">Royalty Free License</h1>
             <p className="text-gray-500 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
               Simple, transparent, and designed for creators. When you buy from A.S Studio, you&apos;re buying the freedom to create without legal headaches.
             </p>
          </motion.div>

          {/* License Summary Box */}
          <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: false }}
             className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-8 md:p-10 mb-16 shadow-xl relative overflow-hidden"
          >
             {/* Background Decoration */}
             <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
                <FileCheck className="w-80 h-80 text-rose-600" />
             </div>
             
             <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">The &quot;Standard&quot; License</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-10 text-lg">
                    This license grants you a non-exclusive, non-transferable right to use the audio samples, presets, and MIDI files purchased from A.S Studio in your own musical compositions and productions. This license is valid forever and applies worldwide.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Allowed */}
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-2xl p-6 md:p-8">
                        <h3 className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2 mb-6 text-lg">
                            <div className="p-1 bg-green-200 dark:bg-green-900/40 rounded-full"><Check className="w-4 h-4" /></div>
                            You Can:
                        </h3>
                        <ul className="space-y-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                                Use in commercial music releases (Spotify, Apple Music, etc.)
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                                Use in soundtracks for film, TV, YouTube, and video games.
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                                Use in live performances and DJ sets.
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                                Modify, chop, and process the sounds to fit your production.
                            </li>
                        </ul>
                    </div>

                    {/* Forbidden */}
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl p-6 md:p-8">
                        <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-6 text-lg">
                            <div className="p-1 bg-red-200 dark:bg-red-900/40 rounded-full"><X className="w-4 h-4" /></div>
                            You Cannot:
                        </h3>
                        <ul className="space-y-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></div>
                                Resell, repackage, or redistribute the sounds as they are.
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></div>
                                Include the sounds in a competitive sample pack or virtual instrument.
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></div>
                                Upload the isolated sounds to sites like Splice or Loopcloud.
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></div>
                                Claim ownership of the original raw audio files.
                            </li>
                        </ul>
                    </div>
                </div>
             </div>
          </motion.div>

          {/* Detailed Terms List */}
          <div className="space-y-12">
             <motion.section 
               initial={{ opacity: 0, x: -10 }} 
               whileInView={{ opacity: 1, x: 0 }} 
               viewport={{ once: false }}
               className="flex gap-6"
             >
                <div className="shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-rose-600 dark:text-rose-500">
                        <Music className="w-6 h-6" />
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        1. Royalty-Free Guarantee
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        All products labeled as &quot;Royalty-Free&quot; mean that you do not owe any additional money to A.S Studio or the sound designer, regardless of how successful your track becomes. Whether you get 10 streams or 10 million streams, you keep 100% of your publishing and royalties.
                    </p>
                </div>
             </motion.section>

             <motion.section 
               initial={{ opacity: 0, x: -10 }} 
               whileInView={{ opacity: 1, x: 0 }} 
               viewport={{ once: false }}
               transition={{ delay: 0.1 }}
               className="flex gap-6"
             >
                <div className="shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-rose-600 dark:text-rose-500">
                        <Globe className="w-6 h-6" />
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        2. Worldwide Distribution Rights
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        You are permitted to distribute your musical works containing these sounds on any platform, physical or digital, worldwide. This includes streaming services (Spotify, Apple Music), social media (TikTok, Instagram), radio, television, and physical media.
                    </p>
                </div>
             </motion.section>

             <motion.section 
               initial={{ opacity: 0, x: -10 }} 
               whileInView={{ opacity: 1, x: 0 }} 
               viewport={{ once: false }}
               transition={{ delay: 0.2 }}
               className="flex gap-6"
             >
                <div className="shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-rose-600 dark:text-rose-500">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        3. Single User License
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        The license is granted to a single user (the purchaser). You cannot share your account details or share the downloaded files with friends or on torrent sites. If you are a production team, studio, or educational institution, please contact us for a multi-seat license.
                    </p>
                </div>
             </motion.section>
          </div>

          {/* Download CTA */}
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: false }}
             className="mt-16 p-8 bg-gray-900 dark:bg-zinc-900 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
             <div className="relative z-10">
                <h4 className="font-bold text-2xl text-white mb-1">Download Full Agreement</h4>
                <p className="text-gray-400">Get a PDF copy of the End User License Agreement (EULA) for your records.</p>
             </div>
             <button className="relative z-10 px-8 py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 whitespace-nowrap active:scale-95">
                <Download className="w-5 h-5" /> Download PDF
             </button>
          </motion.div>
       </div>
    </div>
  );
};

export default LicensingView;
