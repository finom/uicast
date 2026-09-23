// Web Mercator, the projection behind every z/x/y raster tile server.

export const TILE_SIZE = 256;

// ≈ 85.0511°: the square Mercator world ends here, and so do the tiles.
export const MAX_LATITUDE = (Math.atan(Math.sinh(Math.PI)) * 180) / Math.PI;

type Coordinates = { lat: number; lng: number };

type Point = { x: number; y: number };

// `x`/`y` name the tile; `left`/`top` place its corner relative to the map's center, in pixels.
type PlacedTile = { x: number; y: number; left: number; top: number };

const worldSize = (zoom: number): number => TILE_SIZE * 2 ** zoom;

// Pixel position in the world image at `zoom`, measured from its top-left corner.
export const project = ({ lat, lng }: Coordinates, zoom: number): Point => {
  const sin = Math.sin((Math.min(MAX_LATITUDE, Math.max(-MAX_LATITUDE, lat)) * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * worldSize(zoom),
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldSize(zoom),
  };
};

// A point across the antimeridian is placed on the copy of the world nearer the center.
export const offsetFromCenter = (point: Coordinates, center: Coordinates, zoom: number): Point => {
  const size = worldSize(zoom);
  const from = project(center, zoom);
  const to = project(point, zoom);
  const dx = to.x - from.x;
  return { x: dx - size * Math.round(dx / size), y: to.y - from.y };
};

// The tiles covering a `width` × `height` box around `center`.
export const tilesAround = (
  center: Coordinates,
  zoom: number,
  width: number,
  height: number,
): PlacedTile[] => {
  const tileCount = 2 ** zoom;
  const middle = project(center, zoom);
  const left = middle.x - width / 2;
  const top = middle.y - height / 2;
  // Rows outside 0…tileCount-1 lie north or south of the world: nothing to draw.
  const firstRow = Math.max(0, Math.floor(top / TILE_SIZE));
  const endRow = Math.min(tileCount, Math.ceil((top + height) / TILE_SIZE));
  const firstColumn = Math.floor(left / TILE_SIZE);
  const endColumn = Math.ceil((left + width) / TILE_SIZE);
  const tiles: PlacedTile[] = [];
  for (let row = firstRow; row < endRow; row++) {
    for (let column = firstColumn; column < endColumn; column++) {
      tiles.push({
        // Columns past either edge wrap across the antimeridian.
        x: ((column % tileCount) + tileCount) % tileCount,
        y: row,
        left: column * TILE_SIZE - middle.x,
        top: row * TILE_SIZE - middle.y,
      });
    }
  }
  return tiles;
};
