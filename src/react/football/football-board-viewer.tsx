import { useMemo } from "react";
import { ARROW_OBJECT_TYPE } from "../../core/objects/arrow-object";
import { EQUIPMENT_OBJECT_TYPE } from "../../core/objects/equipment-object";
import { PLAYER_OBJECT_TYPE } from "../../core/objects/player-object";
import { SHAPE_OBJECT_TYPE } from "../../core/objects/shape-object";
import { TEXT_OBJECT_TYPE } from "../../core/objects/text-object";
import type { CanvasObjectRendererRegistry } from "../../core/rendering/canvas/types";
import { renderArrow } from "../../core/tools/arrow-tool";
import { createEquipmentRenderer } from "../../core/tools/equipment-tool";
import { renderShape } from "../../core/tools/shape-tool";
import { renderText } from "../../core/tools/text-tool";
import {
  BoardViewerCanvas,
  type BoardViewerCanvasProps,
} from "../components/board-viewer";
import { FOOTBALL_EQUIPMENT_RENDERERS } from "./equipment";
import { renderFootballPlayer } from "./football-tools";

export const FOOTBALL_OBJECT_RENDERERS = {
  [PLAYER_OBJECT_TYPE]: renderFootballPlayer,
  [EQUIPMENT_OBJECT_TYPE]: createEquipmentRenderer(
    FOOTBALL_EQUIPMENT_RENDERERS,
  ),
  [TEXT_OBJECT_TYPE]: renderText,
  [ARROW_OBJECT_TYPE]: renderArrow,
  [SHAPE_OBJECT_TYPE]: renderShape,
} satisfies CanvasObjectRendererRegistry;

export function getFootballObjectRenderers(
  objectRenderers?: CanvasObjectRendererRegistry,
): CanvasObjectRendererRegistry {
  return {
    ...FOOTBALL_OBJECT_RENDERERS,
    ...objectRenderers,
  };
}

export type FootballBoardViewerCanvasProps = BoardViewerCanvasProps;

export function FootballBoardViewerCanvas({
  objectRenderers,
  ...props
}: FootballBoardViewerCanvasProps) {
  const mergedObjectRenderers = useMemo(
    () => getFootballObjectRenderers(objectRenderers),
    [objectRenderers],
  );

  return (
    <BoardViewerCanvas
      {...props}
      objectRenderers={mergedObjectRenderers}
    />
  );
}
