import { describe, expect, it } from "vitest";
import {
  createArrowObject,
  DEFAULT_ARROW_STROKE_WIDTH,
  getArrowBodyPolylines,
  getArrowBodyStrokeWidth,
  getArrowBodyStyleScale,
  getArrowCurveHandlePoint,
  getArrowCurveOffsetFromHandlePoint,
  getArrowWavyPoints,
} from "./arrow-object";

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

  it("keeps double arrow lines tightly spaced", () => {
    const [topLine, bottomLine] = getArrowBodyPolylines({
      start: { x: 10, y: 10 },
      end: { x: 20, y: 10 },
      bodyStyle: "double",
    });

    expect(topLine?.[0]?.y).toBeCloseTo(10.9);
    expect(bottomLine?.[0]?.y).toBeCloseTo(9.1);
    expect(getArrowBodyStyleScale("double")).toBe(0.3);
  });

  it("uses half-width body strokes for double arrows", () => {
    expect(getArrowBodyStrokeWidth(8, "double")).toBe(4);
    expect(getArrowBodyStrokeWidth(8, "straight")).toBe(8);
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

  it("keeps wavy arrow geometry stable relative to zoom", () => {
    const zoomOnePoints = getArrowWavyPoints(
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      1,
    );
    const zoomTwoPoints = getArrowWavyPoints(
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      2,
    );

    expect(zoomTwoPoints).toHaveLength(zoomOnePoints.length);

    zoomOnePoints.forEach((point, index) => {
      expect(zoomTwoPoints[index]).toEqual({
        x: point.x * 2,
        y: point.y * 2,
      });
    });
  });

  it("uses the shared default stroke width when omitted", () => {
    const arrow = createArrowObject({
      id: "arrow-default-stroke",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 10 },
      color: "#000",
      lineStyle: "solid",
      bodyStyle: "straight",
      startHead: "none",
      endHead: "triangle",
    });

    expect(arrow.props.strokeWidth).toBe(DEFAULT_ARROW_STROKE_WIDTH);
  });

  it("keeps the curved handle aligned with the visible bend direction", () => {
    const start = { x: 10, y: 10 };
    const end = { x: 20, y: 10 };

    expect(getArrowCurveHandlePoint(start, end, 4)).toEqual({
      x: 15,
      y: 12.5,
    });
    expect(getArrowCurveHandlePoint(start, end, -4)).toEqual({
      x: 15,
      y: 7.5,
    });
  });

  it("derives the original curve offset from the displayed handle point", () => {
    const start = { x: 10, y: 10 };
    const end = { x: 20, y: 10 };

    expect(
      getArrowCurveOffsetFromHandlePoint(
        start,
        end,
        getArrowCurveHandlePoint(start, end, 4),
      ),
    ).toBeCloseTo(4);
    expect(
      getArrowCurveOffsetFromHandlePoint(
        start,
        end,
        getArrowCurveHandlePoint(start, end, -4),
      ),
    ).toBeCloseTo(-4);
  });
});
