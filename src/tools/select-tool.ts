import type { BoardEditorState } from "../core/editor/types";
import type { CanvasRect } from "../core/editor/board-editor-controller";
import type {
  ToolActionDefinition,
  ToolApi,
  ToolDefinition,
} from "../core/tools/types";
import { createBoardSpaceProjection } from "../core/geometry/board-space-projection";
import type {
  CanvasOverlayRenderInput,
  CanvasRectOverlayItem,
  CanvasOverlayRenderer,
} from "../rendering/canvas/types";
import type { BoardObjectBase, ObjectId } from "../core/board/types";
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
const DISABLED_SELECTION_ACTIONS: ToolActionDefinition[] = [
  {
    id: "duplicate-selection",
    label: "Duplicate",
    tooltip: "Duplicate",
    disabled: true,
    onSelect: duplicateSelection,
  },
  {
    id: "delete-selection",
    label: "Delete",
    tooltip: "Delete",
    disabled: true,
    onSelect: deleteSelection,
  },
];
const ENABLED_SELECTION_ACTIONS: ToolActionDefinition[] = [
  {
    id: "duplicate-selection",
    label: "Duplicate",
    tooltip: "Duplicate",
    disabled: false,
    onSelect: duplicateSelection,
  },
  {
    id: "delete-selection",
    label: "Delete",
    tooltip: "Delete",
    disabled: false,
    onSelect: deleteSelection,
  },
];

let cachedSelectionOverlayItems:
  | {
      objectsById: BoardEditorState["board"]["objects"]["byId"];
      selectState: SelectToolState;
      overlays: Array<CanvasRectOverlayItem | SelectionOverlayItem>;
    }
  | undefined;
let cachedSecondaryActions:
  | {
      selectState: SelectToolState;
      actions: ToolActionDefinition[];
    }
  | undefined;

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

export function getSelectOverlayItems(
  state: BoardEditorState,
): Array<CanvasRectOverlayItem | SelectionOverlayItem> {
  const selectState = getSelectToolState(state.toolState);

  if (
    cachedSelectionOverlayItems?.selectState === selectState &&
    cachedSelectionOverlayItems.objectsById === state.board.objects.byId
  ) {
    return cachedSelectionOverlayItems.overlays;
  }

  const overlays: Array<CanvasRectOverlayItem | SelectionOverlayItem> =
    createSelectionOverlayItems(state);

  if (selectState.interaction?.mode === "marquee") {
    overlays.push(createMarqueeOverlayItem(selectState.interaction));
  }

  cachedSelectionOverlayItems = {
    objectsById: state.board.objects.byId,
    selectState,
    overlays,
  };

  return overlays;
}

export function registerSelectOverlayRenderer(
  registerOverlayRenderer: (
    overlayKind: string,
    renderer: CanvasOverlayRenderer,
  ) => void,
) {
  registerOverlayRenderer(
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
}

function setSelectState(
  api: ToolApi,
  value: Partial<SelectToolState>,
) {
  const selectState = getSelectToolState(api.getState().toolState);

  api.setToolState(SELECT_TOOL_ID, {
    ...selectState,
    ...value,
  } satisfies SelectToolState);
}

function setSelectedObjectIds(api: ToolApi, objectIds: ObjectId[]) {
  setSelectState(api, {
    selectedObjectIds: [...objectIds],
  });
}

function clearSelection(api: ToolApi) {
  setSelectState(api, {
    selectedObjectIds: [],
    interaction: undefined,
  });
}

function duplicateSelection(api: ToolApi) {
  const { selectedObjectIds } = getSelectToolState(api.getState().toolState);
  const duplicateIds = api.duplicateObjects(selectedObjectIds);

  setSelectedObjectIds(api, duplicateIds);
}

function deleteSelection(api: ToolApi) {
  const { selectedObjectIds } = getSelectToolState(api.getState().toolState);
  api.deleteObjects(selectedObjectIds);
  clearSelection(api);
}

function getSelectSecondaryActions(
  state: BoardEditorState,
): ToolActionDefinition[] {
  const selectState = getSelectToolState(state.toolState);

  if (cachedSecondaryActions?.selectState === selectState) {
    return cachedSecondaryActions.actions;
  }

  const actions =
    selectState.selectedObjectIds.length > 0
      ? ENABLED_SELECTION_ACTIONS
      : DISABLED_SELECTION_ACTIONS;

  cachedSecondaryActions = {
    selectState,
    actions,
  };

  return actions;
}

export const selectTool: ToolDefinition = {
  id: SELECT_TOOL_ID,
  label: "Select",
  getSecondaryActions: getSelectSecondaryActions,
  getOverlayItems: getSelectOverlayItems,
  registerRenderers: (api) => {
    registerSelectOverlayRenderer(api.registerOverlayRenderer);
  },
  onPointerDown: (event, api) => {
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

      if (hasAdditiveModifier) {
        setSelectState(api, {
          selectedObjectIds: nextSelection,
          interaction: undefined,
        });
        return;
      }

      setSelectState(api, {
        selectedObjectIds: nextSelection,
        interaction: {
          mode: "drag",
          dragObjectIds: nextSelection,
          lastPoint: event.point,
        },
      });
      return;
    }

    const preserveExistingSelection = isAdditiveSelectionModifierPressed(event);

    if (!preserveExistingSelection) {
      clearSelection(api);
    }

    const baseSelection = preserveExistingSelection
      ? selectState.selectedObjectIds
      : [];
    setSelectState(api, {
      selectedObjectIds: baseSelection,
      interaction: {
        mode: "marquee",
        origin: event.point,
        current: event.point,
        baseSelection,
      },
    });
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

      setSelectState(api, {
        selectedObjectIds: nextSelection,
        interaction: nextToolState,
      });
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
    setSelectState(api, {
      interaction: {
        ...interaction,
        lastPoint: event.point,
      },
    });
  },
  onPointerUp: (_event, api) => {
    setSelectState(api, {
      interaction: undefined,
    });
  },
};
