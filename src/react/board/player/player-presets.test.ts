import { describe, expect, it } from "vitest";
import {
  FOOTBALL_PLAYER_APPEARANCES,
  FOOTBALL_PLAYER_PRESETS,
} from "../../sports/football/theme/football-player-appearances";
import {
  getPlayerPresetChangePatch,
  isPlayerPresetActive,
} from "./player-presets";

const theme = { playerAppearances: FOOTBALL_PLAYER_APPEARANCES };

function getPreset(id: string) {
  const preset = FOOTBALL_PLAYER_PRESETS.find(
    (candidate) => candidate.id === id,
  );

  if (!preset) {
    throw new Error(`Missing football preset ${id}`);
  }

  return preset;
}

function getAppearance(id: string) {
  return theme.playerAppearances.find((candidate) => candidate.id === id);
}

describe("getPlayerPresetChangePatch", () => {
  it("carries shared color roles across preset switches", () => {
    const preset = getPreset("ringed-circle");
    const patch = getPlayerPresetChangePatch({
      current: { colors: { secondary: "#fbbf24" } },
      preset,
      appearance: getAppearance(preset.appearanceId),
    });

    expect(patch.appearanceId).toBe("football-ringed-circle");
    expect(patch.colors).toEqual({ secondary: "#fbbf24" });
    expect(patch.asset).toBeUndefined();
  });

  it("falls back to preset colors and options for new roles", () => {
    const preset = getPreset("shirt-stripes");
    const patch = getPlayerPresetChangePatch({
      current: { colors: undefined },
      preset,
      appearance: getAppearance(preset.appearanceId),
    });

    expect(patch.appearanceId).toBe("football-shirt");
    expect(patch.colors).toEqual({ secondary: "#ffffff" });
    expect(patch.options).toEqual({ pattern: "stripes" });
  });
});

describe("isPlayerPresetActive", () => {
  it("resolves missing options through the appearance defaults", () => {
    const solid = getPreset("shirt");
    const stripes = getPreset("shirt-stripes");
    const appearance = getAppearance(solid.appearanceId);
    const value = { appearanceId: "football-shirt", options: undefined };

    expect(isPlayerPresetActive(solid, value, appearance)).toBe(true);
    expect(isPlayerPresetActive(stripes, value, appearance)).toBe(false);
    expect(
      isPlayerPresetActive(
        stripes,
        { appearanceId: "football-shirt", options: { pattern: "stripes" } },
        appearance,
      ),
    ).toBe(true);
  });

  it("treats the missing appearance id as the default circle", () => {
    const circle = getPreset("circle");

    expect(isPlayerPresetActive(circle, { appearanceId: undefined })).toBe(
      true,
    );
  });
});
