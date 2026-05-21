import { describe, expect, it } from "vitest";
import {
  getSurfaceFitScale,
  getViewportZoomToFitSurface,
} from "./surface-scale";

describe("surface scale", () => {
  it("calculates the scale needed to fit a pixel-space surface in a frame", () => {
    expect(
      getSurfaceFitScale(
        { width: 100, height: 50 },
        { width: 300, height: 200 },
      ),
    ).toBeCloseTo(3);
  });

  it("derives fit zoom directly from the pixel-space surface size", () => {
    const surface = { width: 920, height: 592 };
    const frame = { width: 300, height: 200 };

    expect(getSurfaceFitScale(surface, frame)).toBeCloseTo(300 / 920);
    expect(getViewportZoomToFitSurface(surface, frame)).toBe(0.5);
  });
});
