import { describe, expect, it } from "vitest";
import type { Board, BoardFrameConfig } from "../board/types";
import {
  getBoardViewerViewport,
  getBoardViewerViewportFromPan,
  getBoardViewerViewportFromWheel,
} from "./board-viewer-viewport";

const frame: BoardFrameConfig = {
  width: 100,
  height: 50,
};

const board: Board = {
  id: "viewer-board",
  version: 1,
  metadata: {},
  frame,
  objects: {
    byId: {},
    order: [],
  },
  style: {},
};

describe("board viewer viewport", () => {
  it("fits the board to the canvas in fit mode", () => {
    expect(
      getBoardViewerViewport({
        mode: "fit",
        frame,
        canvasRect: {
          width: 228,
          height: 128,
        },
      }),
    ).toEqual({
      pan: {
        x: 0,
        y: 0,
      },
      zoom: 2.28,
    });
  });

  it("allows viewer fit mode to zoom out below the editor minimum", () => {
    expect(
      getBoardViewerViewport({
        mode: "fit",
        frame,
        canvasRect: {
          width: 68,
          height: 48,
        },
      }),
    ).toEqual({
      pan: {
        x: 0,
        y: 0,
      },
      zoom: 0.68,
    });
  });

  it("keeps fit zoom positive before the canvas has a measured size", () => {
    const viewport = getBoardViewerViewport({
      mode: "fit",
      frame,
      canvasRect: {
        width: 1,
        height: 1,
      },
    });

    expect(viewport.zoom).toBeGreaterThan(0);
  });

  it("uses custom fit padding for viewer fit mode", () => {
    expect(
      getBoardViewerViewport({
        mode: "fit",
        frame,
        canvasRect: {
          width: 200,
          height: 100,
        },
        fitPadding: 14,
      }),
    ).toEqual({
      pan: {
        x: 0,
        y: 0,
      },
      zoom: 1.44,
    });
  });

  it("fits the board content bounds in fit-content mode", () => {
    const contentBoard: Board = {
      ...board,
      objects: {
        byId: {
          outside: {
            id: "outside",
            type: "marker",
            position: {
              x: 120,
              y: 25,
            },
            size: {
              width: 20,
              height: 20,
            },
            props: {},
          },
        },
        order: ["outside"],
      },
    };
    const viewport = getBoardViewerViewport({
      board: contentBoard,
      mode: "fit-content",
      frame,
      canvasRect: {
        width: 228,
        height: 128,
      },
    });

    expect(viewport.zoom).toBeCloseTo(228 / 130);
    expect(viewport.pan.x).toBeCloseTo(-((130 / 2 - 50) * viewport.zoom));
    expect(viewport.pan.y).toBe(0);
  });

  it("uses the supplied viewport outside fit mode", () => {
    const viewport = {
      pan: {
        x: 12,
        y: -4,
      },
      zoom: 1.5,
    };

    expect(
      getBoardViewerViewport({
        mode: "fixed",
        frame,
        canvasRect: {
          width: 228,
          height: 128,
        },
        viewport,
      }),
    ).toBe(viewport);
  });

  it("pans the viewport without changing zoom", () => {
    expect(
      getBoardViewerViewportFromPan({
        viewport: {
          pan: {
            x: 10,
            y: 20,
          },
          zoom: 2,
        },
        input: {
          delta: {
            x: -3,
            y: 5,
          },
        },
      }),
    ).toEqual({
      pan: {
        x: 7,
        y: 25,
      },
      zoom: 2,
    });
  });

  it("zooms around the viewer pointer", () => {
    const viewport = getBoardViewerViewportFromWheel({
      frame,
      viewport: {
        pan: {
          x: 0,
          y: 0,
        },
        zoom: 1,
      },
      input: {
        canvasRect: {
          width: 228,
          height: 128,
        },
        clientPoint: {
          x: 160,
          y: 80,
        },
        deltaY: -100,
      },
    });

    expect(viewport.zoom).toBeGreaterThan(1);
    expect(viewport.pan.x).not.toBe(0);
    expect(viewport.pan.y).not.toBe(0);
  });
});
