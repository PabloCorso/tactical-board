import { describe, expect, it } from "vitest";
import { DEFAULT_ARROW_TOOL_STATE } from "../tools/arrow-tool-state";
import { DEFAULT_SHAPE_TOOL_STATE } from "../tools/shape-tool-state";
import { DEFAULT_PLAYER_COLOR } from "../objects/player-object";
import { DEFAULT_TEXT_COLOR } from "../objects/text-object";
import { footballBoardExample } from "../../examples/football/football-board-example";
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

  it("uses the preset black for football example arrows and shapes", () => {
    const exampleObjects = Object.values(footballBoardExample.objects.byId);

    const exampleArrow = exampleObjects.find(
      (object) => object.id === "arrow-straight-solid-start-none-end-none",
    );
    const exampleShape = exampleObjects.find(
      (object) => object.id === "shape-rectangle-solid-none-bordered",
    );

    expect(exampleArrow?.props.color).toBe(DEFAULT_PRESET_COLOR.black);
    expect(exampleShape?.props.color).toBe(DEFAULT_PRESET_COLOR.black);
  });
});
