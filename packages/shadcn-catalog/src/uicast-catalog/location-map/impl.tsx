import { createComponentImplementation } from "@uicast/react";
import { MapPin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { LocationMapDef } from "./def";
import { offsetFromCenter, TILE_SIZE, tilesAround } from "./project";
import { blockSkeleton } from "../../lib/skeletons";

const tileSrc = (z: number, x: number, y: number): string => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

// Pixel offsets from the map's center, so a container narrower than `width` crops both sides evenly.
const fromCenter = (x: number, y: number) => ({ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` });

// The tile server is fixed here, not set by the document, so `urlPolicy` does not check it.
// OpenStreetMap's license requires the credit in the corner.
export const LocationMapImpl = createComponentImplementation({
  def: LocationMapDef,
  render: ({ center, zoom, markers = [], width, height, onMarkerClick }, { entry }) => (
    <TooltipProvider>
      <div
        role="group"
        aria-label="Map"
        className="relative max-w-full overflow-hidden rounded-lg border bg-muted"
        style={{ width, height }}
        data-key={entry.key}
      >
        {tilesAround(center, zoom, width, height).map((tile) => (
          <img
            key={`${tile.left}:${tile.top}`}
            src={tileSrc(zoom, tile.x, tile.y)}
            alt=""
            width={TILE_SIZE}
            height={TILE_SIZE}
            draggable={false}
            className="absolute max-w-none select-none"
            style={fromCenter(tile.left, tile.top)}
          />
        ))}
        {markers.map((marker, i) => {
          const offset = offsetFromCenter(marker, center, zoom);
          if (Math.abs(offset.x) > width / 2 || Math.abs(offset.y) > height / 2) return null;
          const name = marker.label ?? `${marker.lat}, ${marker.lng}`;
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={name}
                  className="absolute -translate-x-1/2 -translate-y-full rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={fromCenter(offset.x, offset.y)}
                  onClick={() => onMarkerClick(marker)}
                >
                  <MapPin className="size-6 fill-destructive text-destructive" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{name}</TooltipContent>
            </Tooltip>
          );
        })}
        <div className="absolute right-0 bottom-0 rounded-tl-md bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground [&_a]:underline">
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            © OpenStreetMap contributors
          </a>
        </div>
      </div>
    </TooltipProvider>
  ),
  skeleton: blockSkeleton(300),
});
