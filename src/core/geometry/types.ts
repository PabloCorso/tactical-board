import type { Point, Size } from "../board/types";

export interface Rect extends Point, Size {}

export interface Viewport {
  zoom: number;
  pan: Point;
}

export type HitTestMode = "normal" | "passthrough" | "bounds-only";
