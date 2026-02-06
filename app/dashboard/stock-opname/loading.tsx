import { SkeletonStatCard, SkeletonTable, SkeletonPageHeader, Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="px-4 md:px-6 space-y-6">
      {/* Header */}
      <SkeletonPageHeader />
      
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      
      {/* Product List */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-48" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
            <SkeletonTable rows={3} columns={5} />
          </div>
        ))}
      </div>
    </div>
  );
}
