import colors from "tailwindcss/colors";
import {
  DEFAULT_PLAYER_TRANSFORM_CAPABILITIES,
  resizePlayerObject,
  rotatePlayerObject,
  PLAYER_OBJECT_TYPE,
  type PlayerObject,
} from "../objects/player-object";
import type {
  ObjectSelectionAdapter,
  ObjectSelectionSession,
} from "../objects/object-selection";
import {
  getBoundsFromCanvasPoints,
  drawClosedCanvasPath,
  drawRoundedSquareHandle,
  getCornerHandleCanvasPoint,
  getExpandedCanvasRectPoints,
  getRotatedRectBoardPoints,
  getRotationFromPointer,
  getSelectionToolbarAnchorFromSelectionChrome,
  renderRotateHandleIcon,
} from "./selection-geometry";
import { getPlayerBorderWidth } from "../rendering/canvas/object-render-scale";

const PLAYER_SELECTION_PADDING_PX = 0.75;
const PLAYER_RESIZE_HANDLE_RADIUS_PX = 4;
const PLAYER_RESIZE_HANDLE_HIT_RADIUS_PX = 12;
const PLAYER_ROTATE_HANDLE_RADIUS_PX = 11;
const PLAYER_ROTATE_HANDLE_HIT_RADIUS_PX = 18;
const ROTATE_HANDLE_CORNER_INDEX = 3;
const ROTATE_HANDLE_CORNER_OFFSET_PX = 18;

function getPlayerTransformCapabilities(player: PlayerObject) {
  return {
    ...DEFAULT_PLAYER_TRANSFORM_CAPABILITIES,
    ...player.props.transformCapabilities,
  };
}

type PlayerSelectionSession = ObjectSelectionSession & {
  kind: "resize" | "rotate";
  handle?: "top-left" | "top-right" | "bottom-right" | "bottom-left";
  center: PlayerObject["position"];
  initialRotation?: number;
  initialPointerAngle?: number;
};

function getPlayerSelectionPaddingPx(
  projection: Parameters<
    NonNullable<ObjectSelectionAdapter<PlayerObject>["renderSelection"]>
  >[0]["projection"],
  player: PlayerObject,
) {
  const bounds = projection.getObjectCanvasBounds(player);
  const radius = Math.min(Math.abs(bounds.width), Math.abs(bounds.height)) / 2;

  return PLAYER_SELECTION_PADDING_PX + getPlayerBorderWidth(radius) / 2;
}

export function getPlayerSelectionOutlineCanvasPoints(
  projection: Parameters<
    NonNullable<ObjectSelectionAdapter<PlayerObject>["renderSelection"]>
  >[0]["projection"],
  player: PlayerObject,
) {
  return getExpandedCanvasRectPoints(
    getRotatedRectBoardPoints({
      center: player.position,
      width: player.size?.width ?? 0,
      height: player.size?.height ?? player.size?.width ?? 0,
      rotation: player.rotation,
    }).map((point) => projection.boardToCanvas(point)),
    getPlayerSelectionPaddingPx(projection, player),
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
  getTransformCapabilities: getPlayerTransformCapabilities,
  getCanvasBounds: ({ object, projection }) =>
    getBoundsFromCanvasPoints(
      getPlayerSelectionOutlineCanvasPoints(projection, object),
    ),
  renderSelection: ({ context, object, projection, color }) => {
    const outlinePoints = getPlayerSelectionOutlineCanvasPoints(
      projection,
      object,
    );
    const transformCapabilities = getPlayerTransformCapabilities(object);

    context.save();
    context.strokeStyle = color;
    context.lineWidth = 1.5;
    context.fillStyle = colors.white;
    drawClosedCanvasPath(context, outlinePoints);
    context.stroke();

    if (!object.locked) {
      if (transformCapabilities.resize !== false) {
        for (const handlePoint of outlinePoints) {
          drawRoundedSquareHandle(
            context,
            handlePoint,
            PLAYER_RESIZE_HANDLE_RADIUS_PX,
            2,
          );
          context.fill();
          context.stroke();
        }
      }

      if (transformCapabilities.rotate !== false) {
        renderRotateHandleIcon(
          context,
          getPlayerRotateHandleCanvasPoint(projection, object),
          PLAYER_ROTATE_HANDLE_RADIUS_PX,
          object.rotation,
        );
      }
    }

    context.restore();
  },
  hitSelectionHandle: ({ object, projection, event }) => {
    if (object.type !== PLAYER_OBJECT_TYPE || object.locked) {
      return undefined;
    }

    const transformCapabilities = getPlayerTransformCapabilities(object);
    const canvasPoint = projection.boardToCanvas(event.point);
    if (transformCapabilities.resize !== false) {
      const handlePoints = getPlayerSelectionOutlineCanvasPoints(
        projection,
        object,
      );

      for (const [index, handleCanvasPoint] of handlePoints.entries()) {
        const distance = Math.hypot(
          canvasPoint.x - handleCanvasPoint.x,
          canvasPoint.y - handleCanvasPoint.y,
        );

        if (distance <= PLAYER_RESIZE_HANDLE_HIT_RADIUS_PX) {
          return {
            kind: "resize",
            handle:
              index === 0
                ? "top-left"
                : index === 1
                  ? "top-right"
                  : index === 2
                    ? "bottom-right"
                    : "bottom-left",
            center: object.position,
          };
        }
      }
    }

    if (transformCapabilities.rotate === false) {
      return undefined;
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
    const transformCapabilities = getPlayerTransformCapabilities(object);
    const rotateHandlePoint =
      transformCapabilities.rotate === false
        ? undefined
        : getPlayerRotateHandleCanvasPoint(projection, object);

    return getSelectionToolbarAnchorFromSelectionChrome({
      left: projection.boardToCanvas(object.position).x,
      outlinePoints,
      rotateHandlePoint,
      rotateHandleRadiusPx: PLAYER_ROTATE_HANDLE_RADIUS_PX,
    });
  },
};
