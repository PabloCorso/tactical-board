import colors from "tailwindcss/colors";
import type {
  ObjectSelectionAdapter,
  ObjectSelectionSession,
} from "../objects/object-selection";
import { updateTextObject, type TextObject } from "../objects/text-object";
import {
  drawClosedCanvasPath,
  getBoundsFromCanvasPoints,
  getCornerHandleCanvasPoint,
  getRotationFromPointer,
  getSelectionToolbarAnchorFromSelectionChrome,
  renderRotateHandleIcon,
  rotateOffset,
} from "./selection-geometry";

const TEXT_SELECTION_PADDING_PX = 0;
const TEXT_ROTATE_HANDLE_RADIUS_PX = 11;
const TEXT_ROTATE_HANDLE_HIT_RADIUS_PX = 18;
const ROTATE_HANDLE_CORNER_INDEX = 3;
const ROTATE_HANDLE_CORNER_OFFSET_PX = 18;

type TextSelectionSession = ObjectSelectionSession & {
  kind: "rotate";
  center: TextObject["position"];
  initialRotation: number;
  initialPointerAngle: number;
};

function getTextSelectionOutlineCanvasPoints(
  projection: Parameters<
    NonNullable<ObjectSelectionAdapter<TextObject>["renderSelection"]>
  >[0]["projection"],
  object: TextObject,
) {
  const bounds = projection.getObjectCanvasBounds(object);
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  const halfWidth = bounds.width / 2 + TEXT_SELECTION_PADDING_PX;
  const halfHeight = bounds.height / 2 + TEXT_SELECTION_PADDING_PX;

  return [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ].map((point) => {
    const rotated = rotateOffset(point.x, point.y, object.rotation);

    return {
      x: center.x + rotated.x,
      y: center.y + rotated.y,
    };
  });
}

function getTextRotateHandleCanvasPoint(
  projection: Parameters<
    NonNullable<ObjectSelectionAdapter<TextObject>["renderSelection"]>
  >[0]["projection"],
  object: TextObject,
) {
  return getCornerHandleCanvasPoint(
    getTextSelectionOutlineCanvasPoints(projection, object),
    ROTATE_HANDLE_CORNER_INDEX,
    ROTATE_HANDLE_CORNER_OFFSET_PX,
  );
}

export const textSelectionAdapter: ObjectSelectionAdapter<
  TextObject,
  TextSelectionSession
> = {
  getCanvasBounds: ({ object, projection }) =>
    getBoundsFromCanvasPoints(
      getTextSelectionOutlineCanvasPoints(projection, object),
    ),
  renderSelection: ({
    context,
    object,
    projection,
    color,
    showControls = true,
  }) => {
    context.save();
    context.strokeStyle = color;
    context.lineWidth = 1.5;
    context.fillStyle = colors.white;
    drawClosedCanvasPath(
      context,
      getTextSelectionOutlineCanvasPoints(projection, object),
    );
    context.stroke();

    if (showControls) {
      renderRotateHandleIcon(
        context,
        getTextRotateHandleCanvasPoint(projection, object),
        TEXT_ROTATE_HANDLE_RADIUS_PX,
        object.rotation,
      );
    }

    context.restore();
  },
  hitSelectionHandle: ({ object, projection, event }) => {
    const canvasPoint = projection.boardToCanvas(event.point);
    const rotateHandle = getTextRotateHandleCanvasPoint(projection, object);
    const rotateDistance = Math.hypot(
      canvasPoint.x - rotateHandle.x,
      canvasPoint.y - rotateHandle.y,
    );

    if (rotateDistance > TEXT_ROTATE_HANDLE_HIT_RADIUS_PX) {
      return undefined;
    }

    return {
      kind: "rotate",
      center: object.position,
      initialRotation: object.rotation ?? 0,
      initialPointerAngle: Math.atan2(
        event.point.y - object.position.y,
        event.point.x - object.position.x,
      ),
    };
  },
  updateSelectionInteraction: ({ object, session, event }) =>
    updateTextObject(object, {
      rotation: getRotationFromPointer(
        session.center,
        event.point,
        session.initialRotation,
        session.initialPointerAngle,
      ),
    }),
  getToolbarAnchor: ({ object, projection }) => {
    const outlinePoints = getTextSelectionOutlineCanvasPoints(
      projection,
      object,
    );

    return getSelectionToolbarAnchorFromSelectionChrome({
      left: projection.boardToCanvas(object.position).x,
      outlinePoints,
      rotateHandlePoint: getTextRotateHandleCanvasPoint(projection, object),
      rotateHandleRadiusPx: TEXT_ROTATE_HANDLE_RADIUS_PX,
    });
  },
};
