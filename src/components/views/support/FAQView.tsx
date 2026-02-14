'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, HelpCircle, CreditCard, ShieldCheck, Download, Plus, Minus, LucideIcon } from 'lucide-react';
import { TextPageSkeleton } from '@/components/ui/Skeleton';

// --- Interfaces ---
interface FAQCategory {
  id: string;
  name: string;
  icon: LucideIcon;
}

interface FAQEntry {
  category: string;
  question: string;
  answer: string;
}

interface FAQItemProps {
  question: string;
  answer: string;
}

// --- Data ---
const faqCategories: FAQCategory[] = [
  { id: 'general', name: 'General', icon: HelpCircle },
  { id: 'products', name: 'Products & Downloads', icon: Download },
  { id: 'billing', name: 'Billing & Payments', icon: CreditCard },
  { id: 'licensing', name: 'Licensing', icon: ShieldCheck },
];

const faqData: FAQEntry[] = [
  {
    category: 'general',
    question: 'What is A.S Studio?',
    answer: 'A.S Studio is a premium marketplace for music producers, offering high-quality sample packs, synthesizer presets, and audio plugins designed to enhance your production workflow.'
  },
  {
    category: 'products',
    question: 'How do I download my purchased products?',
    answer: 'After completing your purchase, you will be redirected to a confirmation page with download links. Additionally, an email containing your secure download links will be sent to the email address provided during checkout. You can also access all your past purchases in the "My Library" section of your dashboard.'
  },
  {
    category: 'products',
    question: 'What format are the samples in?',
    answer: 'Most of our sample packs are provided in high-quality 24-bit WAV format, which is compatible with all major DAWs (Ableton Live, FL Studio, Logic Pro, etc.). Specific format details are listed on each product page.'
  },
  {
    category: 'billing',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express) as well as PayPal. All transactions are securely encrypted via Stripe.'
  },
  {
    category: 'billing',
    question: 'Can I get a refund?',
    answer: 'Due to the digital nature of our products, we generally do not offer refunds once files have been downloaded. However, if you have a technical issue with a product that cannot be resolved, please contact our support team within 14 days of purchase.'
  },
  {
    category: 'licensing',
    question: 'Are the samples royalty-free?',
    answer: 'Yes! All samples and presets purchased on A.S Studio are 100% royalty-free. This means you can use them in your own commercial music releases without paying any additional fees or royalties to us.'
  },
  {
    category: 'licensing',
    question: 'Can I resell the samples?',
    answer: 'No. You cannot resell, repackage, or redistribute the individual samples or presets as part of another sample pack or library. The license covers your usage in musical compositions only.'
  },
];

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false }}
      className={`border rounded-2xl overflow-hidden mb-4 transition-all duration-300 ${
        isOpen 
          ? 'bg-white dark:bg-zinc-900 border-rose-500/50 shadow-lg shadow-rose-600/5' 
          : 'bg-gray-50 dark:bg-zinc-900/50 border-gray-200 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-zinc-700'
      }`}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
      >
        <span className={`font-bold text-lg pr-4 transition-colors ${isOpen ? 'text-rose-600 dark:text-rose-500' : 'text-gray-900 dark:text-white'}`}>
            {question}
        </span>
        <div className={`p-1 rounded-full transition-colors ${isOpen ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600' : 'bg-gray-200 dark:bg-zinc-800 text-gray-500'}`}>
            {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-zinc-800/50">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
        setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-500 text-xs font-bold uppercase tracking-widest">
            Support Center
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-8 text-gray-900 dark:text-white">How can we help?</h1>
          
          <div className="relative max-w-xl mx-auto group">
             <Search className="absolute left-5 top-4 text-gray-400 w-5 h-5 group-focus-within:text-rose-600 transition-colors" />
             <input 
               type="text" 
               placeholder="Search for answers..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none shadow-sm transition-all text-lg"
             />
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div 
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: false }}
           className="flex flex-wrap justify-center gap-3 mb-12"
        >
           <button 
             onClick={() => setActiveCategory('all')}
             className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
                activeCategory === 'all' 
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
                : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-zinc-700'
             }`}
           >
             All Questions
           </button>
           {faqCategories.map(cat => (
             <button
               key={cat.id}
               onClick={() => setActiveCategory(cat.id)}
               className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${
                activeCategory === cat.id 
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
                : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-zinc-700'
               }`}
             >
               <cat.icon className="w-4 h-4" /> {cat.name}
             </button>
           ))}
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))
          ) : (
            <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
              <div className="w-16 h-16 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No results found</h3>
              <p className="text-gray-500">We couldn&apos;t find any answers matching &quot;{searchTerm}&quot;.</p>
            </div>
          )}
        </div>

        {/* Still need help? */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: false }}
           className="mt-20 text-center bg-gray-900 dark:bg-zinc-900 p-12 rounded-3xl relative overflow-hidden"
        >
           {/* Background Pattern */}
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/20 rounded-full blur-[100px] pointer-events-none"></div>

           <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-black mb-4 text-white">Still have questions?</h3>
                <p className="text-gray-400 mb-8 max-w-lg mx-auto text-lg">Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly team.</p>
                <a href="/support/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20 active:scale-95">
                    Contact Support
                </a>
           </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQView;
