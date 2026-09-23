import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { cn } from "../../lib/utils";
import { ChatThreadDef } from "./def";

export const ChatThreadImpl = createComponentImplementation({
  def: ChatThreadDef,
  render: ({ messages, onMessageClick }, { entry }) => {
    return (
      <div className="space-y-4 p-4" data-key={entry.key}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.isOwn ? "flex-row-reverse" : "flex-row",
            )}
            onClick={() => onMessageClick({ id: msg.id })}
          >
            <Avatar className="size-8 shrink-0">
              {msg.avatar && <AvatarImage src={msg.avatar} alt={msg.sender} />}
              <AvatarFallback className="text-xs">
                {msg.sender.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "flex flex-col max-w-[70%]",
                msg.isOwn ? "items-end" : "items-start",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">{msg.sender}</span>
                {msg.timestamp && (
                  <span className="text-xs text-muted-foreground">
                    {msg.timestamp}
                  </span>
                )}
              </div>
              <div
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm",
                  msg.isOwn
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md",
                )}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  },
  placeholder: () => <Skeleton className="w-full" style={{ height: 320 }} />,
});
