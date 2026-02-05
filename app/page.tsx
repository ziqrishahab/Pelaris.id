'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Smartphone,
  Package,
  BarChart3,
  Check,
  Download,
  WifiOff,
  Shield,
  Store,
  Menu,
  X,
} from 'lucide-react';

// Navbar Component
function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <nav className="fixed top-4 left-4 right-4 z-50">
      <div className="max-w-6xl mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-100 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Mobile: Hamburger Left | Desktop: Logo Left */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            {/* Desktop Logo */}
            <Link href="/" className="hidden lg:flex items-center">
              <Image
                src="/images/logo.png"
                alt="Pelaris"
                width={120}
                height={32}                
                style={{ width: 'auto', height: 'auto' }}
              />
            </Link>
          </div>

          {/* Mobile: Logo Center | Desktop: Menu Center */}
          <div className="flex items-center">
            {/* Mobile Logo */}
            <Link href="/" className="lg:hidden flex items-center">
              <Image
                src="/images/logo.png"
                alt="Pelaris"
                width={105}
                height={28}                
                style={{ width: 'auto', height: 'auto' }}
              />
            </Link>
            
            {/* Desktop Menu Center */}
            <div className="hidden lg:flex items-center gap-8">
              <Link href="#fitur" className="text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
                Fitur
              </Link>
              <Link href="#harga" className="text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
                Harga
              </Link>
              <Link href="/faq" className="text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
                FAQ
              </Link>
              <Link href="/about" className="text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
                Tentang
              </Link>
              <Link href="/contact" className="text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
                Kontak
              </Link>
            </div>
          </div>

          {/* Mobile: Theme Toggle Right | Desktop: CTA Right */}
          <div className="flex items-center gap-3">
            {/* Desktop CTA */}
            <Link
              href="/login"
              className="hidden lg:inline-flex px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="hidden lg:inline-flex px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`lg:hidden border-t border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-[500px] opacity-100 py-4' : 'max-h-0 opacity-0 py-0'
          }`}
        >
          <div className="flex flex-col gap-2">
            <Link
              href="#fitur"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Fitur
            </Link>
            <Link
              href="#harga"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Harga
            </Link>
            <Link
              href="/faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Tentang Kami
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Kontak
            </Link>
            <hr className="border-slate-200 dark:border-slate-700 my-2" />
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mx-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors text-center"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mx-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors text-center"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-500/10 border border-slate-500/20 rounded-full mb-6">
              <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">100% Gratis Selamanya</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Sistem Kasir Modern untuk{' '}
              <span className="text-slate-600 dark:text-slate-400">UMKM Indonesia</span>
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-xl">
              Kelola penjualan, stok, dan laporan keuangan toko Anda dengan mudah. 
              Aplikasi kasir POS gratis yang dirancang khusus untuk pertumbuhan bisnis kecil dan menengah.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-slate-600/20"
              >
                Daftar Sekarang
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-500" />
                <span>Tanpa Iklan</span>
              </div>
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-slate-500" />
                <span>Mode Offline</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-500" />
                <span>Data Aman</span>
              </div>
            </div>
          </div>

          {/* Right - Dashboard Mockup */}
          <div className="relative">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-2xl">
              {/* Browser Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 bg-slate-700 rounded-md px-3 py-1 text-xs text-slate-400">
                  pelaris.id/dashboard
                </div>
              </div>

              {/* Dashboard Preview */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="w-8 h-8 bg-slate-500/20 rounded-lg mb-2"></div>
                  <div className="h-2 bg-slate-600 rounded w-full mb-1"></div>
                  <div className="h-4 bg-slate-500/30 rounded w-2/3"></div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg mb-2"></div>
                  <div className="h-2 bg-slate-600 rounded w-full mb-1"></div>
                  <div className="h-4 bg-blue-500/30 rounded w-3/4"></div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg mb-2"></div>
                  <div className="h-2 bg-slate-600 rounded w-full mb-1"></div>
                  <div className="h-4 bg-purple-500/30 rounded w-1/2"></div>
                </div>
              </div>

              {/* Chart Preview */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-end gap-2 h-32">
                  <div className="flex-1 bg-slate-500/40 rounded-t-sm" style={{ height: '40%' }}></div>
                  <div className="flex-1 bg-slate-500/50 rounded-t-sm" style={{ height: '60%' }}></div>
                  <div className="flex-1 bg-slate-500/60 rounded-t-sm" style={{ height: '45%' }}></div>
                  <div className="flex-1 bg-slate-500/70 rounded-t-sm" style={{ height: '80%' }}></div>
                  <div className="flex-1 bg-slate-500/80 rounded-t-sm" style={{ height: '65%' }}></div>
                  <div className="flex-1 bg-slate-500/90 rounded-t-sm" style={{ height: '90%' }}></div>
                  <div className="flex-1 bg-slate-500 rounded-t-sm" style={{ height: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: Smartphone,
      title: 'Multi-Platform',
      description: 'Akses toko Anda dari mana saja. Tersedia di Web, Android, dan Tablet dengan sinkronisasi real-time.',
    },
    {
      icon: Store,
      title: 'Multi-Cabang',
      description: 'Kelola banyak cabang dalam satu akun. Pantau stok dan penjualan antar cabang tanpa ribet.',
    },
    {
      icon: BarChart3,
      title: 'Laporan Lengkap',
      description: 'Analisis bisnis mendalam dengan grafik visual. Ketahui produk terlaris dan tren penjualan harian.',
    },
    {
      icon: Package,
      title: 'Manajemen Stok',
      description: 'Peringatan stok menipis otomatis. Atur stok masuk dan keluar dengan pencatatan yang rapi.',
    },
    {
      icon: WifiOff,
      title: 'Mode Offline',
      description: 'Tetap jualan meski internet mati. Data akan tersinkronisasi otomatis saat kembali online.',
    },
    {
      icon: Shield,
      title: 'Tanpa Iklan',
      description: 'Fokus jualan tanpa gangguan iklan yang mengganggu. Tampilan bersih dan profesional.',
    },
  ];

  return (
    <section id="fitur" className="py-20 px-4 bg-slate-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Kenapa Pilih Pelaris?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Kami menyediakan fitur premium secara gratis untuk membantu UMKM Indonesia naik kelas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:border-slate-400 dark:hover:border-slate-500 transition-all hover:scale-[1.02] shadow-sm"
            >
              <div className="w-12 h-12 bg-slate-500/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Pricing Section
function PricingSection() {
  const features = [
    'Transaksi Unlimited',
    'Produk & Kategori Unlimited',
    'Manajemen Pegawai',
    'Laporan Keuangan Excel',
    'Support Prioritas 24/7',
  ];

  return (
    <section id="harga" className="py-20 px-4 bg-white dark:bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-lg">
          <div className="grid md:grid-cols-2">
            {/* Left - Pricing */}
            <div className="p-8 md:p-12">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Mulai Sekarang</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Nikmati semua fitur premium tanpa biaya langganan bulanan.
              </p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">Rp 0</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">/ bulan</span>
                </div>
                <p className="text-slate-500 line-through text-sm">Rp 150.000 / bulan</p>
              </div>

              <Link
                href="/register"
                className="block w-full py-3 bg-slate-600 hover:bg-slate-700 text-white text-center rounded-lg font-medium transition-colors"
              >
                Daftar Gratis
              </Link>
            </div>

            {/* Right - Features */}
            <div className="bg-slate-200 dark:bg-slate-800/50 p-8 md:p-12 border-t md:border-t-0 md:border-l border-slate-300 dark:border-slate-700">
              <div className="inline-block px-3 py-1 bg-slate-500/10 border border-slate-500/20 rounded-full text-slate-600 dark:text-slate-400 text-sm font-medium mb-6">
                Gratis Selamanya
              </div>

              <p className="text-slate-900 dark:text-white font-medium mb-4">Apa yang Anda dapatkan:</p>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <Check className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Download Section
function DownloadSection() {
  return (
    <section id="download" className="py-20 px-4 bg-slate-100 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Siap Mengembangkan Usaha Anda?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
          Bergabunglah dengan ribuan UMKM yang telah menggunakan Pelaris. 
          Download sekarang, 100% Gratis.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="#"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
          >
            <Download className="w-6 h-6" />
            <div className="text-left">
              <div className="text-xs opacity-80">Download di</div>
              <div className="text-lg font-semibold">Google Play</div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Trakteer - Left */}
          <div className="order-2 sm:order-1">
            <a 
              href="https://trakteer.id/ziqrishahab/tip" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#BE1E2D] hover:bg-[#a01a26] text-white text-sm font-medium rounded-full transition-colors shadow-sm"
            >
              <Image 
                src="https://edge-cdn.trakteer.id/images/embed/trbtn-icon.png" 
                alt="Trakteer" 
                width={20} 
                height={20}
                className="w-5 h-5"
                unoptimized
              />
              <span>Support saya di Trakteer</span>
            </a>
          </div>

          {/* Copyright - Right on desktop, top on mobile */}
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center order-1 sm:order-2">
            © 2026 Pelaris.id System. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Main Page Component
export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 scroll-smooth">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <DownloadSection />
      </main>
      <Footer />
    </div>
  );
}
