export default function DashboardSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="skeleton h-7 w-32" />
          <div className="skeleton mt-2 h-4 w-48" />
        </div>
        <div className="flex items-center gap-3">
          <div className="skeleton h-9 w-52 rounded-lg" />
          <div className="skeleton h-9 w-40 rounded-lg" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="skeleton h-3 w-20 mb-3" />
          <div className="skeleton h-8 w-28" />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="skeleton h-3 w-16 mb-3" />
          <div className="skeleton h-8 w-24" />
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="skeleton h-4 w-40 mb-2" />
        <div className="skeleton h-3 w-32 mb-4" />
        <div className="skeleton h-72 w-full rounded-lg" />
      </div>

      {/* Recent Changes */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="skeleton h-4 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton h-5 w-5 rounded" />
              <div className="skeleton h-5 w-14 rounded" />
              <div className="skeleton h-5 w-10 rounded" />
              <div className="skeleton h-4 flex-1 rounded" />
              <div className="skeleton h-4 w-12 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
