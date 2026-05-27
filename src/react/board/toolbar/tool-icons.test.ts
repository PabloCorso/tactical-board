import { describe, expect, it } from "vitest";
import { DEFAULT_PLAYER_SIZE } from "../../../core/objects/player-object";
import { PlayerTool } from "../../../core/tools/player-tool";
import { PLAYER_TOOL_ID } from "../../../core/tools/player-tool-state";
import type { ToolRegistry } from "../../../core/tools/types";
import {
  getPlayerToolIconDraftStyle,
  getThemeAwareToolIconColor,
} from "./tool-icons";

describe("getPlayerToolIconDraftStyle", () => {
  it("uses the first registered player default before the player tool is activated", () => {
    const playerTool = new PlayerTool({
      defaults: [
        {
          id: "home",
          label: "Home",
          draftStyle: {
            color: "#1f6feb",
          },
        },
      ],
    });

    expect(
      getPlayerToolIconDraftStyle({
        toolRegistry: createToolRegistry(playerTool),
        toolState: {},
      }),
    ).toEqual({
      color: "#1f6feb",
      size: DEFAULT_PLAYER_SIZE,
    });
  });

  it("follows the current player draft style after selecting another player default", () => {
    const playerTool = new PlayerTool({
      defaults: [
        {
          id: "home",
          label: "Home",
          draftStyle: {
            color: "#1f6feb",
            size: 2.4,
          },
        },
      ],
    });
    const toolState = {
      [PLAYER_TOOL_ID]: {
        draftStyle: {
          color: "#111827",
          size: 3,
        },
        nextNumericLabelByColor: {},
      },
    };

    expect(
      getPlayerToolIconDraftStyle({
        toolRegistry: createToolRegistry(playerTool),
        toolState,
      }),
    ).toEqual({
      color: "#111827",
      size: 3,
    });
  });
});

describe("getThemeAwareToolIconColor", () => {
  it("uses currentColor for monochrome toolbar preview colors", () => {
    expect(getThemeAwareToolIconColor("#1f1f1f")).toBe("currentColor");
    expect(getThemeAwareToolIconColor("#ffffff")).toBe("currentColor");
    expect(getThemeAwareToolIconColor("#e5e7eb")).toBe("currentColor");
  });

  it("keeps saturated toolbar preview colors literal", () => {
    expect(getThemeAwareToolIconColor("#ff5a36")).toBe("#ff5a36");
    expect(getThemeAwareToolIconColor("#4db3ff")).toBe("#4db3ff");
  });
});

function createToolRegistry(playerTool: PlayerTool): ToolRegistry {
  return {
    definitions: {
      [PLAYER_TOOL_ID]: playerTool,
    },
  };
}
