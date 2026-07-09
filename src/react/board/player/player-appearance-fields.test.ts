import { describe, expect, it } from "vitest";
import type { BoardThemePlayerAppearanceDefinition } from "../theme/board-theme";
import { getPlayerAppearanceChangePatch } from "./player-appearance-fields";

describe("getPlayerAppearanceChangePatch", () => {
  it("clears stale appearance-specific props before applying defaults", () => {
    const circle = {
      id: "circle",
      label: "Circle",
    } satisfies BoardThemePlayerAppearanceDefinition;
    const shirt = {
      id: "football-shirt",
      label: "Shirt",
      defaultProps: {
        colors: {
          trim: "#ffffff",
        },
        options: {
          pattern: "solid",
        },
      },
    } satisfies BoardThemePlayerAppearanceDefinition;

    expect(getPlayerAppearanceChangePatch(circle)).toEqual({
      appearanceId: "circle",
      colors: undefined,
      options: undefined,
      asset: undefined,
    });
    expect(getPlayerAppearanceChangePatch(shirt)).toEqual({
      appearanceId: "football-shirt",
      colors: {
        trim: "#ffffff",
      },
      options: {
        pattern: "solid",
      },
      asset: undefined,
    });
  });
});
