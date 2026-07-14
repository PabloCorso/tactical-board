import { describe, expect, it } from "vitest";
import type { BoardThemePlayerAppearanceDefinition } from "../theme/board-theme";
import {
  getPlayerAppearanceChangePatch,
  getPlayerAppearanceFieldChangePatch,
} from "./player-appearance-fields";

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

describe("getPlayerAppearanceFieldChangePatch", () => {
  it("carries shared role colors and options between appearances", () => {
    const shirt = {
      id: "football-shirt",
      label: "Shirt",
      colors: [{ id: "secondary", label: "Secondary" }],
      options: [
        {
          id: "pattern",
          label: "Pattern",
          defaultValue: "solid",
          choices: [
            { value: "solid", label: "Solid" },
            { value: "stripes", label: "Stripes" },
          ],
        },
      ],
    } satisfies BoardThemePlayerAppearanceDefinition;

    expect(
      getPlayerAppearanceFieldChangePatch(shirt, {
        color: "#1f6feb",
        colors: { secondary: "#ffffff", unused: "#000000" },
        options: { pattern: "stripes", unused: true },
        asset: { src: "asset://old" },
      }),
    ).toEqual({
      appearanceId: "football-shirt",
      colors: { secondary: "#ffffff" },
      options: { pattern: "stripes" },
      asset: undefined,
    });
  });
});
