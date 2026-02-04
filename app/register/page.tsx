'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Mail, Lock, User, Building2, Eye, EyeOff, Check, X, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    storeName: '',
    email: '',
    password: '',
  });

  // Password validation
  const hasMinLength = formData.password.length >= 8;
  const hasLowercase = /[a-z]/.test(formData.password);
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const isPasswordValid = hasMinLength && hasLowercase && hasUppercase && hasNumber;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      setError('Password harus minimal 8 karakter, huruf besar, huruf kecil, dan angka');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', {
        ...formData,
        branchName: 'Cabang Utama',
      });

      const data = response.data;
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.csrfToken) {
          localStorage.setItem('csrfToken', data.csrfToken);
        }
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mendaftar');
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Form Card */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Mulai Bisnis Anda Gratis
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Bergabung dengan ribuan UMKM lainnya di Indonesia
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Cth. Budi Santoso"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Nama Bisnis */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nama Bisnis
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    placeholder="Cth. Kopi Kenangan Budi"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Alamat Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nama@email.com"
                    required
                    autoComplete="email"
                    className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  />
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimal 8 karakter"
                    required
                    autoComplete="new-password"
                    className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Requirements */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  <div className={`flex items-center gap-1.5 text-xs ${hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                    {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>8+ Karakter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                    {hasLowercase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>Huruf Kecil</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                    {hasUppercase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>Huruf Besar</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${hasNumber ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                    {hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>Angka</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="w-full py-3.5 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-600/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Daftar Gratis
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-900 text-slate-500">
                  Atau daftar dengan
                </span>
              </div>
            </div>

            {/* Google Button */}
            <button
              type="button"
              disabled
              className="w-full py-3 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>

            {/* Terms */}
            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Dengan mendaftar, Anda menyetujui{' '}
              <Link href="/terms" className="text-slate-600 dark:text-slate-300 hover:underline">
                Syarat & Ketentuan
              </Link>{' '}
              dan{' '}
              <Link href="/privacy" className="text-slate-600 dark:text-slate-300 hover:underline">
                Kebijakan Privasi
              </Link>{' '}
              kami.
            </p>
          </div>

          {/* Login Link */}
          <p className="mt-8 text-center text-slate-600 dark:text-slate-400">
            Sudah punya akun Pelaris?{' '}
            <Link href="/login" className="text-slate-600 dark:text-slate-300 font-medium hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
