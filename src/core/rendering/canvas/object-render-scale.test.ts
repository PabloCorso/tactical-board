import { describe, expect, it } from "vitest";
import {
  getArrowHeadLength,
  getPlayerBorderWidth,
  getPlayerLabelFontSize,
  getRelativeCanvasStrokeWidth,
  getScaledCanvasStrokeWidth,
} from "./object-render-scale";

describe("object render scaling", () => {
  it("keeps scaled stroke widths proportional to viewport zoom", () => {
    expect(getScaledCanvasStrokeWidth(0.4, 2)).toBeCloseTo(0.8);
    expect(getScaledCanvasStrokeWidth(0.4, 4)).toBeCloseTo(1.6);
  });

  it("derives player chrome from the rendered token radius", () => {
    expect(getPlayerBorderWidth(4)).toBeCloseTo(0.72);
    expect(getPlayerLabelFontSize(4)).toBeCloseTo(3.8);
  });

  it("scales arrow heads from the actual rendered stroke width", () => {
    expect(getArrowHeadLength(1)).toBeCloseTo(4.5);
    expect(getArrowHeadLength(2)).toBeCloseTo(9);
  });

  it("keeps relative decorative strokes proportional to the object extent", () => {
    expect(getRelativeCanvasStrokeWidth(20, 0.08)).toBeCloseTo(1.6);
    expect(getRelativeCanvasStrokeWidth(40, 0.08)).toBeCloseTo(3.2);
  });
});
