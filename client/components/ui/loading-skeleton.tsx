import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className='space-y-3'>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className='flex space-x-4'>
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className='h-4 flex-1' />
          ))}
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className='rounded-lg border bg-card p-6 shadow-sm'>
      <div className='space-y-3'>
        <Skeleton className='h-4 w-[250px]' />
        <Skeleton className='h-4 w-[200px]' />
        <Skeleton className='h-4 w-[150px]' />
      </div>
    </div>
  );
}

export { Skeleton, TableSkeleton, CardSkeleton };
