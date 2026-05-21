import { describe, expect, it } from "vitest";
import type { BoardSurfaceConfig } from "../board/types";
import {
  getBoardViewerViewport,
  getBoardViewerViewportFromPan,
  getBoardViewerViewportFromWheel,
} from "./board-viewer-viewport";

const surface: BoardSurfaceConfig = {
  width: 100,
  height: 50,
};

describe("board viewer viewport", () => {
  it("fits the board to the canvas in fit mode", () => {
    expect(
      getBoardViewerViewport({
        mode: "fit",
        surface,
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
      zoom: 2,
    });
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
        surface,
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
      surface,
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
