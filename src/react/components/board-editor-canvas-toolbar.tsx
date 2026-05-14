import type { ComponentProps } from "react";
import { CornersOutIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import { useBoardEditorContext } from "./board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarButton,
} from "./board-editor-toolbar";
import { cn } from "./misc";
import {
  getViewportForZoomAtCanvasPoint,
  getViewportToFitSurface,
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
    <div
      className={cn(
        "pointer-events-none absolute right-4 bottom-4 flex items-center gap-2",
        className,
      )}
    >
      <BoardEditorToolbar className="pointer-events-auto gap-0 rounded-full p-0">
        <BoardEditorCanvasToolbarButton
          aria-label="Zoom out"
          className="rounded-none rounded-l-full"
          iconBefore={
            <MinusIcon aria-hidden="true" className="size-4" weight="bold" />
          }
          iconSize="sm"
          onClick={() =>
            zoomAroundCanvasCenter(viewport.zoom / VIEWPORT_ZOOM_STEP_FACTOR)
          }
          size="sm"
          tooltip="Zoom out"
        />
        <BoardEditorCanvasToolbarButton
          aria-label="Zoom in"
          className="rounded-none rounded-r-full border-l"
          iconBefore={
            <PlusIcon aria-hidden="true" className="size-4" weight="bold" />
          }
          iconSize="sm"
          onClick={() =>
            zoomAroundCanvasCenter(viewport.zoom * VIEWPORT_ZOOM_STEP_FACTOR)
          }
          size="sm"
          tooltip="Zoom in"
        />
      </BoardEditorToolbar>
      <BoardEditorToolbar className="pointer-events-auto gap-0 rounded-full p-0">
        <BoardEditorCanvasToolbarButton
          aria-label="Fit to view"
          className="rounded-full"
          iconBefore={
            <CornersOutIcon
              aria-hidden="true"
              className="size-4"
              weight="bold"
            />
          }
          iconSize="sm"
          onClick={() =>
            actions.setViewport(
              canvasRect
                ? getViewportToFitSurface({
                    surface,
                    canvasRect,
                  })
                : { pan: { x: 0, y: 0 }, zoom: 1 },
            )
          }
          size="sm"
          tooltip="Fit to view"
        />
      </BoardEditorToolbar>
    </div>
  );
}

type BoardEditorCanvasToolbarButtonProps = Omit<
  ComponentProps<typeof BoardEditorToolbarButton>,
  "active"
>;

function BoardEditorCanvasToolbarButton({
  className,
  ...props
}: BoardEditorCanvasToolbarButtonProps) {
  return (
    <BoardEditorToolbarButton
      className={cn("min-w-8 px-0", className)}
      variant="ghost"
      {...props}
    />
  );
}
