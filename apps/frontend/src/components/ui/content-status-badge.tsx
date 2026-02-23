'use client';

import { cn } from '@/lib/utils';
import { ContentStatus } from '@/types';
import { useTranslations } from 'next-intl';

interface ContentStatusBadgeProps {
  status: ContentStatus;
  className?: string;
}

export function ContentStatusBadge({ status, className }: ContentStatusBadgeProps) {
  const t = useTranslations();

  const styles: Record<ContentStatus, string> = {
    [ContentStatus.APPROVED]: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    [ContentStatus.PENDING_REVIEW]: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    [ContentStatus.REJECTED]: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    [ContentStatus.DRAFT]: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        styles[status],
        className
      )}
    >
      {t(`contentStatus.${status}`)}
    </span>
  );
}
