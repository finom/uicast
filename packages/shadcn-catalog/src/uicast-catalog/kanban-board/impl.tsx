import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
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
import { useRef, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import { CHART_COLORS } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";
import { useMirror } from "../../lib/use-mirror";
import { cn } from "../../lib/utils";
import { type KanbanCard, type KanbanColumn, KanbanBoardDef } from "./def";

type CardClick = (evt: { cardId: string; columnId: string }) => void;

// Where `id` is: a card's column and index, or a column itself (index -1), so a drop can target an empty column.
const locate = (board: KanbanColumn[], id: string) => {
  const column = board.find((c) => c.id === id);
  if (column) return { column, index: -1 };
  for (const column of board) {
    const index = column.cards.findIndex((card) => card.id === id);
    if (index >= 0) return { column, index };
  }
  return undefined;
};

const CardView = ({ card, onClick }: { card: KanbanCard; onClick?: () => void }) => (
  <Card className="hover:shadow-md transition-shadow" onClick={onClick}>
    <CardHeader className="p-3 pb-1">
      <CardTitle className="text-sm">{card.title}</CardTitle>
    </CardHeader>
    {(card.description || card.tag) && (
      <CardContent className="p-3 pt-0">
        {card.description && <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>}
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
  onCardClick: CardClick;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <CardView card={card} onClick={() => onCardClick({ cardId: card.id, columnId })} />
    </div>
  );
};

const BoardColumn = ({ column, onCardClick }: { column: KanbanColumn; onCardClick: CardClick }) => {
  // Droppable under the column's own id, so a card can land in an empty column.
  const { setNodeRef } = useDroppable({ id: column.id });
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/50">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">{column.title}</h3>
        <Badge variant="secondary" className="text-xs">
          {column.cards.length}
        </Badge>
      </div>
      <SortableContext items={column.cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <ScrollArea className="flex-1 p-2">
          <div ref={setNodeRef} className="space-y-2 min-h-8">
            {column.cards.map((card) => (
              <SortableCard key={card.id} card={card} columnId={column.id} onCardClick={onCardClick} />
            ))}
          </div>
        </ScrollArea>
      </SortableContext>
    </div>
  );
};

export const KanbanBoardImpl = createComponentImplementation({
  def: KanbanBoardDef,
  render: ({ columns, onCardClick, onCardMove }, { entry }) => {
    // Resyncs by content: the document writing `evt.columns` back matches the local board and nothing moves.
    const [board, setBoard] = useMirror(columns, JSON.stringify(columns));
    const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
    // The state at drag start: a no-op drop skips the callback, a cancel puts `board` back.
    const dragOrigin = useRef<{ columnId: string; index: number; board: KanbanColumn[] } | null>(null);

    const sensors = useSensors(
      // The distance threshold keeps plain clicks flowing to onCardClick.
      useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragStart = ({ active }: DragStartEvent) => {
      const at = locate(board, String(active.id));
      setActiveCard(at?.column.cards[at.index] ?? null);
      dragOrigin.current = at ? { columnId: at.column.id, index: at.index, board } : null;
    };

    // Cross-column moves happen live while hovering; within-column order settles on drop.
    const handleDragOver = ({ active, over }: DragOverEvent) => {
      if (!over) return;
      setBoard((prev) => {
        const from = locate(prev, String(active.id));
        const to = locate(prev, String(over.id));
        if (!from || !to || from.column === to.column || from.index < 0) return prev;
        const card = from.column.cards[from.index];
        const insertAt = to.index >= 0 ? to.index : to.column.cards.length;
        return prev.map((c) => {
          if (c === from.column) return { ...c, cards: c.cards.filter((k) => k.id !== card.id) };
          if (c === to.column)
            return { ...c, cards: [...c.cards.slice(0, insertAt), card, ...c.cards.slice(insertAt)] };
          return c;
        });
      });
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
      setActiveCard(null);
      const activeId = String(active.id);
      const origin = dragOrigin.current;
      dragOrigin.current = null;

      let next = board;
      const from = locate(board, activeId);
      const to = over ? locate(board, String(over.id)) : undefined;
      if (from && to && from.column === to.column && from.index >= 0 && to.index >= 0 && from.index !== to.index) {
        next = board.map((c) => (c === from.column ? { ...c, cards: arrayMove(c.cards, from.index, to.index) } : c));
        setBoard(next);
      }

      const at = locate(next, activeId);
      if (!origin || !at || (origin.columnId === at.column.id && origin.index === at.index)) return;
      onCardMove({
        cardId: activeId,
        fromColumnId: origin.columnId,
        toColumnId: at.column.id,
        toIndex: at.index,
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
            if (dragOrigin.current) setBoard(dragOrigin.current.board);
            dragOrigin.current = null;
          }}
        >
          <div className="flex gap-4">
            {board.map((column) => (
              <BoardColumn key={column.id} column={column} onCardClick={onCardClick} />
            ))}
          </div>
          {/* A fixed-position layer, so the dragged card is not clipped by the scroll containers. */}
          <DragOverlay>{activeCard ? <CardView card={activeCard} /> : null}</DragOverlay>
        </DndContext>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  },
  skeleton: blockSkeleton(320),
});
