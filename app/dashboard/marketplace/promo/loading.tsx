import { SkeletonPageHeader, SkeletonButton, Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="px-4 md:px-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <SkeletonPageHeader />
        <SkeletonButton className="w-36" />
      </div>
      
      {/* Promo List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <Skeleton className="h-32 w-full rounded-lg mb-4" />
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <div className="flex justify-between items-center mt-4">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
