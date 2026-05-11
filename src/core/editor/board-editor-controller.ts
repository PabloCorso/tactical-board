import type { BoardEditorState } from "./types";
import type { ObjectId, Point } from "../board/types";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import type { BoardEditorStore } from "../store/board-editor-store";
import type { ToolApi, ToolPointerEvent } from "../tools/types";

const SURFACE_INSET = 14;

export interface CanvasRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface BoardEditorPointerInput {
  clientPoint: Point;
  pointerId: number;
  ctrlKey: boolean;
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
    setPreviewObjects: actions.setPreviewObjects,
    clearPreviewObjects: actions.clearPreviewObjects,
    setOverlayItems: actions.setOverlayItems,
    clearOverlayItems: actions.clearOverlayItems,
    panViewport: actions.panViewport,
    setToolState: actions.setToolState,
    clearToolState: actions.clearToolState,
    registerObjectRenderer: actions.registerObjectRenderer,
    registerOverlayRenderer: actions.registerOverlayRenderer,
  };
}

function getBoardPoint(
  state: BoardEditorState,
  canvasRect: CanvasRect,
  clientPoint: Point,
): Point {
  const projection = createBoardSpaceProjection({
    surface: state.board.surface,
    viewport: state.ui.viewport,
    canvasRect,
    surfaceInset: SURFACE_INSET,
  });

  return projection.canvasToWorld({
    x: clientPoint.x - canvasRect.left,
    y: clientPoint.y - canvasRect.top,
  });
}

function getTargetObjectId(
  state: BoardEditorState,
  canvasRect: CanvasRect,
  clientPoint: Point,
): ObjectId | undefined {
  const projection = createBoardSpaceProjection({
    surface: state.board.surface,
    viewport: state.ui.viewport,
    canvasRect,
    surfaceInset: SURFACE_INSET,
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

    if (projection.hitTestObject(object, canvasPoint)) {
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
        canvasRect: input.canvasRect,
        pointerId: input.pointerId,
        targetObjectId: getTargetObjectId(
          state,
          input.canvasRect,
          input.clientPoint,
        ),
        ctrlKey: input.ctrlKey,
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
        canvasRect: input.canvasRect,
        pointerId: input.pointerId,
        ctrlKey: input.ctrlKey,
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
