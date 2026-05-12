import {
  CornersOutIcon,
  MinusIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { useMemo } from "react";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import { useBoardEditorContext } from "./board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarButton,
} from "./board-editor-toolbar";
import { cn } from "./misc";
import {
  DEFAULT_VIEWPORT,
  getViewportForZoomAtCanvasPoint,
  VIEWPORT_ZOOM_STEP_FACTOR,
} from "../../core/editor/viewport-utils";

export type BoardEditorCanvasToolbarProps = {
  className?: string;
};

export function BoardEditorCanvasToolbar({
  className,
}: BoardEditorCanvasToolbarProps) {
  const store = useBoardEditorContext();
  const viewport = useBoardEditorStore(store, (state) => state.ui.viewport);
  const canvasRect = useBoardEditorStore(store, (state) => state.ui.canvasRect);
  const surface = useBoardEditorStore(store, (state) => state.board.surface);
  const actions = useBoardEditorStore(store, (state) => state.actions);

  const zoomLabel = useMemo(
    () => `${Math.round(viewport.zoom * 100)}%`,
    [viewport.zoom],
  );

  const zoomAroundCanvasCenter = (nextZoom: number) => {
    if (!canvasRect) {
      actions.setViewport({
        ...viewport,
        zoom: nextZoom,
      });
      return;
    }

    actions.setViewport(
      getViewportForZoomAtCanvasPoint({
        surface,
        viewport,
        canvasRect,
        anchorCanvasPoint: {
          x: canvasRect.width / 2,
          y: canvasRect.height / 2,
        },
        zoom: nextZoom,
      }),
    );
  };

  return (
    <div className={cn("pointer-events-none absolute bottom-4 right-4", className)}>
      <BoardEditorToolbar className="pointer-events-auto gap-1 p-1.5">
        <BoardEditorToolbarButton
          aria-label="Zoom out"
          iconBefore={<MinusIcon aria-hidden="true" className="size-4" weight="bold" />}
          onClick={() =>
            zoomAroundCanvasCenter(viewport.zoom / VIEWPORT_ZOOM_STEP_FACTOR)
          }
          tooltip="Zoom out"
        />
        <div className="min-w-14 px-1 text-center text-xs font-medium tabular-nums text-primary/70">
          {zoomLabel}
        </div>
        <BoardEditorToolbarButton
          aria-label="Zoom in"
          iconBefore={<PlusIcon aria-hidden="true" className="size-4" weight="bold" />}
          onClick={() =>
            zoomAroundCanvasCenter(viewport.zoom * VIEWPORT_ZOOM_STEP_FACTOR)
          }
          tooltip="Zoom in"
        />
        <BoardEditorToolbarButton
          aria-label="Fit to view"
          iconBefore={
            <CornersOutIcon
              aria-hidden="true"
              className="size-4"
              weight="bold"
            />
          }
          onClick={() => actions.setViewport(DEFAULT_VIEWPORT)}
          tooltip="Fit to view"
        />
      </BoardEditorToolbar>
    </div>
  );
}
