import type { BoardEditorState } from "../core/editor/types";
import type {
  ToolActionDefinition,
  ToolApi,
  ToolCapabilityRegistrationApi,
  ToolDefinition,
  ToolPointerEvent,
} from "../core/tools/types";
import { BoardEditorTool } from "../core/tools/tool";
import { createBoardSpaceProjection } from "../core/geometry/board-space-projection";
import type {
  CanvasOverlayItem,
  CanvasOverlayRenderInput,
  CanvasRectOverlayItem,
  CanvasOverlayRenderer,
} from "../rendering/canvas/types";
import type { BoardObject } from "../core/board/types";
import {
  getObjectSelectionAdapterForObject,
  type ObjectSelectionAdapter,
  type ObjectSelectionInteraction,
  type SelectionProjection,
} from "../core/objects/object-selection";
import {
  getSelectToolState,
  type SelectToolState,
  SELECT_TOOL_ID,
} from "./select-tool-state";
import { clearSelection, setSelectedObjectIds } from "./select-tool-actions";
import colors from "tailwindcss/colors";

const SURFACE_INSET = 14;
const DEFAULT_SELECTION_COLOR = colors.sky[400];
const SELECTION_OVERLAY_KIND = "select:selection-ring";

const DISABLED_SELECTION_ACTIONS: ToolActionDefinition[] = [
  {
    id: "duplicate-selection",
    label: "Duplicate",
    icon: { kind: "system", value: "duplicate" },
    tooltip: "Duplicate",
    disabled: true,
    onSelect: duplicateSelection,
  },
  {
    id: "delete-selection",
    label: "Delete",
    icon: { kind: "system", value: "delete" },
    tooltip: "Delete",
    disabled: true,
    onSelect: deleteSelection,
  },
];

const ENABLED_SELECTION_ACTIONS: ToolActionDefinition[] = [
  {
    id: "duplicate-selection",
    label: "Duplicate",
    icon: { kind: "system", value: "duplicate" },
    tooltip: "Duplicate",
    disabled: false,
    onSelect: duplicateSelection,
  },
  {
    id: "delete-selection",
    label: "Delete",
    icon: { kind: "system", value: "delete" },
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
  object: BoardObject;
  color: string;
  selectionAdapter?: ObjectSelectionAdapter;
  [key: string]: unknown;
}

export class SelectTool extends BoardEditorTool implements ToolDefinition {
  readonly id = SELECT_TOOL_ID;
  readonly label = "Select";

  getSecondaryActions(state: BoardEditorState) {
    return getSelectSecondaryActions(state);
  }

  getOverlayItems(state: BoardEditorState) {
    return getSelectOverlayItems(state);
  }

  onDeactivate(api: ToolApi) {
    clearSelection(api);
  }

  registerCapabilities(api: ToolCapabilityRegistrationApi) {
    registerSelectOverlayRenderer(api.registerOverlayRenderer);
  }

  onPointerDown(event: ToolPointerEvent, api: ToolApi) {
    beginSelectionInteraction(
      event,
      api,
      getSelectToolState(api.getState().toolState),
    );
  }

  onPointerMove(event: ToolPointerEvent, api: ToolApi) {
    updateSelectionInteraction(event, api);
  }

  onPointerUp(_event: ToolPointerEvent, api: ToolApi) {
    setSelectState(api, {
      interaction: undefined,
    });
  }
}

function isSelectionOverlayItem(
  overlay: CanvasOverlayItem,
): overlay is SelectionOverlayItem {
  return (
    "kind" in overlay &&
    overlay.kind === SELECTION_OVERLAY_KIND &&
    "object" in overlay
  );
}

function isAdditiveSelectionModifierPressed(event: {
  ctrlKey: boolean;
  metaKey: boolean;
}) {
  return event.ctrlKey || event.metaKey;
}

function getSelectionBounds(
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  return {
    left: Math.min(start.x, end.x),
    right: Math.max(start.x, end.x),
    top: Math.min(start.y, end.y),
    bottom: Math.max(start.y, end.y),
  };
}

function withAlpha(color: string, alpha: number) {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  const rounded = Math.round(clampedAlpha * 255);
  const alphaHex = rounded.toString(16).padStart(2, "0");

  return `${color}${alphaHex}`;
}

function getSelectionAccentColor(
  state: BoardEditorState,
  selectState: SelectToolState,
) {
  void state;
  void selectState;
  return DEFAULT_SELECTION_COLOR;
}

function getMarqueeObjectIds(
  state: BoardEditorState,
  canvasRect: ToolPointerEvent["canvasRect"],
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
  accentColor: string,
): CanvasRectOverlayItem {
  return {
    kind: "rect",
    coordinateSpace: "world",
    x: Math.min(marquee.origin.x, marquee.current.x),
    y: Math.min(marquee.origin.y, marquee.current.y),
    width: Math.abs(marquee.current.x - marquee.origin.x),
    height: Math.abs(marquee.current.y - marquee.origin.y),
    fill: withAlpha(accentColor, 0.14),
    stroke: withAlpha(accentColor, 0.85),
    lineWidth: 1,
  };
}

function createSelectionOverlayItems(
  state: BoardEditorState,
): SelectionOverlayItem[] {
  const selectState = getSelectToolState(state.toolState);
  const accentColor = getSelectionAccentColor(state, selectState);

  return selectState.selectedObjectIds.flatMap((objectId) => {
    const object = state.board.objects.byId[objectId];

    return object
      ? [
          {
            kind: SELECTION_OVERLAY_KIND,
            object,
            color: accentColor,
            selectionAdapter: getObjectSelectionAdapterForObject(state, object),
          } satisfies SelectionOverlayItem,
        ]
      : [];
  });
}

function getSelectOverlayItems(
  state: BoardEditorState,
): Array<CanvasRectOverlayItem | SelectionOverlayItem> {
  const selectState = getSelectToolState(state.toolState);
  const accentColor = getSelectionAccentColor(state, selectState);

  if (
    cachedSelectionOverlayItems?.selectState === selectState &&
    cachedSelectionOverlayItems.objectsById === state.board.objects.byId
  ) {
    return cachedSelectionOverlayItems.overlays;
  }

  const overlays: Array<CanvasRectOverlayItem | SelectionOverlayItem> =
    createSelectionOverlayItems(state);

  if (selectState.interaction?.mode === "marquee") {
    overlays.push(
      createMarqueeOverlayItem(selectState.interaction, accentColor),
    );
  }

  cachedSelectionOverlayItems = {
    objectsById: state.board.objects.byId,
    selectState,
    overlays,
  };

  return overlays;
}

function registerSelectOverlayRenderer(
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

      if (!overlay.selectionAdapter?.renderSelection) {
        return;
      }

      overlay.selectionAdapter.renderSelection({
        context,
        object: overlay.object,
        projection: surfaceTransform as SelectionProjection,
        color: overlay.color,
      });
    },
  );
}

function setSelectState(api: ToolApi, value: Partial<SelectToolState>) {
  const selectState = getSelectToolState(api.getState().toolState);

  api.setToolState(SELECT_TOOL_ID, {
    ...selectState,
    ...value,
  } satisfies SelectToolState);
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

function beginSelectionInteraction(
  event: ToolPointerEvent,
  api: ToolApi,
  selectState: SelectToolState,
) {
  const state = api.getState();
  const projection = createBoardSpaceProjection({
    surface: state.board.surface,
    viewport: state.ui.viewport,
    canvasRect: event.canvasRect,
    surfaceInset: SURFACE_INSET,
  });

  for (const objectId of selectState.selectedObjectIds) {
    const object = state.board.objects.byId[objectId];
    const selectionAdapter = getObjectSelectionAdapterForObject(state, object);
    const session = object
      ? selectionAdapter?.hitSelectionHandle?.({
          state,
          object,
          projection: projection as SelectionProjection,
          event,
        })
      : undefined;

    if (object && session) {
      setSelectState(api, {
        selectedObjectIds: [object.id],
        interaction: {
          mode: "object-selection",
          objectId: object.id,
          session,
        } satisfies ObjectSelectionInteraction,
      });
      return;
    }
  }

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
}

function updateMarqueeSelection(
  event: ToolPointerEvent,
  api: ToolApi,
  interaction: Extract<
    NonNullable<SelectToolState["interaction"]>,
    { mode: "marquee" }
  >,
) {
  const nextInteraction = {
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
    nextInteraction,
  );
  const nextSelection = [
    ...new Set([...nextInteraction.baseSelection, ...marqueeObjectIds]),
  ];

  setSelectState(api, {
    selectedObjectIds: nextSelection,
    interaction: nextInteraction,
  });
}

function updateDragInteraction(
  event: ToolPointerEvent,
  api: ToolApi,
  interaction: Extract<
    NonNullable<SelectToolState["interaction"]>,
    { mode: "drag" }
  >,
) {
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
}

function updateSelectionInteraction(event: ToolPointerEvent, api: ToolApi) {
  const selectState = getSelectToolState(api.getState().toolState);
  const interaction = selectState.interaction;

  if (!interaction) {
    return;
  }

  switch (interaction.mode) {
    case "marquee":
      updateMarqueeSelection(event, api, interaction);
      return;
    case "drag":
      updateDragInteraction(event, api, interaction);
      return;
    case "object-selection":
      api.updateObjects([interaction.objectId], (object) => {
        if (!object || object.locked) {
          return object;
        }

        const selectionAdapter = getObjectSelectionAdapterForObject(
          api.getState(),
          object,
        );

        return (
          selectionAdapter?.updateSelectionInteraction?.({
            object,
            session: interaction.session,
            event,
          }) ?? object
        );
      });
      return;
  }
}
