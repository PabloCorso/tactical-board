import { createBoard } from "../../core/board/create-board";
import type { BoardSurfaceMarking } from "../../core/board/types";

const pitchMetrics = {
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

const pitchColors = {
  outer: "#177238",
  stripeDark: "#257e3f",
  stripeLight: "#2d8747",
  line: "#ffffff",
};

const STRIPE_COUNT = 19;

function createFootballPitchMarkings(): BoardSurfaceMarking[] {
  const outerMarginX = pitchMetrics.perimeter.touchline;
  const outerMarginY = pitchMetrics.perimeter.goalLine;
  const width = pitchMetrics.field.length;
  const height = pitchMetrics.field.width;
  const centerX = outerMarginX + width / 2;
  const centerY = outerMarginY + height / 2;

  const goalWidth = pitchMetrics.goal.areaDepth * 2 + pitchMetrics.goal.postsWidth;
  const goalDepth = pitchMetrics.goal.areaDepth;
  const penaltyWidth =
    pitchMetrics.penalty.areaDepth * 2 + pitchMetrics.goal.postsWidth;
  const penaltyDepth = pitchMetrics.penalty.areaDepth;
  const stripeWidth = width / STRIPE_COUNT;

  const stripes = Array.from({ length: STRIPE_COUNT }, (_, index) => ({
    kind: "rect" as const,
    x: outerMarginX + index * stripeWidth,
    y: outerMarginY,
    width: stripeWidth,
    height,
    fill: index % 2 === 0 ? pitchColors.stripeLight : pitchColors.stripeDark,
  }));

  return [
    ...stripes,
    {
      kind: "rect",
      x: outerMarginX,
      y: outerMarginY,
      width,
      height,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "line",
      x1: centerX,
      y1: outerMarginY,
      x2: centerX,
      y2: outerMarginY + height,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "circle",
      cx: centerX,
      cy: centerY,
      r: pitchMetrics.centerCircle.radius,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "circle",
      cx: centerX,
      cy: centerY,
      r: pitchMetrics.centerCircle.spotRadius,
      fill: pitchColors.line,
    },
    {
      kind: "rect",
      x: outerMarginX,
      y: centerY - penaltyWidth / 2,
      width: penaltyDepth,
      height: penaltyWidth,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "rect",
      x: outerMarginX + width - penaltyDepth,
      y: centerY - penaltyWidth / 2,
      width: penaltyDepth,
      height: penaltyWidth,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "rect",
      x: outerMarginX,
      y: centerY - goalWidth / 2,
      width: goalDepth,
      height: goalWidth,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "rect",
      x: outerMarginX + width - goalDepth,
      y: centerY - goalWidth / 2,
      width: goalDepth,
      height: goalWidth,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "circle",
      cx: outerMarginX + pitchMetrics.penalty.spotDistance,
      cy: centerY,
      r: pitchMetrics.penalty.spotRadius,
      fill: pitchColors.line,
    },
    {
      kind: "circle",
      cx: outerMarginX + width - pitchMetrics.penalty.spotDistance,
      cy: centerY,
      r: pitchMetrics.penalty.spotRadius,
      fill: pitchColors.line,
    },
    {
      kind: "arc",
      cx: outerMarginX + pitchMetrics.penalty.spotDistance,
      cy: centerY,
      r: pitchMetrics.penalty.arcRadius,
      startAngle: -52,
      endAngle: 52,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX + width - pitchMetrics.penalty.spotDistance,
      cy: centerY,
      r: pitchMetrics.penalty.arcRadius,
      startAngle: 128,
      endAngle: 232,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX,
      cy: outerMarginY,
      r: pitchMetrics.cornerArcRadius,
      startAngle: 0,
      endAngle: 90,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX + width,
      cy: outerMarginY,
      r: pitchMetrics.cornerArcRadius,
      startAngle: 90,
      endAngle: 180,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX + width,
      cy: outerMarginY + height,
      r: pitchMetrics.cornerArcRadius,
      startAngle: 180,
      endAngle: 270,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX,
      cy: outerMarginY + height,
      r: pitchMetrics.cornerArcRadius,
      startAngle: 270,
      endAngle: 360,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
  ];
}

const surfaceWidth =
  pitchMetrics.field.length + pitchMetrics.perimeter.touchline * 2;
const surfaceHeight =
  pitchMetrics.field.width + pitchMetrics.perimeter.goalLine * 2;

export const footballBoardExample = createBoard({
  id: "football-example-board",
  version: 1,
  metadata: {
    name: "Football Example",
  },
  surface: {
    width: surfaceWidth,
    height: surfaceHeight,
    unit: "m",
    background: pitchColors.outer,
    markings: createFootballPitchMarkings(),
    markup: {
      sport: "football",
      variant: "full-pitch",
    },
  },
  objects: {
    byId: {
      "player-1": {
        id: "player-1",
        type: "player-token",
        position: { x: 30.2, y: 22.04 },
        size: { width: 1.8, height: 1.8, mode: "world", unit: "m" },
        props: { label: "1" },
      },
      "player-2": {
        id: "player-2",
        type: "player-token",
        position: { x: 51.2, y: 35.64 },
        size: { width: 1.8, height: 1.8, mode: "world", unit: "m" },
        props: { label: "2" },
      },
      "player-3": {
        id: "player-3",
        type: "player-token",
        position: { x: 74.3, y: 26.12 },
        size: { width: 1.8, height: 1.8, mode: "world", unit: "m" },
        props: { label: "3" },
      },
      "player-4": {
        id: "player-4",
        type: "player-token",
        position: { x: 82.7, y: 47.88 },
        size: { width: 1.8, height: 1.8, mode: "world", unit: "m" },
        props: { label: "4" },
      },
    },
    order: ["player-1", "player-2", "player-3", "player-4"],
  },
  style: {},
});
