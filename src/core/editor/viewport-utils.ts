import type { Point } from "../board/types";
import type { BoardViewport } from "./types";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import type { CanvasRect } from "./board-editor-controller";
import type { BoardSurfaceConfig } from "../board/types";
import { getViewportZoomToFitSurface } from "../geometry/surface-scale";
import {
  clampViewportZoom,
  MAX_VIEWPORT_ZOOM,
  MIN_VIEWPORT_ZOOM,
} from "./viewport-zoom";

const SURFACE_INSET = 14;

export const DEFAULT_VIEWPORT: BoardViewport = {
  pan: { x: 0, y: 0 },
  zoom: 1,
};

export { MAX_VIEWPORT_ZOOM, MIN_VIEWPORT_ZOOM };
export const VIEWPORT_ZOOM_STEP_FACTOR = 1.2;
export const VIEWPORT_WHEEL_ZOOM_SENSITIVITY = 0.0015;

export function getViewportForZoomAtCanvasPoint({
  surface,
  viewport,
  canvasRect,
  anchorCanvasPoint,
  zoom,
}: {
  surface: BoardSurfaceConfig;
  viewport: BoardViewport;
  canvasRect: Pick<CanvasRect, "width" | "height">;
  anchorCanvasPoint: Point;
  zoom: number;
}): BoardViewport {
  const nextZoom = clampViewportZoom(zoom);

  if (nextZoom === viewport.zoom) {
    return viewport;
  }

  const currentProjection = createBoardSpaceProjection({
    surface,
    viewport,
    canvasRect,
    surfaceInset: SURFACE_INSET,
  });
  const worldPoint = currentProjection.canvasToWorld(anchorCanvasPoint);
  const nextViewport = {
    ...viewport,
    zoom: nextZoom,
  };
  const nextProjection = createBoardSpaceProjection({
    surface,
    viewport: nextViewport,
    canvasRect,
    surfaceInset: SURFACE_INSET,
  });
  const nextCanvasPoint = nextProjection.worldToCanvas(worldPoint);

  return {
    ...nextViewport,
    pan: {
      x: nextViewport.pan.x + anchorCanvasPoint.x - nextCanvasPoint.x,
      y: nextViewport.pan.y + anchorCanvasPoint.y - nextCanvasPoint.y,
    },
  };
}

export function getViewportToFitSurface({
  surface,
  canvasRect,
}: {
  surface: BoardSurfaceConfig;
  canvasRect: Pick<CanvasRect, "width" | "height">;
}): BoardViewport {
  const frame = {
    width: canvasRect.width - SURFACE_INSET * 2,
    height: canvasRect.height - SURFACE_INSET * 2,
  };

  return {
    pan: { x: 0, y: 0 },
    zoom: getViewportZoomToFitSurface(surface, frame),
  };
}
