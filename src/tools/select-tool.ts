import type { BoardEditorState } from "../core/editor/types";
import type { CanvasRect } from "../core/editor/board-editor-controller";
import type { ToolDefinition } from "../core/tools/types";
import { createBoardSpaceProjection } from "../core/geometry/board-space-projection";
import type {
  CanvasOverlayRenderInput,
  CanvasRectOverlayItem,
} from "../rendering/canvas/types";
import type { BoardObjectBase } from "../core/board/types";
import {
  getSelectToolState,
  type SelectToolState,
  SELECT_TOOL_ID,
} from "./select-tool-state";

const SURFACE_INSET = 14;
const MARQUEE_FILL = "rgba(255,143,61,0.14)";
const MARQUEE_STROKE = "rgba(255,143,61,0.9)";
const SELECTION_STROKE = "#ff8f3d";
const SELECTION_OVERLAY_KIND = "select:selection-ring";

interface SelectionOverlayItem {
  kind: typeof SELECTION_OVERLAY_KIND;
  object: BoardObjectBase;
  [key: string]: unknown;
}

function isSelectionOverlayItem(
  overlay: CanvasOverlayRenderInput["overlay"],
): overlay is SelectionOverlayItem {
  return (
    overlay.kind === SELECTION_OVERLAY_KIND &&
    "object" in overlay &&
    typeof overlay.object === "object" &&
    overlay.object !== null
  );
}

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
  marquee: Extract<
    NonNullable<SelectToolState["interaction"]>,
    { mode: "marquee" }
  >,
) {
  const projection = createBoardSpaceProjection({
    surface: state.board.surface,
    viewport: state.ui.viewport,
    canvasRect,
    surfaceInset: SURFACE_INSET,
  });
  const marqueeStart = projection.worldToCanvas(marquee.origin);
  const marqueeEnd = projection.worldToCanvas(marquee.current);
  const marqueeBounds = getSelectionBounds(marqueeStart, marqueeEnd);

  return state.board.objects.order.filter((objectId) => {
    const object = state.board.objects.byId[objectId];
    if (!object) {
      return false;
    }

    const objectBounds = projection.getObjectCanvasBounds(object);

    return !(
      marqueeBounds.right < objectBounds.x ||
      marqueeBounds.left > objectBounds.x + objectBounds.width ||
      marqueeBounds.bottom < objectBounds.y ||
      marqueeBounds.top > objectBounds.y + objectBounds.height
    );
  });
}

function createMarqueeOverlayItem(
  marquee: Extract<
    NonNullable<SelectToolState["interaction"]>,
    { mode: "marquee" }
  >,
): CanvasRectOverlayItem {
  return {
    kind: "rect",
    coordinateSpace: "world",
    x: Math.min(marquee.origin.x, marquee.current.x),
    y: Math.min(marquee.origin.y, marquee.current.y),
    width: Math.abs(marquee.current.x - marquee.origin.x),
    height: Math.abs(marquee.current.y - marquee.origin.y),
    fill: MARQUEE_FILL,
    stroke: MARQUEE_STROKE,
    lineWidth: 1.5,
    lineDash: [6, 4],
  };
}

function createSelectionOverlayItems(
  state: BoardEditorState,
): SelectionOverlayItem[] {
  const selectState = getSelectToolState(state.toolState);

  return selectState.selectedObjectIds.flatMap((objectId) => {
    const object = state.board.objects.byId[objectId];

    return object
      ? [
          {
            kind: SELECTION_OVERLAY_KIND,
            object,
          } satisfies SelectionOverlayItem,
        ]
      : [];
  });
}

function createSelectOverlayItems(
  state: BoardEditorState,
): Array<CanvasRectOverlayItem | SelectionOverlayItem> {
  const selectState = getSelectToolState(state.toolState);
  const overlays: Array<CanvasRectOverlayItem | SelectionOverlayItem> =
    createSelectionOverlayItems(state);

  if (selectState.interaction?.mode === "marquee") {
    overlays.push(createMarqueeOverlayItem(selectState.interaction));
  }

  return overlays;
}

function syncSelectRendering(
  api: Parameters<NonNullable<ToolDefinition["onPointerDown"]>>[1],
) {
  api.registerOverlayRenderer(
    SELECTION_OVERLAY_KIND,
    ({ context, overlay, surfaceTransform }: CanvasOverlayRenderInput) => {
      if (!isSelectionOverlayItem(overlay)) {
        return;
      }

      const selectionOverlay = overlay;
      const center = surfaceTransform.worldToCanvas(
        selectionOverlay.object.position,
      );
      const radius =
        surfaceTransform.getObjectCanvasRadius(selectionOverlay.object) + 4;

      context.save();
      context.beginPath();
      context.arc(center.x, center.y, radius, 0, Math.PI * 2);
      context.strokeStyle = SELECTION_STROKE;
      context.lineWidth = 3;
      context.stroke();
      context.restore();
    },
  );

  api.setOverlayItems(createSelectOverlayItems(api.getState()));
}

export const selectTool: ToolDefinition = {
  id: SELECT_TOOL_ID,
  label: "Select",
  onPointerDown: (event, api) => {
    syncSelectRendering(api);
    const state = api.getState();
    const selectState = getSelectToolState(state.toolState);

    if (event.targetObjectId) {
      const hasAdditiveModifier = isAdditiveSelectionModifierPressed(event);
      const objectIsSelected = selectState.selectedObjectIds.includes(
        event.targetObjectId,
      );
      const nextSelection = hasAdditiveModifier
        ? objectIsSelected
          ? selectState.selectedObjectIds.filter(
              (objectId) => objectId !== event.targetObjectId,
            )
          : [...selectState.selectedObjectIds, event.targetObjectId]
        : objectIsSelected
          ? selectState.selectedObjectIds
          : [event.targetObjectId];

      api.setSelectedObjectIds(nextSelection);

      if (hasAdditiveModifier) {
        api.setToolState(SELECT_TOOL_ID, {
          ...selectState,
          selectedObjectIds: nextSelection,
          interaction: undefined,
        } satisfies SelectToolState);
        syncSelectRendering(api);
        return;
      }

      api.setToolState(SELECT_TOOL_ID, {
        selectedObjectIds: nextSelection,
        interaction: {
          mode: "drag",
          dragObjectIds: nextSelection,
          lastPoint: event.point,
        },
      } satisfies SelectToolState);
      syncSelectRendering(api);
      return;
    }

    const preserveExistingSelection = isAdditiveSelectionModifierPressed(event);

    if (!preserveExistingSelection) {
      api.clearSelection();
    }

    const baseSelection = preserveExistingSelection
      ? selectState.selectedObjectIds
      : [];
    api.setToolState(SELECT_TOOL_ID, {
      selectedObjectIds: baseSelection,
      interaction: {
        mode: "marquee",
        origin: event.point,
        current: event.point,
        baseSelection,
      },
    } satisfies SelectToolState);
    syncSelectRendering(api);
  },
  onPointerMove: (event, api) => {
    const selectState = getSelectToolState(api.getState().toolState);
    const interaction = selectState.interaction;
    if (!interaction) {
      return;
    }

    if (interaction.mode === "marquee") {
      const nextToolState = {
        ...interaction,
        current: event.point,
      } satisfies Extract<
        NonNullable<SelectToolState["interaction"]>,
        { mode: "marquee" }
      >;
      const state = api.getState();
      const marqueeObjectIds = getMarqueeObjectIds(
        state,
        event.canvasRect,
        nextToolState,
      );
      const nextSelection = [
        ...new Set([...nextToolState.baseSelection, ...marqueeObjectIds]),
      ];

      api.setOverlayItems([createMarqueeOverlayItem(nextToolState)]);
      api.setToolState(SELECT_TOOL_ID, {
        selectedObjectIds: nextSelection,
        interaction: nextToolState,
      } satisfies SelectToolState);
      syncSelectRendering(api);
      return;
    }

    const delta = {
      x: event.point.x - interaction.lastPoint.x,
      y: event.point.y - interaction.lastPoint.y,
    };

    if (delta.x === 0 && delta.y === 0) {
      return;
    }

    api.moveObjects(interaction.dragObjectIds, delta);
    api.setToolState(SELECT_TOOL_ID, {
      ...selectState,
      interaction: {
        ...interaction,
        lastPoint: event.point,
      },
    } satisfies SelectToolState);
    syncSelectRendering(api);
  },
  onPointerUp: (_event, api) => {
    const selectState = getSelectToolState(api.getState().toolState);
    api.setToolState(SELECT_TOOL_ID, {
      ...selectState,
      interaction: undefined,
    } satisfies SelectToolState);
    syncSelectRendering(api);
  },
};
