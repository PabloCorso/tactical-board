import type { DocumentBackgroundConfig, Point } from "../board/types";
import type { BoardViewport } from "./types";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import type { CanvasRect } from "./board-editor-controller";
import { getFrameFitScale } from "../geometry/frame-scale";
import type { ViewportInsets } from "../geometry/types";
import { MAX_VIEWPORT_ZOOM, MIN_VIEWPORT_ZOOM } from "./viewport-zoom";

export const DEFAULT_VIEWPORT: BoardViewport = {
  pan: { x: 0, y: 0 },
  zoom: 1,
};

export const DEFAULT_VIEWPORT_INSETS: ViewportInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};
export { MAX_VIEWPORT_ZOOM, MIN_VIEWPORT_ZOOM };
export const VIEWPORT_ZOOM_STEP_FACTOR = 1.2;
export const VIEWPORT_WHEEL_ZOOM_SENSITIVITY = 0.0015;

function getViewportInsets(
  viewportInsets: ViewportInsets | undefined,
  fitPadding: number | undefined,
) {
  if (viewportInsets) {
    return viewportInsets;
  }

  if (fitPadding === undefined) {
    return DEFAULT_VIEWPORT_INSETS;
  }

  return {
    top: fitPadding,
    right: fitPadding,
    bottom: fitPadding,
    left: fitPadding,
  };
}

export function getViewportFrame({
  canvasRect,
  viewportInsets = DEFAULT_VIEWPORT_INSETS,
}: {
  canvasRect: Pick<CanvasRect, "width" | "height">;
  viewportInsets?: ViewportInsets;
}) {
  return {
    x: viewportInsets.left,
    y: viewportInsets.top,
    width: Math.max(
      1,
      canvasRect.width - viewportInsets.left - viewportInsets.right,
    ),
    height: Math.max(
      1,
      canvasRect.height - viewportInsets.top - viewportInsets.bottom,
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
  viewportInsets,
  fitPadding,
}: {
  frame: DocumentBackgroundConfig;
  viewport: BoardViewport;
  canvasRect: Pick<CanvasRect, "width" | "height">;
  anchorCanvasPoint: Point;
  zoom: number;
  minZoom?: number;
  viewportInsets?: ViewportInsets;
  fitPadding?: number;
}): BoardViewport {
  const resolvedViewportInsets = getViewportInsets(viewportInsets, fitPadding);
  const nextZoom = Math.min(MAX_VIEWPORT_ZOOM, Math.max(minZoom, zoom));

  if (nextZoom === viewport.zoom) {
    return viewport;
  }

  const currentProjection = createBoardSpaceProjection({
    frame,
    viewport,
    canvasRect,
    viewportInsets: resolvedViewportInsets,
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
    viewportInsets: resolvedViewportInsets,
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
  viewportInsets,
  fitPadding,
}: {
  frame: DocumentBackgroundConfig;
  canvasRect: Pick<CanvasRect, "width" | "height">;
  viewportInsets?: ViewportInsets;
  fitPadding?: number;
}): BoardViewport {
  const viewportFrame = getViewportFrame({
    canvasRect,
    viewportInsets: getViewportInsets(viewportInsets, fitPadding),
  });

  return {
    pan: { x: 0, y: 0 },
    zoom: getFrameFitScale(frame, viewportFrame),
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
  viewportInsets = DEFAULT_VIEWPORT_INSETS,
}: {
  frame: DocumentBackgroundConfig;
  canvasRect: Pick<CanvasRect, "width" | "height">;
  viewport: BoardViewport;
  viewportInsets?: ViewportInsets;
}): BoardViewport {
  const viewportFrame = getViewportFrame({ canvasRect, viewportInsets });
  const fitZoom = getFrameFitScale(frame, viewportFrame);
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

export function getViewportForCanvasResize({
  frame,
  previousCanvasRect,
  nextCanvasRect,
  previousViewportInsets = DEFAULT_VIEWPORT_INSETS,
  nextViewportInsets = DEFAULT_VIEWPORT_INSETS,
  viewport,
}: {
  frame: DocumentBackgroundConfig;
  previousCanvasRect: Pick<CanvasRect, "width" | "height">;
  nextCanvasRect: Pick<CanvasRect, "width" | "height">;
  previousViewportInsets?: ViewportInsets;
  nextViewportInsets?: ViewportInsets;
  viewport: BoardViewport;
}): BoardViewport {
  const previousFitZoom = getViewportToFitFrame({
    frame,
    canvasRect: previousCanvasRect,
    viewportInsets: previousViewportInsets,
  }).zoom;
  const nextFitZoom = getViewportToFitFrame({
    frame,
    canvasRect: nextCanvasRect,
    viewportInsets: nextViewportInsets,
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
  nextViewportInsets = DEFAULT_VIEWPORT_INSETS,
  ...resizeOptions
}: Parameters<typeof getViewportForCanvasResize>[0]): BoardViewport {
  return constrainViewportToFrame({
    frame,
    canvasRect: nextCanvasRect,
    viewport: getViewportForCanvasResize({
      frame,
      nextCanvasRect,
      nextViewportInsets,
      ...resizeOptions,
    }),
    viewportInsets: nextViewportInsets,
  });
}
