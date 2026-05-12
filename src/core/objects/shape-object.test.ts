import { describe, expect, it } from "vitest";
import { createShapeObject, DEFAULT_SHAPE_STROKE_WIDTH } from "./shape-object";

describe("createShapeObject", () => {
  it("derives rectangle center and size from drag bounds", () => {
    const shape = createShapeObject({
      id: "shape-1",
      kind: "rectangle",
      start: { x: 10, y: 12 },
      end: { x: 22, y: 20 },
      color: "#000",
      lineStyle: "solid",
      fillStyle: "solid",
      bordered: true,
    });

    expect(shape.position).toEqual({ x: 16, y: 16 });
    expect(shape.size).toMatchObject({ width: 12, height: 8 });
  });

  it("derives polygon bounds from all points", () => {
    const shape = createShapeObject({
      id: "shape-2",
      kind: "polygon",
      points: [
        { x: 10, y: 10 },
        { x: 18, y: 16 },
        { x: 14, y: 24 },
      ],
      color: "#000",
      lineStyle: "solid",
      fillStyle: "solid",
      bordered: true,
    });

    expect(shape.position).toEqual({ x: 14, y: 17 });
    expect(shape.size).toMatchObject({ width: 8, height: 14 });
  });

  it("derives oval bounds from the drag box", () => {
    const shape = createShapeObject({
      id: "shape-oval",
      kind: "oval",
      start: { x: 10, y: 10 },
      end: { x: 22, y: 18 },
      color: "#000",
      lineStyle: "solid",
      fillStyle: "solid",
      bordered: true,
    });

    expect(shape.position).toEqual({ x: 16, y: 14 });
    expect(shape.size).toMatchObject({ width: 12, height: 8 });
  });

  it("derives triangle bounds from the drag box", () => {
    const shape = createShapeObject({
      id: "shape-triangle",
      kind: "triangle",
      start: { x: 10, y: 12 },
      end: { x: 22, y: 20 },
      color: "#000",
      lineStyle: "solid",
      fillStyle: "solid",
      bordered: true,
    });

    expect(shape.position).toEqual({ x: 16, y: 16 });
    expect(shape.size).toMatchObject({ width: 12, height: 8 });
  });

  it("derives diamond bounds from the drag box", () => {
    const shape = createShapeObject({
      id: "shape-diamond",
      kind: "diamond",
      start: { x: 10, y: 12 },
      end: { x: 22, y: 20 },
      color: "#000",
      lineStyle: "solid",
      fillStyle: "solid",
      bordered: true,
    });

    expect(shape.position).toEqual({ x: 16, y: 16 });
    expect(shape.size).toMatchObject({ width: 12, height: 8 });
  });

  it("uses the shared default stroke width when omitted", () => {
    const shape = createShapeObject({
      id: "shape-3",
      kind: "oval",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 18 },
      color: "#000",
      lineStyle: "solid",
      fillStyle: "none",
      bordered: true,
    });

    expect(shape.props.strokeWidth).toBe(DEFAULT_SHAPE_STROKE_WIDTH);
  });

  it("normalizes legacy circle and style props", () => {
    const shape = createShapeObject({
      id: "legacy-shape",
      kind: "circle",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 20 },
      color: "#000",
      lineStyle: "solid",
      style: "fill",
    });

    expect(shape.props.kind).toBe("oval");
    expect(shape.props.fillStyle).toBe("solid");
    expect(shape.props.bordered).toBe(false);
  });
});
