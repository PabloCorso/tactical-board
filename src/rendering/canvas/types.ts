import type { Board, BoardObjectBase } from "../../core/board/types";
import type { BoardSpaceProjection } from "../../core/geometry/board-space-projection";
import type { Viewport } from "../../core/geometry/types";

export interface CanvasRectOverlayItem {
  kind: "rect";
  coordinateSpace?: "world" | "canvas";
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  lineWidth?: number;
  lineDash?: number[];
}

export interface CanvasCustomOverlayItem {
  kind: string;
  [key: string]: unknown;
}

export type CanvasOverlayItem = CanvasRectOverlayItem | CanvasCustomOverlayItem;

export interface CanvasObjectRenderInput {
  context: CanvasRenderingContext2D;
  object: BoardObjectBase;
  appearance: "default" | "preview";
  surfaceTransform: BoardSpaceProjection;
}

export type CanvasObjectRenderer = (input: CanvasObjectRenderInput) => void;

export type CanvasObjectRendererRegistry = Record<string, CanvasObjectRenderer>;

export interface CanvasOverlayRenderInput {
  context: CanvasRenderingContext2D;
  overlay: CanvasOverlayItem;
  surfaceTransform: BoardSpaceProjection;
}

export type CanvasOverlayRenderer = (input: CanvasOverlayRenderInput) => void;

export type CanvasOverlayRendererRegistry = Record<
  string,
  CanvasOverlayRenderer
>;

export interface CanvasRenderRequest<
  TObject extends BoardObjectBase = BoardObjectBase,
> {
  canvas: HTMLCanvasElement;
  board: Board<TObject>;
  viewport: Viewport;
  previewObjects?: BoardObjectBase[];
  overlayItems?: CanvasOverlayItem[];
  objectRenderers?: CanvasObjectRendererRegistry;
  overlayRenderers?: CanvasOverlayRendererRegistry;
}

export interface CanvasRenderer {
  render: <TObject extends BoardObjectBase>(
    request: CanvasRenderRequest<TObject>,
  ) => void;
}
