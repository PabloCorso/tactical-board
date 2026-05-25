import { ARROW_OBJECT_TYPE } from "../../../core/objects/arrow-object";
import { EQUIPMENT_OBJECT_TYPE } from "../../../core/objects/equipment-object";
import { PLAYER_OBJECT_TYPE } from "../../../core/objects/player-object";
import { SHAPE_OBJECT_TYPE } from "../../../core/objects/shape-object";
import { TEXT_OBJECT_TYPE } from "../../../core/objects/text-object";
import type { CanvasObjectRendererRegistry } from "../../../core/rendering/canvas/types";
import { renderArrow } from "../../../core/tools/arrow-tool";
import { createEquipmentRenderer } from "../../../core/tools/equipment-tool";
import { renderPlayer } from "../../../core/tools/player-tool";
import { renderShape } from "../../../core/tools/shape-tool";
import { renderText } from "../../../core/tools/text-tool";
import type { BoardTheme } from "./board-theme";

export function createBoardObjectRenderers(
  theme?: Pick<BoardTheme, "equipment">,
): CanvasObjectRendererRegistry {
  return {
    [PLAYER_OBJECT_TYPE]: renderPlayer,
    [TEXT_OBJECT_TYPE]: renderText,
    [ARROW_OBJECT_TYPE]: renderArrow,
    [SHAPE_OBJECT_TYPE]: renderShape,
    ...(theme?.equipment
      ? {
          [EQUIPMENT_OBJECT_TYPE]: createEquipmentRenderer(
            theme.equipment.renderersByKind,
          ),
        }
      : {}),
  };
}
