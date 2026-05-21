import { describe, expect, it } from "vitest";
import { scaleCanvasDashStyle, scaleCanvasStyleValue } from "./style-scale";

describe("canvas style scaling", () => {
  it("scales dash arrays with viewport zoom", () => {
    expect(scaleCanvasDashStyle([8, 4], 0.5)).toEqual([4, 2]);
    expect(scaleCanvasDashStyle([8, 4], 2)).toEqual([16, 8]);
  });

  it("scales scalar style values with viewport zoom", () => {
    expect(scaleCanvasStyleValue(18, 0.5)).toBe(9);
    expect(scaleCanvasStyleValue(2.25, 2)).toBe(4.5);
  });
});
