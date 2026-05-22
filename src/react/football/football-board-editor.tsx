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
import { BoardEditorToolControl } from "../components/board-editor-tool-control";
import { BoardEditorToolbar } from "../components/board-editor-toolbar";
import { SELECT_TOOL_ID } from "../../core/tools/select-tool-state";
import { createFootballBoard } from "./football-board";
import { FootballSecondaryToolbar } from "./football-secondary-toolbar";
import {
  FootballArrowToolIcon,
  FootballEquipmentToolIcon,
  FootballPlayerToolIcon,
  FootballShapeToolIcon,
} from "./football-tool-icons";
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
        <div className="pointer-events-none absolute inset-y-4 left-4 flex items-center">
          <div className="pointer-events-auto flex items-center gap-3">
            <BoardEditorToolbar className="flex-col">
              <BoardEditorToolControl toolId="select" />
              <BoardEditorToolControl toolId="hand" />
              <BoardEditorToolControl
                toolId="player"
                icon={<FootballPlayerToolIcon />}
              />
              <BoardEditorToolControl
                toolId="equipment"
                icon={<FootballEquipmentToolIcon />}
              />
              <BoardEditorToolControl toolId="text" />
              <BoardEditorToolControl
                toolId="arrow"
                icon={<FootballArrowToolIcon />}
              />
              <BoardEditorToolControl
                toolId="shape"
                icon={<FootballShapeToolIcon />}
              />
            </BoardEditorToolbar>
            <FootballSecondaryToolbar className="flex-col" />
          </div>
        </div>
      </BoardEditor>
    </BoardEditorProvider>
  );
}
