import { describe, expect, it } from "vitest";
import type { Board } from "../../board/types";
import { createCanvasRenderer } from "./create-canvas-renderer";

type DrawOperation =
  | { kind: "surface-fill"; fillStyle: string }
  | {
      kind: "fill-rect";
      fillStyle: string;
      width: number;
      height: number;
    }
  | {
      kind: "stroke-rect";
      strokeStyle: string;
      lineWidth: number;
      width: number;
      height: number;
    };

function createFakeCanvas() {
  const operations: DrawOperation[] = [];
  const context = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    globalAlpha: 1,
    setTransform: () => {},
    clearRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    arcTo: () => {},
    closePath: () => {},
    fill() {
      operations.push({
        kind: "surface-fill",
        fillStyle: String(this.fillStyle),
      });
    },
    fillRect(_x: number, _y: number, width: number, height: number) {
      operations.push({
        kind: "fill-rect",
        fillStyle: String(this.fillStyle),
        width,
        height,
      });
    },
    strokeRect(_x: number, _y: number, width: number, height: number) {
      operations.push({
        kind: "stroke-rect",
        strokeStyle: String(this.strokeStyle),
        lineWidth: Number(this.lineWidth),
        width,
        height,
      });
    },
    lineTo: () => {},
    stroke: () => {},
    arc: () => {},
    save: () => {},
    restore: () => {},
    setLineDash: () => {},
  };
  const canvas = {
    clientWidth: 320,
    clientHeight: 200,
    width: 0,
    height: 0,
    getContext: () => context,
  } as unknown as HTMLCanvasElement;

  return { canvas, operations };
}

function createEmptyBoard(surface: Board["surface"]): Board {
  return {
    id: "board-1",
    version: 1,
    metadata: {},
    surface,
    objects: {
      byId: {},
      order: [],
    },
    style: {},
  };
}

describe("createCanvasRenderer", () => {
  it("paints a generic Document background fill", () => {
    const { canvas, operations } = createFakeCanvas();

    createCanvasRenderer().render({
      canvas,
      board: createEmptyBoard({
        width: 100,
        height: 50,
        fill: "#f8fafc",
      }),
      viewport: {
        pan: { x: 0, y: 0 },
        zoom: 1,
      },
    });

    expect(operations.at(0)).toEqual({
      kind: "surface-fill",
      fillStyle: "#f8fafc",
    });
  });

  it("keeps board surface preset background and markings renderable", () => {
    const { canvas, operations } = createFakeCanvas();

    createCanvasRenderer().render({
      canvas,
      board: createEmptyBoard({
        width: 100,
        height: 50,
        background: "#177238",
        markings: [
          {
            kind: "rect",
            x: 10,
            y: 5,
            width: 20,
            height: 10,
            stroke: "#ffffff",
            strokeWidth: 0.5,
          },
        ],
        markup: {
          sport: "football",
        },
      }),
      viewport: {
        pan: { x: 0, y: 0 },
        zoom: 1,
      },
    });

    expect(operations.at(0)).toEqual({
      kind: "surface-fill",
      fillStyle: "#177238",
    });
    expect(operations).toContainEqual({
      kind: "stroke-rect",
      strokeStyle: "#ffffff",
      lineWidth: 0.5,
      width: 20,
      height: 10,
    });
  });

  it("can extend the board background across the full canvas", () => {
    const { canvas, operations } = createFakeCanvas();

    createCanvasRenderer().render({
      canvas,
      board: createEmptyBoard({
        width: 100,
        height: 50,
        background: "#177238",
      }),
      viewport: {
        pan: { x: 0, y: 0 },
        zoom: 1,
      },
      extendBackground: true,
    });

    expect(operations.at(0)).toEqual({
      kind: "fill-rect",
      fillStyle: "#177238",
      width: 320,
      height: 200,
    });
    expect(operations.at(1)).toEqual({
      kind: "surface-fill",
      fillStyle: "#177238",
    });
  });
});
