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
import type { ToolRegistration } from "../../../core/tools/types";
import type { BoardTheme, BoardThemeAdapters } from "./board-theme";
import { getThemeObjectDefinitions } from "./board-theme";
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
  extraTools?: ToolRegistration[];
};

export function createBoardTools({
  adapters,
  theme,
  defaults = {},
}: {
  theme?: BoardTheme;
  adapters?: BoardThemeAdapters;
  defaults?: BoardToolDefaults;
} = {}): ToolRegistration[] {
  const objectAdapterTools = (adapters?.objectAdapters ?? []).flatMap(
    (adapter) =>
      adapter.createTools?.({
        definitions: getThemeObjectDefinitions(theme, adapter.type),
        theme,
      }) ?? [],
  );

  return [
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
      defaults: defaults.shapes ?? BOARD_SHAPE_DEFAULTS,
      defaultPreviewSize: defaults.shapePreviewSize,
    }),
    ...(defaults.extraTools ?? []),
  ];
}
