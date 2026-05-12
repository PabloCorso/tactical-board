import type { BoardObject, Point } from "../board/types";

export const SHAPE_OBJECT_TYPE = "shape";

export type ShapeKind =
  | "rectangle"
  | "circle"
  | "ellipse"
  | "triangle"
  | "diamond"
  | "polygon";
export type ShapeLineStyle = "solid" | "dashed";
export type ShapeStyle = "stroke" | "fill" | "fill-stroke";

export const THIN_SHAPE_STROKE_WIDTH = 0.4;
export const THICK_SHAPE_STROKE_WIDTH = 0.6;
export const DEFAULT_SHAPE_STROKE_WIDTH = THIN_SHAPE_STROKE_WIDTH;
export const DEFAULT_SHAPE_DASH_STYLE = [8, 10] as const;
export const DEFAULT_SHAPE_FILL_OPACITY = 0.15;

export interface ShapeObjectProps extends Record<string, unknown> {
  kind: ShapeKind;
  color: string;
  strokeWidth: number;
  lineStyle: ShapeLineStyle;
  dashStyle: number[];
  style: ShapeStyle;
  fillOpacity: number;
  start?: Point;
  end?: Point;
  points?: Point[];
}

export type ShapeObject = BoardObject & {
  type: typeof SHAPE_OBJECT_TYPE;
  props: ShapeObjectProps;
};

function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

function clonePoints(points: Point[]) {
  return points.map(clonePoint);
}

function getBoundsFromPoints(points: Point[]) {
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));

  return {
    minX,
    maxX,
    minY,
    maxY,
  };
}

export function getShapePoints(
  props: Pick<ShapeObjectProps, "kind" | "start" | "end" | "points">,
) {
  if (props.kind === "polygon") {
    return clonePoints(props.points ?? []);
  }

  const start = props.start ?? { x: 0, y: 0 };
  const end = props.end ?? start;
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  const width = maxX - minX;
  const height = maxY - minY;

  if (props.kind === "circle") {
    const diameter = Math.min(width, height);

    return [
      { x: minX, y: minY },
      { x: minX + diameter, y: minY },
      { x: minX + diameter, y: minY + diameter },
      { x: minX, y: minY + diameter },
    ];
  }

  if (props.kind === "triangle") {
    return [
      { x: minX + width / 2, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
    ];
  }

  if (props.kind === "diamond") {
    return [
      { x: minX + width / 2, y: minY },
      { x: maxX, y: minY + height / 2 },
      { x: minX + width / 2, y: maxY },
      { x: minX, y: minY + height / 2 },
    ];
  }

  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
}

export function getShapeCenter(
  props: Pick<ShapeObjectProps, "kind" | "start" | "end" | "points">,
): Point {
  const points = getShapePoints(props);
  const bounds = getBoundsFromPoints(points);

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
}

export function getShapeSize(
  props: Pick<ShapeObjectProps, "kind" | "start" | "end" | "points">,
) {
  const points = getShapePoints(props);
  const bounds = getBoundsFromPoints(points);

  return {
    width: Math.abs(bounds.maxX - bounds.minX),
    height: Math.abs(bounds.maxY - bounds.minY),
    mode: "world" as const,
  };
}

export function createShapeObject(input: {
  id: string;
  kind: ShapeKind;
  color: string;
  strokeWidth?: number;
  lineStyle: ShapeLineStyle;
  dashStyle?: number[];
  style: ShapeStyle;
  fillOpacity?: number;
  start?: Point;
  end?: Point;
  points?: Point[];
}): ShapeObject {
  const points =
    input.kind === "polygon" ? clonePoints(input.points ?? []) : undefined;
  const start =
    input.kind === "polygon"
      ? undefined
      : clonePoint(input.start ?? input.end ?? { x: 0, y: 0 });
  const end =
    input.kind === "polygon"
      ? undefined
      : clonePoint(input.end ?? input.start ?? { x: 0, y: 0 });

  return {
    id: input.id,
    type: SHAPE_OBJECT_TYPE,
    position: getShapeCenter({
      kind: input.kind,
      start,
      end,
      points,
    }),
    size: getShapeSize({
      kind: input.kind,
      start,
      end,
      points,
    }),
    props: {
      kind: input.kind,
      color: input.color,
      strokeWidth: input.strokeWidth ?? DEFAULT_SHAPE_STROKE_WIDTH,
      lineStyle: input.lineStyle,
      dashStyle: [...(input.dashStyle ?? DEFAULT_SHAPE_DASH_STYLE)],
      style: input.style,
      fillOpacity: input.fillOpacity ?? DEFAULT_SHAPE_FILL_OPACITY,
      start,
      end,
      points,
    },
  };
}

export function normalizeShapeObject(object: ShapeObject): ShapeObject {
  const kind = object.props.kind;
  const points = kind === "polygon" ? clonePoints(object.props.points ?? []) : undefined;
  const start =
    kind === "polygon"
      ? undefined
      : clonePoint(object.props.start ?? object.position);
  const end =
    kind === "polygon"
      ? undefined
      : clonePoint(object.props.end ?? object.props.start ?? object.position);

  return {
    ...object,
    position: getShapeCenter({
      kind,
      start,
      end,
      points,
    }),
    size: getShapeSize({
      kind,
      start,
      end,
      points,
    }),
    props: {
      ...object.props,
      kind,
      strokeWidth: object.props.strokeWidth ?? DEFAULT_SHAPE_STROKE_WIDTH,
      dashStyle: [...(object.props.dashStyle ?? DEFAULT_SHAPE_DASH_STYLE)],
      fillOpacity: object.props.fillOpacity ?? DEFAULT_SHAPE_FILL_OPACITY,
      start,
      end,
      points,
    },
  };
}
