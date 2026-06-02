import { describe, expect, it } from "vitest";
import { BOARD_ARROW_DEFAULTS } from "./board-tool-defaults";

describe("BOARD_ARROW_DEFAULTS", () => {
  it("puts the straight arrow preset first", () => {
    expect(BOARD_ARROW_DEFAULTS.map((preset) => preset.id)).toEqual([
      "run",
      "line",
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
