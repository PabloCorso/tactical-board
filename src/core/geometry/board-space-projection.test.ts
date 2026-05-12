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
});
