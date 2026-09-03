"use client";
import { createComponentImplementation } from "@uicast/react";
import { useRef, useState } from "react";
import { NodeBoardDef } from "./def";

/**
 * Drag a node's body to move it (emits onMoveNode); click a node's port, then
 * another node's port, to wire them (emits onConnect). The pending "from" node
 * is purely local UI state — the committed graph lives in scope.
 */
export const NodeBoardRenderer = createComponentImplementation({
  def: NodeBoardDef,
  render: ({ nodes = [], links = [], onMoveNode, onConnect}, { entry }) => {
    const boardRef = useRef<HTMLDivElement>(null);
    const dragId = useRef<string | null>(null);
    const [pendingFrom, setPendingFrom] = useState<string | null>(null);

    const byId = (id: string) => nodes.find((n) => n.id === id);

    const moveTo = (clientX: number, clientY: number) => {
      const el = boardRef.current;
      const id = dragId.current;
      if (!el || !id) return;
      const r = el.getBoundingClientRect();
      const x = Math.round(Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * 1000) / 1000;
      const y = Math.round(Math.min(1, Math.max(0, (clientY - r.top) / r.height)) * 1000) / 1000;
      onMoveNode?.({ id, x, y });
    };

    const clickPort = (id: string) => {
      if (!pendingFrom) {
        setPendingFrom(id);
        return;
      }
      if (pendingFrom === id) {
        setPendingFrom(null);
        return;
      }
      onConnect?.({ from: pendingFrom, to: id });
      setPendingFrom(null);
    };

    return (
      <div
        data-key={entry.key}
        ref={boardRef}
        className="relative h-80 w-full select-none overflow-hidden rounded-lg border border-border bg-muted/20"
        style={{ touchAction: "none" }}
        onPointerMove={(e) => {
          if (dragId.current) moveTo(e.clientX, e.clientY);
        }}
        onPointerUp={() => {
          dragId.current = null;
        }}
      >
        <svg
          className="pointer-events-none absolute inset-0 size-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {links.map((lk, i) => {
            const a = byId(lk.from);
            const b = byId(lk.to);
            if (!a || !b) return null;
            return (
              <line
                key={`${lk.from}-${lk.to}-${i}`}
                x1={a.x * 100}
                y1={a.y * 100}
                x2={b.x * 100}
                y2={b.y * 100}
                className="stroke-primary/60"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {nodes.map((n) => (
          <div
            key={n.id}
            className="absolute flex -translate-1/2 cursor-grab items-center gap-2 rounded-md border border-border bg-card px-3 py-2 shadow-sm active:cursor-grabbing"
            style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }}
            onPointerDown={(e) => {
              dragId.current = n.id;
              boardRef.current?.setPointerCapture(e.pointerId);
            }}
          >
            <span className="text-sm font-medium">{n.label}</span>
            <button
              type="button"
              aria-label={`Connect ${n.label}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                clickPort(n.id);
              }}
              className={[
                "size-3 shrink-0 rounded-full border transition",
                pendingFrom === n.id
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/50 bg-background hover:border-primary",
              ].join(" ")}
            />
          </div>
        ))}

        {pendingFrom && (
          <div className="pointer-events-none absolute bottom-2 left-2 rounded-sm bg-background/80 px-2 py-0.5 text-xs text-muted-foreground">
            Connecting from “{byId(pendingFrom)?.label}” — click another node’s
            port
          </div>
        )}
      </div>
    );
  },
});
