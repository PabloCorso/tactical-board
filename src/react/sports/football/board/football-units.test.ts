import { describe, expect, it } from "vitest";
import { createFootballBoard, createFootballPitch } from "./football-board";
import {
  DEFAULT_FOOTBALL_PLAYER_SIZE,
  FOOTBALL_MEASUREMENT,
  FOOTBALL_UNITS_PER_METER,
  metersToPixels,
} from "./football-units";

describe("football units", () => {
  it("declares the football coordinate scale on created frames", () => {
    expect(FOOTBALL_UNITS_PER_METER).toBe(8);
    expect(metersToPixels(3)).toBe(24);
    expect(createFootballPitch().measurement).toEqual(FOOTBALL_MEASUREMENT);
  });

  it("uses a football-specific player size", () => {
    expect(DEFAULT_FOOTBALL_PLAYER_SIZE).toBe(30);
    expect(
      createFootballBoard().playerGroups?.map((group) => group.style.size),
    ).toEqual([30, 30]);
  });
});
