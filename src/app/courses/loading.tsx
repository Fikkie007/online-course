export default function CoursesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <div className="h-10 bg-white/20 rounded-lg mb-3 w-48 animate-pulse" />
            <div className="h-6 bg-white/20 rounded-lg mb-6 w-64 animate-pulse" />

            {/* Search Skeleton */}
            <div className="flex gap-2">
              <div className="flex-1 h-12 bg-white/30 rounded-xl animate-pulse" />
              <div className="h-12 w-20 bg-white/30 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category filters skeleton */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 w-24 bg-muted rounded-full animate-pulse" />
          ))}
        </div>

        {/* Results count skeleton */}
        <div className="h-5 bg-muted rounded mb-6 w-48 animate-pulse" />

        {/* Course Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-card border rounded-xl overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <div className="p-4">
                <div className="h-6 bg-muted rounded mb-2 animate-pulse" />
                <div className="h-5 bg-muted rounded mb-3 w-24 animate-pulse" />
                <div className="flex gap-4">
                  <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-12 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}