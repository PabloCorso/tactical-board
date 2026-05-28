import type { Point } from "../board/types";
import {
  createShapeObject,
  getShapePoints,
  moveShapeObject,
  rotateShapeObject,
  SHAPE_OBJECT_TYPE,
  type ShapeObject,
} from "../objects/shape-object";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import {
  scaleCanvasDashStyle,
  scaleCanvasStyleValue,
} from "../rendering/canvas/style-scale";
import { getScaledCanvasStrokeWidth } from "../rendering/canvas/object-render-scale";
import type {
  CanvasObjectHitTestInput,
  CanvasObjectRenderInput,
} from "../rendering/canvas/types";
import type { ToolApi, ToolDefinition } from "./types";
import { BoardEditorTool } from "./tool";
import { defineObjectDefinition } from "../objects/types";
import {
  getShapeToolState,
  SHAPE_TOOL_ID,
  type ShapeDraftStyle,
} from "./shape-tool-state";
import { clearSelection } from "./select-tool-actions";
import { shapeSelectionAdapter } from "./shape-selection";

const PREVIEW_OPACITY = 0.55;
const MIN_HIT_DISTANCE_PX = 10;
const POLYGON_FINISH_HIT_RADIUS_PX = 12;
const DIAGONAL_STRIPE_TILE_SIZE_PX = 11;
const DIAGONAL_STRIPE_LINE_WIDTH_PX = 2.25;
const RECTANGLE_CORNER_RADIUS_RATIO = 0.08;
const MAX_RECTANGLE_CORNER_RADIUS_PX = 8;
const DEFAULT_SHAPE_PREVIEW_SIZE = {
  width: 16,
  height: 12,
} as const;

export type ShapeToolDefault = {
  id: string;
  label: string;
  tooltip?: string;
  draftStyle: Partial<ShapeDraftStyle>;
};

type CreateShapeToolOptions = {
  defaults?: ShapeToolDefault[];
  defaultPreviewSize?: {
    width: number;
    height: number;
  };
};

const shapeObjectDefinition = defineObjectDefinition({
  type: SHAPE_OBJECT_TYPE,
  behaviors: {
    move: moveShapeObject,
    rotate: (object, center, rotationDelta) => {
      const nextPosition = rotatePointAround(
        object.position,
        center,
        rotationDelta,
      );
      const movedShape = moveShapeObject(object, {
        x: nextPosition.x - object.position.x,
        y: nextPosition.y - object.position.y,
      });

      return rotateShapeObject(
        movedShape,
        (object.rotation ?? 0) + rotationDelta,
      );
    },
  },
  selection: shapeSelectionAdapter,
});

export class ShapeTool extends BoardEditorTool implements ToolDefinition {
  readonly id = SHAPE_TOOL_ID;
  readonly label = "Shape";

  private readonly defaults: ShapeToolDefault[];
  private readonly defaultPreviewSize;

  constructor(options: CreateShapeToolOptions = {}) {
    super();
    this.defaults = options.defaults ?? [];
    this.defaultPreviewSize =
      options.defaultPreviewSize ?? DEFAULT_SHAPE_PREVIEW_SIZE;
  }

  onActivate(api: ToolApi) {
    if (this.defaults.length > 0) {
      applyShapeDefault(api, this.defaults[0]);
    }
  }

  onDeactivate(api: ToolApi) {
    cancelPendingShape(api);
  }

  registerCapabilities(
    api: Parameters<NonNullable<ToolDefinition["registerCapabilities"]>>[0],
  ) {
    api.registerObjectRenderer(SHAPE_OBJECT_TYPE, renderShape);
    api.registerObjectHitTester(SHAPE_OBJECT_TYPE, hitTestShape);
    api.registerObjectDefinition(shapeObjectDefinition);
  }

  onPointerDown(
    event: Parameters<NonNullable<ToolDefinition["onPointerDown"]>>[0],
    api: ToolApi,
  ) {
    const state = api.getState();
    const shapeState = getShapeToolState(state.toolState);

    if (shapeState.draftStyle.kind !== "polygon") {
      clearSelection(api);
      setPendingPoints(api, [event.point]);
      return;
    }

    const pendingPoints = shapeState.pendingPoints;

    if (pendingPoints.length === 0) {
      clearSelection(api);
      setPendingPoints(api, [event.point]);
      return;
    }

    if (event.button === 2) {
      completePendingPolygon(api);
      return;
    }

    if (shouldFinishPolygon(api, pendingPoints, event.point, event)) {
      completePendingPolygon(api);
      return;
    }

    setPendingPoints(api, [...pendingPoints, event.point]);
  }

  onPointerMove(
    event: Parameters<NonNullable<ToolDefinition["onPointerMove"]>>[0],
    api: ToolApi,
  ) {
    const shapeState = getShapeToolState(api.getState().toolState);
    const preview = getPendingShapePreview(
      shapeState,
      event.point,
      this.defaultPreviewSize,
    );

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
    const shapeState = getShapeToolState(state.toolState);

    if (
      shapeState.draftStyle.kind === "polygon" ||
      shapeState.pendingPoints.length !== 1
    ) {
      return;
    }

    const shapeId = createShapeId(state.board.objects.byId);
    api.addObjects([
      event.draggedSincePointerDown
        ? createShapeObject({
            id: shapeId,
            start: shapeState.pendingPoints[0],
            end: event.point,
            ...shapeState.draftStyle,
          })
        : createDefaultShapePreview({
            id: shapeId,
            point: event.point,
            draftStyle: shapeState.draftStyle,
            size: this.defaultPreviewSize,
          }),
    ]);
    cancelPendingShape(api);
  }

  onKeyDown(
    event: Parameters<NonNullable<ToolDefinition["onKeyDown"]>>[0],
    api: ToolApi,
  ) {
    if (
      event.key !== "Enter" ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey ||
      !canCompletePendingPolygon(api)
    ) {
      return false;
    }

    completePendingPolygon(api);
    return true;
  }

  onEscapeKey(api: ToolApi) {
    const shapeState = getShapeToolState(api.getState().toolState);

    if (shapeState.pendingPoints.length === 0) {
      return false;
    }

    cancelPendingShape(api);
    return true;
  }

  shouldKeepPreviewOnPointerLeave(api: ToolApi) {
    return getShapeToolState(api.getState().toolState).pendingPoints.length > 0;
  }

  shouldPreventContextMenu(api: ToolApi) {
    const shapeState = getShapeToolState(api.getState().toolState);

    return (
      shapeState.draftStyle.kind === "polygon" &&
      shapeState.pendingPoints.length > 0
    );
  }
}

function createShapeId(existingIds: Record<string, unknown>) {
  let index = 1;

  while (existingIds[`shape-${index}`]) {
    index += 1;
  }

  return `shape-${index}`;
}

function applyShapeDefault(
  api: ToolApi,
  toolDefault: Pick<ShapeToolDefault, "draftStyle">,
) {
  const shapeState = getShapeToolState(api.getState().toolState);

  api.setToolState(SHAPE_TOOL_ID, {
    ...shapeState,
    draftStyle: {
      ...shapeState.draftStyle,
      ...toolDefault.draftStyle,
    },
  });
}

function setPendingPoints(api: ToolApi, pendingPoints: Point[]) {
  const shapeState = getShapeToolState(api.getState().toolState);

  api.setToolState(SHAPE_TOOL_ID, {
    ...shapeState,
    pendingPoints,
  });
}

function cancelPendingShape(api: ToolApi) {
  setPendingPoints(api, []);
  api.clearPreviewObjects();
}

export function completePendingPolygon(api: ToolApi) {
  const state = api.getState();
  const shapeState = getShapeToolState(state.toolState);

  if (
    shapeState.draftStyle.kind !== "polygon" ||
    shapeState.pendingPoints.length < 3
  ) {
    return;
  }

  const shapeId = createShapeId(state.board.objects.byId);
  api.addObjects([
    createShapeObject({
      id: shapeId,
      points: shapeState.pendingPoints,
      ...shapeState.draftStyle,
    }),
  ]);
  cancelPendingShape(api);
}

export function canCompletePendingPolygon(api: ToolApi) {
  const state = api.getState();
  const shapeState = getShapeToolState(state.toolState);

  return (
    state.ui.activeToolId === SHAPE_TOOL_ID &&
    shapeState.draftStyle.kind === "polygon" &&
    shapeState.pendingPoints.length >= 3
  );
}

function rotatePointAround(point: Point, center: Point, rotation = 0): Point {
  const angle = (rotation * Math.PI) / 180;
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

function getRenderedShapeCanvasPoints(
  shape: ShapeObject,
  frameTransform: CanvasObjectRenderInput["frameTransform"],
) {
  return getShapePoints(shape.props)
    .map((point) => rotatePointAround(point, shape.position, shape.rotation))
    .map((point) => frameTransform.boardToCanvas(point));
}

function getRenderedRectangleMetrics(
  shape: ShapeObject,
  frameTransform: CanvasObjectRenderInput["frameTransform"],
) {
  const center = frameTransform.boardToCanvas(shape.position);
  const width = Math.abs((shape.size?.width ?? 0) * frameTransform.scale);
  const height = Math.abs(
    (shape.size?.height ?? shape.size?.width ?? 0) * frameTransform.scale,
  );
  const radius = getRectangleCornerRadius(width, height);

  return {
    center,
    width,
    height,
    halfWidth: width / 2,
    halfHeight: height / 2,
    radius,
  };
}

export function getRectangleCornerRadius(width: number, height: number) {
  return Math.min(
    Math.min(Math.abs(width), Math.abs(height)) * RECTANGLE_CORNER_RADIUS_RATIO,
    MAX_RECTANGLE_CORNER_RADIUS_PX,
    Math.abs(width) / 2,
    Math.abs(height) / 2,
  );
}

function rotateLocalCanvasPoint(
  localPoint: Point,
  center: Point,
  rotation = 0,
): Point {
  return rotatePointAround(
    {
      x: center.x + localPoint.x,
      y: center.y + localPoint.y,
    },
    center,
    rotation,
  );
}

function traceRoundedRectanglePath(
  path: Path2D,
  shape: ShapeObject,
  frameTransform: CanvasObjectRenderInput["frameTransform"],
) {
  const { center, halfWidth, halfHeight, radius } = getRenderedRectangleMetrics(
    shape,
    frameTransform,
  );
  const rotation = shape.rotation ?? 0;
  const topLeft = rotateLocalCanvasPoint(
    { x: -halfWidth, y: -halfHeight },
    center,
    rotation,
  );
  const topRight = rotateLocalCanvasPoint(
    { x: halfWidth, y: -halfHeight },
    center,
    rotation,
  );
  const bottomRight = rotateLocalCanvasPoint(
    { x: halfWidth, y: halfHeight },
    center,
    rotation,
  );
  const bottomLeft = rotateLocalCanvasPoint(
    { x: -halfWidth, y: halfHeight },
    center,
    rotation,
  );
  const start = rotateLocalCanvasPoint(
    { x: -halfWidth + radius, y: -halfHeight },
    center,
    rotation,
  );

  path.moveTo(start.x, start.y);
  path.arcTo(topRight.x, topRight.y, bottomRight.x, bottomRight.y, radius);
  path.arcTo(bottomRight.x, bottomRight.y, bottomLeft.x, bottomLeft.y, radius);
  path.arcTo(bottomLeft.x, bottomLeft.y, topLeft.x, topLeft.y, radius);
  path.arcTo(topLeft.x, topLeft.y, topRight.x, topRight.y, radius);
  path.closePath();
}

function createRenderedShapePath(
  shape: ShapeObject,
  frameTransform: CanvasObjectRenderInput["frameTransform"],
) {
  const path = new Path2D();

  if (shape.props.kind === "oval") {
    const center = frameTransform.boardToCanvas(shape.position);
    const width = (shape.size?.width ?? 0) * frameTransform.scale;
    const height =
      (shape.size?.height ?? shape.size?.width ?? 0) * frameTransform.scale;

    path.ellipse(
      center.x,
      center.y,
      Math.abs(width) / 2,
      Math.abs(height) / 2,
      ((shape.rotation ?? 0) * Math.PI) / 180,
      0,
      Math.PI * 2,
    );

    return path;
  }

  if (shape.props.kind === "rectangle") {
    traceRoundedRectanglePath(path, shape, frameTransform);
    return path;
  }

  const points = getRenderedShapeCanvasPoints(shape, frameTransform);

  if (points.length === 0) {
    return path;
  }

  path.moveTo(points[0].x, points[0].y);

  for (const point of points.slice(1)) {
    path.lineTo(point.x, point.y);
  }

  path.closePath();

  return path;
}

function getRenderedShapeCanvasBounds(
  shape: ShapeObject,
  frameTransform: CanvasObjectRenderInput["frameTransform"],
) {
  if (shape.props.kind === "oval") {
    const center = frameTransform.boardToCanvas(shape.position);
    const width = (shape.size?.width ?? 0) * frameTransform.scale;
    const height =
      (shape.size?.height ?? shape.size?.width ?? 0) * frameTransform.scale;
    const radius = Math.hypot(width, height) / 2;

    return {
      minX: center.x - radius,
      maxX: center.x + radius,
      minY: center.y - radius,
      maxY: center.y + radius,
    };
  }

  const points = getRenderedShapeCanvasPoints(shape, frameTransform);

  if (points.length === 0) {
    const center = frameTransform.boardToCanvas(shape.position);

    return {
      minX: center.x,
      maxX: center.x,
      minY: center.y,
      maxY: center.y,
    };
  }

  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

function fillDiagonalStripes(
  context: CanvasRenderingContext2D,
  path: Path2D,
  bounds: ReturnType<typeof getRenderedShapeCanvasBounds>,
  color: string,
  frameTransform: CanvasObjectRenderInput["frameTransform"],
) {
  const tileSize = scaleCanvasStyleValue(
    DIAGONAL_STRIPE_TILE_SIZE_PX,
    frameTransform.zoom,
  );
  const lineWidth = scaleCanvasStyleValue(
    DIAGONAL_STRIPE_LINE_WIDTH_PX,
    frameTransform.zoom,
  );
  const boardOriginCanvasPoint = frameTransform.boardToCanvas({ x: 0, y: 0 });
  const phase = boardOriginCanvasPoint.x + boardOriginCanvasPoint.y;
  const extent = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  const minSum = bounds.minX + bounds.minY - extent;
  const maxSum = bounds.maxX + bounds.maxY + extent;
  const startIndex = Math.floor((minSum - phase) / tileSize);
  const endIndex = Math.ceil((maxSum - phase) / tileSize);
  const startX = bounds.minX - extent;
  const endX = bounds.maxX + extent;

  context.save();
  context.clip(path);
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.lineCap = "butt";
  context.setLineDash([]);
  context.beginPath();

  for (let index = startIndex; index <= endIndex; index += 1) {
    const sum = phase + index * tileSize;
    context.moveTo(startX, sum - startX);
    context.lineTo(endX, sum - endX);
  }

  context.stroke();
  context.restore();
}

export function renderShape({
  context,
  object,
  appearance,
  frameTransform,
}: CanvasObjectRenderInput) {
  const shape = object as ShapeObject;
  const path = createRenderedShapePath(shape, frameTransform);
  const bounds = getRenderedShapeCanvasBounds(shape, frameTransform);
  const strokeWidth = getScaledCanvasStrokeWidth(
    shape.props.strokeWidth,
    frameTransform.scale,
  );

  context.save();
  context.globalAlpha = appearance === "preview" ? PREVIEW_OPACITY : 1;
  context.strokeStyle = shape.props.color;
  context.fillStyle = shape.props.color;
  context.lineWidth = strokeWidth;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.setLineDash(
    shape.props.lineStyle === "dashed"
      ? scaleCanvasDashStyle(shape.props.dashStyle, frameTransform.zoom)
      : [],
  );

  if (shape.props.fillStyle !== "none") {
    context.save();
    context.globalAlpha *= shape.props.fillOpacity;
    context.fillStyle = shape.props.color;
    context.fill(path);

    if (shape.props.fillStyle === "diagonal-stripes") {
      fillDiagonalStripes(
        context,
        path,
        bounds,
        shape.props.color,
        frameTransform,
      );
    }
    context.restore();
  }

  if (shape.props.bordered) {
    context.stroke(path);
  }

  context.restore();
}

function getRotatedOffsetFromCenter(
  point: Point,
  center: Point,
  rotation = 0,
): Point {
  const rotated = rotatePointAround(point, center, rotation);

  return {
    x: rotated.x - center.x,
    y: rotated.y - center.y,
  };
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

function isPointInsidePolygon(point: Point, polygon: Point[]) {
  let inside = false;

  for (
    let index = 0, previous = polygon.length - 1;
    index < polygon.length;
    previous = index, index += 1
  ) {
    const a = polygon[index];
    const b = polygon[previous];
    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y || 1e-9) + a.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function isPointInsideRoundedRectangle(
  point: Point,
  halfWidth: number,
  halfHeight: number,
  radius: number,
) {
  const x = Math.abs(point.x);
  const y = Math.abs(point.y);

  if (x > halfWidth || y > halfHeight) {
    return false;
  }

  if (radius <= 0 || x <= halfWidth - radius || y <= halfHeight - radius) {
    return true;
  }

  const dx = x - (halfWidth - radius);
  const dy = y - (halfHeight - radius);

  return dx * dx + dy * dy <= radius * radius;
}

function hitTestShape({
  object,
  canvasPoint,
  frameTransform,
  minimumHitRadiusPx,
}: CanvasObjectHitTestInput) {
  const shape = object as ShapeObject;
  const points = getRenderedShapeCanvasPoints(shape, frameTransform);
  const threshold = Math.max(
    MIN_HIT_DISTANCE_PX,
    minimumHitRadiusPx / 2,
    shape.props.strokeWidth * frameTransform.scale,
  );

  if (shape.props.kind === "oval") {
    const center = frameTransform.boardToCanvas(shape.position);
    const localOffset = getRotatedOffsetFromCenter(
      canvasPoint,
      center,
      -(shape.rotation ?? 0),
    );
    const width = (shape.size?.width ?? 0) * frameTransform.scale;
    const height =
      (shape.size?.height ?? shape.size?.width ?? 0) * frameTransform.scale;
    const rx = Math.max(Math.abs(width) / 2, threshold);
    const ry = Math.max(Math.abs(height) / 2, threshold);
    const normalized =
      (localOffset.x * localOffset.x) / (rx * rx) +
      (localOffset.y * localOffset.y) / (ry * ry);

    return normalized <= 1;
  }

  if (shape.props.kind === "rectangle") {
    const metrics = getRenderedRectangleMetrics(shape, frameTransform);
    const localOffset = getRotatedOffsetFromCenter(
      canvasPoint,
      metrics.center,
      -(shape.rotation ?? 0),
    );

    return isPointInsideRoundedRectangle(
      localOffset,
      metrics.halfWidth,
      metrics.halfHeight,
      metrics.radius,
    );
  }

  for (let index = 0; index < points.length; index += 1) {
    const start = points[index];
    const end = points[(index + 1) % points.length];

    if (distanceToSegment(canvasPoint, start, end) <= threshold) {
      return true;
    }
  }

  return isPointInsidePolygon(canvasPoint, points);
}

function getPendingShapePreview(
  shapeState: ReturnType<typeof getShapeToolState>,
  point: Point,
  defaultPreviewSize: {
    width: number;
    height: number;
  },
) {
  if (shapeState.pendingPoints.length === 0) {
    return shapeState.draftStyle.kind === "polygon"
      ? undefined
      : createDefaultShapePreview({
          id: "shape-preview",
          point,
          draftStyle: shapeState.draftStyle,
          size: defaultPreviewSize,
        });
  }

  if (shapeState.draftStyle.kind === "polygon") {
    return createShapeObject({
      id: "shape-preview",
      points: [...shapeState.pendingPoints, point],
      ...shapeState.draftStyle,
    });
  }

  return createShapeObject({
    id: "shape-preview",
    start: shapeState.pendingPoints[0],
    end: point,
    ...shapeState.draftStyle,
  });
}

function createDefaultShapePreview({
  id,
  point,
  draftStyle,
  size,
}: {
  id: string;
  point: Point;
  draftStyle: ReturnType<typeof getShapeToolState>["draftStyle"];
  size: {
    width: number;
    height: number;
  };
}) {
  return createShapeObject({
    id,
    start: {
      x: point.x,
      y: point.y,
    },
    end: {
      x: point.x + size.width,
      y: point.y + size.height,
    },
    ...draftStyle,
  });
}

function shouldFinishPolygon(
  api: ToolApi,
  pendingPoints: Point[],
  nextPoint: Point,
  event: {
    canvasRect: { left: number; top: number; width: number; height: number };
  },
) {
  if (pendingPoints.length < 3) {
    return false;
  }

  const state = api.getState();
  const projection = createBoardSpaceProjection({
    frame: state.board.frame,
    viewport: state.ui.viewport,
    canvasRect: event.canvasRect,
    viewportInsets: state.ui.viewportInsets,
  });
  const firstPoint = projection.boardToCanvas(pendingPoints[0]);
  const candidate = projection.boardToCanvas(nextPoint);

  return (
    Math.hypot(firstPoint.x - candidate.x, firstPoint.y - candidate.y) <=
    POLYGON_FINISH_HIT_RADIUS_PX
  );
}
