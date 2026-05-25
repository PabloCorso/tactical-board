import type { DocumentBackgroundConfig, Point } from "../board/types";
import type { BoardViewport } from "./types";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import type { CanvasRect } from "./board-editor-controller";
import { getViewportZoomToFitFrame } from "../geometry/frame-scale";
import {
  clampViewportZoom,
  MAX_VIEWPORT_ZOOM,
  MIN_VIEWPORT_ZOOM,
} from "./viewport-zoom";

export const DEFAULT_VIEWPORT: BoardViewport = {
  pan: { x: 0, y: 0 },
  zoom: 1,
};

export const DEFAULT_FIT_PADDING = 0;
export { MAX_VIEWPORT_ZOOM, MIN_VIEWPORT_ZOOM };
export const VIEWPORT_ZOOM_STEP_FACTOR = 1.2;
export const VIEWPORT_WHEEL_ZOOM_SENSITIVITY = 0.0015;

export function getViewportForZoomAtCanvasPoint({
  frame,
  viewport,
  canvasRect,
  anchorCanvasPoint,
  zoom,
  fitPadding = DEFAULT_FIT_PADDING,
}: {
  frame: DocumentBackgroundConfig;
  viewport: BoardViewport;
  canvasRect: Pick<CanvasRect, "width" | "height">;
  anchorCanvasPoint: Point;
  zoom: number;
  fitPadding?: number;
}): BoardViewport {
  const nextZoom = clampViewportZoom(zoom);

  if (nextZoom === viewport.zoom) {
    return viewport;
  }

  const currentProjection = createBoardSpaceProjection({
    frame,
    viewport,
    canvasRect,
    fitPadding,
  });
  const boardPoint = currentProjection.canvasToBoard(anchorCanvasPoint);
  const nextViewport = {
    ...viewport,
    zoom: nextZoom,
  };
  const nextProjection = createBoardSpaceProjection({
    frame,
    viewport: nextViewport,
    canvasRect,
    fitPadding,
  });
  const nextCanvasPoint = nextProjection.boardToCanvas(boardPoint);

  return {
    ...nextViewport,
    pan: {
      x: nextViewport.pan.x + anchorCanvasPoint.x - nextCanvasPoint.x,
      y: nextViewport.pan.y + anchorCanvasPoint.y - nextCanvasPoint.y,
    },
  };
}

export function getViewportToFitFrame({
  frame,
  canvasRect,
  fitPadding = DEFAULT_FIT_PADDING,
}: {
  frame: DocumentBackgroundConfig;
  canvasRect: Pick<CanvasRect, "width" | "height">;
  fitPadding?: number;
}): BoardViewport {
  const viewportFrame = {
    width: canvasRect.width - fitPadding * 2,
    height: canvasRect.height - fitPadding * 2,
  };

  return {
    pan: { x: 0, y: 0 },
    zoom: getViewportZoomToFitFrame(frame, viewportFrame),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getConstrainedPanAxis({
  pan,
  renderSize,
  frameSize,
}: {
  pan: number;
  renderSize: number;
  frameSize: number;
}) {
  const overflow = renderSize - frameSize;

  if (overflow <= 0) {
    return 0;
  }

  const maxPan = overflow / 2;

  return clamp(pan, -maxPan, maxPan);
}

export function constrainViewportToFrame({
  frame,
  canvasRect,
  viewport,
  fitPadding = DEFAULT_FIT_PADDING,
}: {
  frame: DocumentBackgroundConfig;
  canvasRect: Pick<CanvasRect, "width" | "height">;
  viewport: BoardViewport;
  fitPadding?: number;
}): BoardViewport {
  const viewportFrame = {
    width: Math.max(1, canvasRect.width - fitPadding * 2),
    height: Math.max(1, canvasRect.height - fitPadding * 2),
  };
  const fitZoom = getViewportZoomToFitFrame(frame, viewportFrame);
  const zoom = Math.max(viewport.zoom, fitZoom);
  const renderWidth = frame.width * zoom;
  const renderHeight = frame.height * zoom;

  return {
    zoom,
    pan: {
      x: getConstrainedPanAxis({
        pan: viewport.pan.x,
        renderSize: renderWidth,
        frameSize: viewportFrame.width,
      }),
      y: getConstrainedPanAxis({
        pan: viewport.pan.y,
        renderSize: renderHeight,
        frameSize: viewportFrame.height,
      }),
    },
  };
}
