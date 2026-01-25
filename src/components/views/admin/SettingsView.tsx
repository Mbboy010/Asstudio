'use client';

import React from 'react';
import { Save, Globe, Mail, Shield, AlertTriangle, Settings } from 'lucide-react';

const AdminSettingsView: React.FC = () => {
  return (
    <div className="max-w-5xl space-y-8 bg-gray-50 dark:bg-black min-h-screen py-6 transition-colors duration-300">
      
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-zinc-800 pb-6 flex items-end gap-4">
        <div className="p-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm">
            <Settings className="w-8 h-8 text-rose-600" />
        </div>
        <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-500 font-medium mt-1">Configure store preferences and admin controls.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-8 shadow-sm space-y-10">
         
         {/* General Information Section */}
         <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-rose-600" /> General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2.5">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Store Name</label>
                  <input 
                    type="text" 
                    defaultValue="A.S Studio" 
                    className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3.5 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all font-medium text-gray-900 dark:text-white" 
                  />
                  <p className="text-xs text-gray-400">This name will appear in emails and the page title.</p>
               </div>
               <div className="space-y-2.5">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Support Email</label>
                  <div className="relative">
                      <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input 
                        type="email" 
                        defaultValue="support@asstudio.com" 
                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all font-medium text-gray-900 dark:text-white" 
                      />
                  </div>
                  <p className="text-xs text-gray-400">Customer inquiries will be sent to this address.</p>
               </div>
            </div>
         </div>

         <div className="h-px bg-gray-100 dark:bg-zinc-800"></div>

         {/* System Control Section */}
         <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-600" /> System Control
            </h3>
            <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-zinc-800/30 rounded-2xl border border-gray-200 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-zinc-700 transition-colors">
               <div className="flex gap-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 rounded-xl h-fit shadow-sm">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                      <div className="font-bold text-gray-900 dark:text-white text-lg">Maintenance Mode</div>
                      <div className="text-sm text-gray-500 mt-1 max-w-md">Temporarily disable the public storefront. Admin accounts can still access the dashboard.</div>
                  </div>
               </div>
               <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-rose-600 shadow-inner"></div>
               </label>
            </div>
         </div>
         
         {/* Footer Actions */}
         <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-zinc-800">
            <button className="bg-rose-600 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all active:scale-95">
               <Save className="w-5 h-5" /> Save Changes
            </button>
         </div>
      </div>
    </div>
  );
};

export default AdminSettingsView;
