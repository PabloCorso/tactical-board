import type { DocumentBackgroundConfig } from "../board/types";
import { clampViewportZoom } from "../editor/viewport-zoom";
import type { Rect } from "./types";

export function getFrameFitScale(
  boardFrame: Pick<DocumentBackgroundConfig, "width" | "height">,
  viewportFrame: Pick<Rect, "width" | "height">,
) {
  return Math.min(
    viewportFrame.width / Math.max(boardFrame.width, 1),
    viewportFrame.height / Math.max(boardFrame.height, 1),
  );
}

export function getViewportZoomToFitFrame(
  boardFrame: Pick<DocumentBackgroundConfig, "width" | "height">,
  viewportFrame: Pick<Rect, "width" | "height">,
) {
  return clampViewportZoom(getFrameFitScale(boardFrame, viewportFrame));
}
