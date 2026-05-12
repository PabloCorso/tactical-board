import type { BoardEditorState } from "./types";
import { createToolApi } from "./create-tool-api";
import type { ObjectId, Point } from "../board/types";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import type { BoardEditorStore } from "../store/board-editor-store";
import type { ToolPointerEvent, ToolWheelEvent } from "../tools/types";
import {
  getViewportForZoomAtCanvasPoint,
  VIEWPORT_WHEEL_ZOOM_SENSITIVITY,
} from "./viewport-utils";

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

export interface BoardEditorWheelInput {
  clientPoint: Point;
  deltaX: number;
  deltaY: number;
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
  dispatchWheelEvent: (input: BoardEditorWheelInput) => boolean;
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

    const hitTester = state.rendering.objectHitTesters[object.type];

    if (
      hitTester?.({
        object,
        canvasPoint,
        surfaceTransform: projection,
        minimumHitRadiusPx: 24,
      }) ??
      projection.hitTestObject(object, canvasPoint)
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
  const panViewportFromWheel = (input: BoardEditorWheelInput) => {
    const delta =
      input.shiftKey && input.deltaX === 0
        ? { x: -input.deltaY, y: 0 }
        : { x: -input.deltaX, y: -input.deltaY };

    if (delta.x === 0 && delta.y === 0) {
      return false;
    }

    store.getState().actions.panViewport(delta);
    return true;
  };
  const zoomViewportFromWheel = (input: BoardEditorWheelInput) => {
    const state = store.getState();
    const nextViewport = getViewportForZoomAtCanvasPoint({
      surface: state.board.surface,
      viewport: state.ui.viewport,
      canvasRect: input.canvasRect,
      anchorCanvasPoint: {
        x: input.clientPoint.x - input.canvasRect.left,
        y: input.clientPoint.y - input.canvasRect.top,
      },
      zoom:
        state.ui.viewport.zoom *
        Math.exp(-input.deltaY * VIEWPORT_WHEEL_ZOOM_SENSITIVITY),
    });

    state.actions.setViewport(nextViewport);
  };
  const getToolWheelEvent = (
    state: BoardEditorState,
    input: BoardEditorWheelInput,
  ): ToolWheelEvent => ({
    point: getBoardPoint(state, input.canvasRect, input.clientPoint),
    clientPoint: input.clientPoint,
    canvasRect: input.canvasRect,
    targetObjectId: getTargetObjectId(
      state,
      input.canvasRect,
      input.clientPoint,
    ),
    ctrlKey: input.ctrlKey,
    shiftKey: input.shiftKey,
    altKey: input.altKey,
    metaKey: input.metaKey,
    deltaX: input.deltaX,
    deltaY: input.deltaY,
  });

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
    dispatchWheelEvent: (input) => {
      if (input.ctrlKey || input.metaKey) {
        zoomViewportFromWheel(input);
        return true;
      }

      const state = store.getState();
      const currentTool = state.toolRegistry.definitions[state.ui.activeToolId];
      const handler = currentTool?.onWheel;

      if (!handler) {
        return panViewportFromWheel(input);
      }

      handler(getToolWheelEvent(state, input), toolApi);
      return true;
    },
  };
}
