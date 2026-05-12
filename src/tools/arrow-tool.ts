import type { Point } from "../core/board/types";
import {
  ARROW_OBJECT_TYPE,
  createArrowObject,
  type ArrowObject,
  type ArrowBodyStyle,
  type ArrowHeadStyle,
  type ArrowLineStyle,
} from "../core/objects/arrow-object";
import type {
  CanvasObjectHitTestInput,
  CanvasObjectRenderInput,
} from "../rendering/canvas/types";
import type {
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
const CURVE_BEND_RATIO = 0.18;
const MIN_HIT_DISTANCE_PX = 10;

export interface ArrowToolPreset {
  id: string;
  label: string;
  tooltip?: string;
  draftStyle: Partial<ArrowDraftStyle>;
}

export interface CreateArrowToolOptions {
  presets?: ArrowToolPreset[];
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

function setPendingStart(api: ToolApi, pendingStart?: Point) {
  const arrowState = getArrowToolState(api.getState().toolState);

  api.setToolState(ARROW_TOOL_ID, {
    ...arrowState,
    pendingStart,
  });
}

function getCurveControlPoint(start: Point, end: Point): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const bend = length * CURVE_BEND_RATIO;

  return {
    x: (start.x + end.x) / 2 - (dy / length) * bend,
    y: (start.y + end.y) / 2 + (dx / length) * bend,
  };
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

function drawArrowPath(
  context: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  controlPoint: Point | undefined,
  bodyStyle: ArrowBodyStyle,
) {
  context.beginPath();
  context.moveTo(start.x, start.y);

  if (bodyStyle === "curved" && controlPoint) {
    context.quadraticCurveTo(controlPoint.x, controlPoint.y, end.x, end.y);
    return;
  }

  context.lineTo(end.x, end.y);
}

function getArrowGeometry(
  start: Point,
  end: Point,
  bodyStyle: ArrowBodyStyle,
  strokeWidth: number,
  startHead: ArrowHeadStyle,
  endHead: ArrowHeadStyle,
) {
  const controlPoint =
    bodyStyle === "curved" ? getCurveControlPoint(start, end) : undefined;
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

function renderArrow({
  context,
  object,
  appearance,
  surfaceTransform,
}: CanvasObjectRenderInput) {
  const arrow = object as unknown as ArrowObject;
  const start = surfaceTransform.worldToCanvas(arrow.props.start);
  const end = surfaceTransform.worldToCanvas(arrow.props.end);
  const strokeWidth = Math.max(
    1.5,
    arrow.props.strokeWidth * surfaceTransform.pixelsPerUnit,
  );
  const { controlPoint, pathStart, pathEnd, startTangent, endTangent } =
    getArrowGeometry(
      start,
      end,
      arrow.props.bodyStyle,
      strokeWidth,
      arrow.props.startHead,
      arrow.props.endHead,
    );

  context.save();
  context.globalAlpha = appearance === "preview" ? PREVIEW_OPACITY : 1;
  context.strokeStyle = arrow.props.color;
  context.fillStyle = arrow.props.color;
  context.lineWidth = strokeWidth;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.setLineDash(
    arrow.props.lineStyle === "dashed" ? arrow.props.dashStyle : [],
  );

  drawArrowPath(
    context,
    pathStart,
    pathEnd,
    controlPoint,
    arrow.props.bodyStyle,
  );
  context.stroke();

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
  const start = surfaceTransform.worldToCanvas(arrow.props.start);
  const end = surfaceTransform.worldToCanvas(arrow.props.end);
  const strokeWidth = arrow.props.strokeWidth * surfaceTransform.pixelsPerUnit;
  const threshold = Math.max(
    MIN_HIT_DISTANCE_PX,
    minimumHitRadiusPx / 2,
    strokeWidth,
  );

  if (arrow.props.bodyStyle === "straight") {
    return distanceToSegment(canvasPoint, start, end) <= threshold;
  }

  const controlPoint = getCurveControlPoint(start, end);
  let previous = start;

  for (let index = 1; index <= 16; index += 1) {
    const t = index / 16;
    const point = {
      x:
        (1 - t) * (1 - t) * start.x +
        2 * (1 - t) * t * controlPoint.x +
        t * t * end.x,
      y:
        (1 - t) * (1 - t) * start.y +
        2 * (1 - t) * t * controlPoint.y +
        t * t * end.y,
    };

    if (distanceToSegment(canvasPoint, previous, point) <= threshold) {
      return true;
    }

    previous = point;
  }

  return false;
}

function createPresetSecondaryActions(
  presets: ArrowToolPreset[],
): ToolDefinition["getSecondaryActions"] {
  return () =>
    presets.map(
      (preset): ToolActionDefinition => ({
        id: preset.id,
        label: preset.label,
        tooltip: preset.tooltip ?? preset.label,
        disabled: false,
        onSelect: (api) => applyArrowPreset(api, preset),
        active: false,
      }),
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
    registerRenderers: (api) => {
      api.registerObjectRenderer(ARROW_OBJECT_TYPE, renderArrow);
      api.registerObjectHitTester(ARROW_OBJECT_TYPE, hitTestArrow);
    },
    onPointerDown: (event, api) => {
      const state = api.getState();
      const arrowState = getArrowToolState(state.toolState);

      if (!arrowState.pendingStart) {
        clearSelection(api);
        setPendingStart(api, event.point);
        return;
      }

      const arrowId = createArrowId(state.board.objects.byId);
      const nextArrow = createArrowObject({
        id: arrowId,
        start: arrowState.pendingStart,
        end: event.point,
        ...arrowState.draftStyle,
      });

      api.addObjects([nextArrow]);
      setPendingStart(api, undefined);
      api.clearPreviewObjects();
    },
    onPointerMove: (event, api) => {
      const arrowState = getArrowToolState(api.getState().toolState);
      if (!arrowState.pendingStart) {
        api.clearPreviewObjects();
        return;
      }

      api.setPreviewObjects([
        createArrowObject({
          id: "arrow-preview",
          start: arrowState.pendingStart,
          end: event.point,
          ...arrowState.draftStyle,
        }),
      ]);
    },
    onPointerUp: () => {},
  };
}

export const arrowTool = createArrowTool();
