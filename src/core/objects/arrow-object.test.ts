import { describe, expect, it } from "vitest";
import { createArrowObject, getArrowWavyPoints } from "./arrow-object";

describe("createArrowObject", () => {
  it("expands bounds for a wavy horizontal arrow", () => {
    const arrow = createArrowObject({
      id: "arrow-wavy",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 10 },
      color: "#000",
      strokeWidth: 0.4,
      lineStyle: "solid",
      bodyStyle: "wavy",
      startHead: "none",
      endHead: "triangle",
    });

    expect(arrow.position.x).toBeCloseTo(15);
    expect(arrow.position.y).toBeGreaterThan(11);
    expect(arrow.position.y).toBeLessThan(11.75);
  });

  it("expands bounds for a double horizontal arrow", () => {
    const arrow = createArrowObject({
      id: "arrow-double",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 10 },
      color: "#000",
      strokeWidth: 0.4,
      lineStyle: "solid",
      bodyStyle: "double",
      startHead: "none",
      endHead: "triangle",
    });

    expect(arrow.position.x).toBeCloseTo(15);
    expect(arrow.position.y).toBeCloseTo(10);
  });

  it("keeps the squiggle visible across arrow lengths", () => {
    const shortStart = { x: 0, y: 0 };
    const shortEnd = { x: 6, y: 0 };
    const longStart = { x: 0, y: 0 };
    const longEnd = { x: 18, y: 0 };
    const shortPoints = getArrowWavyPoints(shortStart, shortEnd);
    const longPoints = getArrowWavyPoints(longStart, longEnd);
    const getPeakOffset = (points: Array<{ x: number; y: number }>) =>
      Math.max(...points.map((point) => Math.abs(point.y)));

    expect(getPeakOffset(shortPoints)).toBeGreaterThan(2);
    expect(getPeakOffset(longPoints)).toBeGreaterThan(2.5);
  });
});
