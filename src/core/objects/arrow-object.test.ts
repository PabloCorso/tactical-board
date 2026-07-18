import { describe, expect, it } from "vitest";
import { getArrowLength } from "./arrow-object";

describe("arrow measurement", () => {
  it("uses endpoint distance for straight arrows and path length for curves", () => {
    expect(
      getArrowLength({
        start: { x: 0, y: 0 },
        end: { x: 3, y: 4 },
        kind: "straight",
      }),
    ).toBe(5);

    expect(
      getArrowLength({
        start: { x: 0, y: 0 },
        end: { x: 10, y: 0 },
        kind: "curved",
        curveOffset: 5,
      }),
    ).toBeGreaterThan(10);
  });
});
