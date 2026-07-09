import { describe, expect, it } from "vitest";
import {
  getDefaultFormationAxis,
  getFormationPlayerCount,
  getFormationPositions,
} from "./player-formation";

const HORIZONTAL_FRAME = { width: 105, height: 68 };

describe("getFormationPositions", () => {
  it("places goalkeeper plus outfield rows inside the start half", () => {
    const positions = getFormationPositions({
      frame: HORIZONTAL_FRAME,
      layout: { rows: [4, 3, 3] },
    });

    expect(positions).toHaveLength(11);
    expect(getFormationPlayerCount({ rows: [4, 3, 3] })).toBe(11);

    for (const position of positions) {
      expect(position.x).toBeGreaterThan(0);
      expect(position.x).toBeLessThan(HORIZONTAL_FRAME.width / 2);
      expect(position.y).toBeGreaterThan(0);
      expect(position.y).toBeLessThan(HORIZONTAL_FRAME.height);
    }

    const goalkeeper = positions[0];
    expect(goalkeeper.y).toBeCloseTo(HORIZONTAL_FRAME.height / 2);
    expect(Math.min(...positions.map((point) => point.x))).toBeCloseTo(
      goalkeeper.x,
    );
  });

  it("mirrors the end side into the opposite half", () => {
    const layout = { rows: [4, 4, 2] };
    const start = getFormationPositions({
      frame: HORIZONTAL_FRAME,
      layout,
      placement: { side: "start" },
    });
    const end = getFormationPositions({
      frame: HORIZONTAL_FRAME,
      layout,
      placement: { side: "end" },
    });

    expect(end).toHaveLength(start.length);
    start.forEach((position, index) => {
      expect(end[index].x).toBeCloseTo(HORIZONTAL_FRAME.width - position.x);
      expect(end[index].y).toBeCloseTo(position.y);
    });
  });

  it("spreads a full-span formation across the whole frame", () => {
    const positions = getFormationPositions({
      frame: HORIZONTAL_FRAME,
      layout: { rows: [4, 3, 3] },
      placement: { span: "full", side: "start" },
    });

    const xValues = positions.map((point) => point.x);

    expect(Math.min(...xValues)).toBeLessThan(HORIZONTAL_FRAME.width * 0.1);
    expect(Math.max(...xValues)).toBeGreaterThan(HORIZONTAL_FRAME.width / 2);
    expect(Math.max(...xValues)).toBeLessThan(HORIZONTAL_FRAME.width);
  });

  it("honors an explicit axis for frames where play runs on the short axis", () => {
    // A half-pitch is taller than wide, but play runs toward the single goal.
    const frame = { width: 68, height: 56 };
    const positions = getFormationPositions({
      frame,
      layout: { rows: [2, 2] },
      placement: { axis: "y", side: "end", span: "full" },
    });

    expect(getDefaultFormationAxis(frame)).toBe("x");
    expect(positions).toHaveLength(5);

    const goalkeeper = positions[0];
    expect(goalkeeper.y).toBeGreaterThan(frame.height * 0.9);

    for (const position of positions) {
      expect(position.x).toBeGreaterThan(0);
      expect(position.x).toBeLessThan(frame.width);
    }
  });

  it("skips goalkeeper and invalid rows when configured", () => {
    const positions = getFormationPositions({
      frame: HORIZONTAL_FRAME,
      layout: { rows: [3, 0, -1, 3], goalkeeper: false },
    });

    expect(positions).toHaveLength(6);
  });
});
