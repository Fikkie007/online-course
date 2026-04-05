'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/MultiSelect';

interface Category {
  id: string;
  name: string;
  icon: string;
}

export function CourseForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_ids: [] as string[],
    price: '0',
    discount_price: '',
    duration_hours: '',
    thumbnail_url: '',
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?active=true');
        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          category_ids: formData.category_ids.length > 0 ? formData.category_ids : undefined,
          price: parseFloat(formData.price) || 0,
          discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
          duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : null,
          thumbnail_url: formData.thumbnail_url || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create course');
      }

      // Redirect to edit page
      router.push(`/mentor/courses/${data.data.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Judul Kursus <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          required
          minLength={3}
          maxLength={200}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Masukkan judul kursus"
        />
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Kategori
        </label>
        <MultiSelect
          options={categories}
          value={formData.category_ids}
          onChange={(value) => setFormData({ ...formData, category_ids: value })}
          placeholder="Pilih kategori..."
        />
        <p className="text-xs text-muted-foreground mt-1">Dapat memilih lebih dari satu kategori</p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Deskripsi
        </label>
        <textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Jelaskan tentang kursus ini"
        />
      </div>

      {/* Thumbnail URL */}
      <div>
        <label htmlFor="thumbnail_url" className="block text-sm font-medium mb-2">
          URL Thumbnail
        </label>
        <input
          type="url"
          id="thumbnail_url"
          value={formData.thumbnail_url}
          onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* Price Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium mb-2">
            Harga (Rp)
          </label>
          <input
            type="number"
            id="price"
            min="0"
            step="1000"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="discount_price" className="block text-sm font-medium mb-2">
            Harga Diskon (Rp)
          </label>
          <input
            type="number"
            id="discount_price"
            min="0"
            step="1000"
            value={formData.discount_price}
            onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Kosongkan jika tidak ada"
          />
        </div>
      </div>

      {/* Duration */}
      <div>
        <label htmlFor="duration_hours" className="block text-sm font-medium mb-2">
          Durasi (jam)
        </label>
        <input
          type="number"
          id="duration_hours"
          min="0"
          value={formData.duration_hours}
          onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Estimasi total durasi dalam jam"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : 'Buat Kursus'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}