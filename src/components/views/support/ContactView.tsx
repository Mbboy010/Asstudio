'use client';

import React, { useState, useEffect } from 'react';
import { Mail, MapPin, Send, MessageSquare, CheckCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormSkeleton } from '@/components/ui/Skeleton';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase';

const ContactView: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
        setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    
    try {
      await addDoc(collection(db, "messages"), {
        ...formData,
        createdAt: new Date().toISOString(),
        read: false
      });
      
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: unknown) { // Fixed: Changed from 'any' to 'unknown'
      const err = error as { message?: string };
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
      setStatus('idle');
    }
  };

  if (loading) return <FormSkeleton />;

  return (
    <div className="min-h-screen py-16 px-4 bg-gray-50 dark:bg-black transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <motion.div 
           initial={{ opacity: 0, y: -20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: false }}
           className="text-center mb-16"
        >
           <h1 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 dark:text-white">Get in Touch</h1>
           <p className="text-gray-500 font-medium text-lg max-w-2xl mx-auto">
             {/* Fixed: Escaped apostrophe in "We're" */}
             Have questions about our products or need technical support? We&apos;re here to help you create your best work.
           </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           
           {/* Left Column: Contact Info */}
           <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              className="lg:col-span-1 space-y-6"
           >
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm h-full">
                 <h3 className="text-xl font-bold mb-8 text-gray-900 dark:text-white">Contact Information</h3>
                 
                 <div className="space-y-8">
                    <div className="flex items-start gap-5">
                       <div className="p-3 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-500 rounded-xl">
                          <Mail className="w-6 h-6" />
                       </div>
                       <div>
                          <h4 className="font-bold mb-1 text-gray-900 dark:text-white">Email Us</h4>
                          <p className="text-gray-500 text-sm mb-2">Our team typically responds within 24 hours.</p>
                          <a href="mailto:support@asstudio.com" className="text-rose-600 font-bold hover:underline">support@asstudio.com</a>
                       </div>
                    </div>

                    <div className="flex items-start gap-5">
                       <div className="p-3 bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-500 rounded-xl">
                          <MessageSquare className="w-6 h-6" />
                       </div>
                       <div>
                          <h4 className="font-bold mb-1 text-gray-900 dark:text-white">Live Chat</h4>
                          <p className="text-gray-500 text-sm mb-2">Available Mon-Fri, 9am - 5pm PST.</p>
                          <button className="text-purple-600 dark:text-purple-400 font-bold hover:underline">Start Chat</button>
                       </div>
                    </div>

                    <div className="flex items-start gap-5">
                       <div className="p-3 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-500 rounded-xl">
                          <MapPin className="w-6 h-6" />
                       </div>
                       <div>
                          <h4 className="font-bold mb-1 text-gray-900 dark:text-white">Office</h4>
                          <p className="text-gray-500 text-sm leading-relaxed">
                            123 Audio Lane,<br />
                            Sound City, CA 90210<br />
                            United States
                          </p>
                       </div>
                    </div>
                 </div>
              </div>
           </motion.div>

           {/* Right Column: Contact Form */}
           <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              className="lg:col-span-2"
           >
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm h-full flex flex-col justify-center">
                 
                 {status === 'success' ? (
                    <div className="text-center py-20 animate-in fade-in zoom-in duration-300">
                       <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                          <CheckCircle className="w-12 h-12" />
                       </div>
                       <h3 className="text-3xl font-black mb-4 text-gray-900 dark:text-white">Message Sent!</h3>
                       <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
                           Thank you for reaching out. We have received your message and will get back to you shortly.
                       </p>
                       <button 
                         onClick={() => setStatus('idle')}
                         className="px-8 py-3 bg-white dark:bg-black border border-gray-200 dark:border-zinc-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                       >
                          Send Another Message
                       </button>
                    </div>
                 ) : (
                    <>
                        <h3 className="text-xl font-bold mb-8 text-gray-900 dark:text-white">Send us a Message</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Your Name</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        placeholder="John Doe"
                                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3.5 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                                    <input 
                                        required
                                        type="email" 
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        placeholder="john@example.com"
                                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3.5 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Subject</label>
                                <input 
                                    required
                                    type="text" 
                                    value={formData.subject}
                                    onChange={e => setFormData({...formData, subject: e.target.value})}
                                    placeholder="How can we help?"
                                    className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3.5 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Message</label>
                                <textarea 
                                    required
                                    value={formData.message}
                                    onChange={e => setFormData({...formData, message: e.target.value})}
                                    placeholder="Tell us more about your inquiry..."
                                    rows={6}
                                    className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3.5 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-medium resize-none"
                                ></textarea>
                            </div>

                            <button 
                                type="submit" 
                                disabled={status === 'sending'}
                                className="w-full py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2 active:scale-[0.98]"
                            >
                                {status === 'sending' ? (
                                    <><Loader className="w-5 h-5 animate-spin" /> Sending...</>
                                ) : (
                                    <>Send Message <Send className="w-5 h-5" /></>
                                )}
                            </button>
                        </form>
                    </>
                 )}
              </div>
           </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactView;
