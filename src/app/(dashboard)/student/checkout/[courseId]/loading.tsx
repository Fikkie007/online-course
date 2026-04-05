export default function CheckoutLoading() {
  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="h-10 bg-muted rounded-lg mb-6 w-32 animate-pulse" />

        {/* Course info skeleton */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex gap-4">
            <div className="w-24 h-16 bg-muted rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-6 bg-muted rounded mb-2 w-48 animate-pulse" />
              <div className="h-4 bg-muted rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Price breakdown skeleton */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="h-6 bg-muted rounded mb-4 w-48 animate-pulse" />
          <div className="space-y-3">
            <div className="flex justify-between">
              <div className="h-5 bg-muted rounded w-24 animate-pulse" />
              <div className="h-5 bg-muted rounded w-20 animate-pulse" />
            </div>
            <div className="border-t pt-3 flex justify-between">
              <div className="h-6 bg-muted rounded w-16 animate-pulse" />
              <div className="h-6 bg-muted rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Checkout button skeleton */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="h-12 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}