'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Store, ChevronDown, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: { category: string; items: FAQItem[] }[] = [
  {
    category: 'Umum',
    items: [
      {
        question: 'Apa itu Pelaris?',
        answer: 'Pelaris adalah aplikasi kasir (Point of Sale) gratis yang dirancang khusus untuk UMKM Indonesia. Dengan Pelaris, Anda bisa mengelola penjualan, stok barang, dan laporan keuangan dengan mudah dari berbagai perangkat.',
      },
      {
        question: 'Apakah Pelaris benar-benar gratis?',
        answer: 'Ya, Pelaris 100% gratis selamanya! Tidak ada biaya langganan bulanan, tidak ada biaya tersembunyi, dan tidak ada iklan yang mengganggu. Kami berkomitmen membantu UMKM Indonesia berkembang.',
      },
      {
        question: 'Bagaimana cara mendaftar Pelaris?',
        answer: 'Anda bisa mendaftar dengan klik tombol "Daftar Gratis" di halaman utama. Isi nama lengkap, nama bisnis, email, dan password. Setelah itu, Anda langsung bisa menggunakan Pelaris.',
      },
      {
        question: 'Apakah data saya aman di Pelaris?',
        answer: 'Tentu saja! Kami menggunakan enkripsi standar industri untuk melindungi data Anda. Data disimpan di server yang aman dan hanya Anda yang bisa mengaksesnya.',
      },
    ],
  },
  {
    category: 'Fitur & Penggunaan',
    items: [
      {
        question: 'Bisa diakses dari perangkat apa saja?',
        answer: 'Pelaris tersedia di Web Browser, Android, dan Tablet. Semua perangkat akan tersinkronisasi secara real-time, jadi Anda bisa beralih perangkat kapan saja tanpa kehilangan data.',
      },
      {
        question: 'Apakah Pelaris bisa digunakan offline?',
        answer: 'Ya! Pelaris memiliki mode offline. Anda tetap bisa melakukan transaksi meski internet mati. Data akan tersinkronisasi otomatis saat koneksi kembali.',
      },
      {
        question: 'Bagaimana cara menambah produk?',
        answer: 'Masuk ke menu Produk > Tambah Produk. Isi nama produk, harga, stok, dan kategori. Anda juga bisa menambahkan foto produk untuk memudahkan identifikasi.',
      },
      {
        question: 'Bisa mengelola banyak cabang?',
        answer: 'Bisa! Pelaris mendukung multi-cabang. Anda bisa menambah cabang baru, memindahkan stok antar cabang, dan melihat laporan per cabang atau gabungan.',
      },
      {
        question: 'Apakah ada fitur manajemen pegawai?',
        answer: 'Ada! Anda bisa menambahkan pegawai dengan role berbeda (Admin, Kasir). Setiap pegawai punya akun sendiri dan Anda bisa melihat aktivitas mereka.',
      },
    ],
  },
  {
    category: 'Pembayaran & Transaksi',
    items: [
      {
        question: 'Metode pembayaran apa saja yang didukung?',
        answer: 'Pelaris mendukung pembayaran Tunai, QRIS, Transfer Bank, dan E-Wallet. Anda bisa mengaktifkan metode pembayaran sesuai kebutuhan bisnis Anda.',
      },
      {
        question: 'Bagaimana cara mencetak struk?',
        answer: 'Pelaris mendukung printer thermal Bluetooth dan USB. Setelah transaksi selesai, struk bisa langsung dicetak atau dikirim via WhatsApp ke pelanggan.',
      },
      {
        question: 'Bisa melakukan retur/pengembalian barang?',
        answer: 'Bisa! Masuk ke menu Riwayat Transaksi, pilih transaksi yang ingin diretur, lalu pilih produk yang dikembalikan. Stok akan otomatis diperbarui.',
      },
    ],
  },
  {
    category: 'Laporan & Analisis',
    items: [
      {
        question: 'Laporan apa saja yang tersedia?',
        answer: 'Pelaris menyediakan laporan penjualan harian/mingguan/bulanan, laporan stok, produk terlaris, laporan laba rugi, dan laporan per kasir. Semua bisa diekspor ke Excel.',
      },
      {
        question: 'Bagaimana cara export laporan ke Excel?',
        answer: 'Masuk ke menu Laporan, pilih jenis laporan dan rentang tanggal, lalu klik tombol "Export Excel". File akan otomatis terunduh.',
      },
      {
        question: 'Bisa melihat grafik penjualan?',
        answer: 'Tentu! Dashboard Pelaris menampilkan grafik penjualan interaktif. Anda bisa melihat tren penjualan, jam ramai, dan perbandingan antar periode.',
      },
    ],
  },
  {
    category: 'Teknis & Troubleshooting',
    items: [
      {
        question: 'Lupa password, bagaimana cara reset?',
        answer: 'Klik "Lupa Kata Sandi" di halaman login. Masukkan email Anda dan kami akan mengirimkan link reset password. Link berlaku selama 1 jam.',
      },
      {
        question: 'Aplikasi error atau tidak bisa dibuka?',
        answer: 'Coba clear cache browser atau reinstall aplikasi Android. Jika masih bermasalah, hubungi tim support kami via WhatsApp atau email.',
      },
      {
        question: 'Bagaimana cara menghubungi support?',
        answer: 'Anda bisa menghubungi kami via WhatsApp di 0812-XXXX-XXXX, email ke support@pelaris.id, atau melalui halaman Kontak di website ini.',
      },
    ],
  },
];

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <span className="font-medium text-slate-900 dark:text-white pr-4">{item.question}</span>
        <ChevronDown
          className={`w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

      {/* Content */}
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Pertanyaan yang Sering Diajukan
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Temukan jawaban untuk pertanyaan umum tentang Pelaris. Tidak menemukan yang Anda cari?{' '}
              <Link href="/contact" className="text-slate-700 dark:text-slate-300 underline hover:no-underline">
                Hubungi kami
              </Link>
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-10">
            {faqData.map((category) => (
              <div key={category.category}>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  {category.category}
                </h2>
                <div className="space-y-3">
                  {category.items.map((item, index) => (
                    <FAQAccordion
                      key={`${category.category}-${index}`}
                      item={item}
                      isOpen={openItems[`${category.category}-${index}`] || false}
                      onToggle={() => toggleItem(`${category.category}-${index}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Masih punya pertanyaan?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Tim support kami siap membantu Anda 24/7
            </p>
            <Link
              href="/contact"
              className="inline-flex px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
