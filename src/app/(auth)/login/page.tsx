'use client';

import { GoogleSignInButton, LoginForm } from '@/components/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session && status === 'authenticated') {
      // Redirect based on role
      switch (session.user.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'mentor':
          router.push('/mentor');
          break;
        default:
          router.push('/student');
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Masuk</h1>
          <p className="mt-2 text-sm text-gray-600">
            Masuk ke platform kursus online
          </p>
        </div>

        <div className="space-y-6">
          {/* Email/Password Login */}
          <LoginForm />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">atau</span>
            </div>
          </div>

          {/* Google Sign In */}
          <GoogleSignInButton mode="login" />

          <div className="text-center text-sm">
            <span className="text-gray-600">Belum punya akun? </span>
            <a href="/register" className="text-primary hover:underline font-medium">
              Daftar di sini
            </a>
          </div>
        </div>

        <p className="text-xs text-center text-gray-500">
          Dengan masuk, Anda menyetujui{' '}
          <a href="#" className="text-primary hover:underline">Syarat & Ketentuan</a>
          {' '}dan{' '}
          <a href="#" className="text-primary hover:underline">Kebijakan Privasi</a>
        </p>

        {/* reCAPTCHA badge */}
        <p className="text-xs text-center text-gray-400">
          Halaman ini dilindungi oleh reCAPTCHA dan{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Google Privacy Policy
          </a>
          {' '}dan{' '}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
}