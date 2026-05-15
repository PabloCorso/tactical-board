import type { BoardSpaceProjection } from "../core/geometry/board-space-projection";
import type {
  EquipmentObject,
  EquipmentSelectionBounds,
} from "../core/objects/equipment-object";
import { rotateOffset } from "./selection-geometry";

const MIN_EQUIPMENT_RENDER_SIZE_PX = 8;

const DEFAULT_SELECTION_BOUNDS: EquipmentSelectionBounds = {
  left: -0.5,
  top: -0.5,
  right: 0.5,
  bottom: 0.5,
};

export function getEquipmentRenderedCanvasSize(
  projection: Pick<BoardSpaceProjection, "getObjectCanvasBounds">,
  equipment: EquipmentObject,
) {
  const bounds = projection.getObjectCanvasBounds(equipment);

  return {
    width: Math.max(MIN_EQUIPMENT_RENDER_SIZE_PX, Math.abs(bounds.width)),
    height: Math.max(MIN_EQUIPMENT_RENDER_SIZE_PX, Math.abs(bounds.height)),
  };
}

export function getEquipmentSelectionOutlineCanvasPoints(
  projection: Pick<
    BoardSpaceProjection,
    "getObjectCanvasBounds" | "worldToCanvas" | "pixelsPerUnit"
  >,
  equipment: EquipmentObject,
) {
  const bounds =
    equipment.props.definition.selectionBounds ?? DEFAULT_SELECTION_BOUNDS;
  const width =
    equipment.size?.mode === "screen"
      ? Math.max(
          (equipment.size?.width ?? 0) / Math.max(projection.pixelsPerUnit, 1),
          MIN_EQUIPMENT_RENDER_SIZE_PX /
            Math.max(projection.pixelsPerUnit, 1),
        )
      : Math.max(equipment.size?.width ?? 0, 0.25);
  const height =
    equipment.size?.mode === "screen"
      ? Math.max(
          (equipment.size?.height ?? equipment.size?.width ?? 0) /
            Math.max(projection.pixelsPerUnit, 1),
          MIN_EQUIPMENT_RENDER_SIZE_PX /
            Math.max(projection.pixelsPerUnit, 1),
        )
      : Math.max(equipment.size?.height ?? equipment.size?.width ?? 0, 0.25);

  return [
    { x: width * bounds.left, y: height * bounds.top },
    { x: width * bounds.right, y: height * bounds.top },
    { x: width * bounds.right, y: height * bounds.bottom },
    { x: width * bounds.left, y: height * bounds.bottom },
  ].map((point) => {
    const rotated = rotateOffset(point.x, point.y, equipment.rotation);

    return projection.worldToCanvas({
      x: equipment.position.x + rotated.x,
      y: equipment.position.y + rotated.y,
    });
  });
}
