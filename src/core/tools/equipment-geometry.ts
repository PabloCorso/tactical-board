import type { BoardSpaceProjection } from "../geometry/board-space-projection";
import type { EquipmentObject } from "../objects/equipment-object";
import {
  getExpandedCanvasRectPoints,
  getRotatedRectBoardPoints,
  SELECTION_OUTLINE_PADDING_PX,
} from "./selection-geometry";

/**
 * Equipment rendering and selection share the Object's size as their single
 * local frame. The selection outline sits directly outside that frame so its
 * inner stroke edge meets, but never covers, the rendered equipment.
 */
export function getEquipmentSelectionOutlineCanvasPoints(
  projection: Pick<BoardSpaceProjection, "boardToCanvas">,
  equipment: EquipmentObject,
) {
  return getExpandedCanvasRectPoints(
    getRotatedRectBoardPoints({
      center: equipment.position,
      width: equipment.size?.width ?? 0,
      height: equipment.size?.height ?? equipment.size?.width ?? 0,
      rotation: equipment.rotation,
    }).map((point) => projection.boardToCanvas(point)),
    SELECTION_OUTLINE_PADDING_PX,
  );
}
