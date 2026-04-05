'use client';

import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth';
import Link from 'next/link';

function ResetPasswordContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Buat password baru untuk akun Anda
          </p>
        </div>

        <ResetPasswordForm />

        <div className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline font-medium">
            Kembali ke Login
          </Link>
        </div>

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}