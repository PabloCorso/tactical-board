import type { BoardEditorState } from "../core/editor/types";
import type { CanvasRect } from "../core/editor/board-editor-controller";
import type { ToolDefinition } from "../core/tools/types";
import { createBoardSurfaceTransform } from "../core/geometry/create-board-surface-transform";

interface SelectDragState {
  mode: "drag";
  dragObjectIds: string[];
  lastPoint: {
    x: number;
    y: number;
  };
}

interface SelectMarqueeState {
  mode: "marquee";
  origin: {
    x: number;
    y: number;
  };
  current: {
    x: number;
    y: number;
  };
  baseSelection: string[];
}

type SelectToolState = SelectDragState | SelectMarqueeState;

const SURFACE_INSET = 14;
const DEFAULT_OBJECT_DIAMETER = 1.8;

function isAdditiveSelectionModifierPressed(event: {
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}) {
  return event.shiftKey || event.metaKey || event.ctrlKey;
}

function getSelectionBounds(
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  return {
    left: Math.min(start.x, end.x),
    top: Math.min(start.y, end.y),
    right: Math.max(start.x, end.x),
    bottom: Math.max(start.y, end.y),
  };
}

function getMarqueeObjectIds(
  state: BoardEditorState,
  canvasRect: CanvasRect,
  marquee: SelectMarqueeState,
) {
  const transform = createBoardSurfaceTransform({
    surface: state.board.surface,
    frame: {
      x: SURFACE_INSET + state.ui.viewport.pan.x,
      y: SURFACE_INSET + state.ui.viewport.pan.y,
      width: canvasRect.width - SURFACE_INSET * 2,
      height: canvasRect.height - SURFACE_INSET * 2,
    },
  });
  const marqueeStart = transform.worldToCanvas(marquee.origin);
  const marqueeEnd = transform.worldToCanvas(marquee.current);
  const marqueeBounds = getSelectionBounds(marqueeStart, marqueeEnd);

  return state.board.objects.order.filter((objectId) => {
    const object = state.board.objects.byId[objectId];
    if (!object) {
      return false;
    }

    const objectPoint = transform.worldToCanvas(object.position);
    const objectHalfWidthPx =
      object.size && object.size.mode !== "screen"
        ? ((object.size.width || DEFAULT_OBJECT_DIAMETER) / 2) *
          transform.pixelsPerUnit
        : (object.size?.width || DEFAULT_OBJECT_DIAMETER) / 2;
    const objectHalfHeightPx =
      object.size && object.size.mode !== "screen"
        ? ((object.size.height ||
            object.size.width ||
            DEFAULT_OBJECT_DIAMETER) /
            2) *
          transform.pixelsPerUnit
        : (object.size?.height ||
            object.size?.width ||
            DEFAULT_OBJECT_DIAMETER) / 2;
    const objectBounds = {
      left: objectPoint.x - objectHalfWidthPx,
      top: objectPoint.y - objectHalfHeightPx,
      right: objectPoint.x + objectHalfWidthPx,
      bottom: objectPoint.y + objectHalfHeightPx,
    };

    return !(
      marqueeBounds.right < objectBounds.left ||
      marqueeBounds.left > objectBounds.right ||
      marqueeBounds.bottom < objectBounds.top ||
      marqueeBounds.top > objectBounds.bottom
    );
  });
}

export const selectTool: ToolDefinition = {
  id: "select",
  label: "Select",
  onPointerDown: (event, api) => {
    const state = api.getState();

    if (event.targetObjectId) {
      const hasAdditiveModifier = isAdditiveSelectionModifierPressed(event);
      const objectIsSelected = state.ui.selectedObjectIds.includes(
        event.targetObjectId,
      );
      const nextSelection = hasAdditiveModifier
        ? objectIsSelected
          ? state.ui.selectedObjectIds.filter(
              (objectId) => objectId !== event.targetObjectId,
            )
          : [...state.ui.selectedObjectIds, event.targetObjectId]
        : objectIsSelected
          ? state.ui.selectedObjectIds
          : [event.targetObjectId];

      api.setSelectedObjectIds(nextSelection);

      if (hasAdditiveModifier) {
        api.clearToolState("select");
        return;
      }

      api.setToolState("select", {
        mode: "drag",
        dragObjectIds: nextSelection,
        lastPoint: event.point,
      } satisfies SelectDragState);
      return;
    }

    const preserveExistingSelection = isAdditiveSelectionModifierPressed(event);

    if (!preserveExistingSelection) {
      api.clearSelection();
    }

    api.setToolState("select", {
      mode: "marquee",
      origin: event.point,
      current: event.point,
      baseSelection: preserveExistingSelection
        ? state.ui.selectedObjectIds
        : [],
    } satisfies SelectMarqueeState);
  },
  onPointerMove: (event, api) => {
    const toolState = api.getState().toolState.select as
      | SelectToolState
      | undefined;
    if (!toolState) {
      return;
    }

    if (toolState.mode === "marquee") {
      const nextToolState = {
        ...toolState,
        current: event.point,
      } satisfies SelectMarqueeState;
      const state = api.getState();
      const marqueeObjectIds = getMarqueeObjectIds(
        state,
        event.canvasRect,
        nextToolState,
      );

      api.setSelectedObjectIds([
        ...new Set([...toolState.baseSelection, ...marqueeObjectIds]),
      ]);
      api.setToolState("select", nextToolState);
      return;
    }

    const delta = {
      x: event.point.x - toolState.lastPoint.x,
      y: event.point.y - toolState.lastPoint.y,
    };

    if (delta.x === 0 && delta.y === 0) {
      return;
    }

    api.moveObjects(toolState.dragObjectIds, delta);
    api.setToolState("select", {
      ...toolState,
      lastPoint: event.point,
    } satisfies SelectDragState);
  },
  onPointerUp: (_event, api) => {
    api.clearToolState("select");
  },
};
