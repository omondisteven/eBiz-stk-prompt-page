// src/components/ui/Badge.tsx
import { cn } from '@/lib/utils';

interface BadgeProps {
  status: 'Success' | 'Failed' | 'Cancelled' | 'Pending';
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  const statusColors = {
    Success: 'bg-green-100 text-green-800',
    Failed: 'bg-red-100 text-red-800',
    Cancelled: 'bg-yellow-100 text-yellow-800',
    Pending: 'bg-blue-100 text-blue-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusColors[status],
        className
      )}
    >
      {status}
    </span>
  );
}