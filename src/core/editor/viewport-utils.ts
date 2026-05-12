import type { Point } from "../board/types";
import type { BoardViewport } from "./types";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import type { CanvasRect } from "./board-editor-controller";
import type { BoardSurfaceConfig } from "../board/types";

const SURFACE_INSET = 14;

export const DEFAULT_VIEWPORT: BoardViewport = {
  pan: { x: 0, y: 0 },
  zoom: 1,
};

export const MIN_VIEWPORT_ZOOM = 0.5;
export const MAX_VIEWPORT_ZOOM = 4;
export const VIEWPORT_ZOOM_STEP_FACTOR = 1.2;
export const VIEWPORT_WHEEL_ZOOM_SENSITIVITY = 0.0015;

export function clampViewportZoom(zoom: number) {
  return Math.min(MAX_VIEWPORT_ZOOM, Math.max(MIN_VIEWPORT_ZOOM, zoom));
}

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
