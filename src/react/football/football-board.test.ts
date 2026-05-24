import { describe, expect, it } from "vitest";
import {
  createFootballPitchSurface,
  FOOTBALL_FULL_PITCH_METRICS,
  FOOTBALL_PITCH_COLORS,
} from "./football-board";
import { metersToPixels } from "./football-units";

function getPitchStripes(
  markings: ReturnType<typeof createFootballPitchSurface>["markings"],
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

describe("football board surfaces", () => {
  it("creates named full, half, and reduced-space pitch variants", () => {
    const fullPitch = createFootballPitchSurface("full-pitch");
    const halfPitch = createFootballPitchSurface("half-pitch");
    const reducedSpace = createFootballPitchSurface("reduced-space");

    expect(fullPitch.markup?.variant).toBe("full-pitch");
    expect(halfPitch.markup?.variant).toBe("half-pitch");
    expect(reducedSpace.markup?.variant).toBe("reduced-space");

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

    expect(reducedSpace.markings).toEqual([]);
    expect(reducedSpace.background).toBe(FOOTBALL_PITCH_COLORS.outer);
  });
});
