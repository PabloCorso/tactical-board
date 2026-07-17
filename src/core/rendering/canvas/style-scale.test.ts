import { describe, expect, it } from "vitest";
import { scaleRoundCapCanvasDashStyle } from "./style-scale";

describe("scaleRoundCapCanvasDashStyle", () => {
  it("compensates dash gaps for the rendered stroke width", () => {
    expect(scaleRoundCapCanvasDashStyle([8, 4], 1, 2)).toEqual([8, 6]);
    expect(scaleRoundCapCanvasDashStyle([8, 4], 1, 4)).toEqual([8, 8]);
    expect(scaleRoundCapCanvasDashStyle([8, 4], 2, 8)).toEqual([16, 16]);
  });
});
