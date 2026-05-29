import type { ComponentProps } from "react";
import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  CornersOutIcon,
  MinusIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarButton,
} from "./toolbar/editor-toolbar";
import { cn } from "../../ui/misc";
import {
  getViewportForZoomAtCanvasPoint,
  getViewportFrame,
  getViewportToFitBoard,
  VIEWPORT_ZOOM_STEP_FACTOR,
} from "../../../core/editor/viewport-utils";

export type BoardEditorCanvasToolbarProps = {
  className?: string;
};

export function BoardEditorCanvasToolbar({
  className,
}: BoardEditorCanvasToolbarProps) {
  const store = useBoardEditorContext();
  const viewport = useBoardEditorStore(store, (state) => state.ui.viewport);
  const fitPadding = useBoardEditorStore(store, (state) => state.ui.fitPadding);
  const navigationMode = useBoardEditorStore(
    store,
    (state) => state.ui.navigationMode,
  );
  const canvasRect = useBoardEditorStore(store, (state) => state.ui.canvasRect);
  const board = useBoardEditorStore(store, (state) => state.board);
  const frame = useBoardEditorStore(store, (state) => state.board.frame);
  const history = useBoardEditorStore(store, (state) => state.history);
  const actions = useBoardEditorStore(store, (state) => state.actions);
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  const resolvedFitPadding =
    typeof fitPadding === "function" ? fitPadding(frame) : fitPadding;

  const zoomAroundCanvasCenter = (nextZoom: number) => {
    if (!canvasRect) {
      actions.setViewport({
        ...viewport,
        zoom: nextZoom,
      });
      return;
    }

    actions.setViewport(
      (() => {
        const viewportFrame = getViewportFrame({
          canvasRect,
          fitPadding: resolvedFitPadding,
        });
        return getViewportForZoomAtCanvasPoint({
          frame,
          viewport,
          canvasRect,
          anchorCanvasPoint: {
            x: viewportFrame.x + viewportFrame.width / 2,
            y: viewportFrame.y + viewportFrame.height / 2,
          },
          zoom: nextZoom,
          minZoom: navigationMode === "contained" ? 0 : undefined,
          fitPadding: resolvedFitPadding,
        });
      })(),
    );
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute right-2 bottom-2 flex items-center gap-2",
        className,
      )}
    >
      <BoardEditorToolbar
        className="pointer-events-auto gap-0 rounded-full p-0"
        contentClassName="gap-0 p-0"
      >
        <BoardEditorCanvasToolbarButton
          aria-label="Undo"
          className="rounded-none rounded-l-full"
          disabled={!canUndo}
          iconBefore={
            <ArrowCounterClockwiseIcon
              aria-hidden="true"
              className="size-4"
              weight="bold"
            />
          }
          iconSize="sm"
          onClick={() => actions.undo()}
          size="sm"
          tooltip="Undo"
        />
        <BoardEditorCanvasToolbarButton
          aria-label="Redo"
          className="border-tb-border-default rounded-none rounded-r-full border-l"
          disabled={!canRedo}
          iconBefore={
            <ArrowClockwiseIcon
              aria-hidden="true"
              className="size-4"
              weight="bold"
            />
          }
          iconSize="sm"
          onClick={() => actions.redo()}
          size="sm"
          tooltip="Redo"
        />
      </BoardEditorToolbar>
      <BoardEditorToolbar
        className="pointer-events-auto gap-0 rounded-full p-0"
        contentClassName="gap-0 p-0"
      >
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
          className="border-tb-border-default rounded-none rounded-r-full border-l"
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
      <BoardEditorToolbar
        className="pointer-events-auto gap-0 rounded-full p-0"
        contentClassName="gap-0 p-0"
      >
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
                ? getViewportToFitBoard({
                    board,
                    canvasRect,
                    fitPadding: resolvedFitPadding,
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
      className={cn("min-w-8 border-0 px-0", className)}
      variant="ghost"
      {...props}
    />
  );
}
