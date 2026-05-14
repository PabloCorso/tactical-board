import type { BoardSurfaceConfig } from "../board/types";
import { clampViewportZoom } from "../editor/viewport-zoom";
import type { Rect } from "./types";

export function getSurfaceFitPixelsPerUnit(
  surface: Pick<BoardSurfaceConfig, "width" | "height">,
  frame: Pick<Rect, "width" | "height">,
) {
  return Math.min(
    frame.width / Math.max(surface.width, 1),
    frame.height / Math.max(surface.height, 1),
  );
}

export function getSurfaceBasePixelsPerUnit(
  surface: Pick<BoardSurfaceConfig, "width" | "height" | "basePixelsPerUnit">,
  frame: Pick<Rect, "width" | "height">,
) {
  return surface.basePixelsPerUnit ?? getSurfaceFitPixelsPerUnit(surface, frame);
}

export function getViewportZoomToFitSurface(
  surface: Pick<BoardSurfaceConfig, "width" | "height" | "basePixelsPerUnit">,
  frame: Pick<Rect, "width" | "height">,
) {
  const fitPixelsPerUnit = getSurfaceFitPixelsPerUnit(surface, frame);
  const basePixelsPerUnit = getSurfaceBasePixelsPerUnit(surface, frame);

  return clampViewportZoom(fitPixelsPerUnit / Math.max(basePixelsPerUnit, 1e-9));
}
