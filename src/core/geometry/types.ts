import type { Point, Size } from "../board/types";

export interface Rect extends Point, Size {}

export interface Viewport {
  zoom: number;
  pan: Point;
}

export type FitPadding =
  | number
  | {
      x: number;
      y: number;
    }
  | {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };

export interface FitPaddingInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type HitTestMode = "normal" | "passthrough" | "bounds-only";
