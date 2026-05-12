import type { Board, BoardObject } from "../../core/board/types";
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
  object: BoardObject;
  appearance: "default" | "preview";
  surfaceTransform: BoardSpaceProjection;
}

export type CanvasObjectRenderer = (input: CanvasObjectRenderInput) => void;

export type CanvasObjectRendererRegistry = Record<string, CanvasObjectRenderer>;

export interface CanvasObjectHitTestInput {
  object: BoardObject;
  canvasPoint: { x: number; y: number };
  surfaceTransform: BoardSpaceProjection;
  minimumHitRadiusPx: number;
}

export type CanvasObjectHitTester = (
  input: CanvasObjectHitTestInput,
) => boolean;

export type CanvasObjectHitTesterRegistry = Record<
  string,
  CanvasObjectHitTester
>;

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

export interface CanvasRenderRequest {
  canvas: HTMLCanvasElement;
  board: Board;
  viewport: Viewport;
  previewObjects?: BoardObject[];
  overlayItems?: CanvasOverlayItem[];
  objectRenderers?: CanvasObjectRendererRegistry;
  overlayRenderers?: CanvasOverlayRendererRegistry;
}

export interface CanvasRenderer {
  render: (request: CanvasRenderRequest) => void;
}
