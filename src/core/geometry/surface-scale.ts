import type { DocumentBackgroundConfig } from "../board/types";
import { clampViewportZoom } from "../editor/viewport-zoom";
import type { Rect } from "./types";

export function getSurfaceFitScale(
  surface: Pick<DocumentBackgroundConfig, "width" | "height">,
  frame: Pick<Rect, "width" | "height">,
) {
  return Math.min(
    frame.width / Math.max(surface.width, 1),
    frame.height / Math.max(surface.height, 1),
  );
}

export function getViewportZoomToFitSurface(
  surface: Pick<DocumentBackgroundConfig, "width" | "height">,
  frame: Pick<Rect, "width" | "height">,
) {
  return clampViewportZoom(getSurfaceFitScale(surface, frame));
}
