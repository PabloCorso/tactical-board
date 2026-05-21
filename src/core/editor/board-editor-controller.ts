import type { BoardEditorState } from "./types";
import { createToolApi } from "./create-tool-api";
import { getOrderedBoardObjectIds } from "../board/object-order";
import type { ObjectId, Point } from "../board/types";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import type { BoardEditorStore } from "../store/board-editor-store";
import type { ToolPointerEvent, ToolWheelEvent } from "../tools/types";
import {
  getViewportForZoomAtCanvasPoint,
  VIEWPORT_WHEEL_ZOOM_SENSITIVITY,
} from "./viewport-utils";

const SURFACE_INSET = 14;
const POINTER_DRAG_THRESHOLD_PX = 4;

export interface CanvasRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface BoardEditorPointerInput {
  clientPoint: Point;
  pointerId: number;
  button?: number;
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

  return projection.canvasToBoard({
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

  const orderedObjectIds = getOrderedBoardObjectIds(state.board);

  for (let index = orderedObjectIds.length - 1; index >= 0; index -= 1) {
    const objectId = orderedObjectIds[index];
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
  const pointerInteractions = new Map<
    number,
    { startClientPoint: Point; dragged: boolean }
  >();
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
      const interaction = pointerInteractions.get(input.pointerId);
      const startClientPoint =
        interaction?.startClientPoint ?? input.clientPoint;

      return {
        point,
        clientPoint: input.clientPoint,
        canvasRect: input.canvasRect,
        pointerId: input.pointerId,
        button: input.button ?? 0,
        interactionStartPoint: getBoardPoint(
          state,
          input.canvasRect,
          startClientPoint,
        ),
        interactionStartClientPoint: startClientPoint,
        draggedSincePointerDown: interaction?.dragged ?? false,
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
      if (handlerName === "onPointerDown") {
        pointerInteractions.set(input.pointerId, {
          startClientPoint: input.clientPoint,
          dragged: false,
        });
      } else if (handlerName === "onPointerMove") {
        const interaction = pointerInteractions.get(input.pointerId);

        if (interaction && !interaction.dragged) {
          const dx = input.clientPoint.x - interaction.startClientPoint.x;
          const dy = input.clientPoint.y - interaction.startClientPoint.y;

          if (Math.hypot(dx, dy) >= POINTER_DRAG_THRESHOLD_PX) {
            pointerInteractions.set(input.pointerId, {
              ...interaction,
              dragged: true,
            });
          }
        }
      }

      const state = store.getState();
      const currentTool = state.toolRegistry.definitions[state.ui.activeToolId];
      const handler = currentTool?.[handlerName];

      if (!handler) {
        if (handlerName === "onPointerUp") {
          pointerInteractions.delete(input.pointerId);
        }
        return;
      }

      const interaction = pointerInteractions.get(input.pointerId);
      const startClientPoint =
        interaction?.startClientPoint ?? input.clientPoint;
      const toolPointerEvent = {
        point: getBoardPoint(state, input.canvasRect, input.clientPoint),
        clientPoint: input.clientPoint,
        canvasRect: input.canvasRect,
        pointerId: input.pointerId,
        button: input.button ?? 0,
        interactionStartPoint: getBoardPoint(
          state,
          input.canvasRect,
          startClientPoint,
        ),
        interactionStartClientPoint: startClientPoint,
        draggedSincePointerDown: interaction?.dragged ?? false,
        ctrlKey: input.ctrlKey,
        shiftKey: input.shiftKey,
        altKey: input.altKey,
        metaKey: input.metaKey,
      };

      handler.call(
        currentTool,
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

      if (handlerName === "onPointerUp") {
        pointerInteractions.delete(input.pointerId);
      }
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
