'use client';

import { useState } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
  course_count: number;
}

interface CategoriesListProps {
  categories: Category[];
}

export function CategoriesList({ categories: initialCategories }: CategoriesListProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    icon: '',
    description: '',
    order_index: 0,
    is_active: true,
  });

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      icon: category.icon,
      description: category.description || '',
      order_index: category.order_index,
      is_active: category.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', icon: '', description: '', order_index: 0, is_active: true });
  };

  const saveEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(categories.map((c) =>
          c.id === id ? { ...c, ...data.data } : c
        ));
        setEditingId(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update category');
      }
    } catch (error) {
      alert('Failed to update category');
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"? Kursus terkait akan kehilangan kategorinya.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCategories(categories.filter((c) => c.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete category');
      }
    } catch (error) {
      alert('Failed to delete category');
    }
  };

  return (
    <div className="divide-y">
      {categories.map((category) => (
        <div key={category.id} className="p-4 hover:bg-gray-50">
          {editingId === category.id ? (
            // Edit Mode
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
              <input
                type="text"
                value={editForm.icon}
                onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                placeholder="Icon"
                maxLength={4}
                className="px-2 py-1 border rounded text-center text-xl w-16"
              />
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nama"
                className="px-2 py-1 border rounded md:col-span-2"
              />
              <input
                type="text"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Deskripsi"
                className="px-2 py-1 border rounded"
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="rounded"
                  />
                  Aktif
                </label>
                <input
                  type="number"
                  value={editForm.order_index}
                  onChange={(e) => setEditForm({ ...editForm, order_index: parseInt(e.target.value) || 0 })}
                  placeholder="Urutan"
                  className="w-16 px-2 py-1 border rounded text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => saveEdit(category.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Simpan
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{category.name}</h3>
                    {!category.is_active && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {category.course_count} kursus
                </span>
                <span className="text-sm text-muted-foreground">
                  Urutan: {category.order_index}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(category)}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id, category.name)}
                    className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}