import type { BoardObject, Point } from "../board/types";

export const SHAPE_OBJECT_TYPE = "shape";

export type ShapeKind =
  | "rectangle"
  | "oval"
  | "triangle"
  | "diamond"
  | "polygon";
export type ShapeLineStyle = "solid" | "dashed";
export type ShapeFillStyle = "none" | "solid" | "diagonal-stripes";

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
  fillStyle: ShapeFillStyle;
  bordered: boolean;
  fillOpacity: number;
  start?: Point;
  end?: Point;
  points?: Point[];
}

export type ShapeObject = BoardObject & {
  type: typeof SHAPE_OBJECT_TYPE;
  props: ShapeObjectProps;
};

type ShapeCoreInput = {
  kind: ShapeKind | "circle" | "ellipse";
  color: string;
  strokeWidth?: number;
  lineStyle: ShapeLineStyle;
  dashStyle?: number[];
  fillStyle?: ShapeFillStyle;
  bordered?: boolean;
  style?: "stroke" | "fill" | "fill-stroke";
  fillOpacity?: number;
  start?: Point;
  end?: Point;
  points?: Point[];
};

function normalizeShapeKind(kind: ShapeCoreInput["kind"]): ShapeKind {
  return kind === "circle" || kind === "ellipse" ? "oval" : kind;
}

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

export function getShapeBounds(
  props: Pick<ShapeObjectProps, "kind" | "start" | "end" | "points">,
) {
  const points = getShapePoints(props);
  const bounds = getBoundsFromPoints(points);

  return {
    minX: bounds.minX,
    maxX: bounds.maxX,
    minY: bounds.minY,
    maxY: bounds.maxY,
  };
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

function getCanonicalShapeProps(input: ShapeCoreInput): ShapeObjectProps {
  const normalizedKind = normalizeShapeKind(input.kind);
  const points =
    normalizedKind === "polygon" ? clonePoints(input.points ?? []) : undefined;
  let start =
    normalizedKind === "polygon"
      ? undefined
      : clonePoint(input.start ?? input.end ?? { x: 0, y: 0 });
  let end =
    normalizedKind === "polygon"
      ? undefined
      : clonePoint(input.end ?? input.start ?? { x: 0, y: 0 });

  if (input.kind === "circle" && start && end) {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const diameter = Math.min(Math.abs(deltaX), Math.abs(deltaY));

    end = {
      x: start.x + Math.sign(deltaX || 1) * diameter,
      y: start.y + Math.sign(deltaY || 1) * diameter,
    };
  }

  const fillStyle =
    input.fillStyle ??
    (input.style === "stroke"
      ? "none"
      : input.style === "fill-stroke" || input.style === "fill"
        ? "solid"
        : "solid");
  const bordered =
    input.bordered ??
    (input.style === undefined ? true : input.style !== "fill");

  return {
    kind: normalizedKind,
    color: input.color,
    strokeWidth: input.strokeWidth ?? DEFAULT_SHAPE_STROKE_WIDTH,
    lineStyle: input.lineStyle,
    dashStyle: [...(input.dashStyle ?? DEFAULT_SHAPE_DASH_STYLE)],
    fillStyle,
    bordered,
    fillOpacity: input.fillOpacity ?? DEFAULT_SHAPE_FILL_OPACITY,
    start,
    end,
    points,
  };
}

function createCanonicalShapeObject(
  base: Omit<ShapeObject, "position" | "size" | "props">,
  props: ShapeObjectProps,
): ShapeObject {
  return {
    ...base,
    position: getShapeCenter({
      kind: props.kind,
      start: props.start,
      end: props.end,
      points: props.points,
    }),
    size: getShapeSize({
      kind: props.kind,
      start: props.start,
      end: props.end,
      points: props.points,
    }),
    props,
  };
}

export function createShapeObject(
  input: {
    id: string;
  } & ShapeCoreInput,
): ShapeObject {
  return createCanonicalShapeObject(
    {
      id: input.id,
      type: SHAPE_OBJECT_TYPE,
    },
    getCanonicalShapeProps(input),
  );
}

export function resizeShapeObject(
  object: ShapeObject,
  input: Partial<Pick<ShapeObjectProps, "start" | "end" | "points">>,
): ShapeObject {
  return updateShapeObject(object, input);
}

export function updateShapeObject(
  object: ShapeObject,
  props: Partial<ShapeObjectProps>,
): ShapeObject {
  return createCanonicalShapeObject(
    {
      ...object,
      type: SHAPE_OBJECT_TYPE,
    },
    getCanonicalShapeProps({
      ...object.props,
      ...props,
    }),
  );
}

export function moveShapeObject(
  object: ShapeObject,
  delta: Point,
): ShapeObject {
  return updateShapeObject(object, {
    start: object.props.start
      ? {
          x: object.props.start.x + delta.x,
          y: object.props.start.y + delta.y,
        }
      : undefined,
    end: object.props.end
      ? {
          x: object.props.end.x + delta.x,
          y: object.props.end.y + delta.y,
        }
      : undefined,
    points: object.props.points?.map((point) => ({
      x: point.x + delta.x,
      y: point.y + delta.y,
    })),
  });
}
