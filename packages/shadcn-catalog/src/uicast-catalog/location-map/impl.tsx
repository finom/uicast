import { createComponentImplementation } from "@uicast/react";
import { MapPin, Minus, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { blockSkeleton } from "../../lib/skeletons";
import { cn } from "../../lib/utils";
import { LocationMapDef } from "./def";
import {
  DEFAULT_ZOOM,
  fitView,
  MAX_ZOOM,
  offsetFromCenter,
  project,
  TILE_SIZE,
  tilesAround,
  unproject,
} from "./project";

const tileSrc = (z: number, x: number, y: number): string => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

// Pixel offsets from the map's center, so a container narrower than `width` crops both sides evenly.
const fromCenter = (x: number, y: number) => ({ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` });

// A fitted view leaves room for the pins, which stand up from their point, and for an active pin's label above.
const FIT_PADDING = { x: 40, top: 56, bottom: 8 };

type View = { center: { lat: number; lng: number }; zoom: number };

// Pins, the zoom buttons and the credit link take their own clicks; the rest of the box pans and zooms.
const onControl = (target: EventTarget) => (target as Element).closest("button, a") !== null;

const ZOOM_BUTTON = "grid size-7 place-items-center hover:bg-muted disabled:opacity-50";

// The tile server is fixed here, not set by the document, so `urlPolicy` does not check it.
// OpenStreetMap's license requires the credit in the corner.
export const LocationMapImpl = createComponentImplementation({
  def: LocationMapDef,
  render: ({ center, zoom, markers = [], width, height, onMarkerClick }, { entry }) => {
    const fitted = fitView(markers, width, height, FIT_PADDING);
    const start: View = { center: center ?? fitted.center, zoom: zoom ?? (center ? DEFAULT_ZOOM : fitted.zoom) };
    // The user's pan and zoom hold until the document moves the starting view.
    const startKey = `${start.center.lat},${start.center.lng},${start.zoom}`;
    const [moved, setMoved] = useState<{ startKey: string; view: View } | null>(null);
    const view = moved?.startKey === startKey ? moved.view : start;
    const moveTo = (next: View) => setMoved({ startKey, view: next });
    const drag = useRef<{ x: number; y: number; from: { x: number; y: number } } | null>(null);

    const zoomBy = (step: number, dx = 0, dy = 0) => {
      const next = Math.max(0, Math.min(MAX_ZOOM, view.zoom + step));
      // The point `dx`, `dy` from the center stays where it is.
      const at = project(view.center, view.zoom);
      const scale = 2 ** (next - view.zoom);
      moveTo({ center: unproject({ x: (at.x + dx) * scale - dx, y: (at.y + dy) * scale - dy }, next), zoom: next });
    };

    return (
      <TooltipProvider>
        <div
          role="group"
          aria-label="Map"
          className="relative max-w-full cursor-grab touch-none overflow-hidden rounded-lg border bg-muted select-none active:cursor-grabbing"
          style={{ width, height }}
          data-key={entry.key}
          onPointerDown={(e) => {
            if (onControl(e.target)) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, from: project(view.center, view.zoom) };
          }}
          onPointerMove={(e) => {
            const grab = drag.current;
            if (!grab) return;
            const at = { x: grab.from.x - (e.clientX - grab.x), y: grab.from.y - (e.clientY - grab.y) };
            moveTo({ center: unproject(at, view.zoom), zoom: view.zoom });
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onDoubleClick={(e) => {
            if (onControl(e.target)) return;
            const box = e.currentTarget.getBoundingClientRect();
            zoomBy(1, e.clientX - box.left - box.width / 2, e.clientY - box.top - box.height / 2);
          }}
        >
          {tilesAround(view.center, view.zoom, width, height).map((tile) => (
            <img
              key={`${tile.left}:${tile.top}`}
              src={tileSrc(view.zoom, tile.x, tile.y)}
              alt=""
              width={TILE_SIZE}
              height={TILE_SIZE}
              draggable={false}
              className="pointer-events-none absolute max-w-none"
              style={fromCenter(tile.left, tile.top)}
            />
          ))}
          {markers.map((marker, i) => {
            const offset = offsetFromCenter(marker, view.center, view.zoom);
            if (Math.abs(offset.x) > width / 2 || Math.abs(offset.y) > height / 2) return null;
            const name = marker.label ?? `${marker.lat}, ${marker.lng}`;
            // The active pin shows its label already, so it has no tooltip.
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={name}
                    aria-current={marker.active || undefined}
                    className={cn(
                      "absolute -translate-x-1/2 -translate-y-full rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      marker.active && "z-10",
                    )}
                    style={fromCenter(offset.x, offset.y)}
                    onClick={() => onMarkerClick(marker)}
                  >
                    {marker.active && (
                      <span className="absolute bottom-full left-1/2 mb-0.5 -translate-x-1/2 whitespace-nowrap rounded bg-background/90 px-1.5 py-0.5 text-xs font-medium shadow-sm">
                        {name}
                      </span>
                    )}
                    <MapPin
                      className={
                        marker.active
                          ? // A fixed red: `--destructive` turns pale in a dark theme, over tiles that stay light.
                            "size-8 fill-red-600 text-red-900 drop-shadow"
                          : "size-6 fill-destructive text-destructive"
                      }
                    />
                  </button>
                </TooltipTrigger>
                {!marker.active && <TooltipContent>{name}</TooltipContent>}
              </Tooltip>
            );
          })}
          <div className="absolute top-2 left-2 flex flex-col overflow-hidden rounded-md border bg-background/90 shadow-sm">
            <button
              type="button"
              aria-label="Zoom in"
              className={ZOOM_BUTTON}
              disabled={view.zoom >= MAX_ZOOM}
              onClick={() => zoomBy(1)}
            >
              <Plus className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              className={cn(ZOOM_BUTTON, "border-t")}
              disabled={view.zoom <= 0}
              onClick={() => zoomBy(-1)}
            >
              <Minus className="size-4" />
            </button>
          </div>
          <div className="absolute right-0 bottom-0 rounded-tl-md bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground [&_a]:underline">
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
              © OpenStreetMap contributors
            </a>
          </div>
        </div>
      </TooltipProvider>
    );
  },
  skeleton: blockSkeleton(300),
});
