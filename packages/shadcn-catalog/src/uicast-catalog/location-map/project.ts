// Web Mercator, the projection behind every z/x/y raster tile server.

export const TILE_SIZE = 256;

// Tile servers serve zoom 0 (the whole world on one tile) to 19 (single buildings).
export const MAX_ZOOM = 19;
// A city: the zoom for one point, and the closest a fitted view goes.
export const DEFAULT_ZOOM = 13;

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

// The inverse of `project`.
export const unproject = ({ x, y }: Point, zoom: number): Coordinates => {
  const size = worldSize(zoom);
  return {
    lat: (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / size))) * 180) / Math.PI,
    lng: (x / size) * 360 - 180,
  };
};

// The view that shows every point inside the box less `padding`. No points: the whole world.
export const fitView = (
  points: Coordinates[],
  width: number,
  height: number,
  padding: { x: number; top: number; bottom: number },
) => {
  if (points.length === 0) return { center: { lat: 0, lng: 0 }, zoom: 0 };
  const xs = points.map((point) => project(point, 0).x);
  const ys = points.map((point) => project(point, 0).y);
  const [left, right, top, bottom] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  // Each zoom level doubles the spans; take the largest that fits. One point spans nothing and fits at any zoom.
  const room = Math.min(
    Math.max(1, width - 2 * padding.x) / (right - left),
    Math.max(1, height - padding.top - padding.bottom) / (bottom - top),
  );
  const zoom = Math.max(0, Math.min(DEFAULT_ZOOM, Math.floor(Math.log2(room))));
  // The points' middle goes to the middle of the padded box, off the box's own middle when top and bottom differ.
  const scale = 2 ** zoom;
  const middle = {
    x: ((left + right) / 2) * scale,
    y: ((top + bottom) / 2) * scale - (padding.top - padding.bottom) / 2,
  };
  return { center: unproject(middle, zoom), zoom };
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
export const tilesAround = (center: Coordinates, zoom: number, width: number, height: number): PlacedTile[] => {
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
