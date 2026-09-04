import { useRef, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import { cn } from "../../lib/utils";
import { type KanbanCard, type KanbanColumn, KanbanBoardDef } from "./def";
import { CHART_COLORS } from "../../lib/chart-colors";


// The column an item id belongs to — the id may be a card's or a column's own
// (dropping onto an empty column targets the column itself).
const findColumnId = (
  columns: KanbanColumn[],
  itemId: string,
): string | undefined =>
  columns.find((c) => c.id === itemId)?.id ??
  columns.find((c) => c.cards.some((card) => card.id === itemId))?.id;

const CardView = ({
  card,
  onClick,
}: {
  card: KanbanCard;
  onClick?: () => void;
}) => (
  <Card className="hover:shadow-md transition-shadow" onClick={onClick}>
    <CardHeader className="p-3 pb-1">
      <CardTitle className="text-sm">{card.title}</CardTitle>
    </CardHeader>
    {(card.description || card.tag) && (
      <CardContent className="p-3 pt-0">
        {card.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {card.description}
          </p>
        )}
        {card.tag && (
          <Badge
            variant="outline"
            className="mt-2 text-xs"
            style={
              card.tagColor
                ? {
                    backgroundColor: CHART_COLORS[card.tagColor],
                    color: "#fff",
                    borderColor: CHART_COLORS[card.tagColor],
                  }
                : undefined
            }
          >
            {card.tag}
          </Badge>
        )}
      </CardContent>
    )}
  </Card>
);

const SortableCard = ({
  card,
  columnId,
  onCardClick,
}: {
  card: KanbanCard;
  columnId: string;
  onCardClick?: (evt: { cardId: string; columnId: string }) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <CardView
        card={card}
        onClick={() => onCardClick?.({ cardId: card.id, columnId })}
      />
    </div>
  );
};

const BoardColumn = ({
  column,
  onCardClick,
}: {
  column: KanbanColumn;
  onCardClick?: (evt: { cardId: string; columnId: string }) => void;
}) => {
  // The cards container is droppable under the column's own id, so a card can
  // be dropped into a column with no cards to land on.
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/50">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">{column.title}</h3>
        <Badge variant="secondary" className="text-xs">
          {column.cards.length}
        </Badge>
      </div>
      <SortableContext
        items={column.cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <ScrollArea className="flex-1 p-2">
          <div ref={setNodeRef} className="space-y-2 min-h-8">
            {column.cards.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                columnId={column.id}
                onCardClick={onCardClick}
              />
            ))}
          </div>
        </ScrollArea>
      </SortableContext>
    </div>
  );
};

export const KanbanBoardImpl = createComponentImplementation({
  def: KanbanBoardDef,
  render: ({ columns = [], onCardClick, onCardMove}, { entry }) => {
    // Optimistic local mirror of the `columns` prop. Props re-evaluate with a
    // fresh identity every render, so the mirror resyncs by CONTENT — when the
    // document writes `evt.columns` back (the documented binding), the incoming
    // content matches the local state and nothing moves.
    const propsKey = JSON.stringify(columns);
    const [board, setBoard] = useState<KanbanColumn[]>(columns);
    const lastPropsKey = useRef(propsKey);
    if (lastPropsKey.current !== propsKey) {
      lastPropsKey.current = propsKey;
      setBoard(columns);
    }

    const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
    // Where the active card started, to skip the callback on a no-op drop.
    const dragOrigin = useRef<{ columnId: string; index: number } | null>(null);

    const sensors = useSensors(
      // The distance threshold keeps plain clicks flowing to onCardClick.
      useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragStart = ({ active }: DragStartEvent) => {
      const columnId = findColumnId(board, String(active.id));
      const column = board.find((c) => c.id === columnId);
      const card = column?.cards.find((c) => c.id === active.id) ?? null;
      setActiveCard(card);
      dragOrigin.current = column
        ? {
            columnId: column.id,
            index: column.cards.findIndex((c) => c.id === active.id),
          }
        : null;
    };

    // Cross-column moves happen live while hovering; within-column order is
    // settled on drop.
    const handleDragOver = ({ active, over }: DragOverEvent) => {
      if (!over) return;
      const activeId = String(active.id);
      const overId = String(over.id);
      setBoard((prev) => {
        const fromId = findColumnId(prev, activeId);
        const toId = findColumnId(prev, overId);
        if (!fromId || !toId || fromId === toId) return prev;
        const fromColumn = prev.find((c) => c.id === fromId);
        const toColumn = prev.find((c) => c.id === toId);
        const card = fromColumn?.cards.find((c) => c.id === activeId);
        if (!card || !toColumn) return prev;
        const overIndex = toColumn.cards.findIndex((c) => c.id === overId);
        const insertAt = overIndex >= 0 ? overIndex : toColumn.cards.length;
        return prev.map((c) => {
          if (c.id === fromId)
            return { ...c, cards: c.cards.filter((k) => k.id !== activeId) };
          if (c.id === toId)
            return {
              ...c,
              cards: [
                ...c.cards.slice(0, insertAt),
                card,
                ...c.cards.slice(insertAt),
              ],
            };
          return c;
        });
      });
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
      setActiveCard(null);
      const activeId = String(active.id);

      let next = board;
      const columnId = findColumnId(board, activeId);
      const overColumnId = over ? findColumnId(board, String(over.id)) : undefined;
      if (columnId && overColumnId === columnId && over && activeId !== over.id) {
        const column = board.find((c) => c.id === columnId);
        const oldIndex = column?.cards.findIndex((c) => c.id === activeId) ?? -1;
        const newIndex = column?.cards.findIndex((c) => c.id === String(over.id)) ?? -1;
        if (oldIndex >= 0 && newIndex >= 0) {
          next = board.map((c) =>
            c.id === columnId
              ? { ...c, cards: arrayMove(c.cards, oldIndex, newIndex) }
              : c,
          );
          setBoard(next);
        }
      }

      const origin = dragOrigin.current;
      dragOrigin.current = null;
      const toColumnId = findColumnId(next, activeId);
      if (!origin || !toColumnId) return;
      const toColumn = next.find((c) => c.id === toColumnId);
      if (!toColumn) return;
      const toIndex = toColumn.cards.findIndex((c) => c.id === activeId);
      if (origin.columnId === toColumnId && origin.index === toIndex) return;
      onCardMove({
        cardId: activeId,
        fromColumnId: origin.columnId,
        toColumnId,
        toIndex,
        columns: next,
      });
    };

    return (
      <ScrollArea className="pb-4" data-key={entry.key}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveCard(null);
            dragOrigin.current = null;
          }}
        >
          <div className="flex gap-4">
            {board.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                onCardClick={onCardClick}
              />
            ))}
          </div>
          {/* Rendered in a fixed-position layer, so the dragged card isn't
              clipped by the column/board scroll containers. */}
          <DragOverlay>
            {activeCard ? <CardView card={activeCard} /> : null}
          </DragOverlay>
        </DndContext>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  },
  placeholder: () => <Skeleton className="w-full" style={{ height: 320 }} />,
});
