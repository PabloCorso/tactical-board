import type { Asset, Board, BoardObject } from "../../board/types";
import type { BoardSpaceProjection } from "../../geometry/board-space-projection";
import type { Viewport, ViewportInsets } from "../../geometry/types";

export interface CanvasRectOverlayItem {
  kind: "rect";
  coordinateSpace?: "board" | "canvas";
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
  requestRender: () => void;
  frameTransform: BoardSpaceProjection;
  assetResolver?: AssetResolver;
}

export type CanvasObjectRenderer = (input: CanvasObjectRenderInput) => void;

export type CanvasObjectRendererRegistry = Record<string, CanvasObjectRenderer>;

export interface CanvasObjectHitTestInput {
  object: BoardObject;
  canvasPoint: { x: number; y: number };
  frameTransform: BoardSpaceProjection;
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
  frameTransform: BoardSpaceProjection;
}

export type CanvasOverlayRenderer = (input: CanvasOverlayRenderInput) => void;

export type CanvasOverlayRendererRegistry = Record<
  string,
  CanvasOverlayRenderer
>;

export interface AssetResolver {
  getAssetSrc?: (asset: Asset, object: BoardObject) => string;
}

export interface CanvasRenderRequest {
  canvas: HTMLCanvasElement;
  board: Board;
  viewport: Viewport;
  extendBackground?: boolean;
  fitPadding?: number;
  viewportInsets?: ViewportInsets;
  requestRender?: () => void;
  previewObjects?: BoardObject[];
  overlayItems?: CanvasOverlayItem[];
  objectRenderers?: CanvasObjectRendererRegistry;
  overlayRenderers?: CanvasOverlayRendererRegistry;
  assetResolver?: AssetResolver;
}

export interface CanvasRenderer {
  render: (request: CanvasRenderRequest) => void;
}
