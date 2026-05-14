import type { Point } from "../core/board/types";
import type { BoardEditorState } from "../core/editor/types";
import {
  createShapeObject,
  getShapePoints,
  SHAPE_OBJECT_TYPE,
  type ShapeObject,
} from "../core/objects/shape-object";
import { createBoardSpaceProjection } from "../core/geometry/board-space-projection";
import {
  scaleCanvasDashStyle,
  scaleCanvasStyleValue,
} from "../rendering/canvas/style-scale";
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

interface ShapeToolPreset {
  id: string;
  label: string;
  icon?: ToolActionIcon;
  tooltip?: string;
  draftStyle: Partial<ShapeDraftStyle>;
}

interface CreateShapeToolOptions {
  presets?: ShapeToolPreset[];
}

const shapeObjectDefinition = defineObjectDefinition({
  type: SHAPE_OBJECT_TYPE,
  selection: shapeSelectionAdapter,
});

export class ShapeTool extends BoardEditorTool implements ToolDefinition {
  readonly id = SHAPE_TOOL_ID;
  readonly label = "Shape";

  private readonly presets: ShapeToolPreset[];
  private readonly getPresetActions?;

  constructor(options: CreateShapeToolOptions = {}) {
    super();
    this.presets = options.presets ?? [];
    this.getPresetActions =
      this.presets.length > 0
        ? createPresetSecondaryActions(this.presets)
        : undefined;
  }

  getSecondaryActions(state: BoardEditorState) {
    return this.getPresetActions?.(state) ?? [];
  }

  onActivate(api: ToolApi) {
    if (this.presets.length > 0) {
      applyShapePreset(api, this.presets[0]);
    }
  }

  onDeactivate(api: ToolApi) {
    if (getShapeToolState(api.getState().toolState).pendingPoints.length > 0) {
      cancelPendingShape(api);
    }
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
    const pendingPoints = shapeState.pendingPoints;

    if (pendingPoints.length === 0) {
      clearSelection(api);
      setPendingPoints(api, [event.point]);
      return;
    }

    if (shapeState.draftStyle.kind === "polygon") {
      if (shouldFinishPolygon(api, pendingPoints, event.point, event)) {
        finishPendingPolygon(api);
        return;
      }

      setPendingPoints(api, [...pendingPoints, event.point]);
      return;
    }

    const shapeId = createShapeId(state.board.objects.byId);
    api.addObjects([
      createShapeObject({
        id: shapeId,
        start: pendingPoints[0],
        end: event.point,
        ...shapeState.draftStyle,
      }),
    ]);
    cancelPendingShape(api);
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
      shapeState.pendingPoints.length !== 1 ||
      !event.draggedSincePointerDown
    ) {
      return;
    }

    const shapeId = createShapeId(state.board.objects.byId);
    api.addObjects([
      createShapeObject({
        id: shapeId,
        start: shapeState.pendingPoints[0],
        end: event.point,
        ...shapeState.draftStyle,
      }),
    ]);
    cancelPendingShape(api);
  }
}

function isShapePresetActive(
  draftStyle: ShapeDraftStyle,
  presetDraftStyle: Partial<ShapeDraftStyle>,
) {
  return (
    Object.entries(presetDraftStyle) as Array<
      [keyof ShapeDraftStyle, ShapeDraftStyle[keyof ShapeDraftStyle]]
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

export function finishPendingPolygon(api: ToolApi) {
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

function drawShapePath(context: CanvasRenderingContext2D, points: Point[]) {
  if (points.length === 0) {
    return;
  }

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  for (const point of points.slice(1)) {
    context.lineTo(point.x, point.y);
  }
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

function createDiagonalStripePattern(
  context: CanvasRenderingContext2D,
  color: string,
  zoom: number,
) {
  const tileSize = scaleCanvasStyleValue(18, zoom);
  const patternCanvas = document.createElement("canvas");
  patternCanvas.width = tileSize;
  patternCanvas.height = tileSize;
  const patternContext = patternCanvas.getContext("2d");

  if (!patternContext) {
    return undefined;
  }

  patternContext.strokeStyle = color;
  patternContext.lineWidth = scaleCanvasStyleValue(2.25, zoom);
  patternContext.lineCap = "butt";
  patternContext.setLineDash([]);
  patternContext.beginPath();
  patternContext.moveTo(-tileSize, tileSize);
  patternContext.lineTo(0, 0);
  patternContext.moveTo(0, tileSize);
  patternContext.lineTo(tileSize, 0);
  patternContext.moveTo(tileSize, tileSize);
  patternContext.lineTo(tileSize * 2, 0);
  patternContext.stroke();

  return context.createPattern(patternCanvas, "repeat") ?? undefined;
}

function renderShape({
  context,
  object,
  appearance,
  surfaceTransform,
}: CanvasObjectRenderInput) {
  const shape = object as ShapeObject;
  const strokeWidth = Math.max(
    1.5,
    shape.props.strokeWidth * surfaceTransform.pixelsPerUnit,
  );
  const points = getRenderedShapeCanvasPoints(shape, surfaceTransform);

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

  if (shape.props.kind === "oval") {
    const center = surfaceTransform.worldToCanvas(shape.position);
    const width = (shape.size?.width ?? 0) * surfaceTransform.pixelsPerUnit;
    const height =
      (shape.size?.height ?? shape.size?.width ?? 0) *
      surfaceTransform.pixelsPerUnit;
    context.beginPath();
    context.translate(center.x, center.y);
    context.rotate(((shape.rotation ?? 0) * Math.PI) / 180);
    context.ellipse(
      0,
      0,
      Math.abs(width) / 2,
      Math.abs(height) / 2,
      0,
      0,
      Math.PI * 2,
    );
  } else {
    drawShapePath(context, points);
    context.closePath();
  }

  if (shape.props.fillStyle !== "none") {
    context.save();
    context.globalAlpha *= shape.props.fillOpacity;
    context.fillStyle = shape.props.color;
    context.fill();

    if (shape.props.fillStyle === "diagonal-stripes") {
      const stripePattern = createDiagonalStripePattern(
        context,
        shape.props.color,
        surfaceTransform.zoom,
      );

      if (stripePattern) {
        context.fillStyle = stripePattern;
        context.fill();
      }
    }
    context.restore();
  }

  if (shape.props.bordered) {
    context.stroke();
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

function createPresetSecondaryActions(
  presets: ShapeToolPreset[],
): (state: BoardEditorState) => ToolActionDefinition[] {
  return (state) => {
    const shapeState = getShapeToolState(state.toolState);

    return presets.map(
      (preset): ToolActionDefinition => ({
        id: preset.id,
        label: preset.label,
        icon: preset.icon,
        tooltip: preset.tooltip ?? preset.label,
        disabled: false,
        onSelect: (api) => applyShapePreset(api, preset),
        active: isShapePresetActive(shapeState.draftStyle, preset.draftStyle),
      }),
    );
  };
}

function getPendingShapePreview(
  shapeState: ReturnType<typeof getShapeToolState>,
  point: Point,
) {
  if (shapeState.pendingPoints.length === 0) {
    return undefined;
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
