import { describe, expect, it } from "vitest";
import { createBoardSpaceProjection } from "./board-space-projection";

describe("createBoardSpaceProjection", () => {
  const projection = createBoardSpaceProjection({
    frame: {
      width: 100,
      height: 50,
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

  it("projects board pixels to canvas points and back", () => {
    const boardPoint = { x: 25, y: 12.5 };
    const canvasPoint = projection.boardToCanvas(boardPoint);

    const roundTripPoint = projection.canvasToBoard(canvasPoint);

    expect(roundTripPoint.x).toBeCloseTo(boardPoint.x);
    expect(roundTripPoint.y).toBeCloseTo(boardPoint.y);
  });

  it("scales object bounds by viewport zoom", () => {
    expect(
      projection.getObjectCanvasBounds({
        id: "token",
        type: "player",
        position: { x: 10, y: 10 },
        size: { width: 24, height: 18 },
        props: {},
      }),
    ).toMatchObject({
      width: 24,
      height: 18,
    });
  });

  it("applies the minimum hit radius", () => {
    expect(
      projection.hitTestObject(
        {
          id: "small-token",
          type: "player",
          position: { x: 10, y: 10 },
          size: { height: 2, width: 2 },
          props: {},
        },
        projection.boardToCanvas({ x: 10, y: 10.8 }),
      ),
    ).toBe(true);
  });

  it("scales the projection by viewport zoom", () => {
    const zoomedProjection = createBoardSpaceProjection({
      frame: {
        width: 100,
        height: 50,
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

    expect(zoomedProjection.scale).toBeCloseTo(projection.scale * 2);
    expect(
      zoomedProjection.getObjectCanvasBounds({
        id: "token",
        type: "player",
        position: { x: 10, y: 10 },
        size: { width: 24, height: 18 },
        props: {},
      }),
    ).toMatchObject({
      width: 48,
      height: 36,
    });
  });

  it("applies side-specific fit padding", () => {
    const paddedProjection = createBoardSpaceProjection({
      frame: {
        width: 100,
        height: 50,
      },
      viewport: {
        pan: { x: 0, y: 0 },
        zoom: 2,
      },
      canvasRect: {
        width: 260,
        height: 140,
      },
      fitPadding: { top: 20, right: 40, bottom: 10, left: 20 },
    });

    expect(paddedProjection.frame).toEqual({
      x: 20,
      y: 25,
      width: 200,
      height: 100,
    });
  });
});
