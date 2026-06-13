import { createComponentImplementation } from "@ui-fired/react";
import { MapPin } from "lucide-react";
import { MapDef } from "./def";

export const MapImpl = createComponentImplementation({
  def: MapDef,
  render: ({
    center,
    zoom = 13,
    markers = [],
    width = 600,
    height = 400,
    onMarkerClick,
    generatedKey,
  }) => {
    // Use OpenStreetMap static tile as background
    const tileUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.05},${center.lat - 0.03},${center.lng + 0.05},${center.lat + 0.03}&layer=mapnik`;

    return (
      <div
        className="relative overflow-hidden rounded-lg border"
        style={{ width, height }}
        data-key={generatedKey}
      >
        <iframe
          src={tileUrl}
          width={width}
          height={height}
          className="border-0"
          title="Map"
          loading="lazy"
        />
        {/* Overlay markers */}
        {markers.map((marker, i) => (
          <button
            key={i}
            type="button"
            className="absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${50 + (marker.lng - center.lng) * zoom * 50}%`,
              top: `${50 - (marker.lat - center.lat) * zoom * 50}%`,
            }}
            onClick={() =>
              onMarkerClick?.({
                lat: marker.lat,
                lng: marker.lng,
                label: marker.label,
              })
            }
          >
            <MapPin className="h-6 w-6 text-destructive fill-destructive" />
            {marker.label && (
              <span className="text-[10px] font-medium bg-background/80 px-1 rounded">
                {marker.label}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  },
});
