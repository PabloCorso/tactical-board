import { describe, expect, it } from "vitest";
import { getExpandedCanvasRectPoints } from "./selection-geometry";

describe("selection rectangle expansion", () => {
  it("keeps the requested clearance from every edge", () => {
    expect(
      getExpandedCanvasRectPoints(
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 20 },
          { x: 0, y: 20 },
        ],
        2,
      ),
    ).toEqual([
      { x: -2, y: -2 },
      { x: 12, y: -2 },
      { x: 12, y: 22 },
      { x: -2, y: 22 },
    ]);
  });

  it("keeps the requested clearance on a rotated rectangle", () => {
    const rootHalf = Math.sqrt(0.5);
    const expanded = getExpandedCanvasRectPoints(
      [
        { x: -rootHalf, y: -3 * rootHalf },
        { x: 3 * rootHalf, y: rootHalf },
        { x: rootHalf, y: 3 * rootHalf },
        { x: -3 * rootHalf, y: -rootHalf },
      ],
      2,
    );

    expect(expanded[0].x).toBeCloseTo(-rootHalf);
    expect(expanded[0].y).toBeCloseTo(-7 * rootHalf);
    expect(expanded[2].x).toBeCloseTo(rootHalf);
    expect(expanded[2].y).toBeCloseTo(7 * rootHalf);
  });
});
