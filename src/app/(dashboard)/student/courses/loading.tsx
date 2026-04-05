export default function StudentCoursesLoading() {
  return (
    <div className="p-6 lg:p-8">
      <div className="h-10 bg-muted rounded-lg mb-8 w-48 animate-pulse" />

      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-muted rounded w-24 animate-pulse" />
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden border">
            <div className="h-32 bg-muted animate-pulse" />
            <div className="p-4">
              <div className="h-6 bg-muted rounded mb-2 animate-pulse" />
              <div className="h-4 bg-muted rounded mb-3 w-24 animate-pulse" />
              <div className="h-2 bg-muted rounded-full mb-4 animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}