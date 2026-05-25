import type { Point } from "../board/types";
import {
  ARROW_OBJECT_TYPE,
  createArrowObject,
  getArrowBodyPolylines,
  getArrowBodyStrokeWidth,
  getArrowControlPoint,
  moveArrowObject,
  updateArrowObject,
  type ArrowObject,
  type ArrowKind,
  type ArrowHeadStyle,
} from "../objects/arrow-object";
import { rotatePointAround } from "../objects/object-behaviors";
import { scaleCanvasDashStyle } from "../rendering/canvas/style-scale";
import {
  getArrowHeadLength,
  getScaledCanvasStrokeWidth,
} from "../rendering/canvas/object-render-scale";
import type {
  CanvasObjectHitTestInput,
  CanvasObjectRenderInput,
} from "../rendering/canvas/types";
import type { ToolApi, ToolDefinition } from "./types";
import { BoardEditorTool } from "./tool";
import { defineObjectDefinition } from "../objects/types";
import {
  ARROW_TOOL_ID,
  getArrowToolState,
  type ArrowDraftStyle,
} from "./arrow-tool-state";
import { clearSelection } from "./select-tool-actions";
import { arrowSelectionAdapter } from "./arrow-selection";

const PREVIEW_OPACITY = 0.55;
const MIN_HIT_DISTANCE_PX = 10;

export type ArrowToolDefault = {
  id: string;
  label: string;
  tooltip?: string;
  draftStyle: Partial<ArrowDraftStyle>;
};

export type CreateArrowToolOptions = {
  defaults?: ArrowToolDefault[];
};

const arrowObjectDefinition = defineObjectDefinition({
  type: ARROW_OBJECT_TYPE,
  behaviors: {
    move: moveArrowObject,
    rotate: (object, center, rotationDelta) =>
      updateArrowObject(object, {
        start: rotatePointAround(object.props.start, center, rotationDelta),
        end: rotatePointAround(object.props.end, center, rotationDelta),
      }),
  },
  selection: arrowSelectionAdapter,
});

export class ArrowTool extends BoardEditorTool implements ToolDefinition {
  readonly id = ARROW_TOOL_ID;
  readonly label = "Arrow";

  private readonly defaults: ArrowToolDefault[];

  constructor(options: CreateArrowToolOptions = {}) {
    super();
    this.defaults = options.defaults ?? [];
  }

  onActivate(api: ToolApi) {
    if (this.defaults.length > 0) {
      applyArrowDefault(api, this.defaults[0]);
    }
  }

  onDeactivate(api: ToolApi) {
    this.onEscapeKey(api);
  }

  registerCapabilities(
    api: Parameters<NonNullable<ToolDefinition["registerCapabilities"]>>[0],
  ) {
    api.registerObjectRenderer(ARROW_OBJECT_TYPE, renderArrow);
    api.registerObjectHitTester(ARROW_OBJECT_TYPE, hitTestArrow);
    api.registerObjectDefinition(arrowObjectDefinition);
  }

  onPointerDown(
    event: Parameters<NonNullable<ToolDefinition["onPointerDown"]>>[0],
    api: ToolApi,
  ) {
    const state = api.getState();
    const arrowState = getArrowToolState(state.toolState);
    const pendingPoints = arrowState.pendingPoints;

    if (pendingPoints.length === 0) {
      clearSelection(api);
      setPendingPoints(api, [event.point]);
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
  }

  onPointerMove(
    event: Parameters<NonNullable<ToolDefinition["onPointerMove"]>>[0],
    api: ToolApi,
  ) {
    const arrowState = getArrowToolState(api.getState().toolState);
    const preview = getPendingArrowPreview(arrowState, event.point);

    if (!preview) {
      api.clearPreviewObjects();
      return;
    }

    api.setPreviewObjects([preview]);
  }

  onPointerUp(
    event: Parameters<NonNullable<ToolDefinition["onPointerUp"]>>[0],
    api: ToolApi,
  ) {
    const state = api.getState();
    const arrowState = getArrowToolState(state.toolState);

    if (
      arrowState.pendingPoints.length !== 1 ||
      !event.draggedSincePointerDown
    ) {
      return;
    }

    const arrowId = createArrowId(state.board.objects.byId);
    api.addObjects([
      createArrowObject({
        id: arrowId,
        start: arrowState.pendingPoints[0],
        end: event.point,
        ...arrowState.draftStyle,
      }),
    ]);
    cancelPendingArrow(api);
  }

  onEscapeKey(api: ToolApi) {
    if (
      getArrowToolState(api.getState().toolState).pendingPoints.length === 0
    ) {
      return false;
    }

    cancelPendingArrow(api);
    return true;
  }

  shouldKeepPreviewOnPointerLeave(api: ToolApi) {
    return getArrowToolState(api.getState().toolState).pendingPoints.length > 0;
  }
}

function createArrowId(existingIds: Record<string, unknown>) {
  let index = 1;

  while (existingIds[`arrow-${index}`]) {
    index += 1;
  }

  return `arrow-${index}`;
}

function applyArrowDefault(
  api: ToolApi,
  toolDefault: Pick<ArrowToolDefault, "draftStyle">,
) {
  const arrowState = getArrowToolState(api.getState().toolState);

  api.setToolState(ARROW_TOOL_ID, {
    ...arrowState,
    draftStyle: {
      ...arrowState.draftStyle,
      ...toolDefault.draftStyle,
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
  kind: ArrowKind,
  explicitControlPoint: Point | undefined,
  strokeWidth: number,
  startHead: ArrowHeadStyle,
  endHead: ArrowHeadStyle,
) {
  const controlPoint = kind === "curved" ? explicitControlPoint : undefined;
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

export function renderArrow({
  context,
  object,
  appearance,
  frameTransform,
}: CanvasObjectRenderInput) {
  const arrow = object as unknown as ArrowObject;
  const strokeWidth = getScaledCanvasStrokeWidth(
    arrow.props.strokeWidth,
    frameTransform.scale,
  );
  const bodyStrokeWidth = getArrowBodyStrokeWidth(
    strokeWidth,
    arrow.props.kind,
  );

  context.save();
  context.globalAlpha = appearance === "preview" ? PREVIEW_OPACITY : 1;
  context.strokeStyle = arrow.props.color;
  context.fillStyle = arrow.props.color;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.setLineDash(
    arrow.props.lineStyle === "dashed"
      ? scaleCanvasDashStyle(arrow.props.dashStyle, frameTransform.zoom)
      : [],
  );

  const start = frameTransform.boardToCanvas(arrow.props.start);
  const end = frameTransform.boardToCanvas(arrow.props.end);
  const { controlPoint, pathStart, pathEnd, startTangent, endTangent } =
    getArrowGeometry(
      start,
      end,
      arrow.props.kind,
      arrow.props.curveOffset !== undefined
        ? frameTransform.boardToCanvas(
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

  context.lineWidth = bodyStrokeWidth;
  for (const polyline of getArrowBodyPolylines({
    start: pathStart,
    end: pathEnd,
    controlPoint: arrow.props.kind === "curved" ? controlPoint : undefined,
    kind: arrow.props.kind,
    styleScale: frameTransform.zoom,
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
  frameTransform,
  minimumHitRadiusPx,
}: CanvasObjectHitTestInput) {
  const arrow = object as unknown as ArrowObject;
  const strokeWidth = arrow.props.strokeWidth * frameTransform.scale;
  const threshold = Math.max(
    MIN_HIT_DISTANCE_PX,
    minimumHitRadiusPx / 2,
    strokeWidth,
  );

  const controlPoint =
    arrow.props.kind === "curved"
      ? frameTransform.boardToCanvas(
          getArrowControlPoint(
            arrow.props.start,
            arrow.props.end,
            arrow.props.curveOffset,
          ),
        )
      : undefined;
  const start = frameTransform.boardToCanvas(arrow.props.start);
  const end = frameTransform.boardToCanvas(arrow.props.end);
  const { pathStart, pathEnd } = getArrowGeometry(
    start,
    end,
    arrow.props.kind,
    controlPoint,
    strokeWidth,
    arrow.props.startHead,
    arrow.props.endHead,
  );

  for (const polyline of getArrowBodyPolylines({
    start: pathStart,
    end: pathEnd,
    controlPoint: arrow.props.kind === "curved" ? controlPoint : undefined,
    kind: arrow.props.kind,
    styleScale: frameTransform.zoom,
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

function getPendingArrowPreview(
  arrowState: ReturnType<typeof getArrowToolState>,
  point: Point,
) {
  if (arrowState.pendingPoints.length === 0) {
    return undefined;
  }

  return createArrowObject({
    id: "arrow-preview",
    start: arrowState.pendingPoints[0],
    end: point,
    ...arrowState.draftStyle,
  });
}
