import { createBoard } from "../../../../core/board/create-board";
import type {
  Board,
  BoardFrameConfig,
  BoardFrameMarking,
  BoardMetadata,
  BoardStyleRef,
  ObjectIndex,
} from "../../../../core/board/types";

const BASKETBALL_PIXELS_PER_FOOT = 9;

function feetToPixels(value: number) {
  return value * BASKETBALL_PIXELS_PER_FOOT;
}

function scaleBasketballMarkings(markings: BoardFrameMarking[]) {
  return markings.map((marking) => {
    switch (marking.kind) {
      case "rect":
        return {
          ...marking,
          x: feetToPixels(marking.x),
          y: feetToPixels(marking.y),
          width: feetToPixels(marking.width),
          height: feetToPixels(marking.height),
          strokeWidth:
            marking.strokeWidth === undefined
              ? undefined
              : feetToPixels(marking.strokeWidth),
        };
      case "line":
        return {
          ...marking,
          x1: feetToPixels(marking.x1),
          y1: feetToPixels(marking.y1),
          x2: feetToPixels(marking.x2),
          y2: feetToPixels(marking.y2),
          strokeWidth:
            marking.strokeWidth === undefined
              ? undefined
              : feetToPixels(marking.strokeWidth),
        };
      case "circle":
        return {
          ...marking,
          cx: feetToPixels(marking.cx),
          cy: feetToPixels(marking.cy),
          r: feetToPixels(marking.r),
          strokeWidth:
            marking.strokeWidth === undefined
              ? undefined
              : feetToPixels(marking.strokeWidth),
        };
      case "arc":
        return {
          ...marking,
          cx: feetToPixels(marking.cx),
          cy: feetToPixels(marking.cy),
          r: feetToPixels(marking.r),
          strokeWidth:
            marking.strokeWidth === undefined
              ? undefined
              : feetToPixels(marking.strokeWidth),
        };
    }
  });
}

export const BASKETBALL_COURT_COLORS = {
  floor: "#d9a15f",
  key: "#c8783f",
  line: "#ffffff",
};

export function createBasketballCourtMarkings(): BoardFrameMarking[] {
  const courtWidth = 94;
  const courtHeight = 50;
  const keyWidth = 16;
  const keyDepth = 19;
  const freeThrowRadius = 6;
  const centerX = courtWidth / 2;
  const centerY = courtHeight / 2;
  const hoopInset = 5.25;
  const lineWidth = 0.35;

  return scaleBasketballMarkings([
    {
      kind: "rect",
      x: 0,
      y: 0,
      width: courtWidth,
      height: courtHeight,
      fill: BASKETBALL_COURT_COLORS.floor,
    },
    {
      kind: "rect",
      x: 0,
      y: 0,
      width: courtWidth,
      height: courtHeight,
      stroke: BASKETBALL_COURT_COLORS.line,
      strokeWidth: lineWidth,
    },
    {
      kind: "line",
      x1: centerX,
      y1: 0,
      x2: centerX,
      y2: courtHeight,
      stroke: BASKETBALL_COURT_COLORS.line,
      strokeWidth: lineWidth,
    },
    {
      kind: "circle",
      cx: centerX,
      cy: centerY,
      r: 6,
      stroke: BASKETBALL_COURT_COLORS.line,
      strokeWidth: lineWidth,
    },
    {
      kind: "rect",
      x: 0,
      y: centerY - keyWidth / 2,
      width: keyDepth,
      height: keyWidth,
      fill: BASKETBALL_COURT_COLORS.key,
      opacity: 0.7,
    },
    {
      kind: "rect",
      x: courtWidth - keyDepth,
      y: centerY - keyWidth / 2,
      width: keyDepth,
      height: keyWidth,
      fill: BASKETBALL_COURT_COLORS.key,
      opacity: 0.7,
    },
    {
      kind: "rect",
      x: 0,
      y: centerY - keyWidth / 2,
      width: keyDepth,
      height: keyWidth,
      stroke: BASKETBALL_COURT_COLORS.line,
      strokeWidth: lineWidth,
    },
    {
      kind: "rect",
      x: courtWidth - keyDepth,
      y: centerY - keyWidth / 2,
      width: keyDepth,
      height: keyWidth,
      stroke: BASKETBALL_COURT_COLORS.line,
      strokeWidth: lineWidth,
    },
    {
      kind: "circle",
      cx: keyDepth,
      cy: centerY,
      r: freeThrowRadius,
      stroke: BASKETBALL_COURT_COLORS.line,
      strokeWidth: lineWidth,
    },
    {
      kind: "circle",
      cx: courtWidth - keyDepth,
      cy: centerY,
      r: freeThrowRadius,
      stroke: BASKETBALL_COURT_COLORS.line,
      strokeWidth: lineWidth,
    },
    {
      kind: "circle",
      cx: hoopInset,
      cy: centerY,
      r: 1.5,
      stroke: BASKETBALL_COURT_COLORS.line,
      strokeWidth: lineWidth,
    },
    {
      kind: "circle",
      cx: courtWidth - hoopInset,
      cy: centerY,
      r: 1.5,
      stroke: BASKETBALL_COURT_COLORS.line,
      strokeWidth: lineWidth,
    },
    {
      kind: "arc",
      cx: hoopInset,
      cy: centerY,
      r: 23.75,
      startAngle: -68,
      endAngle: 68,
      stroke: BASKETBALL_COURT_COLORS.line,
      strokeWidth: lineWidth,
    },
    {
      kind: "arc",
      cx: courtWidth - hoopInset,
      cy: centerY,
      r: 23.75,
      startAngle: 112,
      endAngle: 248,
      stroke: BASKETBALL_COURT_COLORS.line,
      strokeWidth: lineWidth,
    },
  ]);
}

export function createBasketballCourt(): BoardFrameConfig {
  return {
    width: feetToPixels(94),
    height: feetToPixels(50),
    background: BASKETBALL_COURT_COLORS.floor,
    markings: createBasketballCourtMarkings(),
    markup: {
      sport: "basketball",
      variant: "full-court",
    },
  };
}

export type CreateBasketballBoardOptions = {
  id?: string;
  metadata?: BoardMetadata;
  name?: string;
  objects?: ObjectIndex;
  style?: BoardStyleRef;
  frame?: Partial<BoardFrameConfig>;
};

export function createBasketballBoard({
  id = "basketball-board",
  metadata,
  name = "Basketball Board",
  objects = { byId: {}, order: [] },
  style = {},
  frame,
}: CreateBasketballBoardOptions = {}): Board {
  return createBoard({
    id,
    version: 1,
    metadata: {
      name,
      ...metadata,
    },
    frame: {
      ...createBasketballCourt(),
      ...frame,
    },
    objects,
    style,
  });
}
