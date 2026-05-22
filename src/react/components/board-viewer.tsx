import type { Board } from "../../core/board/types";
import type { Viewport } from "../../core/geometry/types";
import type { BoardViewerViewportMode } from "../../core/viewer/board-viewer-viewport";
import type {
  CanvasObjectRendererRegistry,
  CanvasOverlayItem,
  CanvasOverlayRendererRegistry,
} from "../../core/rendering/canvas/types";
import {
  type BoardViewerInitialViewport,
  useBoardViewerCanvas,
} from "../hooks/use-board-viewer-canvas";
import { cn } from "./misc";

export type BoardViewerCanvasProps = {
  board: Board;
  className?: string;
  frameClassName?: string;
  mode?: BoardViewerViewportMode;
  fitPadding?: number;
  extendBackground?: boolean;
  viewport?: Viewport;
  initialViewport?: BoardViewerInitialViewport;
  onViewportChange?: (viewport: Viewport) => void;
  objectRenderers?: CanvasObjectRendererRegistry;
  overlayItems?: CanvasOverlayItem[];
  overlayRenderers?: CanvasOverlayRendererRegistry;
};

export function BoardViewerCanvas({
  board,
  className,
  frameClassName,
  mode = "fit",
  fitPadding,
  extendBackground,
  viewport,
  initialViewport,
  onViewportChange,
  objectRenderers,
  overlayItems,
  overlayRenderers,
}: BoardViewerCanvasProps) {
  const { canvasRef } = useBoardViewerCanvas({
    board,
    mode,
    fitPadding,
    extendBackground,
    viewport,
    initialViewport,
    onViewportChange,
    objectRenderers,
    overlayItems,
    overlayRenderers,
  });

  return (
    <div
      className={cn("relative min-h-0 w-full min-w-0 flex-1", frameClassName)}
    >
      <canvas
        aria-label="Board preview"
        className={cn(
          "block size-full overflow-hidden",
          mode === "interactive" &&
            "cursor-grab touch-none active:cursor-grabbing",
          className,
        )}
        ref={canvasRef}
      />
    </div>
  );
}
