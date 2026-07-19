import {
  ArrowTool,
  type ArrowToolDefault,
} from "../../../core/tools/arrow-tool";
import { HandTool } from "../../../core/tools/hand-tool";
import {
  PlayerTool,
  type PlayerToolDefault,
} from "../../../core/tools/player-tool";
import { SelectTool } from "../../../core/tools/select-tool";
import {
  ShapeTool,
  type ShapeToolDefault,
} from "../../../core/tools/shape-tool";
import { TextTool } from "../../../core/tools/text-tool";
import type { ToolDefinition } from "../../../core/tools/types";
import type { ObjectDefinition } from "../../../core/objects/types";
import type { BoardTheme, BoardThemeAdapters } from "./board-theme";
import { getThemeObjectDefinitions } from "./board-theme";
import { createBoardObjectDefinitions } from "./create-board-object-definitions";
import {
  BOARD_ARROW_DEFAULTS,
  BOARD_PLAYER_DEFAULTS,
  BOARD_SHAPE_DEFAULTS,
} from "./board-tool-defaults";

export type BoardToolDefaults = {
  arrows?: ArrowToolDefault[];
  players?: PlayerToolDefault[];
  shapes?: ShapeToolDefault[];
  shapePreviewSize?: {
    width: number;
    height: number;
  };
};

export type BoardEditorConfig = {
  adapters?: BoardThemeAdapters;
  objectDefinitions: ReturnType<typeof createBoardObjectDefinitions>;
  theme?: BoardTheme;
  tools: ToolDefinition[];
};

function createTools({
  adapters,
  theme,
  defaults = {},
  tools = [],
}: {
  theme?: BoardTheme;
  adapters?: BoardThemeAdapters;
  defaults?: BoardToolDefaults;
  tools?: ToolDefinition[];
} = {}): ToolDefinition[] {
  const objectAdapterTools = (adapters?.objectAdapters ?? []).flatMap(
    (adapter) =>
      adapter.createTools?.({
        definitions: getThemeObjectDefinitions(theme, adapter.type),
        theme,
      }) ?? [],
  );

  const definitions = [
    new SelectTool(),
    new HandTool(),
    new PlayerTool({
      defaults: defaults.players ?? BOARD_PLAYER_DEFAULTS,
    }),
    ...objectAdapterTools,
    new TextTool(),
    new ArrowTool({
      defaults: defaults.arrows ?? BOARD_ARROW_DEFAULTS,
    }),
    new ShapeTool({
      completion: "select-created",
      defaults: defaults.shapes ?? BOARD_SHAPE_DEFAULTS,
      defaultPreviewSize: defaults.shapePreviewSize,
    }),
    ...tools,
  ];

  return [...new Map(definitions.map((tool) => [tool.id, tool])).values()];
}

export function createBoardEditorConfig(
  options: {
    theme?: BoardTheme;
    adapters?: BoardThemeAdapters;
    defaults?: BoardToolDefaults;
    objectDefinitions?: ObjectDefinition[];
    tools?: ToolDefinition[];
  } = {},
) {
  return {
    adapters: options.adapters,
    objectDefinitions: createBoardObjectDefinitions(options),
    theme: options.theme,
    tools: createTools(options),
  } satisfies BoardEditorConfig;
}
