import { describe, expect, it } from "vitest";
import { DEFAULT_ARROW_TOOL_STATE } from "../tools/arrow-tool-state";
import { DEFAULT_SHAPE_TOOL_STATE } from "../tools/shape-tool-state";
import { DEFAULT_PLAYER_COLOR } from "../objects/player-object";
import { DEFAULT_TEXT_COLOR } from "../objects/text-object";
import { footballShowcaseBoard } from "../../react/football/football-board";
import { DEFAULT_PRESET_COLOR, DEFAULT_PRESET_COLORS } from "./preset-colors";

describe("preset-backed default colors", () => {
  it("keeps the shared black default inside the preset palette", () => {
    expect(DEFAULT_PRESET_COLORS).toContain(DEFAULT_PRESET_COLOR.black);
  });

  it("uses the preset black for player and text defaults", () => {
    expect(DEFAULT_PLAYER_COLOR).toBe(DEFAULT_PRESET_COLOR.black);
    expect(DEFAULT_TEXT_COLOR).toBe(DEFAULT_PRESET_COLOR.black);
  });

  it("uses the preset black for arrow and shape draft defaults", () => {
    expect(DEFAULT_ARROW_TOOL_STATE.draftStyle.color).toBe(
      DEFAULT_PRESET_COLOR.black,
    );
    expect(DEFAULT_SHAPE_TOOL_STATE.draftStyle.color).toBe(
      DEFAULT_PRESET_COLOR.black,
    );
  });

  it("uses the preset black for football showcase arrows and shapes", () => {
    const showcaseObjects = Object.values(footballShowcaseBoard.objects.byId);

    const showcaseArrow = showcaseObjects.find(
      (object) => object.id === "arrow-straight-solid-start-none-end-none",
    );
    const showcaseShape = showcaseObjects.find(
      (object) => object.id === "shape-rectangle-solid-none-bordered",
    );

    expect(showcaseArrow?.props.color).toBe(DEFAULT_PRESET_COLOR.black);
    expect(showcaseShape?.props.color).toBe(DEFAULT_PRESET_COLOR.black);
  });
});
