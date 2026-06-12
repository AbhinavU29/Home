import React from 'react';
import { Link } from 'react-router-dom';
import { Gem, Sparkles, ShieldCheck, HeartHandshake, Phone, Mail, MapPin } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 min-h-screen">
      {/* Navbar */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Gem className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
          <span className="font-serif text-xl font-bold tracking-widest text-blue-900 dark:text-white">
            PRASANTH JEWELLERY
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-wider font-semibold">
          <a href="#hero" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</a>
          <a href="#about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About Us</a>
          <a href="#contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</a>
        </div>
        <div>
          <Link 
            to="/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md"
          >
            Billing Portal
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section id="hero" className="relative py-24 text-center bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-950 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest text-blue-800 dark:text-blue-400 font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Coimbatore's Trusted Jewelry Showroom
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-extrabold tracking-tight text-blue-950 dark:text-white leading-tight">
            Exquisite Craftsmanship <br/>
            <span className="text-blue-600 dark:text-blue-400">Guaranteed Purity</span>
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-350 max-w-lg mx-auto font-light leading-relaxed">
            Welcome to Prasanth Jewellery. Explore pure BIS hallmarked gold necklaces, diamonds, and fine silver ornaments backed by 100% compliant tax billing.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Link 
              to="/catalog" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-500/25"
            >
              Explore Catalog
            </Link>
            <a 
              href="#contact" 
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              Get Directions
            </a>
          </div>
        </div>
      </section>

      {/* Legacy Pillars */}
      <section className="py-16 max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-blue-900 dark:text-white">Hallmarked Bullion</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            All gold items carry the government BIS hallmarking certifying exact purities (24K, 22K, 18K).
          </p>
        </div>
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-blue-900 dark:text-white">Legacy of Trust</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            We have served generations with transparent transaction structures and highly competitive bullion rates.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Gem className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-blue-900 dark:text-white">Custom Artisanship</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Order bespoke wedding chokers, temple collections, and lightweight rings built to your exact weight specifications.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-4">
            <span className="font-serif text-xl font-bold tracking-wider text-blue-900 dark:text-white">PRASANTH JEWELLERY</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Coimbatore's premium gold, silver, and diamond jeweler. Legacy of absolute transparency, verified HUID hallmarking, and tax compliance.
            </p>
          </div>
          
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-350">
            <h4 className="text-xs font-bold text-blue-900 dark:text-white uppercase tracking-wider">Contact Address</h4>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>123 Gold Bazaar Road, Coimbatore, Tamil Nadu, India</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600 shrink-0" />
              <span>+91 99887 76655</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <span>billing@prasanthjewellery.com</span>
            </div>
          </div>
          
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-350">
            <h4 className="text-xs font-bold text-blue-900 dark:text-white uppercase tracking-wider">Showroom Hours</h4>
            <p>
              Monday - Saturday: 10:00 AM to 08:30 PM <br/>
              Sunday: 11:00 AM to 04:00 PM
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto pt-6 flex flex-col md:flex-row justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>&copy; 2026 Prasanth Jewellery Billing Systems. All rights reserved.</span>
          <span className="flex gap-4 mt-2 md:mt-0">
            <a href="#" className="hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600">Terms of Service</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
