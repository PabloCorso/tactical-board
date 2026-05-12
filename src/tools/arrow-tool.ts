import type { Point } from "../core/board/types";
import {
  ARROW_OBJECT_TYPE,
  getArrowBodyPolylines,
  createArrowObject,
  getArrowControlPoint,
  type ArrowObject,
  type ArrowBodyStyle,
  type ArrowHeadStyle,
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
const MIN_HIT_DISTANCE_PX = 10;

export interface ArrowToolPreset {
  id: string;
  label: string;
  iconId?: string;
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

  for (const polyline of getArrowBodyPolylines({
    start: pathStart,
    end: pathEnd,
    controlPoint: arrow.props.bodyStyle === "curved" ? controlPoint : undefined,
    bodyStyle: arrow.props.bodyStyle,
    strokeWidth,
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

  const controlPoint =
    arrow.props.bodyStyle === "curved"
      ? surfaceTransform.worldToCanvas(
          getArrowControlPoint(
            arrow.props.start,
            arrow.props.end,
            arrow.props.curveOffset,
          ),
        )
      : undefined;

  for (const polyline of getArrowBodyPolylines({
    start,
    end,
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
  return () =>
    presets.map(
      (preset): ToolActionDefinition => ({
        id: preset.id,
        label: preset.label,
        iconId: preset.iconId,
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
