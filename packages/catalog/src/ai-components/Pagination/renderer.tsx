import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { Button } from "@ui-fired/catalog/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { PaginationDef } from "./def";

export const PaginationRenderer = createAIComponentRenderer({
  def: PaginationDef,
  renderer: ({
    currentPage,
    totalPages,
    showFirstLast = true,
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
            onClick={() => onPageChange?.({ page: 1 })}
          >
            <ChevronsLeft className="size-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage <= 1}
          onClick={() => onPageChange?.({ page: currentPage - 1 })}
        >
          <ChevronLeft className="size-4" />
        </Button>
        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange?.({ page })}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange?.({ page: currentPage + 1 })}
        >
          <ChevronRight className="size-4" />
        </Button>
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange?.({ page: totalPages })}
          >
            <ChevronsRight className="size-4" />
          </Button>
        )}
      </nav>
    );
  },
});
