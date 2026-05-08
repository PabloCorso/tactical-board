import type { BoardEditorState } from "./types";
import type { ObjectId, Point } from "../board/types";
import { createBoardSurfaceTransform } from "../geometry/create-board-surface-transform";
import type { BoardEditorStore } from "../store/create-board-editor-store";
import type { ToolApi, ToolPointerEvent } from "../tools/types";

const SURFACE_INSET = 14;
const DEFAULT_OBJECT_DIAMETER = 1.8;
const HIT_TEST_RADIUS_PX = 24;

export interface CanvasRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface BoardEditorPointerInput {
  clientPoint: Point;
  pointerId: number;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  canvasRect: CanvasRect;
}

export interface BoardEditorController {
  createToolPointerEvent: (input: BoardEditorPointerInput) => ToolPointerEvent;
  dispatchPointerEvent: (
    handlerName: "onPointerDown" | "onPointerMove" | "onPointerUp",
    input: BoardEditorPointerInput,
  ) => void;
}

function createToolApi(store: BoardEditorStore): ToolApi {
  const actions = store.getState().actions;

  return {
    getState: () => store.getState(),
    moveObjects: actions.moveObjects,
    setSelectedObjectIds: actions.setSelectedObjectIds,
    clearSelection: actions.clearSelection,
    panViewport: actions.panViewport,
    setToolState: actions.setToolState,
    clearToolState: actions.clearToolState,
  };
}

function getBoardPoint(
  state: BoardEditorState,
  canvasRect: CanvasRect,
  clientPoint: Point,
): Point {
  const transform = createBoardSurfaceTransform({
    surface: state.board.surface,
    frame: {
      x: SURFACE_INSET + state.ui.viewport.pan.x,
      y: SURFACE_INSET + state.ui.viewport.pan.y,
      width: canvasRect.width - SURFACE_INSET * 2,
      height: canvasRect.height - SURFACE_INSET * 2,
    },
  });

  return transform.canvasToWorld({
    x: clientPoint.x - canvasRect.left,
    y: clientPoint.y - canvasRect.top,
  });
}

function getTargetObjectId(
  state: BoardEditorState,
  canvasRect: CanvasRect,
  clientPoint: Point,
): ObjectId | undefined {
  const transform = createBoardSurfaceTransform({
    surface: state.board.surface,
    frame: {
      x: SURFACE_INSET + state.ui.viewport.pan.x,
      y: SURFACE_INSET + state.ui.viewport.pan.y,
      width: canvasRect.width - SURFACE_INSET * 2,
      height: canvasRect.height - SURFACE_INSET * 2,
    },
  });
  const canvasPoint = {
    x: clientPoint.x - canvasRect.left,
    y: clientPoint.y - canvasRect.top,
  };

  for (
    let index = state.board.objects.order.length - 1;
    index >= 0;
    index -= 1
  ) {
    const objectId = state.board.objects.order[index];
    const object = state.board.objects.byId[objectId];
    if (!object) {
      continue;
    }

    const objectPoint = transform.worldToCanvas(object.position);
    const objectRadiusPx =
      object.size && object.size.mode !== "screen"
        ? (object.size.width / 2) * transform.pixelsPerUnit
        : object.size?.width
          ? object.size.width / 2
          : (DEFAULT_OBJECT_DIAMETER / 2) * transform.pixelsPerUnit;
    if (
      Math.hypot(canvasPoint.x - objectPoint.x, canvasPoint.y - objectPoint.y) <=
      Math.max(HIT_TEST_RADIUS_PX, objectRadiusPx)
    ) {
      return object.id;
    }
  }

  return undefined;
}

export function createBoardEditorController(
  store: BoardEditorStore,
): BoardEditorController {
  const toolApi = createToolApi(store);

  return {
    createToolPointerEvent: (input) => {
      const state = store.getState();
      const point = getBoardPoint(state, input.canvasRect, input.clientPoint);

      return {
        point,
        clientPoint: input.clientPoint,
        pointerId: input.pointerId,
        targetObjectId: getTargetObjectId(
          state,
          input.canvasRect,
          input.clientPoint,
        ),
        shiftKey: input.shiftKey,
        altKey: input.altKey,
        metaKey: input.metaKey,
      };
    },
    dispatchPointerEvent: (handlerName, input) => {
      const state = store.getState();
      const currentTool = state.toolRegistry.definitions[state.ui.activeToolId];
      const handler = currentTool?.[handlerName];

      if (!handler) {
        return;
      }

      const toolPointerEvent = {
        point: getBoardPoint(state, input.canvasRect, input.clientPoint),
        clientPoint: input.clientPoint,
        pointerId: input.pointerId,
        shiftKey: input.shiftKey,
        altKey: input.altKey,
        metaKey: input.metaKey,
      };

      handler(
        {
          ...toolPointerEvent,
          targetObjectId: getTargetObjectId(
            state,
            input.canvasRect,
            input.clientPoint,
          ),
        },
        toolApi,
      );
    },
  };
}
