'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
}

interface SendNotificationFormProps {
  users: User[];
}

export default function SendNotificationForm({ users }: SendNotificationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    userId: '',
    title: '',
    message: '',
    type: 'in_app',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: {
        title: string;
        message: string;
        type: string;
        userId?: string;
      } = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
      };

      // If specific user selected
      if (formData.userId && formData.userId !== 'all') {
        payload.userId = formData.userId;
      }

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notification');
      }

      setSuccess(`Notifikasi berhasil dikirim ke ${data.data?.count || 1} user`);
      setFormData({ userId: '', title: '', message: '', type: 'in_app' });

      // Refresh page to show new notification
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Recipient */}
      <div>
        <label htmlFor="userId" className="block text-sm font-medium mb-2">
          Penerima
        </label>
        <select
          id="userId"
          value={formData.userId}
          onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          required
        >
          <option value="">Pilih penerima</option>
          <option value="all">Semua User</option>
          <optgroup label="Pilih User Spesifik">
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email} ({user.role})
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium mb-2">
          Tipe Notifikasi
        </label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="in_app">In-App</option>
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Judul <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Judul notifikasi"
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">
          Pesan <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          required
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Isi pesan notifikasi"
        />
      </div>

      {/* Actions */}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Mengirim...' : 'Kirim Notifikasi'}
      </Button>
    </form>
  );
}