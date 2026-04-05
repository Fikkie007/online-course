'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess: (result: any) => void;
          onPending: (result: any) => void;
          onError: (result: any) => void;
          onClose: () => void;
        }
      ) => void;
    };
  }
}

interface CheckoutButtonProps {
  courseId: string;
  isFree?: boolean;
  clientKey: string;
  snapUrl: string;
}

export function CheckoutButton({ courseId, isFree, clientKey, snapUrl }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const router = useRouter();

  // Load Snap.js dynamically
  useEffect(() => {
    if (isFree) return;

    const loadSnap = async () => {
      // Check if already loaded
      if (window.snap) {
        setSnapLoaded(true);
        return;
      }

      // Create new script
      const script = document.createElement('script');
      script.src = snapUrl;
      script.setAttribute('data-client-key', clientKey);
      script.async = true;

      script.onload = () => {
        setSnapLoaded(true);
      };

      script.onerror = () => {
        setError('Gagal memuat payment gateway. Refresh halaman.');
      };

      document.head.appendChild(script);
    };

    loadSnap();
  }, [isFree, clientKey, snapUrl]);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment');
      }

      if (data.data.isFree) {
        router.push('/student/courses?enrolled=success');
        router.refresh();
        return;
      }

      const orderId = data.data.order_id;

      // Ensure snap is loaded
      if (!window.snap) {
        throw new Error('Payment gateway belum siap. Refresh halaman dan coba lagi.');
      }

      // Open Midtrans Snap popup
      window.snap.pay(data.data.snap_token, {
        onSuccess: (result) => {
          console.log('Payment success:', result);
          // Redirect with order_id for sync
          router.push(`/student/courses?payment=success&order_id=${orderId}`);
          router.refresh();
        },
        onPending: (result) => {
          console.log('Payment pending:', result);
          // Redirect with order_id for sync
          router.push(`/student/courses?payment=pending&order_id=${orderId}`);
          router.refresh();
        },
        onError: (result) => {
          console.error('Payment error:', result);
          setError('Pembayaran gagal. Silakan coba lagi.');
          setIsLoading(false);
        },
        onClose: () => {
          // User closed the popup without completing payment
          setIsLoading(false);
        },
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process payment');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={handlePayment}
        disabled={isLoading || (!isFree && !snapLoaded)}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Memproses...
          </span>
        ) : (
          isFree ? 'Daftar Gratis' : 'Bayar Sekarang'
        )}
      </Button>

      {!isFree && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">
            Metode pembayaran tersedia:
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 bg-gray-100 rounded">QRIS</span>
            <span className="px-2 py-1 bg-gray-100 rounded">Transfer Bank</span>
            <span className="px-2 py-1 bg-gray-100 rounded">E-Wallet</span>
            <span className="px-2 py-1 bg-gray-100 rounded">Kartu Kredit</span>
          </div>
        </div>
      )}
    </div>
  );
}