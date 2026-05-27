import type {
  BoardObject,
  DocumentBackgroundConfig,
  Point,
} from "../board/types";
import { createBoardFrameTransform } from "./create-board-frame-transform";
import type { Rect, Viewport, ViewportInsets } from "./types";

const DEFAULT_VIEWPORT_INSETS: ViewportInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};
const DEFAULT_OBJECT_DIAMETER = 18;
const DEFAULT_MINIMUM_HIT_RADIUS_PX = 24;

export interface BoardSpaceProjection {
  frame: Rect;
  zoom: number;
  scale: number;
  boardToCanvas: (point: Point) => Point;
  canvasToBoard: (point: Point) => Point;
  getObjectCanvasRadius: (object: BoardObject) => number;
  getObjectCanvasBounds: (object: BoardObject) => Rect;
  hitTestObject: (
    object: BoardObject,
    canvasPoint: Point,
    options?: { minimumHitRadiusPx?: number },
  ) => boolean;
}

export interface CreateBoardSpaceProjectionOptions {
  frame: DocumentBackgroundConfig;
  viewport: Viewport;
  canvasRect: Pick<Rect, "width" | "height">;
  viewportInsets?: ViewportInsets;
}

export function createBoardSpaceProjection({
  frame,
  viewport,
  canvasRect,
  viewportInsets = DEFAULT_VIEWPORT_INSETS,
}: CreateBoardSpaceProjectionOptions): BoardSpaceProjection {
  const viewportFrameWidth = Math.max(
    1,
    canvasRect.width - viewportInsets.left - viewportInsets.right,
  );
  const viewportFrameHeight = Math.max(
    1,
    canvasRect.height - viewportInsets.top - viewportInsets.bottom,
  );
  const frameTransform = createBoardFrameTransform({
    boardFrame: frame,
    viewportFrame: {
      x: viewportInsets.left + viewport.pan.x,
      y: viewportInsets.top + viewport.pan.y,
      width: viewportFrameWidth,
      height: viewportFrameHeight,
    },
    zoom: viewport.zoom,
  });

  const getObjectCanvasSize = (object: BoardObject) => {
    const width = object.size?.width ?? DEFAULT_OBJECT_DIAMETER;
    const height =
      object.size?.height ?? object.size?.width ?? DEFAULT_OBJECT_DIAMETER;

    return {
      width: width * frameTransform.scale,
      height: height * frameTransform.scale,
    };
  };

  const getObjectCanvasRadius = (object: BoardObject) => {
    const { width } = getObjectCanvasSize(object);
    return width / 2;
  };

  const getObjectCanvasBounds = (object: BoardObject): Rect => {
    const center = frameTransform.boardToCanvas(object.position);
    const { width, height } = getObjectCanvasSize(object);

    return {
      x: center.x - width / 2,
      y: center.y - height / 2,
      width,
      height,
    };
  };

  return {
    frame: frameTransform.frame,
    zoom: viewport.zoom,
    scale: frameTransform.scale,
    boardToCanvas: frameTransform.boardToCanvas,
    canvasToBoard: frameTransform.canvasToBoard,
    getObjectCanvasRadius,
    getObjectCanvasBounds,
    hitTestObject: (object, canvasPoint, options) => {
      const center = frameTransform.boardToCanvas(object.position);
      const radius = Math.max(
        getObjectCanvasRadius(object),
        options?.minimumHitRadiusPx ?? DEFAULT_MINIMUM_HIT_RADIUS_PX,
      );

      return (
        Math.hypot(canvasPoint.x - center.x, canvasPoint.y - center.y) <= radius
      );
    },
  };
}
