import { describe, expect, it } from "vitest";
import { BOARD_ARROW_DEFAULTS } from "./board-tool-defaults";

describe("BOARD_ARROW_DEFAULTS", () => {
  it("includes line as the first open-stroke preset", () => {
    expect(BOARD_ARROW_DEFAULTS.map((preset) => preset.id)).toEqual([
      "line",
      "run",
      "dribble",
      "lofted-pass",
      "screen",
    ]);
  });

  it("keeps the line preset distinct from the straight arrow preset", () => {
    const line = BOARD_ARROW_DEFAULTS.find((preset) => preset.id === "line");
    const run = BOARD_ARROW_DEFAULTS.find((preset) => preset.id === "run");

    expect(line?.draftStyle).toMatchObject({
      kind: "straight",
      startHead: "none",
      endHead: "none",
    });
    expect(run?.draftStyle).toMatchObject({
      kind: "straight",
      startHead: "none",
      endHead: "triangle",
    });
  });
});
