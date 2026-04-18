import { Skeleton } from './ui/skeleton';

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top navbar skeleton */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 bg-background/90 px-4 md:px-6">
        <Skeleton className="h-9 w-24 rounded-none" />
        <Skeleton className="h-4 w-28 rounded-none" />
        <Skeleton className="h-9 w-9 rounded-none" />
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-4 space-y-4 md:p-6">
        <Skeleton className="h-12 w-48 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
