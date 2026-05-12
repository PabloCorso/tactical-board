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
  getArrowCurveHandlePoint,
  getArrowCurveOffsetFromHandlePoint,
  getArrowPolylinePoints,
  setArrowCurveOffset,
  setArrowEndpoint,
  setArrowPolylinePoint,
  type ArrowObject,
} from "../core/objects/arrow-object";
import {
  getShapeBounds,
  resizeShapeObject,
  SHAPE_OBJECT_TYPE,
  type ShapeObject,
} from "../core/objects/shape-object";
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
const ARROW_CURVE_HANDLE_WIDTH_PX = 18;
const ARROW_CURVE_HANDLE_HEIGHT_PX = 6;
const SHAPE_RESIZE_HANDLE_RADIUS_PX = 5;
const SHAPE_RESIZE_HANDLE_HIT_RADIUS_PX = 12;
const SHAPE_RESIZE_EDGE_HIT_RADIUS_PX = 8;
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
  [key: string]: unknown;
}

function getShapeResizeHandlePoints(shape: ShapeObject) {
  const bounds = getShapeBounds(shape.props);

  return [
    {
      handle: "top-left" as const,
      point: { x: bounds.minX, y: bounds.minY },
    },
    {
      handle: "top-right" as const,
      point: { x: bounds.maxX, y: bounds.minY },
    },
    {
      handle: "bottom-right" as const,
      point: { x: bounds.maxX, y: bounds.maxY },
    },
    {
      handle: "bottom-left" as const,
      point: { x: bounds.minX, y: bounds.maxY },
    },
  ];
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

function getSelectedArrowPointAtPoint(
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
        pointIndex: number;
        distance: number;
      }
    | undefined;

  for (const objectId of selectState.selectedObjectIds) {
    const object = state.board.objects.byId[objectId];
    if (object?.type !== ARROW_OBJECT_TYPE || object.locked) {
      continue;
    }

    const arrow = object as ArrowObject;
    if (arrow.props.geometry !== "polyline") {
      continue;
    }

    for (const [pointIndex, point] of getArrowPolylinePoints(
      arrow.props,
    ).entries()) {
      const pointCanvas = projection.worldToCanvas(point);
      const distance = Math.hypot(
        canvasPoint.x - pointCanvas.x,
        canvasPoint.y - pointCanvas.y,
      );

      if (
        distance <= ARROW_ENDPOINT_HANDLE_HIT_RADIUS_PX &&
        (!nearest || distance < nearest.distance)
      ) {
        nearest = {
          objectId,
          pointIndex,
          distance,
        };
      }
    }
  }

  return nearest;
}

function getSelectedArrowCurveHandleAtPoint(
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

  for (const objectId of selectState.selectedObjectIds) {
    const object = state.board.objects.byId[objectId];
    if (
      object?.type !== ARROW_OBJECT_TYPE ||
      object.locked ||
      (object as ArrowObject).props.bodyStyle !== "curved"
    ) {
      continue;
    }

    const arrow = object as ArrowObject;
    const handlePoint = projection.worldToCanvas(
      getArrowCurveHandlePoint(
        arrow.props.start,
        arrow.props.end,
        arrow.props.curveOffset,
      ),
    );
    const startPoint = projection.worldToCanvas(arrow.props.start);
    const endPoint = projection.worldToCanvas(arrow.props.end);
    const angle = Math.atan2(
      endPoint.y - startPoint.y,
      endPoint.x - startPoint.x,
    );
    const dx = canvasPoint.x - handlePoint.x;
    const dy = canvasPoint.y - handlePoint.y;
    const localX = dx * Math.cos(angle) + dy * Math.sin(angle);
    const localY = -dx * Math.sin(angle) + dy * Math.cos(angle);

    if (
      Math.abs(localX) <= ARROW_CURVE_HANDLE_WIDTH_PX / 2 + 2 &&
      Math.abs(localY) <= ARROW_CURVE_HANDLE_HEIGHT_PX / 2
    ) {
      return {
        objectId,
      };
    }
  }

  return undefined;
}

function getSelectedShapeResizeHandleAtPoint(
  state: BoardEditorState,
  selectState: SelectToolState,
  event: ToolPointerEvent,
) {
  if (selectState.selectedObjectIds.length !== 1) {
    return undefined;
  }

  const object = state.board.objects.byId[selectState.selectedObjectIds[0]];
  if (
    object?.type !== SHAPE_OBJECT_TYPE ||
    object.locked ||
    (object as ShapeObject).props.kind === "polygon"
  ) {
    return undefined;
  }

  const projection = createBoardSpaceProjection({
    surface: state.board.surface,
    viewport: state.ui.viewport,
    canvasRect: event.canvasRect,
    surfaceInset: SURFACE_INSET,
  });
  const canvasPoint = projection.worldToCanvas(event.point);
  const shape = object as ShapeObject;
  let nearest:
    | {
        objectId: string;
        handle:
          | "top"
          | "right"
          | "bottom"
          | "left"
          | "top-left"
          | "top-right"
          | "bottom-right"
          | "bottom-left";
        distance: number;
        bounds: ReturnType<typeof getShapeBounds>;
      }
    | undefined;

  for (const { handle, point } of getShapeResizeHandlePoints(shape)) {
    const handleCanvasPoint = projection.worldToCanvas(point);
    const distance = Math.hypot(
      canvasPoint.x - handleCanvasPoint.x,
      canvasPoint.y - handleCanvasPoint.y,
    );

    if (
      distance <= SHAPE_RESIZE_HANDLE_HIT_RADIUS_PX &&
      (!nearest || distance < nearest.distance)
    ) {
      nearest = {
        objectId: shape.id,
        handle,
        distance,
        bounds: getShapeBounds(shape.props),
      };
    }
  }

  if (nearest) {
    return nearest;
  }

  const bounds = projection.getObjectCanvasBounds(shape);
  const edgeHits = [
    {
      handle: "top" as const,
      distance:
        canvasPoint.x >= bounds.x &&
        canvasPoint.x <= bounds.x + bounds.width
          ? Math.abs(canvasPoint.y - bounds.y)
          : Number.POSITIVE_INFINITY,
    },
    {
      handle: "right" as const,
      distance:
        canvasPoint.y >= bounds.y &&
        canvasPoint.y <= bounds.y + bounds.height
          ? Math.abs(canvasPoint.x - (bounds.x + bounds.width))
          : Number.POSITIVE_INFINITY,
    },
    {
      handle: "bottom" as const,
      distance:
        canvasPoint.x >= bounds.x &&
        canvasPoint.x <= bounds.x + bounds.width
          ? Math.abs(canvasPoint.y - (bounds.y + bounds.height))
          : Number.POSITIVE_INFINITY,
    },
    {
      handle: "left" as const,
      distance:
        canvasPoint.y >= bounds.y &&
        canvasPoint.y <= bounds.y + bounds.height
          ? Math.abs(canvasPoint.x - bounds.x)
          : Number.POSITIVE_INFINITY,
    },
  ];

  for (const edgeHit of edgeHits) {
    if (
      edgeHit.distance <= SHAPE_RESIZE_EDGE_HIT_RADIUS_PX &&
      (!nearest || edgeHit.distance < nearest.distance)
    ) {
      nearest = {
        objectId: shape.id,
        handle: edgeHit.handle,
        distance: edgeHit.distance,
        bounds: getShapeBounds(shape.props),
      };
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
        const startPoint = surfaceTransform.worldToCanvas(arrow.props.start);
        const endPoint = surfaceTransform.worldToCanvas(arrow.props.end);

        context.fillStyle = colors.white;
        context.strokeStyle = DEFAULT_SELECTION_COLOR;
        context.lineWidth = 1.5;

        for (const point of (arrow.props.geometry === "polyline"
          ? getArrowPolylinePoints(arrow.props)
          : [arrow.props.start, arrow.props.end]
        ).map((endpoint) => surfaceTransform.worldToCanvas(endpoint))) {
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

        if (arrow.props.bodyStyle === "curved") {
          const handlePoint = surfaceTransform.worldToCanvas(
            getArrowCurveHandlePoint(
              arrow.props.start,
              arrow.props.end,
              arrow.props.curveOffset,
            ),
          );
          const angle = Math.atan2(
            endPoint.y - startPoint.y,
            endPoint.x - startPoint.x,
          );

          context.save();
          context.translate(handlePoint.x, handlePoint.y);
          context.rotate(angle);
          context.fillStyle = colors.white;
          context.beginPath();
          context.roundRect(
            -ARROW_CURVE_HANDLE_WIDTH_PX / 2,
            -ARROW_CURVE_HANDLE_HEIGHT_PX / 2,
            ARROW_CURVE_HANDLE_WIDTH_PX,
            ARROW_CURVE_HANDLE_HEIGHT_PX,
            ARROW_CURVE_HANDLE_HEIGHT_PX / 2,
          );
          context.fill();
          context.stroke();
          context.restore();
        }

        context.restore();
        return;
      }

      const bounds = surfaceTransform.getObjectCanvasBounds(
        selectionOverlay.object,
      );

      context.strokeStyle = DEFAULT_SELECTION_COLOR;
      context.lineWidth = 1.5;
      context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

      if (
        selectionOverlay.object.type === SHAPE_OBJECT_TYPE &&
        !selectionOverlay.object.locked &&
        (selectionOverlay.object as ShapeObject).props.kind !== "polygon"
      ) {
        context.fillStyle = colors.white;

        for (const { point } of getShapeResizeHandlePoints(
          selectionOverlay.object as ShapeObject,
        )) {
          const handlePoint = surfaceTransform.worldToCanvas(point);
          context.beginPath();
          context.arc(
            handlePoint.x,
            handlePoint.y,
            SHAPE_RESIZE_HANDLE_RADIUS_PX,
            0,
            Math.PI * 2,
          );
          context.fill();
          context.stroke();
        }
      }

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

function beginSelectionInteraction(
  event: ToolPointerEvent,
  api: ToolApi,
  selectState: SelectToolState,
) {
  const state = api.getState();
  const shapeResizeHit = getSelectedShapeResizeHandleAtPoint(
    state,
    selectState,
    event,
  );
  if (shapeResizeHit) {
    setSelectState(api, {
      selectedObjectIds: [shapeResizeHit.objectId],
        interaction: {
          mode: "shape-resize",
          objectId: shapeResizeHit.objectId,
          handle: shapeResizeHit.handle,
          bounds: shapeResizeHit.bounds,
        },
      });
    return;
  }

  const arrowCurveHit = getSelectedArrowCurveHandleAtPoint(
    state,
    selectState,
    event,
  );
  if (arrowCurveHit) {
    setSelectState(api, {
      selectedObjectIds: [arrowCurveHit.objectId],
      interaction: {
        mode: "arrow-curve",
        objectId: arrowCurveHit.objectId,
      },
    });
    return;
  }

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

  const arrowPointHit = getSelectedArrowPointAtPoint(state, selectState, event);

  if (arrowPointHit) {
    setSelectState(api, {
      selectedObjectIds: [arrowPointHit.objectId],
      interaction: {
        mode: "arrow-point",
        objectId: arrowPointHit.objectId,
        pointIndex: arrowPointHit.pointIndex,
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

function updateArrowEndpointInteraction(
  event: ToolPointerEvent,
  api: ToolApi,
  interaction: Extract<
    NonNullable<SelectToolState["interaction"]>,
    { mode: "arrow-endpoint" }
  >,
) {
  api.updateObjects([interaction.objectId], (object) => {
    if (object.type !== ARROW_OBJECT_TYPE || object.locked) {
      return object;
    }

    return setArrowEndpoint(
      object as ArrowObject,
      interaction.endpoint,
      event.point,
    );
  });
}

function updateArrowPointInteraction(
  event: ToolPointerEvent,
  api: ToolApi,
  interaction: Extract<
    NonNullable<SelectToolState["interaction"]>,
    { mode: "arrow-point" }
  >,
) {
  api.updateObjects([interaction.objectId], (object) => {
    if (object.type !== ARROW_OBJECT_TYPE || object.locked) {
      return object;
    }

    return setArrowPolylinePoint(
      object as ArrowObject,
      interaction.pointIndex,
      event.point,
    );
  });
}

function updateArrowCurveInteraction(
  event: ToolPointerEvent,
  api: ToolApi,
  interaction: Extract<
    NonNullable<SelectToolState["interaction"]>,
    { mode: "arrow-curve" }
  >,
) {
  api.updateObjects([interaction.objectId], (object) => {
    if (object.type !== ARROW_OBJECT_TYPE || object.locked) {
      return object;
    }

    const arrow = object as ArrowObject;
    const curveOffset = getArrowCurveOffsetFromHandlePoint(
      arrow.props.start,
      arrow.props.end,
      event.point,
    );

    return setArrowCurveOffset(arrow, curveOffset);
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

function updateShapeResizeInteraction(
  event: ToolPointerEvent,
  api: ToolApi,
  interaction: Extract<
    NonNullable<SelectToolState["interaction"]>,
    { mode: "shape-resize" }
  >,
) {
  api.updateObjects([interaction.objectId], (object) => {
    if (object.type !== SHAPE_OBJECT_TYPE || object.locked) {
      return object;
    }

    const shape = object as ShapeObject;
    if (shape.props.kind === "polygon") {
      return object;
    }

    const bounds = interaction.bounds;
    let start = { x: bounds.minX, y: bounds.minY };
    let end = { x: bounds.maxX, y: bounds.maxY };

    switch (interaction.handle) {
      case "left":
        start = { x: event.point.x, y: bounds.minY };
        break;
      case "right":
        end = { x: event.point.x, y: bounds.maxY };
        break;
      case "top":
        start = { x: bounds.minX, y: event.point.y };
        break;
      case "bottom":
        end = { x: bounds.maxX, y: event.point.y };
        break;
      case "top-left":
        start = event.point;
        break;
      case "top-right":
        start = { x: bounds.minX, y: event.point.y };
        end = { x: event.point.x, y: bounds.maxY };
        break;
      case "bottom-right":
        end = event.point;
        break;
      case "bottom-left":
        start = { x: event.point.x, y: bounds.minY };
        end = { x: bounds.maxX, y: event.point.y };
        break;
    }

    return resizeShapeObject(shape, { start, end });
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
    case "arrow-endpoint":
      updateArrowEndpointInteraction(event, api, interaction);
      return;
    case "arrow-point":
      updateArrowPointInteraction(event, api, interaction);
      return;
    case "arrow-curve":
      updateArrowCurveInteraction(event, api, interaction);
      return;
    case "drag":
      updateDragInteraction(event, api, interaction);
      return;
    case "shape-resize":
      updateShapeResizeInteraction(event, api, interaction);
      return;
  }
}

export const selectTool: ToolDefinition = {
  id: SELECT_TOOL_ID,
  label: "Select",
  getSecondaryActions: getSelectSecondaryActions,
  getOverlayItems: getSelectOverlayItems,
  onDeactivate: (api) => {
    clearSelection(api);
  },
  registerRenderers: (api) => {
    registerSelectOverlayRenderer(api.registerOverlayRenderer);
  },
  onPointerDown: (event, api) => {
    beginSelectionInteraction(
      event,
      api,
      getSelectToolState(api.getState().toolState),
    );
  },
  onPointerMove: (event, api) => {
    updateSelectionInteraction(event, api);
  },
  onPointerUp: (_event, api) => {
    setSelectState(api, {
      interaction: undefined,
    });
  },
  onWheel: (event, api) => {
    const delta =
      event.shiftKey && event.deltaX === 0
        ? { x: -event.deltaY, y: 0 }
        : { x: -event.deltaX, y: -event.deltaY };

    if (delta.x === 0 && delta.y === 0) {
      return;
    }

    api.panViewport(delta);
  },
};
