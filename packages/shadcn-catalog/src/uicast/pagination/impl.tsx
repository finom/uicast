import { createComponentImplementation } from "@uicast/react";
import { Button } from "../../components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { PaginationDef } from "./def";

export const PaginationImpl = createComponentImplementation({
  def: PaginationDef,
  render: ({
    currentPage,
    totalPages,
    showFirstLast,
    onPageChange,
    generatedKey,
  }) => {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <nav
        className="flex items-center gap-1"
        aria-label="Pagination"
        data-key={generatedKey}
      >
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage <= 1}
            onClick={() => onPageChange({ page: 1 })}
          >
            <ChevronsLeft className="size-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage <= 1}
          onClick={() => onPageChange({ page: currentPage - 1 })}
        >
          <ChevronLeft className="size-4" />
        </Button>
        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange({ page })}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange({ page: currentPage + 1 })}
        >
          <ChevronRight className="size-4" />
        </Button>
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange({ page: totalPages })}
          >
            <ChevronsRight className="size-4" />
          </Button>
        )}
      </nav>
    );
  },
});
