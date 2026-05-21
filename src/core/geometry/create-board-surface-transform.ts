import type { DocumentBackgroundConfig, Point } from "../board/types";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoardSurfaceTransform {
  frame: Rect;
  scale: number;
  boardToCanvas: (point: Point) => Point;
  canvasToBoard: (point: Point) => Point;
}

export function createBoardSurfaceTransform({
  surface,
  frame,
  zoom = 1,
}: {
  surface: DocumentBackgroundConfig;
  frame: Rect;
  zoom?: number;
}): BoardSurfaceTransform {
  const scale = zoom;
  const renderWidth = surface.width * scale;
  const renderHeight = surface.height * scale;
  const offsetX = frame.x + (frame.width - renderWidth) / 2;
  const offsetY = frame.y + (frame.height - renderHeight) / 2;

  return {
    frame: {
      x: offsetX,
      y: offsetY,
      width: renderWidth,
      height: renderHeight,
    },
    scale,
    boardToCanvas: (point) => ({
      x: offsetX + point.x * scale,
      y: offsetY + point.y * scale,
    }),
    canvasToBoard: (point) => ({
      x: (point.x - offsetX) / scale,
      y: (point.y - offsetY) / scale,
    }),
  };
}
