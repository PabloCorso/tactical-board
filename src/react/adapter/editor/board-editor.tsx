import {
  type CSSProperties,
  type PropsWithChildren,
  type ReactNode,
  useMemo,
  useRef,
} from "react";
import type { BoardEditorStore } from "../../../core/store/board-editor-store";
import { createToolApi } from "../../../core/editor/create-tool-api";
import {
  TEXT_FONT_FAMILY,
  TEXT_HORIZONTAL_PADDING_PX,
  TEXT_LINE_HEIGHT_RATIO,
} from "../../../core/objects/text-object";
import { useBoardEditorCanvas } from "./use-board-editor-canvas";
import { useBoardEditorStore } from "./use-board-editor-store";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";
import {
  finishTextEditingSession,
  getTextEditorOverlayState,
  updateActiveTextEditingText,
} from "../../../core/tools/text-editing";
import type { AssetResolver } from "../../../core/rendering/canvas/types";
import { TEXT_TOOL_ID } from "../../../core/tools/text-tool-state";
import {
  BoardEditorContext,
  useBoardEditorContext,
} from "./board-editor-context";
import {
  BoardEditorLabelsProvider,
  useBoardEditorLabels,
  type BoardEditorLabelOverrides,
} from "../../board/editor/board-editor-labels";
import { cn } from "../../ui/misc";
export { BoardEditorCanvasToolbar } from "../../board/editor/canvas-toolbar";
export { BoardEditorShapePolygonDone } from "../../board/editor/shape-polygon-done";

export type BoardEditorProps = {
  children?: ReactNode;
  className?: string;
};

export type BoardEditorProviderProps = PropsWithChildren & {
  labels?: BoardEditorLabelOverrides;
  store: BoardEditorStore;
};

export type BoardEditorCanvasProps = {
  assetResolver?: AssetResolver;
  className?: string;
  extendBackground?: boolean;
  frameClassName?: string;
};

export function BoardEditorProvider({
  children,
  labels,
  store,
}: BoardEditorProviderProps) {
  return (
    <BoardEditorContext.Provider value={store}>
      <BoardEditorLabelsProvider labels={labels}>
        {children}
      </BoardEditorLabelsProvider>
    </BoardEditorContext.Provider>
  );
}

export function BoardEditor({ children, className }: BoardEditorProps) {
  return (
    <div
      data-board-editor-root
      data-tactical-board
      className={cn(
        "flex min-h-full w-full min-w-0 flex-1 flex-col",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BoardEditorCanvas({
  assetResolver,
  className,
  extendBackground,
  frameClassName,
}: BoardEditorCanvasProps) {
  const store = useBoardEditorContext();
  const { canvasRef } = useBoardEditorCanvas({
    assetResolver,
    extendBackground,
    store,
  });
  const activeToolId = useBoardEditorStore(
    store,
    (state) => state.ui.activeToolId,
  );

  return (
    <div
      className={cn("relative min-h-0 w-full min-w-0 flex-1", frameClassName)}
    >
      <canvas
        className={cn(
          "block size-full touch-none overflow-hidden outline-none",
          activeToolId === TEXT_TOOL_ID && "cursor-text",
          className,
        )}
        ref={canvasRef}
        tabIndex={0}
      />
      <BoardEditorTextEditorOverlay />
    </div>
  );
}

function BoardEditorTextEditorOverlay() {
  const store = useBoardEditorContext();
  const labels = useBoardEditorLabels();
  const toolApi = useMemo(() => createToolApi(store), [store]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const state = useBoardEditorStore(store, (currentState) => currentState);
  const overlayState = useMemo(() => getTextEditorOverlayState(state), [state]);
  const editingSession = overlayState?.session;

  useIsomorphicLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea || !editingSession) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      textarea.focus();
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [editingSession]);

  if (!overlayState) {
    return null;
  }

  const { anchorCanvasPoint, object, objectBounds, scale } = overlayState;
  const horizontalPadding = TEXT_HORIZONTAL_PADDING_PX * scale;
  const contentWidth = Math.max(1, objectBounds.width - horizontalPadding);
  const contentHeight = Math.max(1, objectBounds.height);
  const style: CSSProperties = {
    left: anchorCanvasPoint.x,
    top: anchorCanvasPoint.y,
    width: contentWidth,
    minWidth: contentWidth,
    height: contentHeight,
    padding: 0,
    color: "transparent",
    caretColor: object.props.color,
    fontSize: `${object.props.fontSize * scale}px`,
    lineHeight: String(TEXT_LINE_HEIGHT_RATIO),
    fontFamily: TEXT_FONT_FAMILY,
    letterSpacing: "0px",
    boxSizing: "content-box",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    appearance: "none",
    WebkitTextFillColor: "transparent",
  };

  return (
    <textarea
      ref={textareaRef}
      aria-label={labels.textEditor.ariaLabel}
      className="absolute z-20 m-0 resize-none overflow-hidden border-0 bg-transparent p-0 font-normal outline-none"
      onBlur={() => finishTextEditingSession(toolApi)}
      onChange={(event) =>
        updateActiveTextEditingText(toolApi, event.target.value)
      }
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          finishTextEditingSession(toolApi);
        }
      }}
      rows={Math.max(1, object.props.text.split("\n").length)}
      spellCheck={false}
      style={style}
      value={object.props.text}
    />
  );
}
