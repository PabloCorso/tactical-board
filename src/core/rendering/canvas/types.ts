import type { Asset, Board, BoardObject } from "../../board/types";
import type { BoardSpaceProjection } from "../../geometry/board-space-projection";
import type { FitPadding, Viewport } from "../../geometry/types";
import type { ObjectRegistry } from "../../objects/types";

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
  board: Board;
  object: BoardObject;
  appearance: "default" | "preview";
  requestRender: () => void;
  frameTransform: BoardSpaceProjection;
  assetResolver?: AssetResolver;
}

export type CanvasObjectRenderer = (input: CanvasObjectRenderInput) => void;

export interface CanvasObjectHitTestInput {
  board: Board;
  object: BoardObject;
  canvasPoint: { x: number; y: number };
  frameTransform: BoardSpaceProjection;
  minimumHitRadiusPx: number;
}

export type CanvasObjectHitTester = (
  input: CanvasObjectHitTestInput,
) => boolean;

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
  fitPadding?: FitPadding;
  requestRender?: () => void;
  previewObjects?: BoardObject[];
  overlayItems?: CanvasOverlayItem[];
  objectRegistry?: ObjectRegistry;
  overlayRenderers?: CanvasOverlayRendererRegistry;
  assetResolver?: AssetResolver;
}

export interface CanvasRenderer {
  render: (request: CanvasRenderRequest) => void;
}
