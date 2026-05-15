import colors from "tailwindcss/colors";
import {
  resizeEquipmentObject,
  rotateEquipmentObject,
  EQUIPMENT_OBJECT_TYPE,
  type EquipmentObject,
} from "../core/objects/equipment-object";
import type {
  ObjectSelectionAdapter,
  ObjectSelectionSession,
} from "../core/objects/object-selection";
import { BoardEditorEquipmentSelectionToolbar } from "../react/components/board-editor-selection-toolbar-equipment";
import {
  drawClosedCanvasPath,
  getCornerHandleCanvasPoint,
  getRotationFromPointer,
  getSelectionToolbarAnchorFromSelectionChrome,
  renderRotateHandleIcon,
} from "./selection-geometry";
import { getEquipmentSelectionOutlineCanvasPoints } from "./equipment-geometry";

const EQUIPMENT_RESIZE_HANDLE_RADIUS_PX = 5;
const EQUIPMENT_RESIZE_HANDLE_HIT_RADIUS_PX = 12;
const EQUIPMENT_ROTATE_HANDLE_RADIUS_PX = 13;
const EQUIPMENT_ROTATE_HANDLE_HIT_RADIUS_PX = 18;
const ROTATE_HANDLE_CORNER_INDEX = 3;
const ROTATE_HANDLE_CORNER_OFFSET_PX = 18;

function getEquipmentTransformCapabilities(equipment: EquipmentObject) {
  return equipment.props.definition.transformCapabilities;
}

type EquipmentSelectionSession = ObjectSelectionSession & {
  kind: "resize" | "rotate";
  center: EquipmentObject["position"];
  initialRotation?: number;
  initialPointerAngle?: number;
  initialSize?: {
    width: number;
    height: number;
  };
  lockedAspectRatio?: boolean;
};

function getEquipmentRotateHandleCanvasPoint(
  projection: Parameters<
    NonNullable<ObjectSelectionAdapter<EquipmentObject>["renderSelection"]>
  >[0]["projection"],
  equipment: EquipmentObject,
) {
  return getCornerHandleCanvasPoint(
    getEquipmentSelectionOutlineCanvasPoints(projection, equipment),
    ROTATE_HANDLE_CORNER_INDEX,
    ROTATE_HANDLE_CORNER_OFFSET_PX,
  );
}

export const equipmentSelectionAdapter: ObjectSelectionAdapter<
  EquipmentObject,
  EquipmentSelectionSession
> = {
  getTransformCapabilities: getEquipmentTransformCapabilities,
  renderSelection: ({ context, object, projection, color }) => {
    const outlinePoints = getEquipmentSelectionOutlineCanvasPoints(
      projection,
      object,
    );
    const transformCapabilities = getEquipmentTransformCapabilities(object);

    context.save();
    context.strokeStyle = color;
    context.lineWidth = 1.5;
    context.fillStyle = colors.white;
    drawClosedCanvasPath(context, outlinePoints);
    context.stroke();

    if (!object.locked) {
      if (transformCapabilities?.resize !== false) {
        for (const handlePoint of outlinePoints) {
          context.beginPath();
          context.arc(
            handlePoint.x,
            handlePoint.y,
            EQUIPMENT_RESIZE_HANDLE_RADIUS_PX,
            0,
            Math.PI * 2,
          );
          context.fill();
          context.stroke();
        }
      }

      if (transformCapabilities?.rotate !== false) {
        renderRotateHandleIcon(
          context,
          getEquipmentRotateHandleCanvasPoint(projection, object),
          EQUIPMENT_ROTATE_HANDLE_RADIUS_PX,
          object.rotation,
        );
      }
    }

    context.restore();
  },
  hitSelectionHandle: ({ object, projection, event }) => {
    if (object.type !== EQUIPMENT_OBJECT_TYPE || object.locked) {
      return undefined;
    }

    const transformCapabilities = getEquipmentTransformCapabilities(object);
    const canvasPoint = projection.worldToCanvas(event.point);
    if (transformCapabilities?.resize !== false) {
      const handlePoints = getEquipmentSelectionOutlineCanvasPoints(
        projection,
        object,
      );

      for (const handleCanvasPoint of handlePoints) {
        const distance = Math.hypot(
          canvasPoint.x - handleCanvasPoint.x,
          canvasPoint.y - handleCanvasPoint.y,
        );

        if (distance <= EQUIPMENT_RESIZE_HANDLE_HIT_RADIUS_PX) {
          return {
            kind: "resize",
            center: object.position,
            initialSize: {
              width: object.size?.width ?? 0,
              height: object.size?.height ?? 0,
            },
            lockedAspectRatio:
              object.props.definition.lockedAspectRatio !== false,
          };
        }
      }
    }

    if (transformCapabilities?.rotate === false) {
      return undefined;
    }

    const rotateHandle = getEquipmentRotateHandleCanvasPoint(
      projection,
      object,
    );
    const rotateDistance = Math.hypot(
      canvasPoint.x - rotateHandle.x,
      canvasPoint.y - rotateHandle.y,
    );

    if (rotateDistance <= EQUIPMENT_ROTATE_HANDLE_HIT_RADIUS_PX) {
      return {
        kind: "rotate",
        center: object.position,
        initialRotation: object.rotation ?? 0,
        initialPointerAngle: Math.atan2(
          event.point.y - object.position.y,
          event.point.x - object.position.x,
        ),
      };
    }

    return undefined;
  },
  updateSelectionInteraction: ({ object, session, event }) => {
    if (session.kind === "rotate") {
      return rotateEquipmentObject(
        object,
        getRotationFromPointer(
          session.center,
          event.point,
          session.initialRotation ?? object.rotation ?? 0,
          session.initialPointerAngle ?? 0,
        ),
      );
    }

    const width = Math.max(
      Math.abs(event.point.x - session.center.x) * 2,
      0.25,
    );
    const height = Math.max(
      Math.abs(event.point.y - session.center.y) * 2,
      0.25,
    );

    if (!session.lockedAspectRatio) {
      return resizeEquipmentObject(object, { width, height });
    }

    const initialSize = session.initialSize ?? { width: 0.25, height: 0.25 };
    const baseWidth = Math.max(initialSize.width, 0.25);
    const baseHeight = Math.max(initialSize.height, 0.25);
    const scale = Math.max(width / baseWidth, height / baseHeight, 0.125);

    return resizeEquipmentObject(object, {
      width: baseWidth * scale,
      height: baseHeight * scale,
    });
  },
  getToolbarAnchor: ({ object, projection }) => {
    const outlinePoints = getEquipmentSelectionOutlineCanvasPoints(
      projection,
      object,
    );
    const transformCapabilities = getEquipmentTransformCapabilities(object);
    const rotateHandlePoint =
      transformCapabilities?.rotate === false
        ? undefined
        : getEquipmentRotateHandleCanvasPoint(projection, object);

    return getSelectionToolbarAnchorFromSelectionChrome({
      left: projection.worldToCanvas(object.position).x,
      outlinePoints,
      rotateHandlePoint,
      rotateHandleRadiusPx: EQUIPMENT_ROTATE_HANDLE_RADIUS_PX,
    });
  },
  toolbarRenderer: BoardEditorEquipmentSelectionToolbar,
};
