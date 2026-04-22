import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className
}) => {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={cn("flex items-center justify-between px-4 py-8 mt-auto", className)}>
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-slate-200 dark:border-slate-800 text-sm rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 disabled:opacity-50 transition-all font-bold"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-200 dark:border-slate-800 text-sm rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 disabled:opacity-50 transition-all font-bold"
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-center">
        <nav className="relative z-0 inline-flex items-center gap-2" aria-label="Pagination">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
          >
            <span className="sr-only">Previous</span>
            <ChevronLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
            {getPages().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-slate-400">
                    ...
                  </span>
                ) : (
                  <button
                    onClick={() => onPageChange(page as number)}
                    className={cn(
                      "relative inline-flex items-center px-4 py-2.5 rounded-2xl text-sm font-black transition-all",
                      currentPage === page
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                        : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white"
                    )}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
          >
            <span className="sr-only">Next</span>
            <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  );
};
