'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentSyncButtonProps {
  orderId: string;
}

export function PaymentSyncButton({ orderId }: PaymentSyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payments/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });

      const data = await response.json();

      if (data.success && data.data.is_enrolled) {
        alert('Pembayaran berhasil dikonfirmasi!');
        window.location.reload();
      } else if (data.success) {
        alert(`Status pembayaran: ${data.data.status}`);
      } else {
        alert(data.error || 'Gagal memverifikasi pembayaran');
      }
    } catch (error) {
      alert('Gagal memverifikasi pembayaran');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isLoading}
      className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isLoading && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {isLoading ? 'Memverifikasi...' : 'Verifikasi Pembayaran'}
    </button>
  );
}