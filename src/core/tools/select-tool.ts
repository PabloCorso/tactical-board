import type { BoardEditorState } from "../editor/types";
import type {
  ToolApi,
  ToolCapabilityRegistrationApi,
  ToolDefinition,
  ToolPointerEvent,
} from "./types";
import { BoardEditorTool } from "./tool";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import type {
  CanvasOverlayItem,
  CanvasOverlayRenderInput,
  CanvasRectOverlayItem,
  CanvasOverlayRenderer,
} from "../rendering/canvas/types";
import type { BoardObject, Point } from "../board/types";
import {
  getObjectSelectionAdapterForObject,
  type ObjectSelectionAdapter,
  type ObjectSelectionInteraction,
  getPointerAngle,
  type SelectionProjection,
} from "../objects/object-selection";
import {
  getSelectToolState,
  type SelectToolState,
  SELECT_TOOL_ID,
} from "./select-tool-state";
import {
  drawClosedCanvasPath,
  drawRoundedSquareHandle,
  getCornerHandleCanvasPoint,
  getRotationFromPointer,
  getRotatedRectBoardPoints,
  renderRotateHandleIcon,
} from "./selection-geometry";
import {
  moveBoardObject,
  rotateBoardObject,
} from "../objects/object-behaviors";

const DEFAULT_SELECTION_COLOR = "#38bdf8";
const SELECTION_HANDLE_FILL_COLOR = "#ffffff";
const SELECTION_OVERLAY_KIND = "select:selection-ring";
const GROUP_SELECTION_OVERLAY_KIND = "select:group-selection-ring";
const GROUP_SELECTION_HANDLE_RADIUS_PX = 4;
const GROUP_SELECTION_HANDLE_HIT_RADIUS_PX = 12;
const GROUP_SELECTION_EDGE_HIT_RADIUS_PX = 8;
const GROUP_ROTATE_HANDLE_RADIUS_PX = 11;
const GROUP_ROTATE_HANDLE_HIT_RADIUS_PX = 18;
const GROUP_ROTATE_HANDLE_OFFSET_PX = 18;

let cachedSelectionOverlayItems:
  | {
      objectsById: BoardEditorState["board"]["objects"]["byId"];
      selectState: SelectToolState;
      overlays: Array<
        CanvasRectOverlayItem | SelectionOverlayItem | GroupSelectionOverlayItem
      >;
    }
  | undefined;

type SelectionOverlayItem = {
  kind: typeof SELECTION_OVERLAY_KIND;
  object: BoardObject;
  color: string;
  selectionAdapter?: ObjectSelectionAdapter;
  [key: string]: unknown;
};

type GroupSelectionHandle =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "top-left"
  | "top-right"
  | "bottom-right"
  | "bottom-left";

type GroupSelectionOverlayItem = {
  kind: typeof GROUP_SELECTION_OVERLAY_KIND;
  objects: BoardObject[];
  selectionAdaptersByObjectId: Record<
    string,
    ObjectSelectionAdapter | undefined
  >;
  color: string;
  canRotate: boolean;
  rotation?: number;
  bounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  [key: string]: unknown;
};

type GroupSelectionSession = {
  kind: "resize" | "rotate";
  handle?: GroupSelectionHandle;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  center: Point;
  pointerOffset?: Point;
  initialPointerAngle?: number;
  initialObjects: BoardObject[];
};

export class SelectTool extends BoardEditorTool implements ToolDefinition {
  readonly id = SELECT_TOOL_ID;
  readonly label = "Select";

  getOverlayItems(state: BoardEditorState) {
    return getSelectOverlayItems(state);
  }

  onDeactivate(api: ToolApi) {
    endTransformHistoryBatch(api);
    setSelectState(api, {
      interaction: undefined,
    });
  }

  registerCapabilities(api: ToolCapabilityRegistrationApi) {
    registerSelectOverlayRenderer(api.registerOverlayRenderer);
  }

  onPointerDown(event: ToolPointerEvent, api: ToolApi) {
    beginSelectionInteraction(event, api);
  }

  onPointerMove(event: ToolPointerEvent, api: ToolApi) {
    updateSelectionInteraction(event, api);
  }

  onPointerUp(_event: ToolPointerEvent, api: ToolApi) {
    endTransformHistoryBatch(api);
    setSelectState(api, {
      interaction: undefined,
    });
  }
}

function endTransformHistoryBatch(api: ToolApi) {
  const selectState = getSelectToolState(api.getState().toolState);

  if (
    selectState.interaction?.mode === "drag" ||
    selectState.interaction?.mode === "object-selection" ||
    selectState.interaction?.mode === "group-selection"
  ) {
    api.endHistoryBatch();
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

function isGroupSelectionOverlayItem(
  overlay: CanvasOverlayItem,
): overlay is GroupSelectionOverlayItem {
  return (
    "kind" in overlay &&
    overlay.kind === GROUP_SELECTION_OVERLAY_KIND &&
    "objects" in overlay
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
  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());

  if (hexMatch) {
    const hex = hexMatch[1]!;
    const expanded =
      hex.length === 3
        ? hex
            .split("")
            .map((character) => `${character}${character}`)
            .join("")
        : hex;
    const red = Number.parseInt(expanded.slice(0, 2), 16);
    const green = Number.parseInt(expanded.slice(2, 4), 16);
    const blue = Number.parseInt(expanded.slice(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, ${clampedAlpha})`;
  }

  return color;
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
    frame: state.board.frame,
    viewport: state.ui.viewport,
    canvasRect,
    viewportInsets: state.ui.viewportInsets,
  });
  const marqueeStart = projection.boardToCanvas(marquee.origin);
  const marqueeEnd = projection.boardToCanvas(marquee.current);
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
    coordinateSpace: "board",
    x: Math.min(marquee.origin.x, marquee.current.x),
    y: Math.min(marquee.origin.y, marquee.current.y),
    width: Math.abs(marquee.current.x - marquee.origin.x),
    height: Math.abs(marquee.current.y - marquee.origin.y),
    fill: withAlpha(accentColor, 0.14),
    stroke: withAlpha(accentColor, 0.85),
    lineWidth: 1,
  };
}

function getGroupSelectionCanvasBounds(
  projection: SelectionProjection,
  objects: BoardObject[],
  selectionAdaptersByObjectId?: Record<
    string,
    ObjectSelectionAdapter | undefined
  >,
) {
  const bounds = objects.map((object) => {
    const selectionBounds = selectionAdaptersByObjectId?.[
      object.id
    ]?.getCanvasBounds?.({
      object,
      projection,
    });

    if (selectionBounds) {
      return selectionBounds;
    }

    const objectBounds = projection.getObjectCanvasBounds(object);

    return {
      left: objectBounds.x,
      right: objectBounds.x + objectBounds.width,
      top: objectBounds.y,
      bottom: objectBounds.y + objectBounds.height,
    };
  });

  if (bounds.length === 0) {
    return undefined;
  }

  return {
    left: Math.min(...bounds.map((bound) => bound.left)),
    right: Math.max(...bounds.map((bound) => bound.right)),
    top: Math.min(...bounds.map((bound) => bound.top)),
    bottom: Math.max(...bounds.map((bound) => bound.bottom)),
  };
}

function getGroupSelectionBoardBounds(
  state: Pick<BoardEditorState, "objectRegistry">,
  projection: SelectionProjection,
  objects: BoardObject[],
) {
  const canvasBounds = getGroupSelectionCanvasBounds(
    projection,
    objects,
    Object.fromEntries(
      objects.map((object) => [
        object.id,
        getObjectSelectionAdapterForObject(state, object),
      ]),
    ),
  );

  if (!canvasBounds) {
    return undefined;
  }

  const min = projection.canvasToBoard({
    x: canvasBounds.left,
    y: canvasBounds.top,
  });
  const max = projection.canvasToBoard({
    x: canvasBounds.right,
    y: canvasBounds.bottom,
  });

  return {
    minX: min.x,
    maxX: max.x,
    minY: min.y,
    maxY: max.y,
  };
}

function getGroupSelectionCanvasPoints(
  canvasBounds: ReturnType<typeof getGroupSelectionCanvasBounds>,
) {
  if (!canvasBounds) {
    return [];
  }

  return [
    { x: canvasBounds.left, y: canvasBounds.top },
    { x: canvasBounds.right, y: canvasBounds.top },
    { x: canvasBounds.right, y: canvasBounds.bottom },
    { x: canvasBounds.left, y: canvasBounds.bottom },
  ];
}

function getGroupRotateHandlePoint(
  canvasBounds: NonNullable<ReturnType<typeof getGroupSelectionCanvasBounds>>,
) {
  const dx = canvasBounds.right - canvasBounds.left || 1;
  const dy = canvasBounds.bottom - canvasBounds.top || 1;
  const length = Math.hypot(dx, dy) || 1;

  return {
    x: canvasBounds.left - (dx / length) * GROUP_ROTATE_HANDLE_OFFSET_PX,
    y: canvasBounds.bottom + (dy / length) * GROUP_ROTATE_HANDLE_OFFSET_PX,
  };
}

function getGroupRotateHandlePointFromOutline(outlinePoints: Point[]) {
  return getCornerHandleCanvasPoint(
    outlinePoints,
    3,
    GROUP_ROTATE_HANDLE_OFFSET_PX,
  );
}

function getGroupSelectionRotationDegrees(
  currentObjects: BoardObject[],
  initialObjects: BoardObject[],
  center: Point,
) {
  const initialObjectsById = Object.fromEntries(
    initialObjects.map((object) => [object.id, object]),
  );

  for (const currentObject of currentObjects) {
    const initialObject = initialObjectsById[currentObject.id];

    if (!initialObject) {
      continue;
    }

    const initialDistance = Math.hypot(
      initialObject.position.x - center.x,
      initialObject.position.y - center.y,
    );
    const currentDistance = Math.hypot(
      currentObject.position.x - center.x,
      currentObject.position.y - center.y,
    );

    if (initialDistance <= 1e-6 || currentDistance <= 1e-6) {
      continue;
    }

    return (
      ((getPointerAngle(center, currentObject.position) -
        getPointerAngle(center, initialObject.position)) *
        180) /
      Math.PI
    );
  }

  for (const currentObject of currentObjects) {
    const initialObject = initialObjectsById[currentObject.id];

    if (
      initialObject &&
      typeof currentObject.rotation === "number" &&
      typeof initialObject.rotation === "number"
    ) {
      return currentObject.rotation - initialObject.rotation;
    }
  }

  return 0;
}

function getGroupSelectionOutlineCanvasPoints(
  projection: SelectionProjection,
  overlay: GroupSelectionOverlayItem,
) {
  if (overlay.rotation === undefined || !overlay.bounds) {
    const canvasBounds = getGroupSelectionCanvasBounds(
      projection,
      overlay.objects,
      overlay.selectionAdaptersByObjectId,
    );

    return canvasBounds ? getGroupSelectionCanvasPoints(canvasBounds) : [];
  }

  const center = {
    x: (overlay.bounds.minX + overlay.bounds.maxX) / 2,
    y: (overlay.bounds.minY + overlay.bounds.maxY) / 2,
  };

  return getRotatedRectBoardPoints({
    center,
    width: overlay.bounds.maxX - overlay.bounds.minX,
    height: overlay.bounds.maxY - overlay.bounds.minY,
    rotation: overlay.rotation,
  }).map((point) => projection.boardToCanvas(point));
}

function distanceToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
    ),
  );
  const projection = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };

  return Math.hypot(point.x - projection.x, point.y - projection.y);
}

function remapValue(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number,
) {
  const fromSpan = fromMax - fromMin;

  if (Math.abs(fromSpan) < 1e-6) {
    return (toMin + toMax) / 2;
  }

  return toMin + ((value - fromMin) / fromSpan) * (toMax - toMin);
}

function remapPoint(
  point: Point,
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  },
  nextBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  },
) {
  return {
    x: remapValue(
      point.x,
      bounds.minX,
      bounds.maxX,
      nextBounds.minX,
      nextBounds.maxX,
    ),
    y: remapValue(
      point.y,
      bounds.minY,
      bounds.maxY,
      nextBounds.minY,
      nextBounds.maxY,
    ),
  };
}

function isGroupSelectionChromeHit(
  state: Pick<BoardEditorState, "objectRegistry">,
  projection: SelectionProjection,
  objects: BoardObject[],
  event: ToolPointerEvent,
) {
  if (objects.length <= 1 || objects.some((object) => object.locked)) {
    return false;
  }

  const selectionAdaptersByObjectId = Object.fromEntries(
    objects.map((object) => [
      object.id,
      getObjectSelectionAdapterForObject(state, object),
    ]),
  );
  const canvasBounds = getGroupSelectionCanvasBounds(
    projection,
    objects,
    selectionAdaptersByObjectId,
  );

  if (!canvasBounds) {
    return false;
  }

  const canvasPoint = projection.boardToCanvas(event.point);
  const corners = getGroupSelectionCanvasPoints(canvasBounds);

  for (const handlePoint of corners) {
    if (
      Math.hypot(
        canvasPoint.x - handlePoint.x,
        canvasPoint.y - handlePoint.y,
      ) <= GROUP_SELECTION_HANDLE_HIT_RADIUS_PX
    ) {
      return true;
    }
  }

  const edgeSegments = [
    [corners[0], corners[1]],
    [corners[1], corners[2]],
    [corners[2], corners[3]],
    [corners[3], corners[0]],
  ] as const;

  for (const [start, end] of edgeSegments) {
    if (
      start &&
      end &&
      distanceToSegment(canvasPoint, start, end) <=
        GROUP_SELECTION_EDGE_HIT_RADIUS_PX
    ) {
      return true;
    }
  }

  const rotateHandle = getGroupRotateHandlePoint(canvasBounds);

  return (
    Math.hypot(
      canvasPoint.x - rotateHandle.x,
      canvasPoint.y - rotateHandle.y,
    ) <= GROUP_ROTATE_HANDLE_HIT_RADIUS_PX
  );
}

function createGroupSelectionOverlayItem(
  state: BoardEditorState,
  selectState: SelectToolState,
  accentColor: string,
) {
  const objects = state.selection.selectedObjectIds
    .map((objectId) => state.board.objects.byId[objectId])
    .filter((object): object is BoardObject => Boolean(object));
  const interaction =
    selectState.interaction?.mode === "group-selection"
      ? selectState.interaction
      : undefined;
  const canRotate = objects.every((object) => {
    const transformCapabilities = getObjectSelectionAdapterForObject(
      state,
      object,
    )?.getTransformCapabilities?.(object);

    return transformCapabilities?.rotate !== false;
  });

  return {
    kind: GROUP_SELECTION_OVERLAY_KIND,
    objects,
    selectionAdaptersByObjectId: Object.fromEntries(
      objects.map((object) => [
        object.id,
        getObjectSelectionAdapterForObject(state, object),
      ]),
    ),
    color: accentColor,
    canRotate,
    rotation:
      canRotate && interaction?.session.kind === "rotate"
        ? getGroupSelectionRotationDegrees(
            objects,
            interaction.session.initialObjects,
            interaction.session.center,
          )
        : undefined,
    bounds:
      canRotate && interaction?.session.kind === "rotate"
        ? interaction.session.bounds
        : undefined,
  } satisfies GroupSelectionOverlayItem;
}

function createSelectionOverlayItems(
  state: BoardEditorState,
): Array<SelectionOverlayItem | GroupSelectionOverlayItem> {
  const selectState = getSelectToolState(state.toolState);
  const accentColor = getSelectionAccentColor(state, selectState);
  const selectedObjectIds = state.selection.selectedObjectIds;

  if (selectedObjectIds.length > 1) {
    return [createGroupSelectionOverlayItem(state, selectState, accentColor)];
  }

  return selectedObjectIds.flatMap((objectId) => {
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
): Array<
  CanvasRectOverlayItem | SelectionOverlayItem | GroupSelectionOverlayItem
> {
  const selectState = getSelectToolState(state.toolState);
  const accentColor = getSelectionAccentColor(state, selectState);

  if (
    cachedSelectionOverlayItems?.selectState === selectState &&
    cachedSelectionOverlayItems.objectsById === state.board.objects.byId
  ) {
    return cachedSelectionOverlayItems.overlays;
  }

  const overlays: Array<
    CanvasRectOverlayItem | SelectionOverlayItem | GroupSelectionOverlayItem
  > = createSelectionOverlayItems(state);

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
    ({ context, overlay, frameTransform }: CanvasOverlayRenderInput) => {
      if (!isSelectionOverlayItem(overlay)) {
        return;
      }

      if (!overlay.selectionAdapter?.renderSelection) {
        return;
      }

      overlay.selectionAdapter.renderSelection({
        context,
        object: overlay.object,
        projection: frameTransform as SelectionProjection,
        color: overlay.color,
      });
    },
  );
  registerOverlayRenderer(
    GROUP_SELECTION_OVERLAY_KIND,
    ({ context, overlay, frameTransform }: CanvasOverlayRenderInput) => {
      if (!isGroupSelectionOverlayItem(overlay)) {
        return;
      }
      const outlinePoints = getGroupSelectionOutlineCanvasPoints(
        frameTransform as SelectionProjection,
        overlay,
      );

      if (outlinePoints.length !== 4) {
        return;
      }
      const rotateHandlePoint =
        overlay.rotation === undefined
          ? (() => {
              const canvasBounds = getGroupSelectionCanvasBounds(
                frameTransform as SelectionProjection,
                overlay.objects,
                overlay.selectionAdaptersByObjectId,
              );

              return canvasBounds
                ? getGroupRotateHandlePoint(canvasBounds)
                : undefined;
            })()
          : getGroupRotateHandlePointFromOutline(outlinePoints);
      const anyLocked = overlay.objects.some((object) => object.locked);
      const sideHandlePoints = [
        {
          x: (outlinePoints[0]!.x + outlinePoints[1]!.x) / 2,
          y: (outlinePoints[0]!.y + outlinePoints[1]!.y) / 2,
        },
        {
          x: (outlinePoints[1]!.x + outlinePoints[2]!.x) / 2,
          y: (outlinePoints[1]!.y + outlinePoints[2]!.y) / 2,
        },
        {
          x: (outlinePoints[2]!.x + outlinePoints[3]!.x) / 2,
          y: (outlinePoints[2]!.y + outlinePoints[3]!.y) / 2,
        },
        {
          x: (outlinePoints[3]!.x + outlinePoints[0]!.x) / 2,
          y: (outlinePoints[3]!.y + outlinePoints[0]!.y) / 2,
        },
      ];

      context.save();
      context.strokeStyle = overlay.color;
      context.lineWidth = 1.5;
      context.fillStyle = SELECTION_HANDLE_FILL_COLOR;
      drawClosedCanvasPath(context, outlinePoints);
      context.stroke();

      if (!anyLocked) {
        for (const handlePoint of [...outlinePoints, ...sideHandlePoints]) {
          drawRoundedSquareHandle(
            context,
            handlePoint,
            GROUP_SELECTION_HANDLE_RADIUS_PX,
            2,
          );
          context.fill();
          context.stroke();
        }

        if (overlay.canRotate && rotateHandlePoint) {
          renderRotateHandleIcon(
            context,
            rotateHandlePoint,
            GROUP_ROTATE_HANDLE_RADIUS_PX,
            overlay.rotation ?? 0,
          );
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

function beginSelectionInteraction(event: ToolPointerEvent, api: ToolApi) {
  const state = api.getState();
  const selectedObjectIds = state.selection.selectedObjectIds;
  const projection = createBoardSpaceProjection({
    frame: state.board.frame,
    viewport: state.ui.viewport,
    canvasRect: event.canvasRect,
    viewportInsets: state.ui.viewportInsets,
  });
  const groupSelectionSession =
    selectedObjectIds.length > 1
      ? hitGroupSelectionHandle(
          state,
          projection as SelectionProjection,
          selectedObjectIds
            .map((objectId) => state.board.objects.byId[objectId])
            .filter((object): object is BoardObject => Boolean(object)),
          event,
        )
      : undefined;

  if (groupSelectionSession) {
    api.beginHistoryBatch();
    setSelectState(api, {
      interaction: {
        mode: "group-selection",
        selectedObjectIds: [...selectedObjectIds],
        session: groupSelectionSession,
      },
    });
    return;
  }

  if (
    selectedObjectIds.length > 1 &&
    isGroupSelectionChromeHit(
      state,
      projection as SelectionProjection,
      selectedObjectIds
        .map((objectId) => state.board.objects.byId[objectId])
        .filter((object): object is BoardObject => Boolean(object)),
      event,
    )
  ) {
    return;
  }

  for (const objectId of selectedObjectIds) {
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
      api.beginHistoryBatch();
      api.setSelectedObjectIds([object.id]);
      setSelectState(api, {
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
    const objectIsSelected = selectedObjectIds.includes(event.targetObjectId);
    const nextSelection = hasAdditiveModifier
      ? objectIsSelected
        ? selectedObjectIds.filter(
            (objectId) => objectId !== event.targetObjectId,
          )
        : [...selectedObjectIds, event.targetObjectId]
      : objectIsSelected
        ? selectedObjectIds
        : [event.targetObjectId];

    if (hasAdditiveModifier) {
      api.setSelectedObjectIds(nextSelection);
      setSelectState(api, {
        interaction: undefined,
      });
      return;
    }

    const targetObject = state.board.objects.byId[event.targetObjectId];
    const targetSelectionAdapter = getObjectSelectionAdapterForObject(
      state,
      targetObject,
    );
    const transformCapabilities = targetObject
      ? targetSelectionAdapter?.getTransformCapabilities?.(targetObject)
      : undefined;

    api.setSelectedObjectIds(nextSelection);
    setSelectState(api, {
      interaction:
        transformCapabilities?.move === false
          ? undefined
          : {
              mode: "drag",
              dragObjectIds: nextSelection,
              lastPoint: event.point,
            },
    });

    if (transformCapabilities?.move !== false) {
      api.beginHistoryBatch();
    }
    return;
  }

  const preserveExistingSelection = isAdditiveSelectionModifierPressed(event);

  if (!preserveExistingSelection) {
    api.clearSelection();
  }

  const baseSelection = preserveExistingSelection ? selectedObjectIds : [];

  api.setSelectedObjectIds(baseSelection);
  setSelectState(api, {
    interaction: {
      mode: "marquee",
      origin: event.point,
      current: event.point,
      baseSelection,
    },
  });
}

function hitGroupSelectionHandle(
  state: Pick<BoardEditorState, "objectRegistry">,
  projection: SelectionProjection,
  objects: BoardObject[],
  event: ToolPointerEvent,
): GroupSelectionSession | undefined {
  if (objects.length <= 1 || objects.some((object) => object.locked)) {
    return undefined;
  }

  const selectionAdaptersByObjectId = Object.fromEntries(
    objects.map((object) => [
      object.id,
      getObjectSelectionAdapterForObject(state, object),
    ]),
  );
  const canRotate = objects.every(
    (object) =>
      selectionAdaptersByObjectId[object.id]?.getTransformCapabilities?.(object)
        ?.rotate !== false,
  );
  const canvasBounds = getGroupSelectionCanvasBounds(
    projection,
    objects,
    selectionAdaptersByObjectId,
  );
  const boardBounds = getGroupSelectionBoardBounds(state, projection, objects);

  if (!canvasBounds || !boardBounds) {
    return undefined;
  }

  const canvasPoint = projection.boardToCanvas(event.point);
  const corners = getGroupSelectionCanvasPoints(canvasBounds);
  const handles: GroupSelectionHandle[] = [
    "top-left",
    "top-right",
    "bottom-right",
    "bottom-left",
  ];
  let nearest:
    | {
        kind: "resize";
        handle: GroupSelectionHandle;
        distance: number;
        pointerOffset: Point;
      }
    | undefined;

  for (const [index, handlePoint] of corners.entries()) {
    const distance = Math.hypot(
      canvasPoint.x - handlePoint.x,
      canvasPoint.y - handlePoint.y,
    );

    if (
      distance <= GROUP_SELECTION_HANDLE_HIT_RADIUS_PX &&
      (!nearest || distance < nearest.distance)
    ) {
      nearest = {
        kind: "resize",
        handle: handles[index]!,
        distance,
        pointerOffset: {
          x:
            event.point.x -
            (index === 1 || index === 2 ? boardBounds.maxX : boardBounds.minX),
          y: event.point.y - (index >= 2 ? boardBounds.maxY : boardBounds.minY),
        },
      };
    }
  }

  const edgeHits = [
    {
      handle: "top" as const,
      distance: distanceToSegment(canvasPoint, corners[0]!, corners[1]!),
      pointerOffset: { x: 0, y: event.point.y - boardBounds.minY },
    },
    {
      handle: "right" as const,
      distance: distanceToSegment(canvasPoint, corners[1]!, corners[2]!),
      pointerOffset: { x: event.point.x - boardBounds.maxX, y: 0 },
    },
    {
      handle: "bottom" as const,
      distance: distanceToSegment(canvasPoint, corners[2]!, corners[3]!),
      pointerOffset: { x: 0, y: event.point.y - boardBounds.maxY },
    },
    {
      handle: "left" as const,
      distance: distanceToSegment(canvasPoint, corners[3]!, corners[0]!),
      pointerOffset: { x: event.point.x - boardBounds.minX, y: 0 },
    },
  ];

  for (const edgeHit of edgeHits) {
    if (
      edgeHit.distance <= GROUP_SELECTION_EDGE_HIT_RADIUS_PX &&
      (!nearest || edgeHit.distance < nearest.distance)
    ) {
      nearest = {
        kind: "resize",
        handle: edgeHit.handle,
        distance: edgeHit.distance,
        pointerOffset: edgeHit.pointerOffset,
      };
    }
  }

  if (nearest) {
    return {
      kind: nearest.kind,
      handle: nearest.handle,
      bounds: boardBounds,
      center: {
        x: (boardBounds.minX + boardBounds.maxX) / 2,
        y: (boardBounds.minY + boardBounds.maxY) / 2,
      },
      pointerOffset: nearest.pointerOffset,
      initialObjects: objects,
    };
  }

  if (!canRotate) {
    return undefined;
  }

  const rotateHandle = getGroupRotateHandlePoint(canvasBounds);
  const rotateDistance = Math.hypot(
    canvasPoint.x - rotateHandle.x,
    canvasPoint.y - rotateHandle.y,
  );

  if (rotateDistance <= GROUP_ROTATE_HANDLE_HIT_RADIUS_PX) {
    return {
      kind: "rotate",
      bounds: boardBounds,
      center: {
        x: (boardBounds.minX + boardBounds.maxX) / 2,
        y: (boardBounds.minY + boardBounds.maxY) / 2,
      },
      initialPointerAngle: getPointerAngle(
        {
          x: (boardBounds.minX + boardBounds.maxX) / 2,
          y: (boardBounds.minY + boardBounds.maxY) / 2,
        },
        event.point,
      ),
      initialObjects: objects,
    };
  }

  return undefined;
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

  api.setSelectedObjectIds(nextSelection);
  setSelectState(api, {
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
    case "group-selection":
      updateGroupSelectionInteraction(event, api, interaction);
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

function updateGroupSelectionInteraction(
  event: ToolPointerEvent,
  api: ToolApi,
  interaction: Extract<
    NonNullable<SelectToolState["interaction"]>,
    { mode: "group-selection" }
  >,
) {
  const initialObjectsById = Object.fromEntries(
    interaction.session.initialObjects.map((object) => [object.id, object]),
  );

  if (interaction.session.kind === "rotate") {
    const rotation = getRotationFromPointer(
      interaction.session.center,
      event.point,
      0,
      interaction.session.initialPointerAngle ?? 0,
    );

    api.updateObjects(interaction.selectedObjectIds, (object) => {
      const initialObject = object ? initialObjectsById[object.id] : undefined;
      const transformCapabilities = object
        ? getObjectSelectionAdapterForObject(
            api.getState(),
            object,
          )?.getTransformCapabilities?.(object)
        : undefined;

      if (
        !object ||
        object.locked ||
        !initialObject ||
        transformCapabilities?.rotate === false
      ) {
        return object;
      }

      return rotateBoardObject(
        api.getState(),
        initialObject,
        interaction.session.center,
        rotation,
      );
    });
    return;
  }

  const pointerOffset = interaction.session.pointerOffset ?? { x: 0, y: 0 };
  const adjustedPoint = {
    x: event.point.x - pointerOffset.x,
    y: event.point.y - pointerOffset.y,
  };
  const bounds = interaction.session.bounds;
  let start = { x: bounds.minX, y: bounds.minY };
  let end = { x: bounds.maxX, y: bounds.maxY };

  switch (interaction.session.handle) {
    case "left":
      start = { x: adjustedPoint.x, y: bounds.minY };
      break;
    case "right":
      end = { x: adjustedPoint.x, y: bounds.maxY };
      break;
    case "top":
      start = { x: bounds.minX, y: adjustedPoint.y };
      break;
    case "bottom":
      end = { x: bounds.maxX, y: adjustedPoint.y };
      break;
    case "top-left":
      start = adjustedPoint;
      break;
    case "top-right":
      start = { x: bounds.minX, y: adjustedPoint.y };
      end = { x: adjustedPoint.x, y: bounds.maxY };
      break;
    case "bottom-right":
      end = adjustedPoint;
      break;
    case "bottom-left":
      start = { x: adjustedPoint.x, y: bounds.minY };
      end = { x: bounds.maxX, y: adjustedPoint.y };
      break;
    default:
      return;
  }

  const nextBounds = {
    minX: Math.min(start.x, end.x),
    maxX: Math.max(start.x, end.x),
    minY: Math.min(start.y, end.y),
    maxY: Math.max(start.y, end.y),
  };

  api.updateObjects(interaction.selectedObjectIds, (object) => {
    const initialObject = object ? initialObjectsById[object.id] : undefined;

    if (!object || object.locked || !initialObject) {
      return object;
    }

    const selectionAdapter = getObjectSelectionAdapterForObject(
      api.getState(),
      initialObject,
    );

    if (selectionAdapter?.updateGroupResizeInteraction) {
      return selectionAdapter.updateGroupResizeInteraction({
        object: initialObject,
        bounds,
        nextBounds,
      });
    }

    const nextPosition = remapPoint(initialObject.position, bounds, nextBounds);

    return moveBoardObject(api.getState(), initialObject, {
      x: nextPosition.x - initialObject.position.x,
      y: nextPosition.y - initialObject.position.y,
    });
  });
}
