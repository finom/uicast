import {
  type Announcements,
  closestCorners,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { createComponentImplementation } from "@uicast/react";
import { useMemo, useRef } from "react";
import { Badge } from "../../components/ui/badge";
import { KanbanBoard, KanbanCard, KanbanCards, KanbanHeader, KanbanProvider } from "../../components/ui/kanban";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import { CHART_COLORS } from "../../lib/chart-colors";
import { BlockSkeleton } from "../../lib/skeletons";
import { useMirror } from "../../lib/use-mirror";
import { type KanbanCard as BoardCard, type KanbanColumn, KanbanBoardDef } from "./def";

// Kibo's board takes one flat list, with each card's column as a field.
type Item = { id: string; name: string; column: string; card: BoardCard };

const toItems = (board: KanbanColumn[]): Item[] =>
  board.flatMap((column) => column.cards.map((card) => ({ id: card.id, name: card.title, column: column.id, card })));

const toBoard = (board: KanbanColumn[], items: Item[]): KanbanColumn[] =>
  board.map((column) => ({
    ...column,
    cards: items.filter((item) => item.column === column.id).map((item) => item.card),
  }));

const indexInColumn = (items: Item[], item: Item) => items.filter((i) => i.column === item.column).indexOf(item);

export const KanbanBoardImpl = createComponentImplementation({
  def: KanbanBoardDef,
  render: ({ columns, onCardClick, onCardMove }, { entry }) => {
    // Resyncs by content: the document writing `evt.columns` back matches the local board and nothing moves.
    const [board, setBoard] = useMirror(columns, JSON.stringify(columns));
    const items = useMemo(() => toItems(board), [board]);
    // The state at drag start: a no-op drop skips the callback, a cancel puts `board` back.
    const origin = useRef<{ column: string; index: number; board: KanbanColumn[] } | null>(null);

    const sensors = useSensors(
      // The distance threshold keeps plain clicks flowing to onCardClick.
      useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    // Kibo's own announcements name a column only when the drag is over the column itself, and say "undefined" over a card.
    const nameOf = (id: UniqueIdentifier) => items.find((item) => item.id === id)?.name;
    const columnOf = (id: UniqueIdentifier) =>
      board.find((column) => column.id === id || column.cards.some((card) => card.id === id))?.title;
    const announcements: Announcements = {
      onDragStart: ({ active }) => `Picked up the card "${nameOf(active.id)}" from the "${columnOf(active.id)}" column`,
      onDragOver: ({ active, over }) =>
        over ? `Dragged the card "${nameOf(active.id)}" over the "${columnOf(over.id)}" column` : undefined,
      onDragEnd: ({ active, over }) =>
        over
          ? `Dropped the card "${nameOf(active.id)}" into the "${columnOf(over.id)}" column`
          : `Dropped the card "${nameOf(active.id)}"`,
      onDragCancel: ({ active }) => `Cancelled dragging the card "${nameOf(active.id)}"`,
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
      const start = origin.current;
      origin.current = null;
      // Kibo applies this same move after the handler returns.
      const moved =
        over && active.id !== over.id
          ? arrayMove(
              items,
              items.findIndex((item) => item.id === active.id),
              items.findIndex((item) => item.id === over.id),
            )
          : items;
      const item = moved.find((i) => i.id === active.id);
      if (!start || !item) return;
      const toIndex = indexInColumn(moved, item);
      if (start.column === item.column && start.index === toIndex) return;
      onCardMove({
        cardId: item.id,
        fromColumnId: start.column,
        toColumnId: item.column,
        toIndex,
        columns: toBoard(board, moved),
      });
    };

    return (
      <ScrollArea data-key={entry.key}>
        <KanbanProvider
          columns={board.map((column) => ({ id: column.id, name: column.title, count: column.cards.length }))}
          data={items}
          sensors={sensors}
          accessibility={{ announcements }}
          // Kibo's closestCenter often picks the whole column over a card in it, so a card lands at the column's end.
          collisionDetection={closestCorners}
          // Columns keep 12rem and narrow boards scroll; the padding keeps the drop ring inside the clipping viewport.
          className="auto-cols-[minmax(12rem,1fr)] p-1"
          onDataChange={(next) => setBoard(toBoard(board, next))}
          onDragStart={({ active }) => {
            const item = items.find((i) => i.id === active.id);
            origin.current = item ? { column: item.column, index: indexInColumn(items, item), board } : null;
          }}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            if (origin.current) setBoard(origin.current.board);
            origin.current = null;
          }}
        >
          {(column) => (
            <KanbanBoard id={column.id} key={column.id}>
              <KanbanHeader className="flex items-center justify-between">
                {column.name}
                <span className="font-normal text-muted-foreground tabular-nums">{column.count}</span>
              </KanbanHeader>
              <KanbanCards<Item>
                id={column.id}
                // dnd-kit hides the dropped card while its drop animation runs, and Kibo has emptied the overlay by then.
                className="[&>*]:opacity-100!"
              >
                {(item) => (
                  <KanbanCard column={item.column} id={item.id} key={item.id} name={item.name}>
                    <div onClick={() => onCardClick({ cardId: item.id, columnId: item.column })}>
                      <p className="m-0 text-sm font-medium">{item.name}</p>
                      {item.card.description && (
                        <p className="mt-1 line-clamp-2 text-muted-foreground">{item.card.description}</p>
                      )}
                      {item.card.tag && (
                        <Badge
                          variant="secondary"
                          className="mt-2 gap-1.5"
                          style={
                            item.card.tagColor
                              ? {
                                  backgroundColor: `color-mix(in srgb, ${CHART_COLORS[item.card.tagColor]} 20%, transparent)`,
                                }
                              : undefined
                          }
                        >
                          {item.card.tagColor && (
                            <span
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: CHART_COLORS[item.card.tagColor] }}
                            />
                          )}
                          {item.card.tag}
                        </Badge>
                      )}
                    </div>
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  },
  skeleton: () => <BlockSkeleton height={320} />,
});
