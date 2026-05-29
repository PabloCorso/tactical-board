import { createBoard } from "../../../../core/board/create-board";
import type {
  Board,
  BoardMetadata,
  BoardFrameConfig,
  BoardFrameMarking,
  BoardFrameOrientation,
  BoardStyleRef,
  ObjectIndex,
} from "../../../../core/board/types";
import { metersToPixels } from "./football-units";

export type FootballPitchVariant =
  | "full-pitch"
  | "half-pitch"
  | "reduced-space";

export const FOOTBALL_FULL_PITCH_METRICS = {
  field: { length: 105, width: 68 },
  perimeter: { touchline: 5, goalLine: 3 },
  goal: {
    postsWidth: 7.32,
    frameDepth: 2.44,
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
  variant?: Extract<FootballPitchVariant, "full-pitch" | "half-pitch">;
};

export type CreateFootballPitchOptions = {
  orientation?: BoardFrameOrientation;
  variant?: FootballPitchVariant;
};

function scaleFootballMarkings(markings: BoardFrameMarking[]) {
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

function rotateFootballMarkings(
  markings: BoardFrameMarking[],
  frameSize: { height: number; width: number },
  orientation: BoardFrameOrientation,
): BoardFrameMarking[] {
  if (orientation === 0) {
    return markings;
  }

  const rotatePoint = ({ x, y }: { x: number; y: number }) => ({
    x:
      orientation === 90
        ? y
        : orientation === 180
          ? frameSize.width - x
          : frameSize.height - y,
    y:
      orientation === 90
        ? frameSize.width - x
        : orientation === 180
          ? frameSize.height - y
          : x,
  });

  return markings.map((marking) => {
    switch (marking.kind) {
      case "rect": {
        if (orientation === 90) {
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

        if (orientation === 180) {
          return {
            ...marking,
            x: frameSize.width - marking.x - marking.width,
            y: frameSize.height - marking.y - marking.height,
          };
        }

        if (orientation === 270) {
          const topLeft = rotatePoint({
            x: marking.x,
            y: marking.y + marking.height,
          });

          return {
            ...marking,
            x: topLeft.x,
            y: topLeft.y,
            width: marking.height,
            height: marking.width,
          };
        }

        const corners = [
          rotatePoint({ x: marking.x, y: marking.y }),
          rotatePoint({ x: marking.x + marking.width, y: marking.y }),
          rotatePoint({ x: marking.x, y: marking.y + marking.height }),
          rotatePoint({
            x: marking.x + marking.width,
            y: marking.y + marking.height,
          }),
        ];
        const xs = corners.map((corner) => corner.x);
        const ys = corners.map((corner) => corner.y);
        const x = Math.min(...xs);
        const y = Math.min(...ys);

        return {
          ...marking,
          x,
          y,
          width: Math.max(...xs) - x,
          height: Math.max(...ys) - y,
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
          startAngle: marking.startAngle - orientation,
          endAngle: marking.endAngle - orientation,
        };
      }
    }
  });
}

export function createFootballPitchMarkings({
  variant = "full-pitch",
}: FootballPitchMarkingOptions = {}): BoardFrameMarking[] {
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
  const goalFrameDepth = FOOTBALL_FULL_PITCH_METRICS.goal.frameDepth;
  const goalPostsWidth = FOOTBALL_FULL_PITCH_METRICS.goal.postsWidth;
  const goalFrameLineOverlap = FOOTBALL_FULL_PITCH_METRICS.lineWidth / 2;
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

  const markings: BoardFrameMarking[] = [
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
      kind: "line",
      x1: outerMarginX + goalFrameLineOverlap,
      y1: centerY - goalPostsWidth / 2,
      x2: outerMarginX - goalFrameDepth - goalFrameLineOverlap,
      y2: centerY - goalPostsWidth / 2,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "line",
      x1: outerMarginX - goalFrameDepth,
      y1: centerY - goalPostsWidth / 2 - goalFrameLineOverlap,
      x2: outerMarginX - goalFrameDepth,
      y2: centerY + goalPostsWidth / 2 + goalFrameLineOverlap,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "line",
      x1: outerMarginX - goalFrameDepth - goalFrameLineOverlap,
      y1: centerY + goalPostsWidth / 2,
      x2: outerMarginX + goalFrameLineOverlap,
      y2: centerY + goalPostsWidth / 2,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "line",
      x1: outerMarginX + width - goalFrameLineOverlap,
      y1: centerY - goalPostsWidth / 2,
      x2: outerMarginX + width + goalFrameDepth + goalFrameLineOverlap,
      y2: centerY - goalPostsWidth / 2,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "line",
      x1: outerMarginX + width + goalFrameDepth,
      y1: centerY - goalPostsWidth / 2 - goalFrameLineOverlap,
      x2: outerMarginX + width + goalFrameDepth,
      y2: centerY + goalPostsWidth / 2 + goalFrameLineOverlap,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "line",
      x1: outerMarginX + width + goalFrameDepth + goalFrameLineOverlap,
      y1: centerY + goalPostsWidth / 2,
      x2: outerMarginX + width - goalFrameLineOverlap,
      y2: centerY + goalPostsWidth / 2,
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

function createFootballHalfPitchMarkings(): BoardFrameMarking[] {
  const outerMarginX = FOOTBALL_FULL_PITCH_METRICS.perimeter.goalLine;
  const outerMarginY = FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline;
  const width = FOOTBALL_FULL_PITCH_METRICS.field.length / 2;
  const height = FOOTBALL_FULL_PITCH_METRICS.field.width;
  const centerY = outerMarginY + height / 2;

  const goalWidth =
    FOOTBALL_FULL_PITCH_METRICS.goal.areaDepth * 2 +
    FOOTBALL_FULL_PITCH_METRICS.goal.postsWidth;
  const goalDepth = FOOTBALL_FULL_PITCH_METRICS.goal.areaDepth;
  const goalFrameDepth = FOOTBALL_FULL_PITCH_METRICS.goal.frameDepth;
  const goalPostsWidth = FOOTBALL_FULL_PITCH_METRICS.goal.postsWidth;
  const goalFrameLineOverlap = FOOTBALL_FULL_PITCH_METRICS.lineWidth / 2;
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

  const markings: BoardFrameMarking[] = [
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
      kind: "circle",
      cx: outerMarginX,
      cy: centerY,
      r: FOOTBALL_FULL_PITCH_METRICS.centerCircle.spotRadius,
      fill: FOOTBALL_PITCH_COLORS.line,
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
      kind: "line",
      x1: goalLineX - goalFrameLineOverlap,
      y1: centerY - goalPostsWidth / 2,
      x2: goalLineX + goalFrameDepth + goalFrameLineOverlap,
      y2: centerY - goalPostsWidth / 2,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "line",
      x1: goalLineX + goalFrameDepth,
      y1: centerY - goalPostsWidth / 2 - goalFrameLineOverlap,
      x2: goalLineX + goalFrameDepth,
      y2: centerY + goalPostsWidth / 2 + goalFrameLineOverlap,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "line",
      x1: goalLineX + goalFrameDepth + goalFrameLineOverlap,
      y1: centerY + goalPostsWidth / 2,
      x2: goalLineX - goalFrameLineOverlap,
      y2: centerY + goalPostsWidth / 2,
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
    rotateFootballMarkings(
      markings,
      { width: halfPitchFrameHeight, height: halfPitchFrameWidth },
      90,
    ),
  );
}

const fullPitchFrameWidth =
  FOOTBALL_FULL_PITCH_METRICS.field.length +
  FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline * 2;
const halfPitchFrameWidth =
  FOOTBALL_FULL_PITCH_METRICS.field.width +
  FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline * 2;
const halfPitchFrameHeight =
  FOOTBALL_FULL_PITCH_METRICS.field.length / 2 +
  FOOTBALL_FULL_PITCH_METRICS.perimeter.goalLine * 2;
const pitchFrameHeight =
  FOOTBALL_FULL_PITCH_METRICS.field.width +
  FOOTBALL_FULL_PITCH_METRICS.perimeter.goalLine * 2;

function getFootballPitchPreviewSize(
  options: FootballPitchVariant | CreateFootballPitchOptions = "full-pitch",
): { height: number; width: number } {
  const variant = typeof options === "string" ? options : options.variant;
  const orientation =
    typeof options === "string" ? undefined : options.orientation;
  const resolvedVariant = variant ?? "full-pitch";
  const lineWidth = FOOTBALL_FULL_PITCH_METRICS.lineWidth;

  if (resolvedVariant === "reduced-space") {
    return {
      width: metersToPixels(halfPitchFrameWidth),
      height: metersToPixels(halfPitchFrameHeight),
    };
  }

  if (resolvedVariant === "half-pitch") {
    return {
      width: metersToPixels(
        FOOTBALL_FULL_PITCH_METRICS.field.width + lineWidth,
      ),
      height: metersToPixels(
        FOOTBALL_FULL_PITCH_METRICS.field.length / 2 +
          FOOTBALL_FULL_PITCH_METRICS.goal.frameDepth +
          lineWidth,
      ),
    };
  }

  const width =
    FOOTBALL_FULL_PITCH_METRICS.field.length +
    FOOTBALL_FULL_PITCH_METRICS.goal.frameDepth * 2 +
    lineWidth;
  const height = FOOTBALL_FULL_PITCH_METRICS.field.width + lineWidth;

  if (orientation === 90 || orientation === 270) {
    return {
      width: metersToPixels(height),
      height: metersToPixels(width),
    };
  }

  return {
    width: metersToPixels(width),
    height: metersToPixels(height),
  };
}

export function getFootballPitchAspectRatio(
  options: FootballPitchVariant | CreateFootballPitchOptions = "full-pitch",
): number {
  const contentSize = getFootballPitchPreviewSize(options);

  return contentSize.width / contentSize.height;
}

export const FOOTBALL_FULL_PITCH_ASPECT_RATIO =
  getFootballPitchAspectRatio("full-pitch");

export function createFootballPitch(
  options: FootballPitchVariant | CreateFootballPitchOptions = "full-pitch",
): BoardFrameConfig {
  const variant = typeof options === "string" ? options : options.variant;
  const orientation =
    typeof options === "string" ? undefined : options.orientation;
  const resolvedVariant = variant ?? "full-pitch";

  if (resolvedVariant === "reduced-space") {
    return {
      width: metersToPixels(halfPitchFrameWidth),
      height: metersToPixels(halfPitchFrameHeight),
      background: FOOTBALL_PITCH_COLORS.outer,
      markings: [],
      markup: {
        sport: "football",
        variant: resolvedVariant,
      },
    };
  }

  const isHalfPitch = resolvedVariant === "half-pitch";
  const width = isHalfPitch ? halfPitchFrameWidth : fullPitchFrameWidth;
  const height = isHalfPitch ? halfPitchFrameHeight : pitchFrameHeight;
  const appliedOrientation = isHalfPitch ? undefined : orientation;
  const shouldOrient =
    appliedOrientation !== undefined && appliedOrientation !== 0;
  const markings = createFootballPitchMarkings({ variant: resolvedVariant });

  return {
    width: metersToPixels(
      shouldOrient && appliedOrientation !== 180 ? height : width,
    ),
    height: metersToPixels(
      shouldOrient && appliedOrientation !== 180 ? width : height,
    ),
    background: FOOTBALL_PITCH_COLORS.outer,
    markings: shouldOrient
      ? rotateFootballMarkings(
          markings,
          {
            width: metersToPixels(width),
            height: metersToPixels(height),
          },
          appliedOrientation,
        )
      : markings,
    ...(appliedOrientation === undefined
      ? {}
      : { orientation: appliedOrientation }),
    markup: {
      sport: "football",
      variant: resolvedVariant,
    },
  };
}

export type CreateFootballBoardOptions = {
  id?: string;
  metadata?: BoardMetadata;
  name?: string;
  objects?: ObjectIndex;
  style?: BoardStyleRef;
  frame?: Partial<BoardFrameConfig>;
};

export function createFootballBoard({
  id = "football-board",
  metadata,
  name = "Football Board",
  objects = { byId: {}, order: [] },
  style = {},
  frame,
}: CreateFootballBoardOptions = {}): Board {
  return createBoard({
    id,
    version: 1,
    metadata: {
      name,
      ...metadata,
    },
    frame: {
      ...createFootballPitch(),
      ...frame,
    },
    objects,
    style,
  });
}
