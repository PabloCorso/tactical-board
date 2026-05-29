import { describe, expect, it } from "vitest";
import { getBoardContentBounds } from "../../../../core/board/board-content-bounds";
import {
  createFootballPitch,
  FOOTBALL_FULL_PITCH_ASPECT_RATIO,
  FOOTBALL_FULL_PITCH_METRICS,
  FOOTBALL_PITCH_COLORS,
  getFootballPitchAspectRatio,
} from "./football-board";
import { metersToPixels } from "./football-units";

function getPitchStripes(
  markings: ReturnType<typeof createFootballPitch>["markings"],
) {
  return (
    markings?.filter(
      (marking) =>
        marking.kind === "rect" &&
        (marking.fill === FOOTBALL_PITCH_COLORS.stripeLight ||
          marking.fill === FOOTBALL_PITCH_COLORS.stripeDark),
    ) ?? []
  );
}

type Marking = NonNullable<
  ReturnType<typeof createFootballPitch>["markings"]
>[number];

function expectRectMarking(
  markings: Marking[] | undefined,
  expected: {
    height: number;
    stroke?: string;
    strokeWidth?: number;
    width: number;
    x: number;
    y: number;
  },
) {
  expect(markings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: "rect",
        ...expected,
      }),
    ]),
  );
}

function expectCircleMarking(
  markings: Marking[] | undefined,
  expected: {
    cx: number;
    cy: number;
    fill?: string;
    r: number;
  },
) {
  expect(markings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: "circle",
        ...expected,
      }),
    ]),
  );
}

function expectLineMarking(
  markings: Marking[] | undefined,
  expected: {
    stroke: string;
    strokeWidth: number;
    x1: unknown;
    x2: unknown;
    y1: unknown;
    y2: unknown;
  },
) {
  expect(markings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: "line",
        ...expected,
      }),
    ]),
  );
}

function expectArcMarking(
  markings: Marking[] | undefined,
  expected: {
    cx: number;
    cy: number;
    endAngle: number;
    r: number;
    startAngle: number;
    stroke: string;
    strokeWidth: number;
  },
) {
  expect(markings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: "arc",
        ...expected,
      }),
    ]),
  );
}

describe("football board frames", () => {
  it("creates named full, half, and reduced-space pitch variants", () => {
    const fullPitch = createFootballPitch("full-pitch");
    const halfPitch = createFootballPitch("half-pitch");
    const reducedSpace = createFootballPitch("reduced-space");

    expect(fullPitch.markup?.variant).toBe("full-pitch");
    expect(halfPitch.markup?.variant).toBe("half-pitch");
    expect(reducedSpace.markup?.variant).toBe("reduced-space");
    expect(fullPitch).not.toHaveProperty("orientation");

    expect(fullPitch.width).toBeGreaterThan(halfPitch.width);
    expect(halfPitch.width).toBeGreaterThan(halfPitch.height);
    expect(halfPitch.width).toBe(
      metersToPixels(
        FOOTBALL_FULL_PITCH_METRICS.field.width +
          FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline * 2,
      ),
    );
    expect(halfPitch.height).toBe(
      metersToPixels(
        FOOTBALL_FULL_PITCH_METRICS.field.length / 2 +
          FOOTBALL_FULL_PITCH_METRICS.perimeter.goalLine * 2,
      ),
    );
    expect(halfPitch.width).toBe(reducedSpace.width);
    expect(halfPitch.height).toBe(reducedSpace.height);
    expect(halfPitch.markings?.length).toBeGreaterThan(0);

    const fullPitchStripes = getPitchStripes(fullPitch.markings);
    const halfPitchStripes = getPitchStripes(halfPitch.markings);
    const firstHalfPitchStripe = halfPitchStripes[0];
    const secondHalfPitchStripe = halfPitchStripes[1];

    expect(halfPitchStripes).toHaveLength(
      Math.ceil(fullPitchStripes.length / 2),
    );
    expect(firstHalfPitchStripe?.kind).toBe("rect");
    expect(secondHalfPitchStripe?.kind).toBe("rect");

    if (
      firstHalfPitchStripe?.kind === "rect" &&
      secondHalfPitchStripe?.kind === "rect"
    ) {
      expect(firstHalfPitchStripe.fill).toBe(FOOTBALL_PITCH_COLORS.stripeDark);
      expect(firstHalfPitchStripe.height).toBeCloseTo(
        secondHalfPitchStripe.height / 2,
      );
      expect(firstHalfPitchStripe.y).toBeGreaterThan(secondHalfPitchStripe.y);
    }

    expectCircleMarking(halfPitch.markings, {
      cx: metersToPixels(
        FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline +
          FOOTBALL_FULL_PITCH_METRICS.field.width / 2,
      ),
      cy: metersToPixels(
        FOOTBALL_FULL_PITCH_METRICS.field.length / 2 +
          FOOTBALL_FULL_PITCH_METRICS.perimeter.goalLine,
      ),
      r: metersToPixels(FOOTBALL_FULL_PITCH_METRICS.centerCircle.spotRadius),
      fill: FOOTBALL_PITCH_COLORS.line,
    });

    expect(reducedSpace.markings).toEqual([]);
    expect(reducedSpace.background).toBe(FOOTBALL_PITCH_COLORS.outer);
  });

  it("can create an oriented full pitch without changing default pitch options", () => {
    const horizontalPitch = createFootballPitch("full-pitch");
    const verticalPitch = createFootballPitch({
      variant: "full-pitch",
      orientation: 90,
    });
    const halfPitch = createFootballPitch({
      variant: "half-pitch",
      orientation: 90,
    });

    expect(verticalPitch.orientation).toBe(90);
    expect(verticalPitch.width).toBe(horizontalPitch.height);
    expect(verticalPitch.height).toBe(horizontalPitch.width);
    expect(verticalPitch.markup?.variant).toBe("full-pitch");
    expect(verticalPitch.markings?.length).toBe(
      horizontalPitch.markings?.length,
    );
    expect(halfPitch).not.toHaveProperty("orientation");
  });

  it("fits full-pitch content to the outer visible markings instead of the frame perimeter", () => {
    const fullPitch = createFootballPitch("full-pitch");
    const bounds = getBoardContentBounds({
      id: "football-board",
      version: 1,
      metadata: {},
      frame: fullPitch,
      objects: {
        byId: {},
        order: [],
      },
      style: {},
    });
    const expectedGoalFrameOuterX = metersToPixels(
      FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline -
        FOOTBALL_FULL_PITCH_METRICS.goal.frameDepth -
        FOOTBALL_FULL_PITCH_METRICS.lineWidth / 2,
    );
    const expectedRightGoalFrameOuterX = metersToPixels(
      FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline +
        FOOTBALL_FULL_PITCH_METRICS.field.length +
        FOOTBALL_FULL_PITCH_METRICS.goal.frameDepth +
        FOOTBALL_FULL_PITCH_METRICS.lineWidth / 2,
    );

    expect(bounds.minX).toBeCloseTo(expectedGoalFrameOuterX);
    expect(bounds.maxX).toBeCloseTo(expectedRightGoalFrameOuterX);
    expect(bounds.minX).toBeGreaterThan(0);
    expect(bounds.maxX).toBeLessThan(fullPitch.width);
  });

  it("exports aspect ratios from football pitch dimensions", () => {
    const fullPitch = createFootballPitch("full-pitch");
    const bounds = getBoardContentBounds({
      id: "football-board",
      version: 1,
      metadata: {},
      frame: fullPitch,
      objects: {
        byId: {},
        order: [],
      },
      style: {},
    });
    const expectedAspectRatio =
      (bounds.maxX - bounds.minX) / (bounds.maxY - bounds.minY);
    const reducedSpace = createFootballPitch("reduced-space");

    expect(FOOTBALL_FULL_PITCH_ASPECT_RATIO).toBeCloseTo(expectedAspectRatio);
    expect(getFootballPitchAspectRatio("reduced-space")).toBeCloseTo(
      reducedSpace.width / reducedSpace.height,
    );
  });

  it("draws full-pitch goals as three-line frames centered on each goal line", () => {
    const fullPitch = createFootballPitch("full-pitch");
    const touchlineMargin = FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline;
    const goalLineMargin = FOOTBALL_FULL_PITCH_METRICS.perimeter.goalLine;
    const fieldLength = FOOTBALL_FULL_PITCH_METRICS.field.length;
    const fieldWidth = FOOTBALL_FULL_PITCH_METRICS.field.width;
    const lineWidth = metersToPixels(FOOTBALL_FULL_PITCH_METRICS.lineWidth);
    const centerY = goalLineMargin + fieldWidth / 2;
    const postsTop = centerY - FOOTBALL_FULL_PITCH_METRICS.goal.postsWidth / 2;
    const postsBottom =
      centerY + FOOTBALL_FULL_PITCH_METRICS.goal.postsWidth / 2;
    const frameDepth = FOOTBALL_FULL_PITCH_METRICS.goal.frameDepth;
    const frameLineOverlap = FOOTBALL_FULL_PITCH_METRICS.lineWidth / 2;
    const leftGoalLine = touchlineMargin;
    const rightGoalLine = touchlineMargin + fieldLength;

    expectLineMarking(fullPitch.markings, {
      x1: metersToPixels(leftGoalLine + frameLineOverlap),
      y1: metersToPixels(postsTop),
      x2: metersToPixels(leftGoalLine - frameDepth - frameLineOverlap),
      y2: metersToPixels(postsTop),
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: lineWidth,
    });

    expectLineMarking(fullPitch.markings, {
      x1: metersToPixels(leftGoalLine - frameDepth),
      y1: metersToPixels(postsTop - frameLineOverlap),
      x2: metersToPixels(leftGoalLine - frameDepth),
      y2: metersToPixels(postsBottom + frameLineOverlap),
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: lineWidth,
    });

    expectLineMarking(fullPitch.markings, {
      x1: metersToPixels(leftGoalLine - frameDepth - frameLineOverlap),
      y1: metersToPixels(postsBottom),
      x2: metersToPixels(leftGoalLine + frameLineOverlap),
      y2: metersToPixels(postsBottom),
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: lineWidth,
    });

    expectLineMarking(fullPitch.markings, {
      x1: metersToPixels(rightGoalLine - frameLineOverlap),
      y1: metersToPixels(postsTop),
      x2: metersToPixels(rightGoalLine + frameDepth + frameLineOverlap),
      y2: metersToPixels(postsTop),
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: lineWidth,
    });

    expectLineMarking(fullPitch.markings, {
      x1: metersToPixels(rightGoalLine + frameDepth),
      y1: metersToPixels(postsTop - frameLineOverlap),
      x2: metersToPixels(rightGoalLine + frameDepth),
      y2: metersToPixels(postsBottom + frameLineOverlap),
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: lineWidth,
    });

    expectLineMarking(fullPitch.markings, {
      x1: metersToPixels(rightGoalLine + frameDepth + frameLineOverlap),
      y1: metersToPixels(postsBottom),
      x2: metersToPixels(rightGoalLine - frameLineOverlap),
      y2: metersToPixels(postsBottom),
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: lineWidth,
    });
  });

  it("keeps the half pitch metrically aligned with one goal-to-midfield half of the full pitch", () => {
    const halfPitch = createFootballPitch("half-pitch");
    const touchlineMargin = FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline;
    const goalLineMargin = FOOTBALL_FULL_PITCH_METRICS.perimeter.goalLine;
    const fieldWidth = FOOTBALL_FULL_PITCH_METRICS.field.width;
    const fieldHalfLength = FOOTBALL_FULL_PITCH_METRICS.field.length / 2;
    const lineWidth = metersToPixels(FOOTBALL_FULL_PITCH_METRICS.lineWidth);
    const fieldLeft = touchlineMargin;
    const fieldTop = goalLineMargin;
    const fieldRight = fieldLeft + fieldWidth;
    const fieldBottom = fieldTop + fieldHalfLength;
    const centerX = fieldLeft + fieldWidth / 2;
    const goalFrameDepth = FOOTBALL_FULL_PITCH_METRICS.goal.frameDepth;
    const goalFrameLineOverlap = FOOTBALL_FULL_PITCH_METRICS.lineWidth / 2;
    const goalPostsWidth = FOOTBALL_FULL_PITCH_METRICS.goal.postsWidth;
    const goalWidth =
      FOOTBALL_FULL_PITCH_METRICS.goal.areaDepth * 2 +
      FOOTBALL_FULL_PITCH_METRICS.goal.postsWidth;
    const penaltyWidth =
      FOOTBALL_FULL_PITCH_METRICS.penalty.areaDepth * 2 +
      FOOTBALL_FULL_PITCH_METRICS.goal.postsWidth;

    expect(halfPitch.width).toBe(
      metersToPixels(fieldWidth + touchlineMargin * 2),
    );
    expect(halfPitch.height).toBe(
      metersToPixels(fieldHalfLength + goalLineMargin * 2),
    );

    expectRectMarking(halfPitch.markings, {
      x: metersToPixels(fieldLeft),
      y: metersToPixels(fieldTop),
      width: metersToPixels(fieldWidth),
      height: metersToPixels(fieldHalfLength),
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: lineWidth,
    });

    expectArcMarking(halfPitch.markings, {
      cx: metersToPixels(centerX),
      cy: metersToPixels(fieldBottom),
      r: metersToPixels(FOOTBALL_FULL_PITCH_METRICS.centerCircle.radius),
      startAngle: -180,
      endAngle: 0,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: lineWidth,
    });

    expectCircleMarking(halfPitch.markings, {
      cx: metersToPixels(centerX),
      cy: metersToPixels(fieldBottom),
      r: metersToPixels(FOOTBALL_FULL_PITCH_METRICS.centerCircle.spotRadius),
      fill: FOOTBALL_PITCH_COLORS.line,
    });

    expectRectMarking(halfPitch.markings, {
      x: metersToPixels(centerX - penaltyWidth / 2),
      y: metersToPixels(fieldTop),
      width: metersToPixels(penaltyWidth),
      height: metersToPixels(FOOTBALL_FULL_PITCH_METRICS.penalty.areaDepth),
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: lineWidth,
    });

    expectRectMarking(halfPitch.markings, {
      x: metersToPixels(centerX - goalWidth / 2),
      y: metersToPixels(fieldTop),
      width: metersToPixels(goalWidth),
      height: metersToPixels(FOOTBALL_FULL_PITCH_METRICS.goal.areaDepth),
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: lineWidth,
    });

    expectLineMarking(halfPitch.markings, {
      x1: metersToPixels(centerX - goalPostsWidth / 2),
      y1: expect.closeTo(metersToPixels(fieldTop + goalFrameLineOverlap)),
      x2: metersToPixels(centerX - goalPostsWidth / 2),
      y2: expect.closeTo(
        metersToPixels(fieldTop - goalFrameDepth - goalFrameLineOverlap),
      ),
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: lineWidth,
    });

    expectLineMarking(halfPitch.markings, {
      x1: expect.closeTo(
        metersToPixels(centerX - goalPostsWidth / 2 - goalFrameLineOverlap),
      ),
      y1: expect.closeTo(metersToPixels(fieldTop - goalFrameDepth)),
      x2: expect.closeTo(
        metersToPixels(centerX + goalPostsWidth / 2 + goalFrameLineOverlap),
      ),
      y2: expect.closeTo(metersToPixels(fieldTop - goalFrameDepth)),
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: lineWidth,
    });

    expectLineMarking(halfPitch.markings, {
      x1: metersToPixels(centerX + goalPostsWidth / 2),
      y1: expect.closeTo(
        metersToPixels(fieldTop - goalFrameDepth - goalFrameLineOverlap),
      ),
      x2: metersToPixels(centerX + goalPostsWidth / 2),
      y2: expect.closeTo(metersToPixels(fieldTop + goalFrameLineOverlap)),
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: lineWidth,
    });

    expectCircleMarking(halfPitch.markings, {
      cx: metersToPixels(centerX),
      cy: metersToPixels(
        fieldTop + FOOTBALL_FULL_PITCH_METRICS.penalty.spotDistance,
      ),
      r: metersToPixels(FOOTBALL_FULL_PITCH_METRICS.penalty.spotRadius),
      fill: FOOTBALL_PITCH_COLORS.line,
    });

    expectArcMarking(halfPitch.markings, {
      cx: metersToPixels(centerX),
      cy: metersToPixels(
        fieldTop + FOOTBALL_FULL_PITCH_METRICS.penalty.spotDistance,
      ),
      r: metersToPixels(FOOTBALL_FULL_PITCH_METRICS.penalty.arcRadius),
      startAngle: 38,
      endAngle: 142,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: lineWidth,
    });

    expectArcMarking(halfPitch.markings, {
      cx: metersToPixels(fieldLeft),
      cy: metersToPixels(fieldTop),
      r: metersToPixels(FOOTBALL_FULL_PITCH_METRICS.cornerArcRadius),
      startAngle: 0,
      endAngle: 90,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: lineWidth,
    });

    expectArcMarking(halfPitch.markings, {
      cx: metersToPixels(fieldRight),
      cy: metersToPixels(fieldTop),
      r: metersToPixels(FOOTBALL_FULL_PITCH_METRICS.cornerArcRadius),
      startAngle: 90,
      endAngle: 180,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: lineWidth,
    });
  });
});
