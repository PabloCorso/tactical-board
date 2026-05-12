import type { BoardObject, Point } from "../board/types";

export const ARROW_OBJECT_TYPE = "arrow";

export type ArrowBodyStyle = "straight" | "curved" | "wavy" | "double";
export type ArrowHeadStyle = "none" | "triangle";
export type ArrowLineStyle = "solid" | "dashed";
export const DEFAULT_ARROW_DASH_STYLE = [8, 10] as const;
const DEFAULT_CURVE_BEND_RATIO = 0.18;
const DEFAULT_ARROW_PADDING = 3;
const FIXED_WAVE_AMPLITUDE = 6;
const FIXED_WAVE_SEGMENT_LENGTH = 10;
const MIN_WAVE_SEGMENTS = 1;
const WAVE_SAMPLES_PER_SEGMENT = 8;
const WAVE_TAIL_LENGTH = 2;
const BODY_SAMPLE_COUNT = 24;
const MIN_DOUBLE_LINE_OFFSET = 0.18;
const DOUBLE_LINE_OFFSET_RATIO = 0.03;
const DOUBLE_LINE_STROKE_MULTIPLIER = 0.9;

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

export function getArrowDoubleLineOffset(
  start: Point,
  end: Point,
  strokeWidth: number,
) {
  return Math.max(
    MIN_DOUBLE_LINE_OFFSET,
    strokeWidth * DOUBLE_LINE_STROKE_MULTIPLIER,
    getArrowVector(start, end).length * DOUBLE_LINE_OFFSET_RATIO,
  );
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
  return getArrowControlPoint(start, end, curveOffset);
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

export function getArrowWavyPoints(start: Point, end: Point) {
  const { dx, dy, length } = getArrowVector(start, end);
  const normal = getArrowNormal(start, end);
  const tailLength = Math.min(WAVE_TAIL_LENGTH, length * 0.25);
  const waveLength = Math.max(length - tailLength, 0);
  const segmentCount = Math.max(
    MIN_WAVE_SEGMENTS,
    Math.round(waveLength / FIXED_WAVE_SEGMENT_LENGTH),
  );
  const segmentLength =
    segmentCount > 0 ? waveLength / segmentCount : waveLength;
  const amplitude = Math.min(
    FIXED_WAVE_AMPLITUDE,
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

export function getArrowBodyPolylines(
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
      return [getArrowWavyPoints(props.start, props.end)];
    case "double": {
      const offset = getArrowDoubleLineOffset(
        props.start,
        props.end,
        props.strokeWidth,
      );

      return [
        [
          offsetPointByNormal(props.start, props.start, props.end, offset),
          offsetPointByNormal(props.end, props.start, props.end, offset),
        ],
        [
          offsetPointByNormal(props.start, props.start, props.end, -offset),
          offsetPointByNormal(props.end, props.start, props.end, -offset),
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
    | "strokeWidth"
  >,
) {
  return getArrowBodyPolylines(props).flat();
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

export function createArrowObject(input: {
  id: string;
  start: Point;
  end: Point;
  color: string;
  strokeWidth: number;
  lineStyle: ArrowLineStyle;
  dashStyle?: number[];
  bodyStyle: ArrowBodyStyle;
  controlPoint?: Point;
  curveOffset?: number;
  startHead: ArrowHeadStyle;
  endHead: ArrowHeadStyle;
}): ArrowObject {
  const curveOffset =
    input.bodyStyle === "curved"
      ? (input.curveOffset ??
        getArrowCurveOffset(input.start, input.end, input.controlPoint))
      : input.curveOffset;

  return {
    id: input.id,
    type: ARROW_OBJECT_TYPE,
    position: getArrowCenter({
      start: input.start,
      end: input.end,
      controlPoint: undefined,
      curveOffset,
      bodyStyle: input.bodyStyle,
      strokeWidth: input.strokeWidth,
    }),
    size: getArrowSize({
      start: input.start,
      end: input.end,
      controlPoint: undefined,
      curveOffset,
      bodyStyle: input.bodyStyle,
      strokeWidth: input.strokeWidth,
    }),
    props: {
      start: input.start,
      end: input.end,
      controlPoint: undefined,
      curveOffset,
      color: input.color,
      strokeWidth: input.strokeWidth,
      lineStyle: input.lineStyle,
      dashStyle: [...(input.dashStyle ?? DEFAULT_ARROW_DASH_STYLE)],
      bodyStyle: input.bodyStyle,
      startHead: input.startHead,
      endHead: input.endHead,
    },
  };
}

export function normalizeArrowObject(object: ArrowObject): ArrowObject {
  const curveOffset = getResolvedCurveOffset(object.props);

  return {
    ...object,
    position: getArrowCenter({
      start: object.props.start,
      end: object.props.end,
      controlPoint: undefined,
      curveOffset,
      bodyStyle: object.props.bodyStyle,
      strokeWidth: object.props.strokeWidth,
    }),
    size: getArrowSize({
      start: object.props.start,
      end: object.props.end,
      controlPoint: undefined,
      curveOffset,
      bodyStyle: object.props.bodyStyle,
      strokeWidth: object.props.strokeWidth,
    }),
    props: {
      ...object.props,
      controlPoint: undefined,
      curveOffset,
      dashStyle: [...(object.props.dashStyle ?? DEFAULT_ARROW_DASH_STYLE)],
    },
  };
}
