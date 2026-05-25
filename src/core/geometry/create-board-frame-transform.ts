import type { DocumentBackgroundConfig, Point } from "../board/types";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoardFrameTransform {
  frame: Rect;
  scale: number;
  boardToCanvas: (point: Point) => Point;
  canvasToBoard: (point: Point) => Point;
}

export function createBoardFrameTransform({
  boardFrame,
  viewportFrame,
  zoom = 1,
}: {
  boardFrame: DocumentBackgroundConfig;
  viewportFrame: Rect;
  zoom?: number;
}): BoardFrameTransform {
  const scale = zoom;
  const renderWidth = boardFrame.width * scale;
  const renderHeight = boardFrame.height * scale;
  const offsetX = viewportFrame.x + (viewportFrame.width - renderWidth) / 2;
  const offsetY = viewportFrame.y + (viewportFrame.height - renderHeight) / 2;

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
