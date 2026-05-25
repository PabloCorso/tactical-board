import { describe, expect, it } from "vitest";
import { DEFAULT_ARROW_TOOL_STATE } from "../tools/arrow-tool-state";
import { DEFAULT_SHAPE_TOOL_STATE } from "../tools/shape-tool-state";
import { DEFAULT_PLAYER_COLOR } from "../objects/player-object";
import { DEFAULT_TEXT_COLOR } from "../objects/text-object";
import { footballShowcaseBoard } from "../../examples/football/football-showcase-board";
import { DEFAULT_BOARD_COLOR, DEFAULT_BOARD_COLORS } from "./default-colors";

describe("default-backed default colors", () => {
  it("keeps the shared black default inside the default palette", () => {
    expect(DEFAULT_BOARD_COLORS).toContain(DEFAULT_BOARD_COLOR.black);
  });

  it("uses the default black for player and text defaults", () => {
    expect(DEFAULT_PLAYER_COLOR).toBe(DEFAULT_BOARD_COLOR.black);
    expect(DEFAULT_TEXT_COLOR).toBe(DEFAULT_BOARD_COLOR.black);
  });

  it("uses the default black for arrow and shape draft defaults", () => {
    expect(DEFAULT_ARROW_TOOL_STATE.draftStyle.color).toBe(
      DEFAULT_BOARD_COLOR.black,
    );
    expect(DEFAULT_SHAPE_TOOL_STATE.draftStyle.color).toBe(
      DEFAULT_BOARD_COLOR.black,
    );
  });

  it("uses the default black for football showcase arrows and shapes", () => {
    const showcaseObjects = Object.values(footballShowcaseBoard.objects.byId);

    const showcaseArrow = showcaseObjects.find(
      (object) => object.id === "arrow-straight-solid-start-none-end-none",
    );
    const showcaseShape = showcaseObjects.find(
      (object) => object.id === "shape-rectangle-solid-none-bordered",
    );

    expect(showcaseArrow?.props.color).toBe(DEFAULT_BOARD_COLOR.black);
    expect(showcaseShape?.props.color).toBe(DEFAULT_BOARD_COLOR.black);
  });
});
