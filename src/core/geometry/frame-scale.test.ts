import { describe, expect, it } from "vitest";
import { getFrameFitScale, getViewportZoomToFitFrame } from "./frame-scale";

describe("frame scale", () => {
  it("calculates the scale needed to fit a pixel-space frame in a frame", () => {
    expect(
      getFrameFitScale({ width: 100, height: 50 }, { width: 300, height: 200 }),
    ).toBeCloseTo(3);
  });

  it("derives fit zoom directly from the pixel-space frame size", () => {
    const boardFrame = { width: 920, height: 592 };
    const viewportFrame = { width: 300, height: 200 };

    expect(getFrameFitScale(boardFrame, viewportFrame)).toBeCloseTo(300 / 920);
    expect(getViewportZoomToFitFrame(boardFrame, viewportFrame)).toBe(0.5);
  });
});
