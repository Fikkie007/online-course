'use client';

import { useRouter, usePathname } from 'next/navigation';

interface SortSelectProps {
  currentSort: string;
  search: string;
  category: string;
}

export function SortSelect({ currentSort, search, category }: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const urlParams = new URLSearchParams();
    if (search) urlParams.set('search', search);
    if (category && category !== 'all') urlParams.set('category', category);
    if (e.target.value !== 'newest') urlParams.set('sort', e.target.value);

    const queryString = urlParams.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const sortOptions = [
    { id: 'newest', label: 'Terbaru' },
    { id: 'popular', label: 'Terpopuler' },
    { id: 'rating', label: 'Rating Tertinggi' },
    { id: 'price-low', label: 'Harga Terendah' },
    { id: 'price-high', label: 'Harga Tertinggi' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Urutkan:</span>
      <div className="relative">
        <select
          value={currentSort}
          onChange={handleChange}
          className="appearance-none bg-white border rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
        >
          {sortOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}