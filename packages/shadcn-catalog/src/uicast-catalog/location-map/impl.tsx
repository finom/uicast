import type { ReactNode } from "react";
import { createComponentImplementation } from "@uicast/react";
import { MapPin } from "lucide-react";
import { Skeleton } from "../../components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { LocationMapDef } from "./def";
import { offsetFromCenter, TILE_SIZE, tilesAround } from "./project";

type TileSource = {
  // A raster tile URL with `{z}`, `{x}` and `{y}` in it.
  tileUrl: string;
  // Drawn in the map's corner; tile providers require it.
  attribution: ReactNode;
};

const OPEN_STREET_MAP: TileSource = {
  tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: (
    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
      © OpenStreetMap contributors
    </a>
  ),
};

const tileSrc = (tileUrl: string, z: number, x: number, y: number): string =>
  tileUrl.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));

// Pixel offsets from the map's center, so a container narrower than `width` crops both sides evenly.
const fromCenter = (x: number, y: number) => ({ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` });

// The tile server is the host's choice, not the document's, so `urlPolicy` does not check it.
export const createLocationMapImplementation = ({ tileUrl, attribution }: TileSource) =>
  createComponentImplementation({
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
              src={tileSrc(tileUrl, zoom, tile.x, tile.y)}
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
            {attribution}
          </div>
        </div>
      </TooltipProvider>
    ),
    placeholder: () => <Skeleton className="w-full" style={{ height: 300 }} />,
  });

export const LocationMapImpl = createLocationMapImplementation(OPEN_STREET_MAP);
