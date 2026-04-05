export default function AdminUsersLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="h-10 bg-muted rounded-lg mb-8 w-48 animate-pulse" />

        {/* Filters skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 bg-muted rounded w-20 animate-pulse" />
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></th>
                <th className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></th>
                <th className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></th>
                <th className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></th>
                <th className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                      <div className="h-5 bg-muted rounded w-24 animate-pulse" />
                    </div>
                  </td>
                  <td className="px-4 py-3"><div className="h-5 bg-muted rounded w-40 animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-6 bg-muted rounded w-16 animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-6 bg-muted rounded w-16 animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-9 bg-muted rounded w-32 animate-pulse" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}