import { useRef } from "react";
import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  CornersOutIcon,
  FrameCornersIcon,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { useBoardEditorLabels } from "./board-editor-labels";
import {
  getViewportForZoomAtCanvasPoint,
  getViewportFrame,
  getViewportToFitBoard,
  getViewportZoomRangeToFitBoard,
  VIEWPORT_ZOOM_STEP_FACTOR,
} from "../../../core/editor/viewport-utils";

export type BoardEditorCanvasToolbarProps = {
  className?: string;
};

export function BoardEditorCanvasToolbar({
  className,
}: BoardEditorCanvasToolbarProps) {
  const labels = useBoardEditorLabels();
  const zoomToolbarAnchorRef = useRef<HTMLDivElement>(null);
  const store = useBoardEditorContext();
  const viewport = useBoardEditorStore(store, (state) => state.ui.viewport);
  const fitPadding = useBoardEditorStore(store, (state) => state.ui.fitPadding);
  const navigationMode = useBoardEditorStore(
    store,
    (state) => state.ui.navigationMode,
  );
  const zoomScaleLimits = useBoardEditorStore(
    store,
    (state) => state.ui.zoomScaleLimits,
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
  const fitViewport = canvasRect
    ? getViewportToFitBoard({
        board,
        canvasRect,
        fitPadding: resolvedFitPadding,
      })
    : { pan: { x: 0, y: 0 }, zoom: 1 };
  const zoomLevel = `${Math.round((viewport.zoom / fitViewport.zoom) * 100)}%`;

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
        const zoomRange = getViewportZoomRangeToFitBoard({
          board,
          canvasRect,
          fitPadding: resolvedFitPadding,
          zoomScaleLimits,
          constrainMinToFit: navigationMode === "contained",
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
          minZoom: zoomRange.minZoom,
          maxZoom: zoomRange.maxZoom,
          fitPadding: resolvedFitPadding,
        });
      })(),
    );
  };
  const enterFullScreen = () => {
    const fullScreenTarget =
      zoomToolbarAnchorRef.current?.closest("[data-board-editor-root]") ??
      zoomToolbarAnchorRef.current?.closest("[data-tactical-board]") ??
      (typeof document !== "undefined" ? document.documentElement : null);

    if (!fullScreenTarget?.requestFullscreen) {
      return;
    }

    void fullScreenTarget.requestFullscreen().catch(() => undefined);
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute right-2 bottom-2 flex items-center gap-2",
        className,
      )}
    >
      {canUndo || canRedo ? (
        <BoardEditorToolbar>
          <BoardEditorToolbarButton
            aria-label={labels.canvasToolbar.undo}
            disabled={!canUndo}
            iconBefore={
              <ArrowCounterClockwiseIcon aria-hidden="true" weight="bold" />
            }
            onClick={() => actions.undo()}
            tooltip={labels.canvasToolbar.undo}
          />
          <BoardEditorToolbarButton
            aria-label={labels.canvasToolbar.redo}
            disabled={!canRedo}
            iconBefore={<ArrowClockwiseIcon aria-hidden="true" weight="bold" />}
            onClick={() => actions.redo()}
            tooltip={labels.canvasToolbar.redo}
          />
        </BoardEditorToolbar>
      ) : null}
      <DropdownMenu modal={false}>
        <div ref={zoomToolbarAnchorRef} className="pointer-events-auto flex">
          <BoardEditorToolbar>
            <BoardEditorToolbarButton
              aria-label={labels.canvasToolbar.zoomOut}
              iconBefore={<MinusIcon aria-hidden="true" weight="bold" />}
              onClick={() =>
                zoomAroundCanvasCenter(
                  viewport.zoom / VIEWPORT_ZOOM_STEP_FACTOR,
                )
              }
              tooltip={labels.canvasToolbar.zoomOut}
            />
            <DropdownMenuTrigger>
              {(triggerProps) => (
                <BoardEditorToolbarButton
                  aria-label={labels.canvasToolbar.zoomLevel}
                  className="tabular-nums"
                  tooltip={labels.canvasToolbar.zoomLevel}
                  {...triggerProps}
                >
                  {zoomLevel}
                </BoardEditorToolbarButton>
              )}
            </DropdownMenuTrigger>
            <BoardEditorToolbarButton
              aria-label={labels.canvasToolbar.zoomIn}
              iconBefore={<PlusIcon aria-hidden="true" weight="bold" />}
              onClick={() =>
                zoomAroundCanvasCenter(
                  viewport.zoom * VIEWPORT_ZOOM_STEP_FACTOR,
                )
              }
              tooltip={labels.canvasToolbar.zoomIn}
            />
          </BoardEditorToolbar>
        </div>
        <DropdownMenuContent
          align="center"
          anchor={zoomToolbarAnchorRef}
          className="w-(--anchor-width)"
          side="top"
          sideOffset={8}
        >
          <DropdownMenuItem
            icon={<FrameCornersIcon aria-hidden="true" weight="bold" />}
            onClick={enterFullScreen}
          >
            {labels.canvasToolbar.enterFullScreen}
          </DropdownMenuItem>
          <DropdownMenuItem
            icon={<CornersOutIcon aria-hidden="true" weight="bold" />}
            onClick={() => actions.setViewport(fitViewport)}
          >
            {labels.canvasToolbar.fitToView}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
