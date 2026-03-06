import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /**
   * Maximum number of page buttons to show before using ellipsis
   * @default 7
   */
  maxVisibleButtons?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisibleButtons = 7,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Generate page numbers to show
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const halfVisible = Math.floor(maxVisibleButtons / 2);

    // Always show first page
    pages.push(1);

    let startPage = Math.max(2, currentPage - halfVisible);
    let endPage = Math.min(totalPages - 1, currentPage + halfVisible);

    // Adjust if near the start
    if (currentPage <= halfVisible + 2) {
      endPage = Math.min(totalPages - 1, maxVisibleButtons - 1);
    }

    // Adjust if near the end
    if (currentPage >= totalPages - halfVisible - 1) {
      startPage = Math.max(2, totalPages - maxVisibleButtons + 2);
    }

    // Add left ellipsis if needed
    if (startPage > 2) {
      pages.push('...');
    }

    // Add page numbers between
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add right ellipsis if needed
    if (endPage < totalPages - 1) {
      pages.push('...');
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {/* Previous button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      {/* Page numbers */}
      {pageNumbers.map((page, idx) =>
        typeof page === 'number' ? (
          <Button
            key={idx}
            variant={page === currentPage ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(page)}
            className={
              page === currentPage
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                : ''
            }
          >
            {page}
          </Button>
        ) : (
          <span key={idx} className="px-2 text-slate-400">
            {page}
          </span>
        )
      )}

      {/* Next button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="gap-1"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
