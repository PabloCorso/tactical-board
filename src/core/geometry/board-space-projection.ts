import type {
  BoardObject,
  DocumentBackgroundConfig,
  Point,
} from "../board/types";
import { createBoardFrameTransform } from "./create-board-frame-transform";
import type { Rect, Viewport } from "./types";

const DEFAULT_FIT_PADDING = 0;
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
  fitPadding?: number;
}

export function createBoardSpaceProjection({
  frame,
  viewport,
  canvasRect,
  fitPadding = DEFAULT_FIT_PADDING,
}: CreateBoardSpaceProjectionOptions): BoardSpaceProjection {
  const frameTransform = createBoardFrameTransform({
    boardFrame: frame,
    viewportFrame: {
      x: fitPadding + viewport.pan.x,
      y: fitPadding + viewport.pan.y,
      width: canvasRect.width - fitPadding * 2,
      height: canvasRect.height - fitPadding * 2,
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
