'use client';

import Link from 'next/link';
import { Store, Sun, Moon, ArrowLeft, Target, Heart, Users, Rocket } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const values = [
  {
    icon: Heart,
    title: 'Gratis Selamanya',
    description: 'Kami percaya teknologi harus bisa diakses semua orang. Pelaris gratis tanpa biaya tersembunyi.',
  },
  {
    icon: Users,
    title: 'Fokus pada UMKM',
    description: 'Setiap fitur dirancang berdasarkan kebutuhan nyata pelaku usaha kecil dan menengah Indonesia.',
  },
  {
    icon: Rocket,
    title: 'Inovasi Berkelanjutan',
    description: 'Kami terus mengembangkan fitur baru untuk membantu bisnis Anda berkembang lebih cepat.',
  },
  {
    icon: Target,
    title: 'Sederhana & Powerful',
    description: 'Antarmuka yang mudah dipahami dengan fitur lengkap untuk kebutuhan bisnis modern.',
  },
];

const milestones = [
  { year: '2024', event: 'Ide Pelaris lahir dari keresahan melihat UMKM kesulitan mencatat transaksi' },
  { year: '2025', event: 'Pelaris versi beta diluncurkan untuk 100 toko pertama' },
  { year: '2026', event: 'Pelaris resmi diluncurkan secara publik dengan fitur lengkap' },
];

export default function AboutPage() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">Pelaris</span>
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Tentang Pelaris
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
            Kami adalah tim yang berdedikasi untuk membantu UMKM Indonesia naik kelas melalui 
            teknologi kasir yang mudah, gratis, dan powerful.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Misi Kami</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Indonesia memiliki lebih dari 64 juta UMKM yang menjadi tulang punggung ekonomi. 
                Sayangnya, banyak yang masih kesulitan mengelola bisnis karena keterbatasan akses teknologi.
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Pelaris hadir untuk mengubah itu. Kami menyediakan sistem kasir modern yang bisa 
                digunakan siapa saja, dari warung kecil hingga toko retail, tanpa biaya apapun.
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-8">
              <div className="text-5xl font-bold text-slate-600 dark:text-slate-400 mb-2">64 Juta+</div>
              <div className="text-slate-600 dark:text-slate-400">UMKM di Indonesia yang bisa kami bantu</div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">
            Nilai-Nilai Kami
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6"
              >
                <div className="w-12 h-12 bg-slate-500/10 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{value.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">
            Perjalanan Kami
          </h2>
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {milestone.year}
                  </div>
                  {index < milestones.length - 1 && (
                    <div className="w-0.5 flex-1 bg-slate-300 dark:bg-slate-700 my-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <p className="text-slate-700 dark:text-slate-300 pt-3">{milestone.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Tim Kami</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Pelaris dikembangkan oleh tim kecil yang passionate dengan teknologi dan pemberdayaan UMKM. 
            Kami percaya bahwa solusi terbaik lahir dari memahami kebutuhan nyata pengguna.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 text-sm">
            🇮🇩 Bangga Buatan Indonesia
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-slate-100 dark:bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Siap Bergabung?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Mulai gunakan Pelaris sekarang dan rasakan kemudahan mengelola bisnis Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
            >
              Daftar Gratis
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
