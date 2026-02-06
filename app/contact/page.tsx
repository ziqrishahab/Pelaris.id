'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import emailjs from '@emailjs/browser';
import { Sun, Moon, ArrowLeft, Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { EMAILJS_CONFIG } from '@/lib/emailjs.config';

const contactInfo = [
  {
    icon: Mail,
    title: 'Email',
    value: 'ziqrishahab@gmail.com',
    href: 'mailto:ziqrishahab@gmail.com',
  },
  {
    icon: Phone,
    title: 'WhatsApp',
    value: '+62 821-1240-6540',
    href: 'https://wa.me/6282112406540',
  },
  {
    icon: MapPin,
    title: 'Lokasi',
    value: 'Jakarta, Indonesia',
    href: null,
  },
];

export default function ContactPage() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!formRef.current) return;

      const result = await emailjs.sendForm(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        formRef.current,
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      if (result.status === 200) {
        setIsSubmitted(true);
        formRef.current.reset();
      } else {
        throw new Error('Failed to send email');
      }
    } catch (err: any) {
      console.error('EmailJS Error:', err);
      setError('Gagal mengirim pesan. Silakan coba lagi atau hubungi kami via WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Hubungi Kami
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Punya pertanyaan, saran, atau butuh bantuan? Tim kami siap membantu Anda kapan saja.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                Informasi Kontak
              </h2>
              
              <div className="space-y-4 mb-8">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="w-10 h-10 bg-slate-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{info.title}</p>
                      {info.href ? (
                        <a
                          href={info.href}
                          className="text-slate-900 dark:text-white font-medium hover:underline"
                          target={info.href.startsWith('http') ? '_blank' : undefined}
                          rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-slate-900 dark:text-white font-medium">{info.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp CTA */}
              <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">Chat via WhatsApp</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  Dapatkan respon cepat dengan menghubungi kami langsung via WhatsApp.
                </p>
                <a
                  href="https://wa.me/6282112406540"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat Sekarang
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                Kirim Pesan
              </h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Pesan Terkirim!
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Terima kasih! Kami akan merespon pesan Anda dalam 1x24 jam.
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setError('');
                    }}
                    className="text-slate-600 dark:text-slate-400 hover:underline"
                  >
                    Kirim pesan lagi
                  </button>
                </div>
              ) : (
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                  {/* Hidden field for recipient name (used in template) */}
                  <input type="hidden" name="to_name" value="Pelaris Support" />
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      name="from_name"
                      required
                      placeholder="Nama Anda"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      name="from_email"
                      required
                      placeholder="nama@email.com"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Subjek
                    </label>
                    <select
                      name="subject"
                      required
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                    >
                      <option value="">Pilih subjek</option>
                      <option value="Pertanyaan Umum">Pertanyaan Umum</option>
                      <option value="Bantuan Teknis">Bantuan Teknis</option>
                      <option value="Saran & Masukan">Saran & Masukan</option>
                      <option value="Kerjasama">Kerjasama</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Pesan
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      placeholder="Tulis pesan Anda di sini..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-600/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Kirim Pesan
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
