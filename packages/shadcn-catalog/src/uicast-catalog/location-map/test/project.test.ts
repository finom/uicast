import { describe, expect, it } from "vitest";
import {
  DEFAULT_ZOOM,
  fitView,
  MAX_LATITUDE,
  offsetFromCenter,
  project,
  TILE_SIZE,
  tilesAround,
  unproject,
} from "../project";

const BERLIN = { lat: 52.52, lng: 13.405 };
const ORIGIN = { lat: 0, lng: 0 };

describe("project", () => {
  it("puts lat 0 / lng 0 in the middle of the zoom-0 tile", () => {
    expect(project(ORIGIN, 0)).toEqual({ x: 128, y: 128 });
  });

  it("spans a world of 256 · 2^zoom pixels", () => {
    for (const zoom of [0, 1, 13, 19]) {
      const southEast = project({ lat: -MAX_LATITUDE, lng: 180 }, zoom);
      expect(southEast.x).toBe(TILE_SIZE * 2 ** zoom);
      expect(southEast.y).toBeCloseTo(TILE_SIZE * 2 ** zoom, 3);
    }
  });

  it("lands Berlin on OpenStreetMap tile 10/550/335", () => {
    const { x, y } = project(BERLIN, 10);
    expect([Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE)]).toEqual([550, 335]);
  });

  it("clamps latitude to ±85.0511°", () => {
    expect(MAX_LATITUDE).toBeCloseTo(85.0511, 4);
    expect(project({ lat: 90, lng: 0 }, 0)).toEqual(project({ lat: MAX_LATITUDE, lng: 0 }, 0));
    expect(project({ lat: 90, lng: 0 }, 0).y).toBeCloseTo(0, 6);
    expect(project({ lat: -90, lng: 0 }, 0).y).toBeCloseTo(TILE_SIZE, 6);
  });
});

describe("offsetFromCenter", () => {
  it("places a pin by the tile formula", () => {
    // At zoom 13 a degree of longitude is 256 · 2^13 / 360 pixels.
    const offset = offsetFromCenter({ lat: 0, lng: 0.05 }, ORIGIN, 13);
    expect(offset.x).toBeCloseTo((0.05 * TILE_SIZE * 2 ** 13) / 360, 6);
    expect(offset.y).toBeCloseTo(0, 6);
  });

  it("measures north as up", () => {
    expect(offsetFromCenter({ lat: 1, lng: 0 }, ORIGIN, 5).y).toBeLessThan(0);
  });

  it("takes the short way across the antimeridian", () => {
    const offset = offsetFromCenter({ lat: 0, lng: -179 }, { lat: 0, lng: 179 }, 4);
    expect(offset.x).toBeCloseTo((2 * TILE_SIZE * 2 ** 4) / 360, 6);
  });
});

describe("tilesAround", () => {
  it("covers a tile-sized box on the only zoom-0 tile with that one tile", () => {
    expect(tilesAround(ORIGIN, 0, TILE_SIZE, TILE_SIZE)).toEqual([{ x: 0, y: 0, left: -128, top: -128 }]);
  });

  it("covers the whole box with tiles placed relative to its center", () => {
    const width = 600;
    const height = 400;
    const tiles = tilesAround(BERLIN, 13, width, height);
    const lefts = tiles.map((tile) => tile.left);
    const tops = tiles.map((tile) => tile.top);
    expect(Math.min(...lefts)).toBeLessThanOrEqual(-width / 2);
    expect(Math.max(...lefts) + TILE_SIZE).toBeGreaterThanOrEqual(width / 2);
    expect(Math.min(...tops)).toBeLessThanOrEqual(-height / 2);
    expect(Math.max(...tops) + TILE_SIZE).toBeGreaterThanOrEqual(height / 2);
    expect(Math.min(...lefts)).toBeGreaterThan(-width / 2 - TILE_SIZE);
    expect(Math.min(...tops)).toBeGreaterThan(-height / 2 - TILE_SIZE);
  });

  it("wraps columns across the antimeridian", () => {
    const xs = tilesAround({ lat: 0, lng: 179.9 }, 2, TILE_SIZE, TILE_SIZE).map((tile) => tile.x);
    expect(new Set(xs)).toEqual(new Set([3, 0]));
  });

  it("skips rows north and south of the world", () => {
    const tiles = tilesAround({ lat: 85, lng: 0 }, 1, TILE_SIZE, 4 * TILE_SIZE);
    expect(tiles.every((tile) => tile.y >= 0 && tile.y < 2)).toBe(true);
    expect(new Set(tiles.map((tile) => tile.y))).toEqual(new Set([0, 1]));
  });
});

describe("unproject", () => {
  it("inverts project", () => {
    for (const zoom of [0, 4, 13]) {
      const back = unproject(project(BERLIN, zoom), zoom);
      expect(back.lat).toBeCloseTo(BERLIN.lat, 9);
      expect(back.lng).toBeCloseTo(BERLIN.lng, 9);
    }
  });
});

describe("fitView", () => {
  const PARIS = { lat: 48.86, lng: 2.35 };
  const WARSAW = { lat: 52.23, lng: 21.01 };

  const PADDING = { x: 40, top: 56, bottom: 8 };

  it("shows the whole world with no points", () => {
    expect(fitView([], 400, 300, PADDING)).toEqual({ center: { lat: 0, lng: 0 }, zoom: 0 });
  });

  it("puts one point in the middle of the padded box, at the default zoom", () => {
    const { center, zoom } = fitView([BERLIN], 400, 300, PADDING);
    expect(zoom).toBe(DEFAULT_ZOOM);
    const { x, y } = offsetFromCenter(BERLIN, center, zoom);
    expect(x).toBeCloseTo(0, 3);
    // Halfway between 56 px from the top and 8 px from the bottom: 24 px below the box's middle.
    expect(y).toBeCloseTo(24, 3);
  });

  it("takes the largest zoom that keeps every point inside the padding", () => {
    const points = [PARIS, BERLIN, WARSAW];
    const { center, zoom } = fitView(points, 380, 190, PADDING);
    const offsets = points.map((point) => offsetFromCenter(point, center, zoom));
    const [xs, ys] = [offsets.map(({ x }) => x), offsets.map(({ y }) => y)];
    // The box runs from -190 to 190 across and from -95 to 95 down.
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(-150);
    expect(Math.max(...xs)).toBeLessThanOrEqual(150);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(-39);
    expect(Math.max(...ys)).toBeLessThanOrEqual(87);
    // One zoom level more doubles the spans, and one no longer fits.
    const span = (values: number[]) => 2 * (Math.max(...values) - Math.min(...values));
    expect(span(xs) > 300 || span(ys) > 126).toBe(true);
  });
});
