import colors from "tailwindcss/colors";
import {
  resizePlayerObject,
  rotatePlayerObject,
  PLAYER_OBJECT_TYPE,
  type PlayerObject,
} from "../core/objects/player-object";
import type {
  ObjectSelectionAdapter,
  ObjectSelectionSession,
} from "../core/objects/object-selection";
import { BoardEditorPlayerSelectionToolbar } from "../react/components/board-editor-selection-toolbar-player";
import {
  drawClosedCanvasPath,
  getCornerHandleCanvasPoint,
  getExpandedCanvasRectPoints,
  getRotatedRectWorldPoints,
  getRotationFromPointer,
  getSelectionToolbarAnchorFromSelectionChrome,
  renderRotateHandleIcon,
} from "./selection-geometry";

const PLAYER_SELECTION_PADDING_PX = 0.75;
const PLAYER_RESIZE_HANDLE_RADIUS_PX = 5;
const PLAYER_RESIZE_HANDLE_HIT_RADIUS_PX = 12;
const PLAYER_ROTATE_HANDLE_RADIUS_PX = 13;
const PLAYER_ROTATE_HANDLE_HIT_RADIUS_PX = 18;
const ROTATE_HANDLE_CORNER_INDEX = 3;
const ROTATE_HANDLE_CORNER_OFFSET_PX = 18;
type PlayerSelectionSession = ObjectSelectionSession & {
  kind: "resize" | "rotate";
  center: PlayerObject["position"];
  initialRotation?: number;
  initialPointerAngle?: number;
};

function getPlayerSelectionOutlineCanvasPoints(
  projection: Parameters<
    NonNullable<ObjectSelectionAdapter<PlayerObject>["renderSelection"]>
  >[0]["projection"],
  player: PlayerObject,
) {
  return getExpandedCanvasRectPoints(
    getRotatedRectWorldPoints({
      center: player.position,
      width: player.size?.width ?? 0,
      height: player.size?.height ?? player.size?.width ?? 0,
      rotation: player.rotation,
    }).map((point) => projection.worldToCanvas(point)),
    PLAYER_SELECTION_PADDING_PX,
  );
}

function getPlayerRotateHandleCanvasPoint(
  projection: Parameters<
    NonNullable<ObjectSelectionAdapter<PlayerObject>["renderSelection"]>
  >[0]["projection"],
  player: PlayerObject,
) {
  return getCornerHandleCanvasPoint(
    getPlayerSelectionOutlineCanvasPoints(projection, player),
    ROTATE_HANDLE_CORNER_INDEX,
    ROTATE_HANDLE_CORNER_OFFSET_PX,
  );
}

export const playerSelectionAdapter: ObjectSelectionAdapter<
  PlayerObject,
  PlayerSelectionSession
> = {
  renderSelection: ({ context, object, projection, color }) => {
    const outlinePoints = getPlayerSelectionOutlineCanvasPoints(
      projection,
      object,
    );

    context.save();
    context.strokeStyle = color;
    context.lineWidth = 1.5;
    context.fillStyle = colors.white;
    drawClosedCanvasPath(context, outlinePoints);
    context.stroke();

    if (!object.locked) {
      for (const handlePoint of outlinePoints) {
        context.beginPath();
        context.arc(
          handlePoint.x,
          handlePoint.y,
          PLAYER_RESIZE_HANDLE_RADIUS_PX,
          0,
          Math.PI * 2,
        );
        context.fill();
        context.stroke();
      }

      renderRotateHandleIcon(
        context,
        getPlayerRotateHandleCanvasPoint(projection, object),
        PLAYER_ROTATE_HANDLE_RADIUS_PX,
        object.rotation,
      );
    }

    context.restore();
  },
  hitSelectionHandle: ({ object, projection, event }) => {
    if (object.type !== PLAYER_OBJECT_TYPE || object.locked) {
      return undefined;
    }

    const canvasPoint = projection.worldToCanvas(event.point);
    const handlePoints = getPlayerSelectionOutlineCanvasPoints(
      projection,
      object,
    );

    for (const handleCanvasPoint of handlePoints) {
      const distance = Math.hypot(
        canvasPoint.x - handleCanvasPoint.x,
        canvasPoint.y - handleCanvasPoint.y,
      );

      if (distance <= PLAYER_RESIZE_HANDLE_HIT_RADIUS_PX) {
        return {
          kind: "resize",
          center: object.position,
        };
      }
    }

    const rotateHandle = getPlayerRotateHandleCanvasPoint(projection, object);
    const rotateDistance = Math.hypot(
      canvasPoint.x - rotateHandle.x,
      canvasPoint.y - rotateHandle.y,
    );

    if (rotateDistance <= PLAYER_ROTATE_HANDLE_HIT_RADIUS_PX) {
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
    if (session.kind === "resize") {
      const halfSize = Math.max(
        Math.abs(event.point.x - session.center.x),
        Math.abs(event.point.y - session.center.y),
        0.125,
      );

      return resizePlayerObject(object, halfSize * 2);
    }

    return rotatePlayerObject(
      object,
      getRotationFromPointer(
        session.center,
        event.point,
        session.initialRotation ?? object.rotation ?? 0,
        session.initialPointerAngle ?? 0,
      ),
    );
  },
  getToolbarAnchor: ({ object, projection }) => {
    const outlinePoints = getPlayerSelectionOutlineCanvasPoints(
      projection,
      object,
    );
    const rotateHandlePoint = getPlayerRotateHandleCanvasPoint(
      projection,
      object,
    );

    return getSelectionToolbarAnchorFromSelectionChrome({
      left: projection.worldToCanvas(object.position).x,
      outlinePoints,
      rotateHandlePoint,
      rotateHandleRadiusPx: PLAYER_ROTATE_HANDLE_RADIUS_PX,
    });
  },
  toolbarRenderer: BoardEditorPlayerSelectionToolbar,
};
