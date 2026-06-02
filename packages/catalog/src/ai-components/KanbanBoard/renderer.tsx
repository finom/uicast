import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "ui-fired/catalog/components/ui/card";
import { Badge } from "ui-fired/catalog/components/ui/badge";
import { ScrollArea, ScrollBar } from "ui-fired/catalog/components/ui/scroll-area";
import { KanbanBoardDef } from "./def";

export const KanbanBoardRenderer = createAIComponentRenderer({
  def: KanbanBoardDef,
  renderer: ({ columns = [], onCardClick, generatedKey }) => {
    return (
      <ScrollArea className="pb-4" data-key={generatedKey}>
        <div className="flex gap-4">
          {columns.map((col) => (
            <div
              key={col.id}
              className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/50"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="text-sm font-semibold">{col.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {col.cards.length}
                </Badge>
              </div>
              <ScrollArea className="flex-1 p-2">
                <div className="space-y-2">
                  {col.cards.map((card) => (
                    <Card
                      key={card.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() =>
                        onCardClick?.({ cardId: card.id, columnId: col.id })
                      }
                    >
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
                              className="mt-2 text-[10px]"
                              style={
                                card.tagColor
                                  ? {
                                      backgroundColor: card.tagColor,
                                      color: "#fff",
                                      borderColor: card.tagColor,
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
                  ))}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  },
});
