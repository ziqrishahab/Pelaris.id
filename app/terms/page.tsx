'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function TermsPage() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo.png"
                alt="Pelaris"
                width={120}
                height={32}                
                style={{ width: 'auto', height: 'auto' }}
              />
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

      {/* Content */}
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-12">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Syarat & Ketentuan
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Terakhir diperbarui: 1 Februari 2026
            </p>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  1. Penerimaan Ketentuan
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Dengan mengakses atau menggunakan layanan Pelaris, Anda menyetujui untuk terikat oleh 
                  Syarat & Ketentuan ini. Jika Anda tidak setuju dengan bagian manapun dari ketentuan ini, 
                  Anda tidak diperkenankan menggunakan layanan kami.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  2. Deskripsi Layanan
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  Pelaris adalah platform Point of Sale (POS) yang menyediakan:
                </p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                  <li>Sistem kasir dan pencatatan transaksi</li>
                  <li>Manajemen inventori dan stok barang</li>
                  <li>Laporan penjualan dan analisis bisnis</li>
                  <li>Manajemen multi-cabang dan pegawai</li>
                  <li>Fitur mode offline dengan sinkronisasi otomatis</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  3. Akun Pengguna
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  Untuk menggunakan layanan Pelaris, Anda harus:
                </p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                  <li>Berusia minimal 17 tahun atau memiliki izin dari orang tua/wali</li>
                  <li>Memberikan informasi yang akurat dan lengkap saat pendaftaran</li>
                  <li>Menjaga kerahasiaan password akun Anda</li>
                  <li>Bertanggung jawab atas semua aktivitas yang terjadi di akun Anda</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  4. Penggunaan yang Dilarang
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  Anda dilarang menggunakan Pelaris untuk:
                </p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                  <li>Aktivitas ilegal atau melanggar hukum yang berlaku</li>
                  <li>Menyebarkan malware, virus, atau kode berbahaya</li>
                  <li>Mencoba mengakses sistem atau data pengguna lain tanpa izin</li>
                  <li>Melakukan tindakan yang dapat membahayakan sistem kami</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  5. Hak Kekayaan Intelektual
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Semua konten, fitur, dan fungsionalitas Pelaris termasuk namun tidak terbatas pada 
                  desain, logo, teks, grafik, dan kode sumber adalah milik Pelaris dan dilindungi oleh 
                  undang-undang hak cipta dan merek dagang.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  6. Batasan Tanggung Jawab
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Pelaris disediakan "sebagaimana adanya" tanpa jaminan apapun. Kami tidak bertanggung 
                  jawab atas kerugian langsung, tidak langsung, insidental, atau konsekuensial yang 
                  timbul dari penggunaan layanan kami.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  7. Perubahan Ketentuan
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Kami berhak mengubah Syarat & Ketentuan ini kapan saja. Perubahan akan berlaku segera 
                  setelah dipublikasikan di halaman ini. Penggunaan berkelanjutan atas layanan kami 
                  setelah perubahan berarti Anda menerima ketentuan yang diperbarui.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  8. Kontak
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Jika Anda memiliki pertanyaan tentang Syarat & Ketentuan ini, silakan hubungi kami di{' '}
                  <a href="mailto:legal@pelaris.id" className="text-slate-700 dark:text-slate-300 underline hover:no-underline">
                    legal@pelaris.id
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
