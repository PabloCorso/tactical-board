import type { BoardObject, Point } from "../board/types";

export const ARROW_OBJECT_TYPE = "arrow";

export type ArrowBodyStyle = "straight" | "curved";
export type ArrowHeadStyle = "none" | "triangle";
export type ArrowLineStyle = "solid" | "dashed";
export const DEFAULT_ARROW_DASH_STYLE = [8, 10] as const;

export interface ArrowObjectProps extends Record<string, unknown> {
  start: Point;
  end: Point;
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

const DEFAULT_ARROW_PADDING = 3;

export function getArrowCenter(start: Point, end: Point): Point {
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
}

export function getArrowSize(start: Point, end: Point) {
  return {
    width: Math.abs(end.x - start.x) + DEFAULT_ARROW_PADDING * 2,
    height: Math.abs(end.y - start.y) + DEFAULT_ARROW_PADDING * 2,
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
  startHead: ArrowHeadStyle;
  endHead: ArrowHeadStyle;
}): ArrowObject {
  return {
    id: input.id,
    type: ARROW_OBJECT_TYPE,
    position: getArrowCenter(input.start, input.end),
    size: getArrowSize(input.start, input.end),
    props: {
      start: input.start,
      end: input.end,
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
  return {
    ...object,
    position: getArrowCenter(object.props.start, object.props.end),
    size: getArrowSize(object.props.start, object.props.end),
    props: {
      ...object.props,
      dashStyle: [...(object.props.dashStyle ?? DEFAULT_ARROW_DASH_STYLE)],
    },
  };
}
