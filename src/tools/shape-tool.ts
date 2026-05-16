import type { Point } from "../core/board/types";
import {
  createShapeObject,
  getShapePoints,
  moveShapeObject,
  rotateShapeObject,
  SHAPE_OBJECT_TYPE,
  type ShapeObject,
} from "../core/objects/shape-object";
import { createBoardSpaceProjection } from "../core/geometry/board-space-projection";
import {
  scaleCanvasDashStyle,
  scaleCanvasStyleValue,
} from "../rendering/canvas/style-scale";
import { getWorldCanvasStrokeWidth } from "../rendering/canvas/object-render-scale";
import type {
  CanvasObjectHitTestInput,
  CanvasObjectRenderInput,
} from "../rendering/canvas/types";
import type { ToolApi, ToolDefinition } from "../core/tools/types";
import { BoardEditorTool } from "../core/tools/tool";
import { defineObjectDefinition } from "../core/objects/types";
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
const DEFAULT_SHAPE_PREVIEW_SIZE = {
  width: 16,
  height: 12,
} as const;

export type ShapeToolPreset = {
  id: string;
  label: string;
  tooltip?: string;
  draftStyle: Partial<ShapeDraftStyle>;
};

type CreateShapeToolOptions = {
  presets?: ShapeToolPreset[];
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

  private readonly presets: ShapeToolPreset[];

  constructor(options: CreateShapeToolOptions = {}) {
    super();
    this.presets = options.presets ?? [];
  }

  onActivate(api: ToolApi) {
    if (this.presets.length > 0) {
      applyShapePreset(api, this.presets[0]);
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
    const preview = getPendingShapePreview(shapeState, event.point);

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
          }),
    ]);
    cancelPendingShape(api);
  }
}

function createShapeId(existingIds: Record<string, unknown>) {
  let index = 1;

  while (existingIds[`shape-${index}`]) {
    index += 1;
  }

  return `shape-${index}`;
}

function applyShapePreset(
  api: ToolApi,
  preset: Pick<ShapeToolPreset, "draftStyle">,
) {
  const shapeState = getShapeToolState(api.getState().toolState);

  api.setToolState(SHAPE_TOOL_ID, {
    ...shapeState,
    draftStyle: {
      ...shapeState.draftStyle,
      ...preset.draftStyle,
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
  surfaceTransform: CanvasObjectRenderInput["surfaceTransform"],
) {
  return getShapePoints(shape.props)
    .map((point) => rotatePointAround(point, shape.position, shape.rotation))
    .map((point) => surfaceTransform.worldToCanvas(point));
}

function getRenderedRectangleMetrics(
  shape: ShapeObject,
  surfaceTransform: CanvasObjectRenderInput["surfaceTransform"],
) {
  const center = surfaceTransform.worldToCanvas(shape.position);
  const width = Math.abs(
    (shape.size?.width ?? 0) * surfaceTransform.pixelsPerUnit,
  );
  const height = Math.abs(
    (shape.size?.height ?? shape.size?.width ?? 0) *
      surfaceTransform.pixelsPerUnit,
  );
  const radius = Math.min(
    Math.min(width, height) * RECTANGLE_CORNER_RADIUS_RATIO,
    width / 2,
    height / 2,
  );

  return {
    center,
    width,
    height,
    halfWidth: width / 2,
    halfHeight: height / 2,
    radius,
  };
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
  surfaceTransform: CanvasObjectRenderInput["surfaceTransform"],
) {
  const { center, halfWidth, halfHeight, radius } = getRenderedRectangleMetrics(
    shape,
    surfaceTransform,
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
  surfaceTransform: CanvasObjectRenderInput["surfaceTransform"],
) {
  const path = new Path2D();

  if (shape.props.kind === "oval") {
    const center = surfaceTransform.worldToCanvas(shape.position);
    const width = (shape.size?.width ?? 0) * surfaceTransform.pixelsPerUnit;
    const height =
      (shape.size?.height ?? shape.size?.width ?? 0) *
      surfaceTransform.pixelsPerUnit;

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
    traceRoundedRectanglePath(path, shape, surfaceTransform);
    return path;
  }

  const points = getRenderedShapeCanvasPoints(shape, surfaceTransform);

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
  surfaceTransform: CanvasObjectRenderInput["surfaceTransform"],
) {
  if (shape.props.kind === "oval") {
    const center = surfaceTransform.worldToCanvas(shape.position);
    const width = (shape.size?.width ?? 0) * surfaceTransform.pixelsPerUnit;
    const height =
      (shape.size?.height ?? shape.size?.width ?? 0) *
      surfaceTransform.pixelsPerUnit;
    const radius = Math.hypot(width, height) / 2;

    return {
      minX: center.x - radius,
      maxX: center.x + radius,
      minY: center.y - radius,
      maxY: center.y + radius,
    };
  }

  const points = getRenderedShapeCanvasPoints(shape, surfaceTransform);

  if (points.length === 0) {
    const center = surfaceTransform.worldToCanvas(shape.position);

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
  surfaceTransform: CanvasObjectRenderInput["surfaceTransform"],
) {
  const tileSize = scaleCanvasStyleValue(
    DIAGONAL_STRIPE_TILE_SIZE_PX,
    surfaceTransform.zoom,
  );
  const lineWidth = scaleCanvasStyleValue(
    DIAGONAL_STRIPE_LINE_WIDTH_PX,
    surfaceTransform.zoom,
  );
  const worldOriginCanvasPoint = surfaceTransform.worldToCanvas(
    surfaceTransform.worldOrigin,
  );
  const phase = worldOriginCanvasPoint.x + worldOriginCanvasPoint.y;
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
  surfaceTransform,
}: CanvasObjectRenderInput) {
  const shape = object as ShapeObject;
  const path = createRenderedShapePath(shape, surfaceTransform);
  const bounds = getRenderedShapeCanvasBounds(shape, surfaceTransform);
  const strokeWidth = getWorldCanvasStrokeWidth(
    shape.props.strokeWidth,
    surfaceTransform.pixelsPerUnit,
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
      ? scaleCanvasDashStyle(shape.props.dashStyle, surfaceTransform.zoom)
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
        surfaceTransform,
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
  surfaceTransform,
  minimumHitRadiusPx,
}: CanvasObjectHitTestInput) {
  const shape = object as ShapeObject;
  const points = getRenderedShapeCanvasPoints(shape, surfaceTransform);
  const threshold = Math.max(
    MIN_HIT_DISTANCE_PX,
    minimumHitRadiusPx / 2,
    shape.props.strokeWidth * surfaceTransform.pixelsPerUnit,
  );

  if (shape.props.kind === "oval") {
    const center = surfaceTransform.worldToCanvas(shape.position);
    const localOffset = getRotatedOffsetFromCenter(
      canvasPoint,
      center,
      -(shape.rotation ?? 0),
    );
    const width = (shape.size?.width ?? 0) * surfaceTransform.pixelsPerUnit;
    const height =
      (shape.size?.height ?? shape.size?.width ?? 0) *
      surfaceTransform.pixelsPerUnit;
    const rx = Math.max(Math.abs(width) / 2, threshold);
    const ry = Math.max(Math.abs(height) / 2, threshold);
    const normalized =
      (localOffset.x * localOffset.x) / (rx * rx) +
      (localOffset.y * localOffset.y) / (ry * ry);

    if (shape.props.fillStyle !== "none") {
      return normalized <= 1;
    }

    const innerRx = Math.max(rx - threshold, 0.0001);
    const innerRy = Math.max(ry - threshold, 0.0001);
    const innerNormalized =
      (localOffset.x * localOffset.x) / (innerRx * innerRx) +
      (localOffset.y * localOffset.y) / (innerRy * innerRy);

    return normalized <= 1.1 && innerNormalized >= 1;
  }

  if (shape.props.kind === "rectangle") {
    const metrics = getRenderedRectangleMetrics(shape, surfaceTransform);
    const localOffset = getRotatedOffsetFromCenter(
      canvasPoint,
      metrics.center,
      -(shape.rotation ?? 0),
    );

    if (shape.props.fillStyle !== "none") {
      return isPointInsideRoundedRectangle(
        localOffset,
        metrics.halfWidth,
        metrics.halfHeight,
        metrics.radius,
      );
    }

    const outerInset = threshold / 2;
    const innerInset = Math.min(
      threshold / 2,
      metrics.halfWidth,
      metrics.halfHeight,
    );

    return (
      isPointInsideRoundedRectangle(
        localOffset,
        metrics.halfWidth + outerInset,
        metrics.halfHeight + outerInset,
        metrics.radius + outerInset,
      ) &&
      !isPointInsideRoundedRectangle(
        localOffset,
        Math.max(metrics.halfWidth - innerInset, 0),
        Math.max(metrics.halfHeight - innerInset, 0),
        Math.max(metrics.radius - innerInset, 0),
      )
    );
  }

  for (let index = 0; index < points.length; index += 1) {
    const start = points[index];
    const end = points[(index + 1) % points.length];

    if (distanceToSegment(canvasPoint, start, end) <= threshold) {
      return true;
    }
  }

  return (
    shape.props.fillStyle !== "none" &&
    isPointInsidePolygon(canvasPoint, points)
  );
}

function getPendingShapePreview(
  shapeState: ReturnType<typeof getShapeToolState>,
  point: Point,
) {
  if (shapeState.pendingPoints.length === 0) {
    return shapeState.draftStyle.kind === "polygon"
      ? undefined
      : createDefaultShapePreview({
          id: "shape-preview",
          point,
          draftStyle: shapeState.draftStyle,
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
}: {
  id: string;
  point: Point;
  draftStyle: ReturnType<typeof getShapeToolState>["draftStyle"];
}) {
  return createShapeObject({
    id,
    start: {
      x: point.x,
      y: point.y,
    },
    end: {
      x: point.x + DEFAULT_SHAPE_PREVIEW_SIZE.width,
      y: point.y + DEFAULT_SHAPE_PREVIEW_SIZE.height,
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
    POLYGON_FINISH_HIT_RADIUS_PX
  );
}
