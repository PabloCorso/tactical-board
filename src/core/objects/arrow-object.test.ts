import { describe, expect, it } from "vitest";
import {
  getArrowBodyPolylines,
  getArrowBodyStrokeWidth,
} from "./arrow-object";

function getDoubleLineGap(strokeWidth: number) {
  const polylines = getArrowBodyPolylines({
    start: { x: 0, y: 0 },
    end: { x: 10, y: 0 },
    kind: "double",
    strokeWidth,
  });
  const centerlineDistance = Math.abs(
    polylines[0][0].y - polylines[1][0].y,
  );

  return centerlineDistance - getArrowBodyStrokeWidth(strokeWidth, "double");
}

describe("getArrowBodyPolylines", () => {
  it("preserves the visible gap between double lines across thicknesses", () => {
    expect(getDoubleLineGap(2)).toBeCloseTo(1);
    expect(getDoubleLineGap(4)).toBeCloseTo(1);
  });
});
