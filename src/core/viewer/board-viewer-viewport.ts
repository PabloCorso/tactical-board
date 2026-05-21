import type { BoardSurfaceConfig, Point } from "../board/types";
import type { Viewport } from "../geometry/types";
import {
  DEFAULT_VIEWPORT,
  getViewportForZoomAtCanvasPoint,
  getViewportToFitSurface,
  VIEWPORT_WHEEL_ZOOM_SENSITIVITY,
} from "../editor/viewport-utils";

export type BoardViewerViewportMode = "fit" | "fixed" | "interactive";

export interface BoardViewerCanvasRect {
  width: number;
  height: number;
}

export interface BoardViewerWheelInput {
  canvasRect: BoardViewerCanvasRect;
  clientPoint: Point;
  deltaY: number;
}

export interface BoardViewerPanInput {
  delta: Point;
}

export function getBoardViewerViewport({
  mode,
  surface,
  canvasRect,
  viewport,
}: {
  mode: BoardViewerViewportMode;
  surface: BoardSurfaceConfig;
  canvasRect: BoardViewerCanvasRect;
  viewport?: Viewport;
}): Viewport {
  if (mode === "fit") {
    return getViewportToFitSurface({
      surface,
      canvasRect,
    });
  }

  return viewport ?? DEFAULT_VIEWPORT;
}

export function getBoardViewerViewportFromWheel({
  surface,
  viewport,
  input,
}: {
  surface: BoardSurfaceConfig;
  viewport: Viewport;
  input: BoardViewerWheelInput;
}): Viewport {
  return getViewportForZoomAtCanvasPoint({
    surface,
    viewport,
    canvasRect: input.canvasRect,
    anchorCanvasPoint: input.clientPoint,
    zoom:
      viewport.zoom * Math.exp(-input.deltaY * VIEWPORT_WHEEL_ZOOM_SENSITIVITY),
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
