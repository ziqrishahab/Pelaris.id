'use client';

import Link from 'next/link';
import { Store, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function PrivacyPage() {
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

      {/* Content */}
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-12">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Kebijakan Privasi
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Terakhir diperbarui: 1 Februari 2026
            </p>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  1. Informasi yang Kami Kumpulkan
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  Kami mengumpulkan informasi yang Anda berikan secara langsung, termasuk:
                </p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                  <li><strong>Data Akun:</strong> Nama, email, nama bisnis, dan password terenkripsi</li>
                  <li><strong>Data Transaksi:</strong> Riwayat penjualan, produk, dan pembayaran</li>
                  <li><strong>Data Inventori:</strong> Informasi produk, stok, dan kategori</li>
                  <li><strong>Data Penggunaan:</strong> Log aktivitas dan preferensi penggunaan</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  2. Bagaimana Kami Menggunakan Informasi
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  Informasi yang kami kumpulkan digunakan untuk:
                </p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                  <li>Menyediakan, mengoperasikan, dan memelihara layanan Pelaris</li>
                  <li>Memproses transaksi dan mengirim notifikasi terkait</li>
                  <li>Meningkatkan dan mengembangkan fitur baru</li>
                  <li>Memberikan dukungan pelanggan</li>
                  <li>Mengirim komunikasi penting tentang layanan</li>
                  <li>Mendeteksi dan mencegah aktivitas penipuan</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  3. Keamanan Data
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk 
                  melindungi data Anda, termasuk enkripsi data dalam transit dan saat disimpan, 
                  kontrol akses yang ketat, dan audit keamanan berkala. Namun, tidak ada metode 
                  transmisi internet yang 100% aman, dan kami tidak dapat menjamin keamanan mutlak.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  4. Berbagi Informasi
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  Kami <strong>tidak menjual</strong> data pribadi Anda. Kami hanya membagikan informasi dalam 
                  situasi berikut:
                </p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                  <li>Dengan persetujuan eksplisit Anda</li>
                  <li>Untuk mematuhi kewajiban hukum</li>
                  <li>Dengan penyedia layanan yang membantu operasional kami (dengan perjanjian kerahasiaan)</li>
                  <li>Dalam situasi darurat untuk melindungi hak dan keselamatan</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  5. Penyimpanan Data
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Data Anda disimpan di server yang aman di Indonesia. Kami menyimpan data selama 
                  akun Anda aktif atau selama diperlukan untuk menyediakan layanan. Setelah akun 
                  dihapus, kami akan menghapus data Anda dalam waktu 30 hari, kecuali ada kewajiban 
                  hukum untuk menyimpan lebih lama.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  6. Hak Anda
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  Anda memiliki hak untuk:
                </p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                  <li><strong>Mengakses:</strong> Meminta salinan data pribadi Anda</li>
                  <li><strong>Memperbaiki:</strong> Memperbarui informasi yang tidak akurat</li>
                  <li><strong>Menghapus:</strong> Meminta penghapusan data Anda</li>
                  <li><strong>Mengekspor:</strong> Mengunduh data Anda dalam format yang dapat dibaca</li>
                  <li><strong>Menolak:</strong> Menolak penggunaan data untuk tujuan tertentu</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  7. Cookie dan Teknologi Pelacakan
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Kami menggunakan cookie dan teknologi serupa untuk menjaga sesi login Anda, 
                  mengingat preferensi, dan meningkatkan pengalaman pengguna. Anda dapat mengontrol 
                  cookie melalui pengaturan browser Anda, namun beberapa fitur mungkin tidak berfungsi 
                  dengan baik tanpa cookie.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  8. Perubahan Kebijakan
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan 
                  signifikan akan diberitahukan melalui email atau notifikasi di aplikasi. 
                  Tanggal "Terakhir diperbarui" di bagian atas menunjukkan kapan terakhir 
                  kebijakan ini direvisi.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  9. Hubungi Kami
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini atau ingin menggunakan 
                  hak Anda terkait data pribadi, silakan hubungi kami di{' '}
                  <a href="mailto:privacy@pelaris.id" className="text-slate-700 dark:text-slate-300 underline hover:no-underline">
                    privacy@pelaris.id
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
