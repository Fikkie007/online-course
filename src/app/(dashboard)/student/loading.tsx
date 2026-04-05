export default function StudentLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      {/* Header skeleton */}
      <div className="h-10 bg-muted rounded-lg mb-2 w-64 animate-pulse" />
      <div className="h-6 bg-muted rounded-lg mb-8 w-48 animate-pulse" />

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6">
            <div className="w-12 h-12 bg-muted rounded-lg mb-3 animate-pulse" />
            <div className="h-8 bg-muted rounded mb-2 w-16 animate-pulse" />
            <div className="h-4 bg-muted rounded w-24 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Course cards skeleton */}
      <div className="h-8 bg-muted rounded-lg mb-4 w-48 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="h-32 bg-muted animate-pulse" />
            <div className="p-4">
              <div className="h-6 bg-muted rounded mb-3 animate-pulse" />
              <div className="h-2 bg-muted rounded-full mb-4 animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}