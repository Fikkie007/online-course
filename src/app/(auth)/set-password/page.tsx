'use client';

import { SetPasswordForm } from '@/components/auth';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SetPasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Buat Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Buat password untuk login dengan email Anda
          </p>
        </div>

        <SetPasswordForm />

        <p className="text-xs text-center text-gray-500">
          Password ini dapat digunakan sebagai alternatif login Google.
        </p>
      </div>
    </div>
  );
}