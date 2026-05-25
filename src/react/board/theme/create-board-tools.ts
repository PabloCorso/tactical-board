import {
  ArrowTool,
  type ArrowToolDefault,
} from "../../../core/tools/arrow-tool";
import { EquipmentTool } from "../../../core/tools/equipment-tool";
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
import type { BoardTheme } from "./board-theme";
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
  theme,
  defaults = {},
}: {
  theme?: Pick<BoardTheme, "equipment">;
  defaults?: BoardToolDefaults;
} = {}): ToolRegistration[] {
  return [
    new SelectTool(),
    new HandTool(),
    new PlayerTool({
      defaults: defaults.players ?? BOARD_PLAYER_DEFAULTS,
    }),
    ...(theme?.equipment
      ? [
          new EquipmentTool({
            definitions: theme.equipment.definitions,
            renderersByKind: theme.equipment.renderersByKind,
          }),
        ]
      : []),
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
