import { createBoardEditorStore } from "../../core/store/board-editor-store";
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorProvider,
} from "../../react/components/board-editor";
import { BoardEditorSecondaryToolbar } from "../../react/components/board-editor-secondary-toolbar";
import { BoardEditorToolControl } from "../../react/components/board-editor-tool-control";
import { BoardEditorToolbar } from "../../react/components/board-editor-toolbar";
import { handTool } from "../../tools/hand-tool";
import { selectTool } from "../../tools/select-tool";
import { footballBoardExample } from "./football-board-example";

const store = createBoardEditorStore({
  initialBoard: footballBoardExample,
  initialToolId: selectTool.id,
  tools: [selectTool, handTool],
});

export function FootballExampleApp() {
  return (
    <BoardEditorProvider store={store}>
      <BoardEditor className="relative h-dvh w-full overflow-hidden p-4">
        <BoardEditorCanvas />
        <div className="pointer-events-none absolute inset-y-4 left-4 flex items-center">
          <div className="pointer-events-auto flex items-center gap-3">
            <BoardEditorToolbar className="flex-col">
              <BoardEditorToolControl toolId="select" />
              <BoardEditorToolControl toolId="hand" />
            </BoardEditorToolbar>
            <BoardEditorSecondaryToolbar className="flex-col" />
          </div>
        </div>
      </BoardEditor>
    </BoardEditorProvider>
  );
}
