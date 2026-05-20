import { describe, expect, it } from "vitest";
import { createBoardSpaceProjection } from "./board-space-projection";

describe("createBoardSpaceProjection", () => {
  const projection = createBoardSpaceProjection({
    surface: {
      width: 100,
      height: 50,
      origin: { x: 0, y: 0 },
    },
    viewport: {
      pan: { x: 10, y: 20 },
      zoom: 1,
    },
    canvasRect: {
      width: 300,
      height: 200,
    },
  });

  it("projects world points to canvas points and back", () => {
    const worldPoint = { x: 25, y: 12.5 };
    const canvasPoint = projection.worldToCanvas(worldPoint);

    const roundTripPoint = projection.canvasToWorld(canvasPoint);

    expect(roundTripPoint.x).toBeCloseTo(worldPoint.x);
    expect(roundTripPoint.y).toBeCloseTo(worldPoint.y);
  });

  it("keeps screen-sized objects in pixels", () => {
    expect(
      projection.getObjectCanvasBounds({
        id: "screen-token",
        type: "player",
        position: { x: 10, y: 10 },
        size: { width: 24, height: 18, mode: "screen" },
        props: {},
      }),
    ).toMatchObject({
      width: 24,
      height: 18,
    });
  });

  it("scales world-sized objects through pixelsPerUnit", () => {
    expect(
      projection.getObjectCanvasBounds({
        id: "world-zone",
        type: "zone",
        position: { x: 10, y: 10 },
        size: { width: 4, height: 2, mode: "world" },
        props: {},
      }),
    ).toMatchObject({
      width: 10.88,
      height: 5.44,
    });
  });

  it("applies the minimum hit radius", () => {
    expect(
      projection.hitTestObject(
        {
          id: "small-token",
          type: "player",
          position: { x: 10, y: 10 },
          size: { height: 2, width: 2, mode: "screen" },
          props: {},
        },
        projection.worldToCanvas({ x: 10, y: 10.8 }),
      ),
    ).toBe(true);
  });

  it("scales world-space projection by viewport zoom", () => {
    const zoomedProjection = createBoardSpaceProjection({
      surface: {
        width: 100,
        height: 50,
        origin: { x: 0, y: 0 },
      },
      viewport: {
        pan: { x: 10, y: 20 },
        zoom: 2,
      },
      canvasRect: {
        width: 300,
        height: 200,
      },
    });

    expect(zoomedProjection.pixelsPerUnit).toBeCloseTo(
      projection.pixelsPerUnit * 2,
    );
  });

  it("uses pixel Document units as one world unit per canvas pixel at base scale", () => {
    const pixelProjection = createBoardSpaceProjection({
      surface: {
        width: 320,
        height: 180,
        coordinateSystem: {
          unit: "px",
          basePixelsPerUnit: 1,
        },
      },
      viewport: {
        pan: { x: 0, y: 0 },
        zoom: 1,
      },
      canvasRect: {
        width: 348,
        height: 208,
      },
    });

    expect(pixelProjection.documentUnit).toBe("px");
    expect(pixelProjection.pixelsPerUnit).toBe(1);
    expect(pixelProjection.worldToCanvas({ x: 25, y: 40 })).toEqual({
      x: 39,
      y: 54,
    });
    expect(pixelProjection.canvasToWorld({ x: 39, y: 54 })).toEqual({
      x: 25,
      y: 40,
    });
  });

  it("uses meter Document units through the declared base scale", () => {
    const meterProjection = createBoardSpaceProjection({
      surface: {
        width: 115,
        height: 74,
        coordinateSystem: {
          unit: "m",
          basePixelsPerUnit: 8,
          origin: { x: -5, y: -3 },
        },
      },
      viewport: {
        pan: { x: 0, y: 0 },
        zoom: 1,
      },
      canvasRect: {
        width: 948,
        height: 620,
      },
    });

    expect(meterProjection.documentUnit).toBe("m");
    expect(meterProjection.pixelsPerUnit).toBe(8);
    expect(meterProjection.worldToCanvas({ x: -4, y: -1 })).toEqual({
      x: 22,
      y: 30,
    });
    expect(meterProjection.canvasToWorld({ x: 22, y: 30 })).toEqual({
      x: -4,
      y: -1,
    });
  });
});
