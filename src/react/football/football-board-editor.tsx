import { useMemo } from "react";
import type { Board } from "../../core/board/types";
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
import { SELECT_TOOL_ID } from "../../core/tools/select-tool-state";
import { createFootballBoard } from "./football-board";
import { FootballPrimaryToolbar } from "./football-primary-toolbar";
import { FootballSecondaryToolbar } from "./football-secondary-toolbar";
import { createFootballTools } from "./football-tools";

export type FootballBoardEditorProps = {
  className?: string;
  initialBoard?: Board;
  store?: BoardEditorStore;
};

export function createFootballBoardEditorStore(
  initialBoard: Board = createFootballBoard(),
) {
  return createBoardEditorStore({
    initialBoard,
    initialToolId: SELECT_TOOL_ID,
    tools: createFootballTools(),
  });
}

export function FootballBoardEditor({
  className = "relative h-dvh w-full overflow-hidden",
  initialBoard,
  store: providedStore,
}: FootballBoardEditorProps = {}) {
  const store = useMemo(
    () =>
      providedStore ??
      createFootballBoardEditorStore(initialBoard ?? createFootballBoard()),
    [initialBoard, providedStore],
  );

  return (
    <BoardEditorProvider store={store}>
      <BoardEditor className={className}>
        <BoardEditorCanvas />
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
