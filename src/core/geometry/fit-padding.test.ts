import { describe, expect, it } from "vitest";
import { getFitPaddingInsets } from "./fit-padding";

describe("getFitPaddingInsets", () => {
  it("normalizes scalar fit padding", () => {
    expect(getFitPaddingInsets(12)).toEqual({
      top: 12,
      right: 12,
      bottom: 12,
      left: 12,
    });
  });

  it("normalizes axis fit padding", () => {
    expect(getFitPaddingInsets({ x: 20, y: 10 })).toEqual({
      top: 10,
      right: 20,
      bottom: 10,
      left: 20,
    });
  });

  it("preserves side-specific fit padding", () => {
    expect(
      getFitPaddingInsets({ top: 8, right: 16, bottom: 24, left: 32 }),
    ).toEqual({
      top: 8,
      right: 16,
      bottom: 24,
      left: 32,
    });
  });
});
