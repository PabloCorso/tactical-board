import type { Point, Size } from "../board/types";

export interface Rect extends Point, Size {}

export interface Viewport {
  zoom: number;
  pan: Point;
}

export interface ViewportInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type HitTestMode = "normal" | "passthrough" | "bounds-only";
