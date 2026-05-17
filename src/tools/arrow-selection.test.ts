import { describe, expect, it } from "vitest";
import { createArrowObject } from "../core/objects/arrow-object";
import { getArrowSelectionCanvasBounds } from "./arrow-selection";

describe("getArrowSelectionCanvasBounds", () => {
  it("tracks the actual arrow geometry more tightly than object bounds", () => {
    const arrow = createArrowObject({
      id: "arrow-1",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 10 },
      color: "#111827",
      strokeWidth: 0.225,
      lineStyle: "solid",
      bodyStyle: "straight",
      startHead: "none",
      endHead: "triangle",
    });
    const projection = {
      getObjectCanvasBounds: () => ({
        x: 70,
        y: 30,
        width: 160,
        height: 80,
      }),
      worldToCanvas: ({ x, y }: { x: number; y: number }) => ({
        x: x * 10,
        y: y * 10,
      }),
      canvasToWorld: ({ x, y }: { x: number; y: number }) => ({
        x: x / 10,
        y: y / 10,
      }),
      pixelsPerUnit: 10,
      zoom: 1,
    };

    const bounds = getArrowSelectionCanvasBounds(projection, arrow);

    expect(bounds.left).toBeCloseTo(98.875, 2);
    expect(bounds.right).toBeCloseTo(201.125, 2);
    expect(bounds.top).toBeCloseTo(94.483, 2);
    expect(bounds.bottom).toBeCloseTo(105.517, 2);
  });

  it("trims hidden wavy body segments beneath the arrowhead", () => {
    const arrow = createArrowObject({
      id: "arrow-wavy",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 10 },
      color: "#111827",
      strokeWidth: 0.225,
      lineStyle: "solid",
      bodyStyle: "wavy",
      startHead: "none",
      endHead: "triangle",
    });
    const projection = {
      getObjectCanvasBounds: () => ({
        x: 70,
        y: 30,
        width: 160,
        height: 80,
      }),
      worldToCanvas: ({ x, y }: { x: number; y: number }) => ({
        x: x * 10,
        y: y * 10,
      }),
      canvasToWorld: ({ x, y }: { x: number; y: number }) => ({
        x: x / 10,
        y: y / 10,
      }),
      pixelsPerUnit: 10,
      zoom: 1,
    };

    const bounds = getArrowSelectionCanvasBounds(projection, arrow);

    expect(bounds.top).toBeCloseTo(94.483, 2);
    expect(bounds.bottom).toBeCloseTo(105.517, 2);
  });

  it("keeps double-arrow vertical bounds tight around the visible rails", () => {
    const arrow = createArrowObject({
      id: "arrow-double",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 10 },
      color: "#111827",
      strokeWidth: 0.225,
      lineStyle: "solid",
      bodyStyle: "double",
      startHead: "none",
      endHead: "triangle",
    });
    const projection = {
      getObjectCanvasBounds: () => ({
        x: 70,
        y: 30,
        width: 160,
        height: 80,
      }),
      worldToCanvas: ({ x, y }: { x: number; y: number }) => ({
        x: x * 10,
        y: y * 10,
      }),
      canvasToWorld: ({ x, y }: { x: number; y: number }) => ({
        x: x / 10,
        y: y / 10,
      }),
      pixelsPerUnit: 10,
      zoom: 1,
    };

    const bounds = getArrowSelectionCanvasBounds(projection, arrow);

    expect(bounds.top).toBeCloseTo(94.607, 2);
    expect(bounds.bottom).toBeCloseTo(105.393, 2);
  });
});
