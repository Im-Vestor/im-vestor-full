import { MapPin } from 'lucide-react';
import { Skeleton } from '~/components/ui/skeleton';

export const SkeletonProfile = () => {
  return (
    <div className={`rounded-lg border border-white/10 pb-20 bg-card`}>
      <Skeleton className="h-48 w-full rounded-t-lg" />

      <div className="absolute bottom-0 left-12 translate-y-1/2">
        <Skeleton className="h-24 w-24 rounded-full ring-4 ring-[#1E202A]" />
      </div>

      <div className="md:px-12 px-6 pt-16">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="mt-3 h-6 w-64" />
        <div className="mt-1 flex items-center gap-1">
          <MapPin className="mr-0.5 h-4 w-4 text-gray-600" />
          <Skeleton className="h-5 w-40" />
        </div>

        <Skeleton className="my-4 sm:my-6 h-px w-full" />

        <Skeleton className="mt-12 h-6 w-24" />
        <Skeleton className="mt-3 h-5 w-full" />
        <Skeleton className="mt-2 h-5 w-5/6" />
        <Skeleton className="mt-2 h-5 w-3/4" />

        <Skeleton className="my-4 sm:my-6 h-px w-full" />

        <Skeleton className="mt-12 h-6 w-20" />
        <div className="mt-4 rounded-xl border-2 border-white/10 bg-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-0">
            <div className="flex gap-4 sm:gap-6">
              <Skeleton className="h-16 w-16 sm:h-[72px] sm:w-[72px] flex-shrink-0 rounded-lg" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
            <div className="flex sm:flex-col gap-2 sm:items-end">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
          <Skeleton className="my-4 sm:my-6 h-px w-full" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex space-x-1 sm:space-x-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          </div>
        </div>
        <Skeleton className="mt-4 h-10 w-full md:w-1/3" />
      </div>
    </div>
  );
};