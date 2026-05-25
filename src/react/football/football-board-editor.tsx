import { useMemo } from "react";
import type { Board } from "../../core/board/types";
import type { BoardEditorState } from "../../core/editor/types";
import {
  createBoardEditorStore,
  type BoardEditorStore,
} from "../../core/store/board-editor-store";
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorCanvasToolbar,
  BoardEditorProvider,
  BoardEditorShapePolygonDone,
} from "../components/board-editor";
import { BoardEditorSelectionToolbar } from "../components/board-editor-selection-toolbar";
import { BoardEditorToolbarDock } from "../components/board-editor-toolbar";
import { cn } from "../components/misc";
import { SELECT_TOOL_ID } from "../../core/tools/select-tool-state";
import { createFootballBoard } from "./football-board";
import { FootballPrimaryToolbar } from "./football-primary-toolbar";
import { FootballSecondaryToolbar } from "./football-secondary-toolbar";
import { createFootballTools } from "./football-tools";

export type FootballBoardEditorProps = {
  className?: string;
  extendBackground?: boolean;
  initialBoard?: Board;
  store?: BoardEditorStore;
  fitPadding?: number;
  navigationMode?: BoardEditorState["ui"]["navigationMode"];
};

export type CreateFootballBoardEditorStoreOptions = {
  fitPadding?: number;
  navigationMode?: BoardEditorState["ui"]["navigationMode"];
};

export function createFootballBoardEditorStore(
  initialBoard: Board = createFootballBoard(),
  {
    fitPadding,
    navigationMode = "contained",
  }: CreateFootballBoardEditorStoreOptions = {},
) {
  return createBoardEditorStore({
    initialBoard,
    initialToolId: SELECT_TOOL_ID,
    fitPadding,
    navigationMode,
    tools: createFootballTools(),
  });
}

export function FootballBoardEditor({
  className,
  extendBackground,
  initialBoard,
  store: providedStore,
  fitPadding,
  navigationMode,
}: FootballBoardEditorProps = {}) {
  const store = useMemo(
    () =>
      providedStore ??
      createFootballBoardEditorStore(initialBoard ?? createFootballBoard(), {
        fitPadding,
        navigationMode,
      }),
    [initialBoard, providedStore, fitPadding, navigationMode],
  );

  return (
    <BoardEditorProvider store={store}>
      <BoardEditor
        className={cn("relative h-dvh w-full overflow-hidden", className)}
      >
        <BoardEditorCanvas extendBackground={extendBackground} />
        <BoardEditorShapePolygonDone />
        <BoardEditorCanvasToolbar />
        <BoardEditorSelectionToolbar />
        <BoardEditorToolbarDock>
          <FootballPrimaryToolbar />
          <FootballSecondaryToolbar />
        </BoardEditorToolbarDock>
      </BoardEditor>
    </BoardEditorProvider>
  );
}
