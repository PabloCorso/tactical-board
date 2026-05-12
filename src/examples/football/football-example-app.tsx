import { createBoardEditorStore } from "../../core/store/board-editor-store";
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorProvider,
} from "../../react/components/board-editor";
import { BoardEditorSelectionToolbar } from "../../react/components/board-editor-selection-toolbar";
import { BoardEditorSecondaryToolbar } from "../../react/components/board-editor-secondary-toolbar";
import { BoardEditorToolControl } from "../../react/components/board-editor-tool-control";
import { BoardEditorToolbar } from "../../react/components/board-editor-toolbar";
import { createArrowTool } from "../../tools/arrow-tool";
import { handTool } from "../../tools/hand-tool";
import { selectTool } from "../../tools/select-tool";
import { footballBoardExample } from "./football-board-example";

const footballArrowTool = createArrowTool({
  presets: [
    {
      id: "run",
      label: "Run",
      iconId: "arrow-straight-solid",
      draftStyle: {
        color: "black",
        strokeWidth: 0.4,
        lineStyle: "solid",
        bodyStyle: "straight",
        startHead: "none",
        endHead: "triangle",
      },
    },
    {
      id: "dribble",
      label: "Dribble",
      iconId: "arrow-wavy",
      draftStyle: {
        color: "black",
        strokeWidth: 0.4,
        lineStyle: "solid",
        bodyStyle: "wavy",
        startHead: "none",
        endHead: "triangle",
      },
    },
    {
      id: "pass",
      label: "Pass",
      iconId: "arrow-straight-dashed",
      draftStyle: {
        color: "black",
        strokeWidth: 0.4,
        lineStyle: "dashed",
        bodyStyle: "straight",
        startHead: "none",
        endHead: "triangle",
      },
    },
    {
      id: "long-pass",
      label: "Long pass",
      iconId: "arrow-curved-dashed",
      draftStyle: {
        color: "black",
        strokeWidth: 0.4,
        lineStyle: "dashed",
        bodyStyle: "curved",
        startHead: "none",
        endHead: "triangle",
      },
    },
  ],
});

const store = createBoardEditorStore({
  initialBoard: footballBoardExample,
  initialToolId: selectTool.id,
  tools: [selectTool, footballArrowTool, handTool],
});

export function FootballExampleApp() {
  return (
    <BoardEditorProvider store={store}>
      <BoardEditor className="relative h-dvh w-full overflow-hidden p-4">
        <BoardEditorCanvas />
        <BoardEditorSelectionToolbar />
        <div className="pointer-events-none absolute inset-y-4 left-4 flex items-center">
          <div className="pointer-events-auto flex items-center gap-3">
            <BoardEditorToolbar className="flex-col">
              <BoardEditorToolControl toolId="select" />
              <BoardEditorToolControl toolId="hand" />
              <BoardEditorToolControl toolId="arrow" />
            </BoardEditorToolbar>
            <BoardEditorSecondaryToolbar className="flex-col" />
          </div>
        </div>
      </BoardEditor>
    </BoardEditorProvider>
  );
}
