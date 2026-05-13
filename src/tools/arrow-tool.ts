import type { Point } from "../core/board/types";
import {
  ARROW_OBJECT_TYPE,
  createArrowObject,
  getArrowBodyPolylines,
  getArrowControlPoint,
  getArrowPolylinePoints,
  type ArrowObject,
  type ArrowBodyStyle,
  type ArrowHeadStyle,
} from "../core/objects/arrow-object";
import { createBoardSpaceProjection } from "../core/geometry/board-space-projection";
import { scaleCanvasDashStyle } from "../rendering/canvas/style-scale";
import type {
  CanvasObjectHitTestInput,
  CanvasObjectRenderInput,
} from "../rendering/canvas/types";
import type {
  ToolActionIcon,
  ToolActionDefinition,
  ToolApi,
  ToolDefinition,
} from "../core/tools/types";
import {
  ARROW_TOOL_ID,
  getArrowToolState,
  type ArrowDraftStyle,
} from "./arrow-tool-state";
import { clearSelection } from "./select-tool-actions";

const PREVIEW_OPACITY = 0.55;
const MIN_HIT_DISTANCE_PX = 10;
const POLYLINE_FINISH_HIT_RADIUS_PX = 12;

export interface ArrowToolPreset {
  id: string;
  label: string;
  icon?: ToolActionIcon;
  tooltip?: string;
  draftStyle: Partial<ArrowDraftStyle>;
}

export interface CreateArrowToolOptions {
  presets?: ArrowToolPreset[];
}

function isArrowPresetActive(
  draftStyle: ArrowDraftStyle,
  presetDraftStyle: Partial<ArrowDraftStyle>,
) {
  return (
    Object.entries(presetDraftStyle) as Array<
      [keyof ArrowDraftStyle, ArrowDraftStyle[keyof ArrowDraftStyle]]
    >
  ).every(([key, value]) => {
    const currentValue = draftStyle[key];

    if (Array.isArray(value)) {
      return (
        Array.isArray(currentValue) &&
        currentValue.length === value.length &&
        currentValue.every((part, index) => part === value[index])
      );
    }

    return currentValue === value;
  });
}

function createArrowId(existingIds: Record<string, unknown>) {
  let index = 1;

  while (existingIds[`arrow-${index}`]) {
    index += 1;
  }

  return `arrow-${index}`;
}

export function setArrowDraftStyle(
  api: ToolApi,
  draftStyle: Partial<ArrowDraftStyle>,
) {
  const arrowState = getArrowToolState(api.getState().toolState);

  api.setToolState(ARROW_TOOL_ID, {
    ...arrowState,
    draftStyle: {
      ...arrowState.draftStyle,
      ...draftStyle,
    },
  });
}

export function applyArrowPreset(
  api: ToolApi,
  preset: Pick<ArrowToolPreset, "draftStyle">,
) {
  const arrowState = getArrowToolState(api.getState().toolState);

  api.setToolState(ARROW_TOOL_ID, {
    ...arrowState,
    draftStyle: {
      ...arrowState.draftStyle,
      ...preset.draftStyle,
    },
  });
}

function setPendingPoints(api: ToolApi, pendingPoints: Point[]) {
  const arrowState = getArrowToolState(api.getState().toolState);

  api.setToolState(ARROW_TOOL_ID, {
    ...arrowState,
    pendingPoints,
  });
}

function cancelPendingArrow(api: ToolApi) {
  setPendingPoints(api, []);
  api.clearPreviewObjects();
}

export function finishPendingArrow(api: ToolApi) {
  const state = api.getState();
  const arrowState = getArrowToolState(state.toolState);

  if (
    arrowState.draftStyle.geometry !== "polyline" ||
    arrowState.pendingPoints.length < 2
  ) {
    return;
  }

  const arrowId = createArrowId(state.board.objects.byId);
  api.addObjects([
    createArrowObject({
      id: arrowId,
      points: arrowState.pendingPoints,
      ...arrowState.draftStyle,
    }),
  ]);
  cancelPendingArrow(api);
}

function getArrowHeadLength(strokeWidth: number) {
  return Math.max(10, strokeWidth * 4.5);
}

function getArrowHeadBodyInset(strokeWidth: number) {
  const spread = Math.PI / 7;
  return getArrowHeadLength(strokeWidth) * Math.cos(spread);
}

function offsetPointToward(
  point: Point,
  target: Point,
  distance: number,
): Point {
  const dx = target.x - point.x;
  const dy = target.y - point.y;
  const length = Math.hypot(dx, dy);

  if (length === 0) {
    return point;
  }

  const clampedDistance = Math.min(distance, length);

  return {
    x: point.x + (dx / length) * clampedDistance,
    y: point.y + (dy / length) * clampedDistance,
  };
}

function drawArrowHead(input: {
  context: CanvasRenderingContext2D;
  tip: Point;
  tail: Point;
  color: string;
  strokeWidth: number;
  headStyle: ArrowHeadStyle;
}) {
  const { context, tip, tail, color, strokeWidth, headStyle } = input;
  if (headStyle === "none") {
    return;
  }

  const angle = Math.atan2(tip.y - tail.y, tip.x - tail.x);
  const headLength = getArrowHeadLength(strokeWidth);
  const spread = Math.PI / 7;

  context.save();
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(tip.x, tip.y);
  context.lineTo(
    tip.x - Math.cos(angle - spread) * headLength,
    tip.y - Math.sin(angle - spread) * headLength,
  );
  context.lineTo(
    tip.x - Math.cos(angle + spread) * headLength,
    tip.y - Math.sin(angle + spread) * headLength,
  );
  context.closePath();
  context.fill();
  context.restore();
}

function drawArrowPath(context: CanvasRenderingContext2D, points: Point[]) {
  if (points.length === 0) {
    return;
  }

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  for (const point of points.slice(1)) {
    context.lineTo(point.x, point.y);
  }
}

function getArrowDirectionPoint(
  anchor: Point,
  points: Point[],
  fallback: Point,
) {
  for (const point of points) {
    if (Math.hypot(point.x - anchor.x, point.y - anchor.y) > Number.EPSILON) {
      return point;
    }
  }

  return fallback;
}

function getArrowGeometry(
  start: Point,
  end: Point,
  bodyStyle: ArrowBodyStyle,
  explicitControlPoint: Point | undefined,
  strokeWidth: number,
  startHead: ArrowHeadStyle,
  endHead: ArrowHeadStyle,
) {
  const controlPoint =
    bodyStyle === "curved" ? explicitControlPoint : undefined;
  const startTangent = controlPoint ?? end;
  const endTangent = controlPoint ?? start;

  const pathStart =
    startHead === "none"
      ? start
      : offsetPointToward(
          start,
          startTangent,
          getArrowHeadBodyInset(strokeWidth),
        );
  const pathEnd =
    endHead === "none"
      ? end
      : offsetPointToward(end, endTangent, getArrowHeadBodyInset(strokeWidth));

  return {
    controlPoint,
    pathStart,
    pathEnd,
    startTangent,
    endTangent,
  };
}

function getPolylineArrowGeometry(
  points: Point[],
  strokeWidth: number,
  startHead: ArrowHeadStyle,
  endHead: ArrowHeadStyle,
) {
  const start = points[0];
  const end = points[points.length - 1];
  const startTangent = getArrowDirectionPoint(start, points.slice(1), end);
  const endTangent = getArrowDirectionPoint(
    end,
    points.slice(0, -1).reverse(),
    start,
  );
  const pathPoints = points.map((point) => ({ ...point }));

  if (startHead !== "none" && pathPoints.length > 1) {
    pathPoints[0] = offsetPointToward(
      pathPoints[0],
      startTangent,
      getArrowHeadBodyInset(strokeWidth),
    );
  }

  if (endHead !== "none" && pathPoints.length > 1) {
    pathPoints[pathPoints.length - 1] = offsetPointToward(
      pathPoints[pathPoints.length - 1],
      endTangent,
      getArrowHeadBodyInset(strokeWidth),
    );
  }

  return {
    pathPoints,
    start,
    end,
    startTangent,
    endTangent,
  };
}

function renderArrow({
  context,
  object,
  appearance,
  surfaceTransform,
}: CanvasObjectRenderInput) {
  const arrow = object as unknown as ArrowObject;
  const strokeWidth = Math.max(
    1.5,
    arrow.props.strokeWidth * surfaceTransform.pixelsPerUnit,
  );

  context.save();
  context.globalAlpha = appearance === "preview" ? PREVIEW_OPACITY : 1;
  context.strokeStyle = arrow.props.color;
  context.fillStyle = arrow.props.color;
  context.lineWidth = strokeWidth;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.setLineDash(
    arrow.props.lineStyle === "dashed"
      ? scaleCanvasDashStyle(arrow.props.dashStyle, surfaceTransform.zoom)
      : [],
  );

  if (arrow.props.geometry === "polyline") {
    const geometry = getPolylineArrowGeometry(
      getArrowPolylinePoints(arrow.props).map((point) =>
        surfaceTransform.worldToCanvas(point),
      ),
      strokeWidth,
      arrow.props.startHead,
      arrow.props.endHead,
    );

    drawArrowPath(context, geometry.pathPoints);
    context.stroke();
    drawArrowHead({
      context,
      tip: geometry.start,
      tail: geometry.startTangent,
      color: arrow.props.color,
      strokeWidth,
      headStyle: arrow.props.startHead,
    });
    drawArrowHead({
      context,
      tip: geometry.end,
      tail: geometry.endTangent,
      color: arrow.props.color,
      strokeWidth,
      headStyle: arrow.props.endHead,
    });
  } else {
    const start = surfaceTransform.worldToCanvas(arrow.props.start);
    const end = surfaceTransform.worldToCanvas(arrow.props.end);
    const { controlPoint, pathStart, pathEnd, startTangent, endTangent } =
      getArrowGeometry(
        start,
        end,
        arrow.props.bodyStyle,
        arrow.props.curveOffset !== undefined
          ? surfaceTransform.worldToCanvas(
              getArrowControlPoint(
                arrow.props.start,
                arrow.props.end,
                arrow.props.curveOffset,
              ),
            )
          : undefined,
        strokeWidth,
        arrow.props.startHead,
        arrow.props.endHead,
      );

    for (const polyline of getArrowBodyPolylines({
      geometry: arrow.props.geometry,
      start: pathStart,
      end: pathEnd,
      controlPoint:
        arrow.props.bodyStyle === "curved" ? controlPoint : undefined,
      bodyStyle: arrow.props.bodyStyle,
      strokeWidth,
      styleScale: surfaceTransform.zoom,
    })) {
      drawArrowPath(context, polyline);
      context.stroke();
    }

    drawArrowHead({
      context,
      tip: start,
      tail: startTangent,
      color: arrow.props.color,
      strokeWidth,
      headStyle: arrow.props.startHead,
    });
    drawArrowHead({
      context,
      tip: end,
      tail: endTangent,
      color: arrow.props.color,
      strokeWidth,
      headStyle: arrow.props.endHead,
    });
  }
  context.restore();
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

function hitTestArrow({
  object,
  canvasPoint,
  surfaceTransform,
  minimumHitRadiusPx,
}: CanvasObjectHitTestInput) {
  const arrow = object as unknown as ArrowObject;
  const strokeWidth = arrow.props.strokeWidth * surfaceTransform.pixelsPerUnit;
  const threshold = Math.max(
    MIN_HIT_DISTANCE_PX,
    minimumHitRadiusPx / 2,
    strokeWidth,
  );

  const controlPoint =
    arrow.props.geometry === "simple" && arrow.props.bodyStyle === "curved"
      ? surfaceTransform.worldToCanvas(
          getArrowControlPoint(
            arrow.props.start,
            arrow.props.end,
            arrow.props.curveOffset,
          ),
        )
      : undefined;

  for (const polyline of getArrowBodyPolylines({
    geometry: arrow.props.geometry,
    start: surfaceTransform.worldToCanvas(arrow.props.start),
    end: surfaceTransform.worldToCanvas(arrow.props.end),
    points:
      arrow.props.geometry === "polyline"
        ? getArrowPolylinePoints(arrow.props).map((point) =>
            surfaceTransform.worldToCanvas(point),
          )
        : undefined,
    controlPoint,
    bodyStyle: arrow.props.bodyStyle,
    strokeWidth,
  })) {
    for (let index = 1; index < polyline.length; index += 1) {
      if (
        distanceToSegment(canvasPoint, polyline[index - 1], polyline[index]) <=
        threshold
      ) {
        return true;
      }
    }
  }

  return false;
}

function createPresetSecondaryActions(
  presets: ArrowToolPreset[],
): ToolDefinition["getSecondaryActions"] {
  return (state) => {
    const arrowState = getArrowToolState(state.toolState);

    return presets.map(
      (preset): ToolActionDefinition => ({
        id: preset.id,
        label: preset.label,
        icon: preset.icon,
        tooltip: preset.tooltip ?? preset.label,
        disabled: false,
        onSelect: (api) => applyArrowPreset(api, preset),
        active: isArrowPresetActive(arrowState.draftStyle, preset.draftStyle),
      }),
    );
  };
}

function getPendingArrowPreview(
  arrowState: ReturnType<typeof getArrowToolState>,
  point: Point,
) {
  if (arrowState.pendingPoints.length === 0) {
    return undefined;
  }

  if (arrowState.draftStyle.geometry === "polyline") {
    return createArrowObject({
      id: "arrow-preview",
      points: [...arrowState.pendingPoints, point],
      ...arrowState.draftStyle,
    });
  }

  return createArrowObject({
    id: "arrow-preview",
    start: arrowState.pendingPoints[0],
    end: point,
    ...arrowState.draftStyle,
  });
}

function shouldFinishPolyline(
  api: ToolApi,
  pendingPoints: Point[],
  nextPoint: Point,
  event: {
    canvasRect: { left: number; top: number; width: number; height: number };
  },
) {
  if (pendingPoints.length < 2) {
    return false;
  }

  const projection = createBoardSpaceProjection({
    surface: api.getState().board.surface,
    viewport: api.getState().ui.viewport,
    canvasRect: event.canvasRect,
    surfaceInset: 14,
  });
  const lastPoint = projection.worldToCanvas(
    pendingPoints[pendingPoints.length - 1],
  );
  const candidate = projection.worldToCanvas(nextPoint);

  return (
    Math.hypot(lastPoint.x - candidate.x, lastPoint.y - candidate.y) <=
    POLYLINE_FINISH_HIT_RADIUS_PX
  );
}

export function createArrowTool(
  options: CreateArrowToolOptions = {},
): ToolDefinition {
  const getSecondaryActions =
    options.presets && options.presets.length > 0
      ? createPresetSecondaryActions(options.presets)
      : undefined;

  return {
    id: ARROW_TOOL_ID,
    label: "Arrow",
    getSecondaryActions,
    onActivate: (api) => {
      if (options.presets && options.presets.length > 0) {
        applyArrowPreset(api, options.presets[0]);
      }
    },
    onDeactivate: (api) => {
      if (
        getArrowToolState(api.getState().toolState).pendingPoints.length > 0
      ) {
        cancelPendingArrow(api);
      }
    },
    registerRenderers: (api) => {
      api.registerObjectRenderer(ARROW_OBJECT_TYPE, renderArrow);
      api.registerObjectHitTester(ARROW_OBJECT_TYPE, hitTestArrow);
    },
    onPointerDown: (event, api) => {
      const state = api.getState();
      const arrowState = getArrowToolState(state.toolState);
      const pendingPoints = arrowState.pendingPoints;

      if (pendingPoints.length === 0) {
        clearSelection(api);
        setPendingPoints(api, [event.point]);
        return;
      }

      if (arrowState.draftStyle.geometry === "polyline") {
        if (shouldFinishPolyline(api, pendingPoints, event.point, event)) {
          finishPendingArrow(api);
          return;
        }

        setPendingPoints(api, [...pendingPoints, event.point]);
        return;
      }

      const arrowId = createArrowId(state.board.objects.byId);
      api.addObjects([
        createArrowObject({
          id: arrowId,
          start: pendingPoints[0],
          end: event.point,
          ...arrowState.draftStyle,
        }),
      ]);
      cancelPendingArrow(api);
    },
    onPointerMove: (event, api) => {
      const arrowState = getArrowToolState(api.getState().toolState);
      const preview = getPendingArrowPreview(arrowState, event.point);

      if (!preview) {
        api.clearPreviewObjects();
        return;
      }

      api.setPreviewObjects([preview]);
    },
    onPointerUp: () => {},
  };
}

export const arrowTool = createArrowTool();
