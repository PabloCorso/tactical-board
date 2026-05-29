import type { Board, DocumentBackgroundConfig, Point } from "../board/types";
import type { BoardViewport } from "./types";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import type { CanvasRect } from "./board-editor-controller";
import { getFitPaddingInsets } from "../geometry/fit-padding";
import { getFrameFitScale } from "../geometry/frame-scale";
import type { FitPadding } from "../geometry/types";
import { MAX_VIEWPORT_ZOOM, MIN_VIEWPORT_ZOOM } from "./viewport-zoom";
import { getBoardContentBounds } from "../board/board-content-bounds";

export const DEFAULT_VIEWPORT: BoardViewport = {
  pan: { x: 0, y: 0 },
  zoom: 1,
};

export { MAX_VIEWPORT_ZOOM, MIN_VIEWPORT_ZOOM };
export const VIEWPORT_ZOOM_STEP_FACTOR = 1.2;
export const VIEWPORT_WHEEL_ZOOM_SENSITIVITY = 0.0015;

export type { FitPadding };

export function getViewportFrame({
  canvasRect,
  fitPadding,
}: {
  canvasRect: Pick<CanvasRect, "width" | "height">;
  fitPadding?: FitPadding;
}) {
  const paddingInsets = getFitPaddingInsets(fitPadding);

  return {
    x: paddingInsets.left,
    y: paddingInsets.top,
    width: Math.max(
      1,
      canvasRect.width - paddingInsets.left - paddingInsets.right,
    ),
    height: Math.max(
      1,
      canvasRect.height - paddingInsets.top - paddingInsets.bottom,
    ),
  };
}

export function getViewportForZoomAtCanvasPoint({
  frame,
  viewport,
  canvasRect,
  anchorCanvasPoint,
  zoom,
  minZoom = MIN_VIEWPORT_ZOOM,
  fitPadding,
}: {
  frame: DocumentBackgroundConfig;
  viewport: BoardViewport;
  canvasRect: Pick<CanvasRect, "width" | "height">;
  anchorCanvasPoint: Point;
  zoom: number;
  minZoom?: number;
  fitPadding?: FitPadding;
}): BoardViewport {
  const nextZoom = Math.min(MAX_VIEWPORT_ZOOM, Math.max(minZoom, zoom));

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
  fitPadding,
}: {
  frame: DocumentBackgroundConfig;
  canvasRect: Pick<CanvasRect, "width" | "height">;
  fitPadding?: FitPadding;
}): BoardViewport {
  const viewportFrame = getViewportFrame({
    canvasRect,
    fitPadding,
  });

  return {
    pan: { x: 0, y: 0 },
    zoom: getFrameFitScale(frame, viewportFrame),
  };
}

function normalizeZero(value: number) {
  return Math.abs(value) < 1e-9 || Object.is(value, -0) ? 0 : value;
}

export function getViewportToFitBoard({
  board,
  canvasRect,
  fitPadding,
}: {
  board: Board;
  canvasRect: Pick<CanvasRect, "width" | "height">;
  fitPadding?: FitPadding;
}): BoardViewport {
  const viewportFrame = getViewportFrame({
    canvasRect,
    fitPadding,
  });
  const bounds = getBoardContentBounds(board);
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const zoom = getFrameFitScale({ width, height }, viewportFrame);

  return {
    pan: {
      x: normalizeZero(
        getPanAxisToCenterBounds({
          frameSize: board.frame.width,
          boundsMin: bounds.minX,
          boundsMax: bounds.maxX,
          zoom,
          viewportFrameSize: viewportFrame.width,
        }),
      ),
      y: normalizeZero(
        getPanAxisToCenterBounds({
          frameSize: board.frame.height,
          boundsMin: bounds.minY,
          boundsMax: bounds.maxY,
          zoom,
          viewportFrameSize: viewportFrame.height,
        }),
      ),
    },
    zoom,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPanAxisToCenterBounds({
  frameSize,
  boundsMin,
  boundsMax,
  zoom,
  viewportFrameSize,
}: {
  frameSize: number;
  boundsMin: number;
  boundsMax: number;
  zoom: number;
  viewportFrameSize: number;
}) {
  const frameOffset = (viewportFrameSize - frameSize * zoom) / 2;
  const boundsCenter = (boundsMin + boundsMax) / 2;
  const boundsCenterCanvas = frameOffset + boundsCenter * zoom;

  return viewportFrameSize / 2 - boundsCenterCanvas;
}

function getPanAxisToFitBounds({
  pan,
  frameSize,
  boundsMin,
  boundsMax,
  zoom,
  viewportFrameSize,
}: {
  pan: number;
  frameSize: number;
  boundsMin: number;
  boundsMax: number;
  zoom: number;
  viewportFrameSize: number;
}) {
  const frameOffset = (viewportFrameSize - frameSize * zoom) / 2;
  const minCanvas = frameOffset + boundsMin * zoom;
  const maxCanvas = frameOffset + boundsMax * zoom;
  const contentRenderSize = maxCanvas - minCanvas;
  const minPan = Math.min(-minCanvas, viewportFrameSize - maxCanvas);
  const maxPan = Math.max(-minCanvas, viewportFrameSize - maxCanvas);
  const targetPan = contentRenderSize <= viewportFrameSize ? 0 : pan;

  return clamp(targetPan, minPan, maxPan);
}

export function constrainViewportToFrame({
  frame,
  canvasRect,
  viewport,
  fitPadding,
}: {
  frame: DocumentBackgroundConfig;
  canvasRect: Pick<CanvasRect, "width" | "height">;
  viewport: BoardViewport;
  fitPadding?: FitPadding;
}): BoardViewport {
  const viewportFrame = getViewportFrame({
    canvasRect,
    fitPadding,
  });
  const fitZoom = getFrameFitScale(frame, viewportFrame);
  const zoom = Math.max(viewport.zoom, fitZoom);

  return {
    zoom,
    pan: {
      x: normalizeZero(
        getPanAxisToFitBounds({
          pan: viewport.pan.x,
          frameSize: frame.width,
          boundsMin: 0,
          boundsMax: frame.width,
          zoom,
          viewportFrameSize: viewportFrame.width,
        }),
      ),
      y: normalizeZero(
        getPanAxisToFitBounds({
          pan: viewport.pan.y,
          frameSize: frame.height,
          boundsMin: 0,
          boundsMax: frame.height,
          zoom,
          viewportFrameSize: viewportFrame.height,
        }),
      ),
    },
  };
}

export function constrainViewportToBoard({
  board,
  canvasRect,
  viewport,
  fitPadding,
}: {
  board: Board;
  canvasRect: Pick<CanvasRect, "width" | "height">;
  viewport: BoardViewport;
  fitPadding?: FitPadding;
}): BoardViewport {
  const viewportFrame = getViewportFrame({
    canvasRect,
    fitPadding,
  });
  const bounds = getBoardContentBounds(board);
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const fitZoom = getFrameFitScale({ width, height }, viewportFrame);
  const zoom = Math.max(viewport.zoom, fitZoom);

  return {
    zoom,
    pan: {
      x: normalizeZero(
        getPanAxisToFitBounds({
          pan: viewport.pan.x,
          frameSize: board.frame.width,
          boundsMin: bounds.minX,
          boundsMax: bounds.maxX,
          zoom,
          viewportFrameSize: viewportFrame.width,
        }),
      ),
      y: normalizeZero(
        getPanAxisToFitBounds({
          pan: viewport.pan.y,
          frameSize: board.frame.height,
          boundsMin: bounds.minY,
          boundsMax: bounds.maxY,
          zoom,
          viewportFrameSize: viewportFrame.height,
        }),
      ),
    },
  };
}

export function getViewportForCanvasResize({
  frame,
  previousCanvasRect,
  nextCanvasRect,
  viewport,
  fitPadding,
}: {
  frame: DocumentBackgroundConfig;
  previousCanvasRect: Pick<CanvasRect, "width" | "height">;
  nextCanvasRect: Pick<CanvasRect, "width" | "height">;
  viewport: BoardViewport;
  fitPadding?: FitPadding;
}): BoardViewport {
  const previousFitZoom = getViewportToFitFrame({
    frame,
    canvasRect: previousCanvasRect,
    fitPadding,
  }).zoom;
  const nextFitZoom = getViewportToFitFrame({
    frame,
    canvasRect: nextCanvasRect,
    fitPadding,
  }).zoom;
  const zoomRatio = previousFitZoom > 0 ? viewport.zoom / previousFitZoom : 1;
  const nextZoom = nextFitZoom * zoomRatio;
  const panScale = viewport.zoom > 0 ? nextZoom / viewport.zoom : 1;

  return {
    zoom: nextZoom,
    pan: {
      x: viewport.pan.x * panScale,
      y: viewport.pan.y * panScale,
    },
  };
}

export function getViewportForBoardCanvasResize({
  board,
  previousCanvasRect,
  nextCanvasRect,
  viewport,
  fitPadding,
}: {
  board: Board;
  previousCanvasRect: Pick<CanvasRect, "width" | "height">;
  nextCanvasRect: Pick<CanvasRect, "width" | "height">;
  viewport: BoardViewport;
  fitPadding?: FitPadding;
}): BoardViewport {
  const previousFitZoom = getViewportToFitBoard({
    board,
    canvasRect: previousCanvasRect,
    fitPadding,
  }).zoom;
  const nextFitZoom = getViewportToFitBoard({
    board,
    canvasRect: nextCanvasRect,
    fitPadding,
  }).zoom;
  const zoomRatio = previousFitZoom > 0 ? viewport.zoom / previousFitZoom : 1;
  const nextZoom = nextFitZoom * zoomRatio;
  const panScale = viewport.zoom > 0 ? nextZoom / viewport.zoom : 1;

  return {
    zoom: nextZoom,
    pan: {
      x: viewport.pan.x * panScale,
      y: viewport.pan.y * panScale,
    },
  };
}

export function getContainedViewportForCanvasResize({
  frame,
  nextCanvasRect,
  ...resizeOptions
}: Parameters<typeof getViewportForCanvasResize>[0]): BoardViewport {
  return constrainViewportToFrame({
    frame,
    canvasRect: nextCanvasRect,
    viewport: getViewportForCanvasResize({
      frame,
      nextCanvasRect,
      ...resizeOptions,
    }),
    fitPadding: resizeOptions.fitPadding,
  });
}

export function getContainedViewportForBoardCanvasResize({
  board,
  nextCanvasRect,
  ...resizeOptions
}: Parameters<typeof getViewportForBoardCanvasResize>[0]): BoardViewport {
  return constrainViewportToBoard({
    board,
    canvasRect: nextCanvasRect,
    viewport: getViewportForBoardCanvasResize({
      board,
      nextCanvasRect,
      ...resizeOptions,
    }),
    fitPadding: resizeOptions.fitPadding,
  });
}
