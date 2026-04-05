import { cn, statusColor, statusDot, statusLabel, type StatusType } from '@/lib/utils';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
        statusColor(status),
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', statusDot(status))} />
      {statusLabel(status)}
    </span>
  );
}
