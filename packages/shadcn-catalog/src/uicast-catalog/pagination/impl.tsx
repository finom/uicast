import { createComponentImplementation } from "@uicast/react";
import { Button } from "../../components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { PaginationDef } from "./def";

// Up to five page numbers around the current one.
function visiblePages(current: number, total: number): number[] {
  const start = Math.max(1, Math.min(current - 2, total - 4));
  return Array.from({ length: Math.min(5, total) }, (_, i) => start + i);
}

export const PaginationImpl = createComponentImplementation({
  def: PaginationDef,
  render: ({
    currentPage,
    totalPages,
    hasNext,
    showFirstLast,
    onPageChange,
  }, { entry }) => {
    // Without a page count, the pages behind the current one are still known.
    const pages = visiblePages(currentPage, totalPages ?? currentPage);
    const atEnd = totalPages === undefined ? !hasNext : currentPage >= totalPages;
    const last = pages[pages.length - 1] ?? currentPage;
    const moreAfter = totalPages === undefined ? hasNext : last < totalPages;
    const ellipsis = <span className="px-1 text-muted-foreground">…</span>;

    return (
      <nav
        className="flex items-center gap-1"
        aria-label="Pagination"
        data-key={entry.key}
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
        {pages[0] > 1 && ellipsis}
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
        {moreAfter && ellipsis}
        <Button
          variant="outline"
          size="icon"
          disabled={atEnd}
          onClick={() => onPageChange({ page: currentPage + 1 })}
        >
          <ChevronRight className="size-4" />
        </Button>
        {showFirstLast && totalPages !== undefined && (
          <Button
            variant="outline"
            size="icon"
            disabled={atEnd}
            onClick={() => onPageChange({ page: totalPages })}
          >
            <ChevronsRight className="size-4" />
          </Button>
        )}
      </nav>
    );
  },
});
