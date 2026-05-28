import { describe, expect, it } from "vitest";
import { getRectangleCornerRadius } from "./shape-tool";

describe("shape rendering", () => {
  it("caps rectangle corner radius so larger squares do not keep getting rounder", () => {
    expect(getRectangleCornerRadius(40, 40)).toBe(3.2);
    expect(getRectangleCornerRadius(100, 100)).toBe(8);
    expect(getRectangleCornerRadius(240, 240)).toBe(8);
  });

  it("keeps the radius inside very small rectangle dimensions", () => {
    expect(getRectangleCornerRadius(4, 20)).toBe(0.32);
  });
});
