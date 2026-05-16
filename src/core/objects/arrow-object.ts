import type { BoardObject, Point } from "../board/types";

export const ARROW_OBJECT_TYPE = "arrow";

export type ArrowBodyStyle = "straight" | "curved" | "wavy" | "double";
export type ArrowHeadStyle = "none" | "triangle";
export type ArrowLineStyle = "solid" | "dashed";
export const THIN_ARROW_STROKE_WIDTH = 0.225;
export const THICK_ARROW_STROKE_WIDTH = 0.35;
export const DEFAULT_ARROW_STROKE_WIDTH = THIN_ARROW_STROKE_WIDTH;
export const DEFAULT_ARROW_DASH_STYLE = [8, 4] as const;
const DEFAULT_CURVE_BEND_RATIO = 0.18;
const DEFAULT_ARROW_PADDING = 3;
const FIXED_WAVE_AMPLITUDE = 6;
const FIXED_WAVE_SEGMENT_LENGTH = 10;
const MIN_WAVE_SEGMENTS = 1;
const WAVE_SAMPLES_PER_SEGMENT = 8;
const WAVE_TAIL_LENGTH = 2;
const BODY_SAMPLE_COUNT = 24;
const DOUBLE_LINE_OFFSET = 3;
const DOUBLE_LINE_STYLE_SCALE = 0.4;
const CURVE_HANDLE_OFFSET = 0.5;

export interface ArrowObjectProps extends Record<string, unknown> {
  start: Point;
  end: Point;
  controlPoint?: Point;
  curveOffset?: number;
  color: string;
  strokeWidth: number;
  lineStyle: ArrowLineStyle;
  dashStyle: number[];
  bodyStyle: ArrowBodyStyle;
  startHead: ArrowHeadStyle;
  endHead: ArrowHeadStyle;
}

export type ArrowObject = BoardObject & {
  type: typeof ARROW_OBJECT_TYPE;
  props: ArrowObjectProps;
};

type ArrowCoreInput = {
  start?: Point;
  end?: Point;
  color: string;
  strokeWidth?: number;
  lineStyle: ArrowLineStyle;
  dashStyle?: number[];
  bodyStyle: ArrowBodyStyle;
  controlPoint?: Point;
  curveOffset?: number;
  startHead: ArrowHeadStyle;
  endHead: ArrowHeadStyle;
};

function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

function getArrowVector(start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;

  return { dx, dy, length };
}

function getArrowNormal(start: Point, end: Point) {
  const { dx, dy, length } = getArrowVector(start, end);

  return {
    x: -dy / length,
    y: dx / length,
  };
}

function offsetPointByNormal(
  point: Point,
  start: Point,
  end: Point,
  offset: number,
): Point {
  const normal = getArrowNormal(start, end);

  return {
    x: point.x + normal.x * offset,
    y: point.y + normal.y * offset,
  };
}

export function getDefaultArrowCurveOffset(start: Point, end: Point): number {
  return getArrowVector(start, end).length * DEFAULT_CURVE_BEND_RATIO;
}

export function getArrowCurveOffset(
  start: Point,
  end: Point,
  controlPoint?: Point,
): number {
  if (!controlPoint) {
    return getDefaultArrowCurveOffset(start, end);
  }

  const { dx, dy, length } = getArrowVector(start, end);
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
  const normal = {
    x: -dy / length,
    y: dx / length,
  };

  return (
    (controlPoint.x - midpoint.x) * normal.x +
    (controlPoint.y - midpoint.y) * normal.y
  );
}

export function getArrowControlPoint(
  start: Point,
  end: Point,
  curveOffset?: number,
): Point {
  const { dx, dy, length } = getArrowVector(start, end);
  const bend = curveOffset ?? getDefaultArrowCurveOffset(start, end);
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };

  return {
    x: midpoint.x - (dy / length) * bend,
    y: midpoint.y + (dx / length) * bend,
  };
}

export function getArrowCurveHandlePoint(
  start: Point,
  end: Point,
  curveOffset?: number,
): Point {
  const bend = curveOffset ?? getDefaultArrowCurveOffset(start, end);
  const handleOffset =
    Math.sign(bend || 1) * (Math.abs(bend) / 2 + CURVE_HANDLE_OFFSET);

  return offsetPointByNormal(
    {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    },
    start,
    end,
    handleOffset,
  );
}

export function getArrowCurveOffsetFromHandlePoint(
  start: Point,
  end: Point,
  handlePoint: Point,
) {
  const handleOffset = getArrowCurveOffset(start, end, handlePoint);
  const sign = Math.sign(handleOffset || 1);

  return sign * Math.max(0, (Math.abs(handleOffset) - CURVE_HANDLE_OFFSET) * 2);
}

function getResolvedCurveOffset(
  props: Pick<
    ArrowObjectProps,
    "start" | "end" | "controlPoint" | "curveOffset" | "bodyStyle"
  >,
) {
  if (props.bodyStyle !== "curved") {
    return props.curveOffset;
  }

  return (
    props.curveOffset ??
    getArrowCurveOffset(props.start, props.end, props.controlPoint)
  );
}

function sampleQuadraticCurve(
  start: Point,
  controlPoint: Point,
  end: Point,
  sampleCount = BODY_SAMPLE_COUNT,
) {
  const points: Point[] = [];

  for (let index = 0; index <= sampleCount; index += 1) {
    const t = index / sampleCount;
    points.push({
      x:
        (1 - t) * (1 - t) * start.x +
        2 * (1 - t) * t * controlPoint.x +
        t * t * end.x,
      y:
        (1 - t) * (1 - t) * start.y +
        2 * (1 - t) * t * controlPoint.y +
        t * t * end.y,
    });
  }

  return points;
}

function sampleQuadraticSegment(
  start: Point,
  controlPoint: Point,
  end: Point,
  sampleCount: number,
) {
  return sampleQuadraticCurve(start, controlPoint, end, sampleCount).slice(1);
}

export function getArrowWavyPoints(start: Point, end: Point, styleScale = 1) {
  const { dx, dy, length } = getArrowVector(start, end);
  const normal = getArrowNormal(start, end);
  const tailLength = Math.min(WAVE_TAIL_LENGTH * styleScale, length * 0.25);
  const waveLength = Math.max(length - tailLength, 0);
  const segmentCount = Math.max(
    MIN_WAVE_SEGMENTS,
    Math.round(waveLength / (FIXED_WAVE_SEGMENT_LENGTH * styleScale)),
  );
  const segmentLength =
    segmentCount > 0 ? waveLength / segmentCount : waveLength;
  const amplitude = Math.min(
    FIXED_WAVE_AMPLITUDE * styleScale,
    segmentLength * 1.4,
    length * 0.7,
  );
  const tailStart = {
    x: start.x + (dx / length) * waveLength,
    y: start.y + (dy / length) * waveLength,
  };
  const points: Point[] = [start];

  let segmentStart = start;

  for (let index = 0; index < segmentCount; index += 1) {
    const segmentEndDistance = segmentLength * (index + 1);
    const segmentEnd =
      index === segmentCount - 1
        ? tailStart
        : {
            x: start.x + (dx / length) * segmentEndDistance,
            y: start.y + (dy / length) * segmentEndDistance,
          };
    const midpoint = {
      x: (segmentStart.x + segmentEnd.x) / 2,
      y: (segmentStart.y + segmentEnd.y) / 2,
    };
    const sign = index % 2 === 0 ? 1 : -1;
    const controlPoint = {
      x: midpoint.x + normal.x * amplitude * sign,
      y: midpoint.y + normal.y * amplitude * sign,
    };

    points.push(
      ...sampleQuadraticSegment(
        segmentStart,
        controlPoint,
        segmentEnd,
        WAVE_SAMPLES_PER_SEGMENT,
      ),
    );
    segmentStart = segmentEnd;
  }

  if (tailLength > 0.001) {
    points.push(
      ...sampleQuadraticSegment(
        tailStart,
        {
          x: (tailStart.x + end.x) / 2,
          y: (tailStart.y + end.y) / 2,
        },
        end,
        Math.max(3, Math.floor(BODY_SAMPLE_COUNT / 6)),
      ),
    );
  }

  return points;
}

export function getArrowBodyStyleScale(bodyStyle: ArrowBodyStyle) {
  return bodyStyle === "double" ? DOUBLE_LINE_STYLE_SCALE : 1;
}

export function getArrowBodyStrokeWidth(
  strokeWidth: number,
  bodyStyle: ArrowBodyStyle,
) {
  return bodyStyle === "double" ? strokeWidth / 2 : strokeWidth;
}

export function getArrowBodyPolylines(
  props: Pick<
    ArrowObjectProps,
    | "start"
    | "end"
    | "controlPoint"
    | "curveOffset"
    | "bodyStyle"
  > & {
    styleScale?: number;
  },
) {
  const styleScale = props.styleScale ?? 1;

  switch (props.bodyStyle) {
    case "curved":
      return [
        sampleQuadraticCurve(
          props.start,
          getArrowControlPoint(
            props.start,
            props.end,
            getResolvedCurveOffset(props),
          ),
          props.end,
        ),
      ];
    case "wavy":
      return [getArrowWavyPoints(props.start, props.end, styleScale)];
    case "double": {
      const lineOffset =
        DOUBLE_LINE_OFFSET *
        getArrowBodyStyleScale(props.bodyStyle) *
        styleScale;

      return [
        [
          offsetPointByNormal(props.start, props.start, props.end, lineOffset),
          offsetPointByNormal(props.end, props.start, props.end, lineOffset),
        ],
        [
          offsetPointByNormal(props.start, props.start, props.end, -lineOffset),
          offsetPointByNormal(props.end, props.start, props.end, -lineOffset),
        ],
      ];
    }
    default:
      return [[props.start, props.end]];
  }
}

function getArrowBodyPoints(
  props: Pick<
    ArrowObjectProps,
    | "start"
    | "end"
    | "controlPoint"
    | "curveOffset"
    | "bodyStyle"
  >,
) {
  return getArrowBodyPolylines(props).flat();
}

function getCanonicalArrowProps(input: ArrowCoreInput): ArrowObjectProps {
  const strokeWidth = input.strokeWidth ?? DEFAULT_ARROW_STROKE_WIDTH;
  const start = clonePoint(input.start ?? { x: 0, y: 0 });
  const end = clonePoint(input.end ?? start);
  const curveOffset =
    input.bodyStyle === "curved"
      ? (input.curveOffset ??
        getArrowCurveOffset(start, end, input.controlPoint))
      : input.curveOffset;

  return {
    start,
    end,
    controlPoint: undefined,
    curveOffset,
    color: input.color,
    strokeWidth,
    lineStyle: input.lineStyle,
    dashStyle: [...(input.dashStyle ?? DEFAULT_ARROW_DASH_STYLE)],
    bodyStyle: input.bodyStyle,
    startHead: input.startHead,
    endHead: input.endHead,
  };
}

function createCanonicalArrowObject(
  base: Omit<ArrowObject, "position" | "size" | "props">,
  props: ArrowObjectProps,
): ArrowObject {
  return {
    ...base,
    position: getArrowCenter(props),
    size: getArrowSize(props),
    props,
  };
}

export function getArrowCenter(
  props: Pick<
    ArrowObjectProps,
    | "start"
    | "end"
    | "controlPoint"
    | "curveOffset"
    | "bodyStyle"
    | "strokeWidth"
  >,
): Point {
  const points = getArrowBodyPoints(props);
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };
}

export function getArrowSize(
  props: Pick<
    ArrowObjectProps,
    | "start"
    | "end"
    | "controlPoint"
    | "curveOffset"
    | "bodyStyle"
    | "strokeWidth"
  >,
) {
  const points = getArrowBodyPoints(props);
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));

  return {
    width: Math.abs(maxX - minX) + DEFAULT_ARROW_PADDING * 2,
    height: Math.abs(maxY - minY) + DEFAULT_ARROW_PADDING * 2,
    mode: "world" as const,
  };
}

export function createArrowObject(
  input: {
    id: string;
  } & ArrowCoreInput,
): ArrowObject {
  return createCanonicalArrowObject(
    {
      id: input.id,
      type: ARROW_OBJECT_TYPE,
    },
    getCanonicalArrowProps(input),
  );
}

export function updateArrowObject(
  object: ArrowObject,
  props: Partial<ArrowObjectProps>,
): ArrowObject {
  return createCanonicalArrowObject(
    {
      ...object,
      type: ARROW_OBJECT_TYPE,
    },
    getCanonicalArrowProps({
      ...object.props,
      ...props,
    }),
  );
}

export function moveArrowObject(
  object: ArrowObject,
  delta: Point,
): ArrowObject {
  const start = {
    x: object.props.start.x + delta.x,
    y: object.props.start.y + delta.y,
  };
  const end = {
    x: object.props.end.x + delta.x,
    y: object.props.end.y + delta.y,
  };

  return updateArrowObject(object, {
    start,
    end,
  });
}

export function setArrowEndpoint(
  object: ArrowObject,
  endpoint: "start" | "end",
  point: Point,
): ArrowObject {
  return updateArrowObject(object, { [endpoint]: point });
}

export function setArrowCurveOffset(
  object: ArrowObject,
  curveOffset: number,
): ArrowObject {
  return updateArrowObject(object, { curveOffset });
}

export function setArrowBodyStyle(
  object: ArrowObject,
  bodyStyle: ArrowBodyStyle,
): ArrowObject {
  return updateArrowObject(object, {
    bodyStyle,
    curveOffset:
      bodyStyle === "curved"
        ? (object.props.curveOffset ??
          getDefaultArrowCurveOffset(object.props.start, object.props.end))
        : object.props.curveOffset,
  });
}
