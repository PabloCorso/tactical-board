import type { BoardEditorState } from "../core/editor/types";
import type { CanvasRect } from "../core/editor/board-editor-controller";
import type {
  ToolActionDefinition,
  ToolApi,
  ToolDefinition,
  ToolPointerEvent,
} from "../core/tools/types";
import { createBoardSpaceProjection } from "../core/geometry/board-space-projection";
import type {
  CanvasOverlayRenderInput,
  CanvasRectOverlayItem,
  CanvasOverlayRenderer,
} from "../rendering/canvas/types";
import type { BoardObject } from "../core/board/types";
import {
  ARROW_OBJECT_TYPE,
  type ArrowObject,
} from "../core/objects/arrow-object";
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
const ARROW_ENDPOINT_HANDLE_RADIUS_PX = 5;
const ARROW_ENDPOINT_HANDLE_HIT_RADIUS_PX = 12;
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
  object: BoardObject;
  color: string;
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

function withAlpha(color: string, alpha: number) {
  const hex = color.trim().replace("#", "");
  const normalizedHex =
    hex.length === 3
      ? hex
          .split("")
          .map((part) => `${part}${part}`)
          .join("")
      : hex;

  if (!/^[\da-fA-F]{6}$/.test(normalizedHex)) {
    return `rgba(56, 189, 248, ${alpha})`;
  }

  const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getSelectionAccentColor(
  state: BoardEditorState,
  selectState: SelectToolState,
) {
  const prioritizedIds = [
    ...selectState.selectedObjectIds,
    ...(selectState.interaction?.mode === "marquee"
      ? selectState.interaction.baseSelection
      : []),
  ];

  for (const objectId of prioritizedIds) {
    const object = state.board.objects.byId[objectId];
    if (typeof object?.props.color === "string") {
      return object.props.color;
    }
  }

  return DEFAULT_SELECTION_COLOR;
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
          } satisfies SelectionOverlayItem,
        ]
      : [];
  });
}

function getSelectedArrowEndpointAtPoint(
  state: BoardEditorState,
  selectState: SelectToolState,
  event: ToolPointerEvent,
) {
  const projection = createBoardSpaceProjection({
    surface: state.board.surface,
    viewport: state.ui.viewport,
    canvasRect: event.canvasRect,
    surfaceInset: SURFACE_INSET,
  });
  const canvasPoint = projection.worldToCanvas(event.point);
  let nearest:
    | {
        objectId: string;
        endpoint: "start" | "end";
        distance: number;
      }
    | undefined;

  for (const objectId of selectState.selectedObjectIds) {
    const object = state.board.objects.byId[objectId];
    if (object?.type !== ARROW_OBJECT_TYPE || object.locked) {
      continue;
    }

    const arrow = object as ArrowObject;
    const endpoints = [
      { endpoint: "start" as const, point: arrow.props.start },
      { endpoint: "end" as const, point: arrow.props.end },
    ];

    for (const { endpoint, point } of endpoints) {
      const endpointCanvasPoint = projection.worldToCanvas(point);
      const distance = Math.hypot(
        canvasPoint.x - endpointCanvasPoint.x,
        canvasPoint.y - endpointCanvasPoint.y,
      );

      if (
        distance <= ARROW_ENDPOINT_HANDLE_HIT_RADIUS_PX &&
        (!nearest || distance < nearest.distance)
      ) {
        nearest = {
          objectId,
          endpoint,
          distance,
        };
      }
    }
  }

  return nearest;
}

export function getSelectOverlayItems(
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

      context.save();
      context.strokeStyle = selectionOverlay.color;
      context.lineWidth = 1;
      context.setLineDash([]);

      if (selectionOverlay.object.type === ARROW_OBJECT_TYPE) {
        const arrow = selectionOverlay.object as ArrowObject;
        const endpoints = [arrow.props.start, arrow.props.end];

        context.fillStyle = colors.white;
        context.lineWidth = 1.5;

        for (const endpoint of endpoints) {
          const point = surfaceTransform.worldToCanvas(endpoint);

          context.beginPath();
          context.arc(
            point.x,
            point.y,
            ARROW_ENDPOINT_HANDLE_RADIUS_PX,
            0,
            Math.PI * 2,
          );
          context.fill();
          context.stroke();
        }

        context.restore();
        return;
      }

      const bounds = surfaceTransform.getObjectCanvasBounds(
        selectionOverlay.object,
      );

      context.strokeRect(
        bounds.x - 4,
        bounds.y - 4,
        bounds.width + 8,
        bounds.height + 8,
      );
      context.restore();
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
    const arrowEndpointHit = getSelectedArrowEndpointAtPoint(
      state,
      selectState,
      event,
    );

    if (arrowEndpointHit) {
      setSelectState(api, {
        selectedObjectIds: [arrowEndpointHit.objectId],
        interaction: {
          mode: "arrow-endpoint",
          objectId: arrowEndpointHit.objectId,
          endpoint: arrowEndpointHit.endpoint,
        },
      });
      return;
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

    if (interaction.mode === "arrow-endpoint") {
      api.updateObjects([interaction.objectId], (object) => {
        if (object.type !== ARROW_OBJECT_TYPE || object.locked) {
          return object;
        }

        const arrow = object as ArrowObject;

        return {
          ...arrow,
          props: {
            ...arrow.props,
            [interaction.endpoint]: event.point,
          },
        };
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
