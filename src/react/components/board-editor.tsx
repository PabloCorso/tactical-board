import {
  type CSSProperties,
  type PropsWithChildren,
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import type { BoardEditorStore } from "../../core/store/board-editor-store";
import { createToolApi } from "../../core/editor/create-tool-api";
import {
  TEXT_FONT_FAMILY,
  TEXT_HORIZONTAL_PADDING_PX,
  TEXT_LINE_HEIGHT_RATIO,
  TEXT_VERTICAL_PADDING_PX,
  isTextObjectEmpty,
  type TextObject,
} from "../../core/objects/text-object";
import { useBoardEditorCanvas } from "../hooks/use-board-editor-canvas";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import { setSelectedObjectIds } from "../../tools/select-tool-actions";
import {
  createTextToolProjection,
  updateAnchoredTextObject,
} from "../../tools/text-layout";
import { getTextToolState, TEXT_TOOL_ID } from "../../tools/text-tool-state";
import {
  BoardEditorContext,
  useBoardEditorContext,
} from "./board-editor-context";
import { cn } from "./misc";
export { BoardEditorCanvasToolbar } from "./board-editor-canvas-toolbar";
export { BoardEditorShapePolygonDone } from "./board-editor-shape-polygon-done";

export type BoardEditorProps = {
  children?: ReactNode;
  className?: string;
};

export type BoardEditorProviderProps = PropsWithChildren & {
  store: BoardEditorStore;
};

export type BoardEditorCanvasProps = {
  className?: string;
  frameClassName?: string;
};

export function BoardEditorProvider({
  store,
  children,
}: BoardEditorProviderProps) {
  return (
    <BoardEditorContext.Provider value={store}>
      {children}
    </BoardEditorContext.Provider>
  );
}

export function BoardEditor({ children, className }: BoardEditorProps) {
  return (
    <div
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
  className,
  frameClassName,
}: BoardEditorCanvasProps) {
  const store = useBoardEditorContext();
  const { canvasRef } = useBoardEditorCanvas({ store });
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
          "block size-full touch-none overflow-hidden",
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
  const toolApi = useMemo(() => createToolApi(store), [store]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const state = useBoardEditorStore(store, (currentState) => currentState);
  const textState = getTextToolState(state.toolState);
  const editingSession = textState.editingSession;
  const object =
    editingSession &&
    state.board.objects.byId[editingSession.objectId]?.type === "text"
      ? (state.board.objects.byId[editingSession.objectId] as TextObject)
      : undefined;

  useLayoutEffect(() => {
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

  if (!editingSession || !object || !state.ui.canvasRect) {
    return null;
  }

  const projection = createTextToolProjection(state, state.ui.canvasRect);
  const anchorCanvasPoint = projection.worldToCanvas(
    editingSession.anchorPosition,
  );
  const objectBounds = projection.getObjectCanvasBounds(object);
  const scale = projection.pixelsPerUnit / object.props.referencePixelsPerUnit;
  const horizontalPadding = TEXT_HORIZONTAL_PADDING_PX * scale;
  const verticalPadding = TEXT_VERTICAL_PADDING_PX * scale;
  const contentWidth = Math.max(1, objectBounds.width - horizontalPadding);
  const contentHeight = Math.max(1, objectBounds.height - verticalPadding);
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
      aria-label="Text editor"
      className="absolute z-20 m-0 resize-none overflow-hidden border-0 bg-transparent p-0 font-normal outline-none"
      onBlur={() => {
        const nextState = toolApi.getState();
        const nextTextState = getTextToolState(nextState.toolState);
        const nextEditingSession = nextTextState.editingSession;

        if (!nextEditingSession) {
          return;
        }

        const nextObject =
          nextState.board.objects.byId[nextEditingSession.objectId];
        if (
          nextObject?.type === "text" &&
          isTextObjectEmpty(nextObject as TextObject)
        ) {
          toolApi.deleteObjects([nextEditingSession.objectId]);
          setSelectedObjectIds(toolApi, []);
        }

        toolApi.setToolState(TEXT_TOOL_ID, {
          ...nextTextState,
          editingSession: undefined,
        });
      }}
      onChange={(event) => {
        const nextState = toolApi.getState();
        const nextTextState = getTextToolState(nextState.toolState);
        const nextEditingSession = nextTextState.editingSession;
        const nextObject = nextEditingSession
          ? nextState.board.objects.byId[nextEditingSession.objectId]
          : undefined;
        const canvasRect = nextState.ui.canvasRect;

        if (
          !nextEditingSession ||
          !nextObject ||
          nextObject.type !== "text" ||
          !canvasRect
        ) {
          return;
        }

        toolApi.updateObjects([nextObject.id], (currentObject) =>
          updateAnchoredTextObject(
            currentObject as TextObject,
            { text: event.target.value },
            nextEditingSession.anchorPosition,
            nextState,
            canvasRect,
          ),
        );
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      rows={Math.max(1, object.props.text.split("\n").length)}
      spellCheck={false}
      style={style}
      value={object.props.text}
    />
  );
}
