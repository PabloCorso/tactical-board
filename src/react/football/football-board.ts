import { createBoard } from "../../core/board/create-board";
import type {
  Board,
  BoardMetadata,
  BoardSurfaceConfig,
  BoardSurfaceMarking,
  BoardStyleRef,
  ObjectIndex,
} from "../../core/board/types";
import { metersToPixels } from "./football-units";

export const FOOTBALL_FULL_PITCH_METRICS = {
  field: { length: 105, width: 68 },
  perimeter: { touchline: 5, goalLine: 3 },
  goal: {
    postsWidth: 7.32,
    areaDepth: 5.5,
  },
  penalty: {
    areaDepth: 16.5,
    spotDistance: 11,
    spotRadius: 0.4,
    arcRadius: 9.15,
  },
  centerCircle: { radius: 9.15, spotRadius: 0.6 },
  cornerArcRadius: 1,
  lineWidth: 0.4,
};

export const FOOTBALL_PITCH_COLORS = {
  outer: "#177238",
  stripeDark: "#257e3f",
  stripeLight: "#2d8747",
  line: "#ffffff",
};

const STRIPE_COUNT = 19;

export function createFootballPitchMarkings(): BoardSurfaceMarking[] {
  const outerMarginX = FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline;
  const outerMarginY = FOOTBALL_FULL_PITCH_METRICS.perimeter.goalLine;
  const width = FOOTBALL_FULL_PITCH_METRICS.field.length;
  const height = FOOTBALL_FULL_PITCH_METRICS.field.width;
  const centerX = outerMarginX + width / 2;
  const centerY = outerMarginY + height / 2;

  const goalWidth =
    FOOTBALL_FULL_PITCH_METRICS.goal.areaDepth * 2 +
    FOOTBALL_FULL_PITCH_METRICS.goal.postsWidth;
  const goalDepth = FOOTBALL_FULL_PITCH_METRICS.goal.areaDepth;
  const penaltyWidth =
    FOOTBALL_FULL_PITCH_METRICS.penalty.areaDepth * 2 +
    FOOTBALL_FULL_PITCH_METRICS.goal.postsWidth;
  const penaltyDepth = FOOTBALL_FULL_PITCH_METRICS.penalty.areaDepth;
  const stripeWidth = width / STRIPE_COUNT;

  const stripes = Array.from({ length: STRIPE_COUNT }, (_, index) => ({
    kind: "rect" as const,
    x: outerMarginX + index * stripeWidth,
    y: outerMarginY,
    width: stripeWidth,
    height,
    fill:
      index % 2 === 0
        ? FOOTBALL_PITCH_COLORS.stripeLight
        : FOOTBALL_PITCH_COLORS.stripeDark,
  }));

  const markings: BoardSurfaceMarking[] = [
    ...stripes,
    {
      kind: "rect",
      x: outerMarginX,
      y: outerMarginY,
      width,
      height,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "line",
      x1: centerX,
      y1: outerMarginY,
      x2: centerX,
      y2: outerMarginY + height,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "circle",
      cx: centerX,
      cy: centerY,
      r: FOOTBALL_FULL_PITCH_METRICS.centerCircle.radius,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "circle",
      cx: centerX,
      cy: centerY,
      r: FOOTBALL_FULL_PITCH_METRICS.centerCircle.spotRadius,
      fill: FOOTBALL_PITCH_COLORS.line,
    },
    {
      kind: "rect",
      x: outerMarginX,
      y: centerY - penaltyWidth / 2,
      width: penaltyDepth,
      height: penaltyWidth,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "rect",
      x: outerMarginX + width - penaltyDepth,
      y: centerY - penaltyWidth / 2,
      width: penaltyDepth,
      height: penaltyWidth,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "rect",
      x: outerMarginX,
      y: centerY - goalWidth / 2,
      width: goalDepth,
      height: goalWidth,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "rect",
      x: outerMarginX + width - goalDepth,
      y: centerY - goalWidth / 2,
      width: goalDepth,
      height: goalWidth,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "circle",
      cx: outerMarginX + FOOTBALL_FULL_PITCH_METRICS.penalty.spotDistance,
      cy: centerY,
      r: FOOTBALL_FULL_PITCH_METRICS.penalty.spotRadius,
      fill: FOOTBALL_PITCH_COLORS.line,
    },
    {
      kind: "circle",
      cx:
        outerMarginX +
        width -
        FOOTBALL_FULL_PITCH_METRICS.penalty.spotDistance,
      cy: centerY,
      r: FOOTBALL_FULL_PITCH_METRICS.penalty.spotRadius,
      fill: FOOTBALL_PITCH_COLORS.line,
    },
    {
      kind: "arc",
      cx: outerMarginX + FOOTBALL_FULL_PITCH_METRICS.penalty.spotDistance,
      cy: centerY,
      r: FOOTBALL_FULL_PITCH_METRICS.penalty.arcRadius,
      startAngle: -52,
      endAngle: 52,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "arc",
      cx:
        outerMarginX +
        width -
        FOOTBALL_FULL_PITCH_METRICS.penalty.spotDistance,
      cy: centerY,
      r: FOOTBALL_FULL_PITCH_METRICS.penalty.arcRadius,
      startAngle: 128,
      endAngle: 232,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX,
      cy: outerMarginY,
      r: FOOTBALL_FULL_PITCH_METRICS.cornerArcRadius,
      startAngle: 0,
      endAngle: 90,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX + width,
      cy: outerMarginY,
      r: FOOTBALL_FULL_PITCH_METRICS.cornerArcRadius,
      startAngle: 90,
      endAngle: 180,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX + width,
      cy: outerMarginY + height,
      r: FOOTBALL_FULL_PITCH_METRICS.cornerArcRadius,
      startAngle: 180,
      endAngle: 270,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX,
      cy: outerMarginY + height,
      r: FOOTBALL_FULL_PITCH_METRICS.cornerArcRadius,
      startAngle: 270,
      endAngle: 360,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
  ];

  return markings.map((marking) => {
    switch (marking.kind) {
      case "rect":
        return {
          ...marking,
          x: metersToPixels(marking.x),
          y: metersToPixels(marking.y),
          width: metersToPixels(marking.width),
          height: metersToPixels(marking.height),
          strokeWidth:
            marking.strokeWidth === undefined
              ? undefined
              : metersToPixels(marking.strokeWidth),
        };
      case "line":
        return {
          ...marking,
          x1: metersToPixels(marking.x1),
          y1: metersToPixels(marking.y1),
          x2: metersToPixels(marking.x2),
          y2: metersToPixels(marking.y2),
          strokeWidth:
            marking.strokeWidth === undefined
              ? undefined
              : metersToPixels(marking.strokeWidth),
        };
      case "circle":
        return {
          ...marking,
          cx: metersToPixels(marking.cx),
          cy: metersToPixels(marking.cy),
          r: metersToPixels(marking.r),
          strokeWidth:
            marking.strokeWidth === undefined
              ? undefined
              : metersToPixels(marking.strokeWidth),
        };
      case "arc":
        return {
          ...marking,
          cx: metersToPixels(marking.cx),
          cy: metersToPixels(marking.cy),
          r: metersToPixels(marking.r),
          strokeWidth:
            marking.strokeWidth === undefined
              ? undefined
              : metersToPixels(marking.strokeWidth),
        };
    }
  });
}

const surfaceWidth =
  FOOTBALL_FULL_PITCH_METRICS.field.length +
  FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline * 2;
const surfaceHeight =
  FOOTBALL_FULL_PITCH_METRICS.field.width +
  FOOTBALL_FULL_PITCH_METRICS.perimeter.goalLine * 2;

export function createFootballPitchSurface(): BoardSurfaceConfig {
  return {
    width: metersToPixels(surfaceWidth),
    height: metersToPixels(surfaceHeight),
    background: FOOTBALL_PITCH_COLORS.outer,
    markings: createFootballPitchMarkings(),
    markup: {
      sport: "football",
      variant: "full-pitch",
    },
  };
}

export type CreateFootballBoardOptions = {
  id?: string;
  metadata?: BoardMetadata;
  name?: string;
  objects?: ObjectIndex;
  style?: BoardStyleRef;
  surface?: Partial<BoardSurfaceConfig>;
};

export function createFootballBoard({
  id = "football-board",
  metadata,
  name = "Football Board",
  objects = { byId: {}, order: [] },
  style = {},
  surface,
}: CreateFootballBoardOptions = {}): Board {
  return createBoard({
    id,
    version: 1,
    metadata: {
      name,
      ...metadata,
    },
    surface: {
      ...createFootballPitchSurface(),
      ...surface,
    },
    objects,
    style,
  });
}
