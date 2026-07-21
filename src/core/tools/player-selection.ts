import colors from "tailwindcss/colors";
import {
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
  SELECTION_OUTLINE_PADDING_PX,
  SELECTION_OUTLINE_WIDTH_PX,
  getSelectionToolbarAnchorFromSelectionChrome,
  renderRotateHandleIcon,
} from "./selection-geometry";
import {
  getPlayerCaptionCanvasBounds,
  getPlayerCaptionText,
} from "./player-geometry";
import { getPlayerWithEffectiveStyle } from "../board/player-style";

const PLAYER_RESIZE_HANDLE_RADIUS_PX = 4;
const PLAYER_RESIZE_HANDLE_HIT_RADIUS_PX = 12;
const PLAYER_ROTATE_HANDLE_RADIUS_PX = 11;
const PLAYER_ROTATE_HANDLE_HIT_RADIUS_PX = 18;
const ROTATE_HANDLE_CORNER_INDEX = 3;
const ROTATE_HANDLE_CORNER_OFFSET_PX = 18;

type PlayerSelectionSession = ObjectSelectionSession & {
  kind: "resize" | "rotate";
  handle?: "top-left" | "top-right" | "bottom-right" | "bottom-left";
  center: PlayerObject["position"];
  initialRotation?: number;
  initialPointerAngle?: number;
};

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
    SELECTION_OUTLINE_PADDING_PX,
  );
}

function getPlayerCaptionSelectionOutlineCanvasPoints(
  projection: Parameters<
    NonNullable<ObjectSelectionAdapter<PlayerObject>["renderSelection"]>
  >[0]["projection"],
  player: PlayerObject,
) {
  const bounds = getPlayerCaptionCanvasBounds(player, projection);

  if (!bounds) {
    return [];
  }

  return getExpandedCanvasRectPoints(
    [
      { x: bounds.x, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { x: bounds.x, y: bounds.y + bounds.height },
    ],
    SELECTION_OUTLINE_PADDING_PX,
  );
}

function getPlayerSelectionCanvasBounds(
  projection: Parameters<
    NonNullable<ObjectSelectionAdapter<PlayerObject>["renderSelection"]>
  >[0]["projection"],
  player: PlayerObject,
) {
  return getBoundsFromCanvasPoints([
    ...getPlayerSelectionOutlineCanvasPoints(projection, player),
    ...getPlayerCaptionSelectionOutlineCanvasPoints(projection, player),
  ]);
}

export function getPlayerRotateHandleCanvasPoint(
  projection: Parameters<
    NonNullable<ObjectSelectionAdapter<PlayerObject>["renderSelection"]>
  >[0]["projection"],
  player: PlayerObject,
) {
  const placement = getPlayerCaptionText(player)
    ? (player.props.caption?.style?.placement ?? "bottom")
    : undefined;
  const cornerIndex =
    placement === "top"
      ? 2
      : placement === "bottom"
        ? 0
        : placement === "left"
          ? 1
          : ROTATE_HANDLE_CORNER_INDEX;

  return getCornerHandleCanvasPoint(
    getPlayerSelectionOutlineCanvasPoints(projection, player),
    cornerIndex,
    ROTATE_HANDLE_CORNER_OFFSET_PX,
  );
}

export const playerSelectionAdapter: ObjectSelectionAdapter<
  PlayerObject,
  PlayerSelectionSession
> = {
  getCanvasBounds: ({ board, object, projection }) => {
    const player = getPlayerWithEffectiveStyle(board, object);

    return getPlayerSelectionCanvasBounds(projection, player);
  },
  renderSelection: ({
    board,
    context,
    object,
    projection,
    color,
    showControls = true,
  }) => {
    const player = getPlayerWithEffectiveStyle(board, object);
    const outlinePoints = getPlayerSelectionOutlineCanvasPoints(
      projection,
      player,
    );
    context.save();
    context.strokeStyle = color;
    context.lineWidth = SELECTION_OUTLINE_WIDTH_PX;
    context.fillStyle = colors.white;
    drawClosedCanvasPath(context, outlinePoints);
    context.stroke();

    if (showControls) {
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

      renderRotateHandleIcon(
        context,
        getPlayerRotateHandleCanvasPoint(projection, player),
        PLAYER_ROTATE_HANDLE_RADIUS_PX,
        player.rotation,
      );
    }

    context.restore();
  },
  hitSelectionHandle: ({ state, object, projection, event }) => {
    if (object.type !== PLAYER_OBJECT_TYPE) {
      return undefined;
    }

    const player = getPlayerWithEffectiveStyle(state.board, object);
    const canvasPoint = projection.boardToCanvas(event.point);
    const handlePoints = getPlayerSelectionOutlineCanvasPoints(
      projection,
      player,
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
          center: player.position,
        };
      }
    }

    const rotateHandle = getPlayerRotateHandleCanvasPoint(projection, player);
    const rotateDistance = Math.hypot(
      canvasPoint.x - rotateHandle.x,
      canvasPoint.y - rotateHandle.y,
    );

    if (rotateDistance <= PLAYER_ROTATE_HANDLE_HIT_RADIUS_PX) {
      return {
        kind: "rotate",
        center: player.position,
        initialRotation: player.rotation ?? 0,
        initialPointerAngle: Math.atan2(
          event.point.y - player.position.y,
          event.point.x - player.position.x,
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
  getToolbarAnchor: ({ board, object, projection }) => {
    const player = getPlayerWithEffectiveStyle(board, object);
    const outlinePoints = getPlayerSelectionOutlineCanvasPoints(
      projection,
      player,
    );
    const rotateHandlePoint = getPlayerRotateHandleCanvasPoint(
      projection,
      player,
    );

    return getSelectionToolbarAnchorFromSelectionChrome({
      left: projection.boardToCanvas(player.position).x,
      outlinePoints,
      rotateHandlePoint,
      rotateHandleRadiusPx: PLAYER_ROTATE_HANDLE_RADIUS_PX,
    });
  },
};
