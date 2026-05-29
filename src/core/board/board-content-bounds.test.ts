import { describe, expect, it } from "vitest";
import type { Board } from "./types";
import { getBoardContentBounds } from "./board-content-bounds";

function createBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: "board-1",
    version: 1,
    metadata: {},
    frame: {
      width: 100,
      height: 50,
    },
    objects: {
      byId: {},
      order: [],
    },
    style: {},
    ...overrides,
  };
}

describe("getBoardContentBounds", () => {
  it("uses the visible outer marking bounds when frame markings exist", () => {
    const board = createBoard({
      frame: {
        width: 100,
        height: 50,
        markings: [
          {
            kind: "rect",
            x: 10,
            y: 5,
            width: 80,
            height: 40,
            stroke: "#fff",
            strokeWidth: 4,
          },
        ],
      },
    });

    expect(getBoardContentBounds(board)).toEqual({
      minX: 8,
      minY: 3,
      maxX: 92,
      maxY: 47,
    });
  });

  it("expands marking bounds to include objects", () => {
    const board = createBoard({
      frame: {
        width: 100,
        height: 50,
        markings: [
          {
            kind: "rect",
            x: 10,
            y: 5,
            width: 80,
            height: 40,
            fill: "#080",
          },
        ],
      },
      objects: {
        byId: {
          outside: {
            id: "outside",
            type: "marker",
            position: { x: 105, y: 25 },
            size: { width: 10, height: 10 },
            props: {},
          },
        },
        order: ["outside"],
      },
    });

    expect(getBoardContentBounds(board)).toEqual({
      minX: 10,
      minY: 5,
      maxX: 110,
      maxY: 45,
    });
  });

  it("uses the actual stroked line bounds", () => {
    const board = createBoard({
      frame: {
        width: 100,
        height: 50,
        markings: [
          {
            kind: "line",
            x1: 10,
            y1: 10,
            x2: 20,
            y2: 20,
            stroke: "#fff",
            strokeWidth: Math.sqrt(2),
          },
        ],
      },
    });

    expect(getBoardContentBounds(board)).toEqual({
      minX: 9.5,
      minY: 9.5,
      maxX: 20.5,
      maxY: 20.5,
    });
  });

  it("uses the actual stroked arc bounds", () => {
    const board = createBoard({
      frame: {
        width: 100,
        height: 50,
        markings: [
          {
            kind: "arc",
            cx: 20,
            cy: 20,
            r: 10,
            startAngle: 0,
            endAngle: 90,
            stroke: "#fff",
            strokeWidth: 2,
          },
        ],
      },
    });

    expect(getBoardContentBounds(board)).toEqual({
      minX: 20,
      minY: 20,
      maxX: 31,
      maxY: 31,
    });
  });

  it("ignores invisible frame markings", () => {
    const board = createBoard({
      frame: {
        width: 100,
        height: 50,
        markings: [
          {
            kind: "arc",
            cx: 20,
            cy: 20,
            r: 10,
            startAngle: 0,
            endAngle: 90,
            strokeWidth: 2,
          },
        ],
      },
    });

    expect(getBoardContentBounds(board)).toEqual({
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 50,
    });
  });

  it("falls back to the full frame when no markings exist", () => {
    expect(getBoardContentBounds(createBoard())).toEqual({
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 50,
    });
  });
});
