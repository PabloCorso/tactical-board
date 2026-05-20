import { describe, expect, it } from "vitest";
import {
  getSurfaceBasePixelsPerUnit,
  getSurfaceFitPixelsPerUnit,
  getViewportZoomToFitSurface,
} from "./surface-scale";

describe("surface scale", () => {
  it("uses fit scaling when the surface has no canonical base scale", () => {
    expect(
      getSurfaceBasePixelsPerUnit(
        { width: 100, height: 50 },
        { width: 300, height: 200 },
      ),
    ).toBeCloseTo(3);
  });

  it("preserves an explicit base scale across frame sizes", () => {
    expect(
      getSurfaceBasePixelsPerUnit(
        { width: 115, height: 74, basePixelsPerUnit: 8 },
        { width: 320, height: 200 },
      ),
    ).toBe(8);
    expect(
      getSurfaceBasePixelsPerUnit(
        { width: 115, height: 74, basePixelsPerUnit: 8 },
        { width: 1400, height: 900 },
      ),
    ).toBe(8);
  });

  it("prefers the Document coordinate-system base scale for new Document code", () => {
    expect(
      getSurfaceBasePixelsPerUnit(
        {
          width: 320,
          height: 180,
          basePixelsPerUnit: 2,
          coordinateSystem: {
            unit: "px",
            basePixelsPerUnit: 1,
          },
        },
        { width: 640, height: 360 },
      ),
    ).toBe(1);
  });

  it("derives fit zoom relative to the canonical base scale", () => {
    const surface = { width: 115, height: 74, basePixelsPerUnit: 8 };
    const frame = { width: 300, height: 200 };

    expect(getSurfaceFitPixelsPerUnit(surface, frame)).toBeCloseTo(300 / 115);
    expect(getViewportZoomToFitSurface(surface, frame)).toBe(0.5);
  });
});
