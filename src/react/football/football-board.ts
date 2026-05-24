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

export type FootballPitchSurfaceVariant =
  | "full-pitch"
  | "half-pitch"
  | "reduced-space";

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

type FootballPitchMarkingOptions = {
  variant?: Extract<FootballPitchSurfaceVariant, "full-pitch" | "half-pitch">;
};

function scaleFootballMarkings(markings: BoardSurfaceMarking[]) {
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

function rotateFootballMarkingsMinus90(
  markings: BoardSurfaceMarking[],
  surfaceWidth: number,
): BoardSurfaceMarking[] {
  const rotatePoint = ({ x, y }: { x: number; y: number }) => ({
    x: y,
    y: surfaceWidth - x,
  });

  return markings.map((marking) => {
    switch (marking.kind) {
      case "rect": {
        const topLeft = rotatePoint({
          x: marking.x + marking.width,
          y: marking.y,
        });

        return {
          ...marking,
          x: topLeft.x,
          y: topLeft.y,
          width: marking.height,
          height: marking.width,
        };
      }
      case "line": {
        const from = rotatePoint({ x: marking.x1, y: marking.y1 });
        const to = rotatePoint({ x: marking.x2, y: marking.y2 });

        return {
          ...marking,
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
        };
      }
      case "circle": {
        const center = rotatePoint({ x: marking.cx, y: marking.cy });

        return {
          ...marking,
          cx: center.x,
          cy: center.y,
        };
      }
      case "arc": {
        const center = rotatePoint({ x: marking.cx, y: marking.cy });

        return {
          ...marking,
          cx: center.x,
          cy: center.y,
          startAngle: marking.startAngle - 90,
          endAngle: marking.endAngle - 90,
        };
      }
    }
  });
}

export function createFootballPitchMarkings({
  variant = "full-pitch",
}: FootballPitchMarkingOptions = {}): BoardSurfaceMarking[] {
  if (variant === "half-pitch") {
    return createFootballHalfPitchMarkings();
  }

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
        outerMarginX + width - FOOTBALL_FULL_PITCH_METRICS.penalty.spotDistance,
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
        outerMarginX + width - FOOTBALL_FULL_PITCH_METRICS.penalty.spotDistance,
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

  return scaleFootballMarkings(markings);
}

function createFootballHalfPitchMarkings(): BoardSurfaceMarking[] {
  const outerMarginX = FOOTBALL_FULL_PITCH_METRICS.perimeter.goalLine;
  const outerMarginY = FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline;
  const width = FOOTBALL_FULL_PITCH_METRICS.field.length / 2;
  const height = FOOTBALL_FULL_PITCH_METRICS.field.width;
  const centerY = outerMarginY + height / 2;

  const goalWidth =
    FOOTBALL_FULL_PITCH_METRICS.goal.areaDepth * 2 +
    FOOTBALL_FULL_PITCH_METRICS.goal.postsWidth;
  const goalDepth = FOOTBALL_FULL_PITCH_METRICS.goal.areaDepth;
  const penaltyWidth =
    FOOTBALL_FULL_PITCH_METRICS.penalty.areaDepth * 2 +
    FOOTBALL_FULL_PITCH_METRICS.goal.postsWidth;
  const penaltyDepth = FOOTBALL_FULL_PITCH_METRICS.penalty.areaDepth;
  const fullPitchStripeWidth =
    FOOTBALL_FULL_PITCH_METRICS.field.length / STRIPE_COUNT;
  const stripeCount = Math.ceil(width / fullPitchStripeWidth);

  const stripes = Array.from({ length: stripeCount }, (_, index) => {
    const stripeWidth =
      index === 0 ? fullPitchStripeWidth / 2 : fullPitchStripeWidth;
    const x =
      index === 0
        ? outerMarginX
        : outerMarginX +
          fullPitchStripeWidth / 2 +
          (index - 1) * fullPitchStripeWidth;

    return {
      kind: "rect" as const,
      x,
      y: outerMarginY,
      width: stripeWidth,
      height,
      fill:
        index % 2 === 0
          ? FOOTBALL_PITCH_COLORS.stripeDark
          : FOOTBALL_PITCH_COLORS.stripeLight,
    };
  });

  const goalLineX = outerMarginX + width;

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
      kind: "arc",
      cx: outerMarginX,
      cy: centerY,
      r: FOOTBALL_FULL_PITCH_METRICS.centerCircle.radius,
      startAngle: -90,
      endAngle: 90,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "rect",
      x: goalLineX - penaltyDepth,
      y: centerY - penaltyWidth / 2,
      width: penaltyDepth,
      height: penaltyWidth,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "rect",
      x: goalLineX - goalDepth,
      y: centerY - goalWidth / 2,
      width: goalDepth,
      height: goalWidth,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "circle",
      cx: goalLineX - FOOTBALL_FULL_PITCH_METRICS.penalty.spotDistance,
      cy: centerY,
      r: FOOTBALL_FULL_PITCH_METRICS.penalty.spotRadius,
      fill: FOOTBALL_PITCH_COLORS.line,
    },
    {
      kind: "arc",
      cx: goalLineX - FOOTBALL_FULL_PITCH_METRICS.penalty.spotDistance,
      cy: centerY,
      r: FOOTBALL_FULL_PITCH_METRICS.penalty.arcRadius,
      startAngle: 128,
      endAngle: 232,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "arc",
      cx: goalLineX,
      cy: outerMarginY,
      r: FOOTBALL_FULL_PITCH_METRICS.cornerArcRadius,
      startAngle: 90,
      endAngle: 180,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "arc",
      cx: goalLineX,
      cy: outerMarginY + height,
      r: FOOTBALL_FULL_PITCH_METRICS.cornerArcRadius,
      startAngle: 180,
      endAngle: 270,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
  ];

  return scaleFootballMarkings(
    rotateFootballMarkingsMinus90(markings, halfPitchSurfaceHeight),
  );
}

const fullPitchSurfaceWidth =
  FOOTBALL_FULL_PITCH_METRICS.field.length +
  FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline * 2;
const halfPitchSurfaceWidth =
  FOOTBALL_FULL_PITCH_METRICS.field.width +
  FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline * 2;
const halfPitchSurfaceHeight =
  FOOTBALL_FULL_PITCH_METRICS.field.length / 2 +
  FOOTBALL_FULL_PITCH_METRICS.perimeter.goalLine * 2;
const pitchSurfaceHeight =
  FOOTBALL_FULL_PITCH_METRICS.field.width +
  FOOTBALL_FULL_PITCH_METRICS.perimeter.goalLine * 2;

export function createFootballPitchSurface(
  variant: FootballPitchSurfaceVariant = "full-pitch",
): BoardSurfaceConfig {
  if (variant === "reduced-space") {
    return {
      width: metersToPixels(halfPitchSurfaceWidth),
      height: metersToPixels(halfPitchSurfaceHeight),
      background: FOOTBALL_PITCH_COLORS.outer,
      markings: [],
      markup: {
        sport: "football",
        variant,
      },
    };
  }

  const isHalfPitch = variant === "half-pitch";

  return {
    width: metersToPixels(
      isHalfPitch ? halfPitchSurfaceWidth : fullPitchSurfaceWidth,
    ),
    height: metersToPixels(
      isHalfPitch ? halfPitchSurfaceHeight : pitchSurfaceHeight,
    ),
    background: FOOTBALL_PITCH_COLORS.outer,
    markings: createFootballPitchMarkings({ variant }),
    markup: {
      sport: "football",
      variant,
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
