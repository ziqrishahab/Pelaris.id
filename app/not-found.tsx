'use client';

import Link from 'next/link';
import { Store, Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Logo Header */}
      <div className="pt-8 pb-4 flex justify-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">Pelaris</span>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="text-center max-w-md">
          {/* 404 Number */}
          <div className="mb-8">
            <span className="text-8xl md:text-9xl font-bold text-slate-200 dark:text-slate-800">
              404
            </span>
          </div>

          {/* Message */}
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Maaf, halaman yang Anda cari tidak ada atau mungkin telah dipindahkan. 
            Pastikan URL yang Anda masukkan sudah benar.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
            >
              <Home className="w-5 h-5" />
              Ke Beranda
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </button>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Mungkin Anda mencari:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/login" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline">
                Login
              </Link>
              <Link href="/register" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline">
                Daftar
              </Link>
              <Link href="/faq" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline">
                FAQ
              </Link>
              <Link href="/contact" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline">
                Kontak
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
