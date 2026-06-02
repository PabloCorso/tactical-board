import { describe, expect, it } from "vitest";
import { DEFAULT_PLAYER_SIZE } from "../../../core/objects/player-object";
import { ArrowTool } from "../../../core/tools/arrow-tool";
import {
  ARROW_TOOL_ID,
  DEFAULT_ARROW_TOOL_STATE,
} from "../../../core/tools/arrow-tool-state";
import { getNextNumericPlayerLabel } from "../../../core/tools/player-labels";
import { PlayerTool } from "../../../core/tools/player-tool";
import { PLAYER_TOOL_ID } from "../../../core/tools/player-tool-state";
import { ShapeTool } from "../../../core/tools/shape-tool";
import {
  DEFAULT_SHAPE_TOOL_STATE,
  SHAPE_TOOL_ID,
} from "../../../core/tools/shape-tool-state";
import type { ToolRegistry } from "../../../core/tools/types";
import {
  getArrowToolIconDraftStyle,
  getPlayerToolIconDraftStyle,
  getShapeToolIconDraftStyle,
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

describe("getArrowToolIconDraftStyle", () => {
  it("uses the first registered arrow default before the arrow tool is activated", () => {
    const arrowTool = new ArrowTool({
      defaults: [
        {
          id: "line",
          draftStyle: {
            kind: "straight",
            endHead: "none",
          },
        },
      ],
    });

    expect(
      getArrowToolIconDraftStyle({
        toolRegistry: createToolRegistry({ [ARROW_TOOL_ID]: arrowTool }),
        toolState: {},
      }),
    ).toEqual({
      ...DEFAULT_ARROW_TOOL_STATE.draftStyle,
      kind: "straight",
      endHead: "none",
    });
  });

  it("follows the current arrow draft style after selecting another arrow default", () => {
    const arrowTool = new ArrowTool({
      defaults: [
        {
          id: "line",
          draftStyle: {
            endHead: "none",
          },
        },
      ],
    });
    const toolState = {
      [ARROW_TOOL_ID]: {
        draftStyle: {
          ...DEFAULT_ARROW_TOOL_STATE.draftStyle,
          endHead: "triangle" as const,
          kind: "wavy" as const,
        },
        pendingPoints: [],
      },
    };

    expect(
      getArrowToolIconDraftStyle({
        toolRegistry: createToolRegistry({ [ARROW_TOOL_ID]: arrowTool }),
        toolState,
      }),
    ).toEqual({
      ...DEFAULT_ARROW_TOOL_STATE.draftStyle,
      endHead: "triangle",
      kind: "wavy",
    });
  });
});

describe("getShapeToolIconDraftStyle", () => {
  it("uses the first registered shape default before the shape tool is activated", () => {
    const shapeTool = new ShapeTool({
      defaults: [
        {
          id: "triangle",
          draftStyle: {
            kind: "triangle",
          },
        },
      ],
    });

    expect(
      getShapeToolIconDraftStyle({
        toolRegistry: createToolRegistry({ [SHAPE_TOOL_ID]: shapeTool }),
        toolState: {},
      }),
    ).toEqual({
      ...DEFAULT_SHAPE_TOOL_STATE.draftStyle,
      kind: "triangle",
    });
  });

  it("follows the current shape draft style after selecting another shape default", () => {
    const shapeTool = new ShapeTool({
      defaults: [
        {
          id: "triangle",
          draftStyle: {
            kind: "triangle",
          },
        },
      ],
    });
    const toolState = {
      [SHAPE_TOOL_ID]: {
        draftStyle: {
          ...DEFAULT_SHAPE_TOOL_STATE.draftStyle,
          kind: "diamond" as const,
        },
        pendingPoints: [],
      },
    };

    expect(
      getShapeToolIconDraftStyle({
        toolRegistry: createToolRegistry({ [SHAPE_TOOL_ID]: shapeTool }),
        toolState,
      }),
    ).toEqual({
      ...DEFAULT_SHAPE_TOOL_STATE.draftStyle,
      kind: "diamond",
    });
  });
});

describe("getNextNumericPlayerLabel", () => {
  it("ignores non-numeric player labels", () => {
    expect(
      getNextNumericPlayerLabel(
        {
          objects: {
            byId: {
              player: {
                id: "player",
                type: "player",
                position: { x: 10, y: 10 },
                props: {
                  color: "#1f6feb",
                  label: "GK",
                },
              },
            },
            order: ["player"],
          },
        },
        "#1f6feb",
      ),
    ).toBe("1");
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

function createToolRegistry(
  definitions: ToolRegistry["definitions"] | PlayerTool,
): ToolRegistry {
  return {
    definitions:
      definitions instanceof PlayerTool
        ? { [PLAYER_TOOL_ID]: definitions }
        : definitions,
  };
}
