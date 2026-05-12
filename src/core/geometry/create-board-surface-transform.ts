import type { BoardSurfaceConfig, Point } from "../board/types";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoardSurfaceTransform {
  frame: Rect;
  pixelsPerUnit: number;
  worldOrigin: Point;
  worldToCanvas: (point: Point) => Point;
  canvasToWorld: (point: Point) => Point;
}

export function createBoardSurfaceTransform({
  surface,
  frame,
  zoom = 1,
}: {
  surface: BoardSurfaceConfig;
  frame: Rect;
  zoom?: number;
}): BoardSurfaceTransform {
  const worldOrigin = surface.origin ?? { x: 0, y: 0 };
  const basePixelsPerUnit = Math.min(
    frame.width / Math.max(surface.width, 1),
    frame.height / Math.max(surface.height, 1),
  );
  const pixelsPerUnit = basePixelsPerUnit * zoom;
  const renderWidth = surface.width * pixelsPerUnit;
  const renderHeight = surface.height * pixelsPerUnit;
  const offsetX = frame.x + (frame.width - renderWidth) / 2;
  const offsetY = frame.y + (frame.height - renderHeight) / 2;

  return {
    frame: {
      x: offsetX,
      y: offsetY,
      width: renderWidth,
      height: renderHeight,
    },
    pixelsPerUnit,
    worldOrigin,
    worldToCanvas: (point) => ({
      x: offsetX + (point.x - worldOrigin.x) * pixelsPerUnit,
      y: offsetY + (point.y - worldOrigin.y) * pixelsPerUnit,
    }),
    canvasToWorld: (point) => ({
      x: worldOrigin.x + (point.x - offsetX) / pixelsPerUnit,
      y: worldOrigin.y + (point.y - offsetY) / pixelsPerUnit,
    }),
  };
}
