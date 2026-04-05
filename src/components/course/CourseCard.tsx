'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Category } from '@/types';

// Minimal type for CourseCard - only fields that are actually used
interface CourseCardProps {
  course: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    thumbnail_url?: string | null;
    price: number;
    discount_price?: number | null;
    total_students: number;
    rating?: number | null;
    duration_hours?: number | null;
    mentor?: {
      id: string;
      full_name: string | null;
      avatar_url?: string | null;
    };
    categories?: Category[];
  };
}

export function CourseCard({ course }: CourseCardProps) {
  const router = useRouter();
  const hasDiscount = course.discount_price && course.discount_price < course.price;
  const displayPrice = hasDiscount ? course.discount_price : course.price;
  const isFree = displayPrice === 0;

  const handleCategoryClick = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/courses?category=${slug}`);
  };

  return (
    <Link href={`/courses/${course.slug}`} className="group">
      <div className="bg-card rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group-hover:border-primary/30 h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted flex-shrink-0">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {isFree && (
              <div className="bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                Gratis
              </div>
            )}
            {hasDiscount && !isFree && (
              <div className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                Diskon
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Categories */}
          {course.categories && course.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {course.categories.slice(0, 2).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={(e) => handleCategoryClick(e, cat.slug)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  <span>{cat.name}</span>
                </button>
              ))}
              {course.categories.length > 2 && (
                <span className="text-xs text-muted-foreground">+{course.categories.length - 2}</span>
              )}
            </div>
          )}

          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {course.title}
          </h3>

          {/* Mentor */}
          {course.mentor && (
            <div className="flex items-center gap-2 mb-3">
              {course.mentor.avatar_url ? (
                <Image
                  src={course.mentor.avatar_url}
                  alt={course.mentor.full_name || 'Mentor'}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">
                  {course.mentor.full_name?.charAt(0) || 'M'}
                </div>
              )}
              <span className="text-sm text-muted-foreground truncate">
                {course.mentor.full_name || 'Mentor'}
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              {course.total_students}
            </div>

            {course.rating && (
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {course.rating.toFixed(1)}
              </div>
            )}

            {course.duration_hours && (
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {course.duration_hours} jam
              </div>
            )}
          </div>

          {/* Price */}
          <div className="mt-auto pt-3 border-t">
            <div className="flex items-center gap-2">
              {isFree ? (
                <span className="text-green-600 font-bold">Gratis</span>
              ) : (
                <>
                  <span className="font-bold">
                    Rp {displayPrice?.toLocaleString('id-ID')}
                  </span>
                  {hasDiscount && (
                    <span className="text-muted-foreground text-xs line-through">
                      Rp {course.price.toLocaleString('id-ID')}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}