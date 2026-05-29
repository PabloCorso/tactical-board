import type { Board, BoardFrameConfig, Point } from "../board/types";
import type { Viewport } from "../geometry/types";
import {
  DEFAULT_VIEWPORT,
  getViewportForZoomAtCanvasPoint,
  getViewportToFitBoard,
  VIEWPORT_WHEEL_ZOOM_SENSITIVITY,
} from "../editor/viewport-utils";
import { getFrameFitScale } from "../geometry/frame-scale";

export const DEFAULT_BOARD_VIEWER_FIT_PADDING = 0;

export type BoardViewerViewportMode =
  | "fit"
  | "fit-content"
  | "fixed"
  | "interactive";

export interface BoardViewerCanvasRect {
  width: number;
  height: number;
}

export interface BoardViewerWheelInput {
  canvasRect: BoardViewerCanvasRect;
  clientPoint: Point;
  deltaY: number;
  fitPadding?: number;
}

export interface BoardViewerPanInput {
  delta: Point;
}

export interface BoardViewerPinchInput {
  canvasRect: BoardViewerCanvasRect;
  clientPoint: Point;
  fitPadding?: number;
  scale: number;
}

function getViewerViewportToFitFrame({
  frame,
  canvasRect,
  fitPadding,
}: {
  frame: BoardFrameConfig;
  canvasRect: BoardViewerCanvasRect;
  fitPadding: number;
}): Viewport {
  const viewportFrame = {
    width: Math.max(1, canvasRect.width - fitPadding * 2),
    height: Math.max(1, canvasRect.height - fitPadding * 2),
  };

  return {
    pan: { x: 0, y: 0 },
    zoom: getFrameFitScale(frame, viewportFrame),
  };
}

export function getBoardViewerViewport({
  board,
  mode,
  frame,
  canvasRect,
  viewport,
  fitPadding = DEFAULT_BOARD_VIEWER_FIT_PADDING,
}: {
  board?: Board;
  mode: BoardViewerViewportMode;
  frame: BoardFrameConfig;
  canvasRect: BoardViewerCanvasRect;
  viewport?: Viewport;
  fitPadding?: number;
}): Viewport {
  if ((mode === "fit" || mode === "fit-content") && board) {
    return getViewportToFitBoard({
      board,
      canvasRect,
      fitPadding,
    });
  }

  if (mode === "fit" || mode === "fit-content") {
    return getViewerViewportToFitFrame({
      frame,
      canvasRect,
      fitPadding,
    });
  }

  return viewport ?? DEFAULT_VIEWPORT;
}

export function getBoardViewerViewportFromWheel({
  frame,
  viewport,
  input,
}: {
  frame: BoardFrameConfig;
  viewport: Viewport;
  input: BoardViewerWheelInput;
}): Viewport {
  return getViewportForZoomAtCanvasPoint({
    frame,
    viewport,
    canvasRect: input.canvasRect,
    anchorCanvasPoint: input.clientPoint,
    fitPadding: input.fitPadding,
    zoom:
      viewport.zoom * Math.exp(-input.deltaY * VIEWPORT_WHEEL_ZOOM_SENSITIVITY),
  });
}

export function getBoardViewerViewportFromPinch({
  frame,
  viewport,
  input,
}: {
  frame: BoardFrameConfig;
  viewport: Viewport;
  input: BoardViewerPinchInput;
}): Viewport {
  return getViewportForZoomAtCanvasPoint({
    frame,
    viewport,
    canvasRect: input.canvasRect,
    anchorCanvasPoint: input.clientPoint,
    fitPadding: input.fitPadding,
    zoom: viewport.zoom * input.scale,
  });
}

export function getBoardViewerViewportFromPan({
  viewport,
  input,
}: {
  viewport: Viewport;
  input: BoardViewerPanInput;
}): Viewport {
  return {
    ...viewport,
    pan: {
      x: viewport.pan.x + input.delta.x,
      y: viewport.pan.y + input.delta.y,
    },
  };
}
