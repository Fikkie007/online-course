export default function HomeLoading() {
  return (
    <main className="min-h-screen">
      {/* Hero Skeleton */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/20 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="h-12 md:h-16 bg-muted rounded-lg mb-6 animate-pulse" />
            <div className="h-6 bg-muted rounded-lg mb-8 max-w-2xl mx-auto animate-pulse" />
            <div className="flex gap-4 justify-center">
              <div className="h-12 w-32 bg-muted rounded-lg animate-pulse" />
              <div className="h-12 w-28 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Skeleton */}
      <section className="py-12 bg-primary/5 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-10 bg-muted rounded mb-2 animate-pulse" />
                <div className="h-5 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Skeleton */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-10 bg-muted rounded-lg mb-4 max-w-md mx-auto animate-pulse" />
            <div className="h-6 bg-muted rounded-lg max-w-2xl mx-auto animate-pulse" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border rounded-lg p-6">
                <div className="w-12 h-12 bg-muted rounded animate-pulse mb-4" />
                <div className="h-6 bg-muted rounded mb-2 animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Skeleton */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="h-10 bg-muted rounded-lg mb-2 w-48 animate-pulse" />
              <div className="h-5 bg-muted rounded-lg w-64 animate-pulse" />
            </div>
            <div className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card border rounded-lg overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <div className="p-4">
                  <div className="h-6 bg-muted rounded mb-2 animate-pulse" />
                  <div className="h-5 bg-muted rounded mb-3 w-32 animate-pulse" />
                  <div className="flex gap-4">
                    <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Skeleton */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="h-10 bg-white/20 rounded-lg mb-4 max-w-md mx-auto animate-pulse" />
          <div className="h-6 bg-white/20 rounded-lg mb-8 max-w-2xl mx-auto animate-pulse" />
          <div className="h-12 w-40 bg-white/30 rounded-lg mx-auto animate-pulse" />
        </div>
      </section>
    </main>
  );
}