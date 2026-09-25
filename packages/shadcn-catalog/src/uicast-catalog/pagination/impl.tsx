import { createComponentImplementation } from "@uicast/react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, type LucideIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { PaginationDef } from "./def";

const PAGE_WINDOW = 5;

function visiblePages(current: number, total: number): number[] {
  const start = Math.max(1, Math.min(current - Math.floor(PAGE_WINDOW / 2), total - PAGE_WINDOW + 1));
  return Array.from({ length: Math.min(PAGE_WINDOW, total) }, (_, i) => start + i);
}

const ELLIPSIS = <span className="px-1 text-muted-foreground">…</span>;

export const PaginationImpl = createComponentImplementation({
  def: PaginationDef,
  render: ({ currentPage, totalPages, hasNext, showFirstLast, onPageChange }, { entry }) => {
    // Without a page count, the pages behind the current one are still known.
    const pages = visiblePages(currentPage, totalPages ?? currentPage);
    const atStart = currentPage <= 1;
    const atEnd = totalPages === undefined ? !hasNext : currentPage >= totalPages;
    const moreAfter = totalPages === undefined ? hasNext : pages[pages.length - 1] < totalPages;
    const arrow = (Icon: LucideIcon, page: number, disabled: boolean) => (
      <Button variant="outline" size="icon" disabled={disabled} onClick={() => onPageChange({ page })}>
        <Icon className="size-4" />
      </Button>
    );

    return (
      <nav className="flex items-center gap-1" aria-label="Pagination" data-key={entry.key}>
        {showFirstLast && arrow(ChevronsLeft, 1, atStart)}
        {arrow(ChevronLeft, currentPage - 1, atStart)}
        {pages[0] > 1 && ELLIPSIS}
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
        {moreAfter && ELLIPSIS}
        {arrow(ChevronRight, currentPage + 1, atEnd)}
        {showFirstLast && totalPages !== undefined && arrow(ChevronsRight, totalPages, atEnd)}
      </nav>
    );
  },
});
