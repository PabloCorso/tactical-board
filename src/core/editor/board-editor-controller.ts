import type { BoardEditorState } from "./types";
import type { ObjectId, Point } from "../board/types";
import type { BoardEditorStore } from "../store/create-board-editor-store";
import type { ToolApi, ToolPointerEvent } from "../tools/types";

const HIT_TEST_RADIUS = 3;

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
  ui: BoardEditorState["ui"],
  canvasRect: CanvasRect,
  clientPoint: Point,
): Point {
  return {
    x:
      ((clientPoint.x - canvasRect.left - ui.viewport.pan.x) /
        canvasRect.width) *
      100,
    y:
      ((clientPoint.y - canvasRect.top - ui.viewport.pan.y) /
        canvasRect.height) *
      100,
  };
}

function getTargetObjectId(
  state: BoardEditorState,
  point: Point,
): ObjectId | undefined {
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

    if (
      Math.abs(point.x - object.position.x) <= HIT_TEST_RADIUS &&
      Math.abs(point.y - object.position.y) <= HIT_TEST_RADIUS
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
      const point = getBoardPoint(
        state.ui,
        input.canvasRect,
        input.clientPoint,
      );

      return {
        point,
        clientPoint: input.clientPoint,
        pointerId: input.pointerId,
        targetObjectId: getTargetObjectId(state, point),
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
        point: getBoardPoint(state.ui, input.canvasRect, input.clientPoint),
        clientPoint: input.clientPoint,
        pointerId: input.pointerId,
        shiftKey: input.shiftKey,
        altKey: input.altKey,
        metaKey: input.metaKey,
      };

      handler(
        {
          ...toolPointerEvent,
          targetObjectId: getTargetObjectId(state, toolPointerEvent.point),
        },
        toolApi,
      );
    },
  };
}
