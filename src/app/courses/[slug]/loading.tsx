export default function CourseDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section Skeleton */}
      <div className="bg-primary py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left - Course Info Skeleton */}
            <div className="flex-1">
              <div className="h-10 lg:h-12 bg-white/20 rounded-lg mb-4 animate-pulse" />
              <div className="h-6 bg-white/20 rounded-lg mb-6 animate-pulse" />

              {/* Stats Skeleton */}
              <div className="flex flex-wrap gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-5 bg-white/20 rounded-lg w-24 animate-pulse" />
                ))}
              </div>

              {/* Mentor Skeleton */}
              <div className="mt-6 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 animate-pulse" />
                <div>
                  <div className="h-5 bg-white/20 rounded mb-1 w-24 animate-pulse" />
                  <div className="h-4 bg-white/20 rounded w-16 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Right - Price Card Skeleton */}
            <div className="lg:w-80">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="h-10 bg-muted rounded mb-4 animate-pulse" />
                <div className="h-12 bg-muted rounded mb-6 animate-pulse" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-5 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section Skeleton */}
      <div className="container mx-auto px-4 py-12">
        {/* Tabs Skeleton */}
        <div className="flex gap-4 border-b mb-8">
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
        </div>

        {/* Curriculum Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-6 bg-muted rounded mb-4 w-48 animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-5 bg-muted rounded w-full animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}