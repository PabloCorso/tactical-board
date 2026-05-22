import { describe, expect, it } from "vitest";

import { DEFAULT_PLAYER_SIZE } from "../../../core/objects/player-object";
import { FOOTBALL_EQUIPMENT_DEFINITIONS } from ".";

describe("mannequin equipment", () => {
  it("defaults to larger than player-sized height on the football board", () => {
    const mannequin = FOOTBALL_EQUIPMENT_DEFINITIONS.find(
      (definition) => definition.kind === "mannequin",
    );

    expect(mannequin?.defaultSize.height).toBe(DEFAULT_PLAYER_SIZE * 1.75);
  });
});
