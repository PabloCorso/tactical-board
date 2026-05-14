import type { BoardSpaceProjection } from "../core/geometry/board-space-projection";
import type {
  EquipmentObject,
  EquipmentSelectionBounds,
} from "../core/objects/equipment-object";
import { rotatePointAround } from "./selection-geometry";

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
    "getObjectCanvasBounds" | "worldToCanvas"
  >,
  equipment: EquipmentObject,
) {
  const center = projection.worldToCanvas(equipment.position);
  const { width, height } = getEquipmentRenderedCanvasSize(projection, equipment);
  const bounds =
    equipment.props.definition.selectionBounds ?? DEFAULT_SELECTION_BOUNDS;
  const angle = ((equipment.rotation ?? 0) * Math.PI) / 180;

  return [
    { x: center.x + width * bounds.left, y: center.y + height * bounds.top },
    { x: center.x + width * bounds.right, y: center.y + height * bounds.top },
    {
      x: center.x + width * bounds.right,
      y: center.y + height * bounds.bottom,
    },
    {
      x: center.x + width * bounds.left,
      y: center.y + height * bounds.bottom,
    },
  ].map((point) => rotatePointAround(point, center, angle));
}
