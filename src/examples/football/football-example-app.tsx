import { createBoardEditorStore } from "../../core/store/create-board-editor-store";
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorProvider,
} from "../../react/components/board-editor";
import { BoardEditorToolControl } from "../../react/components/board-editor-tool-control";
import { BoardEditorToolbar } from "../../react/components/board-editor-toolbar";
import { handTool } from "../../tools/hand-tool";
import { selectTool } from "../../tools/select-tool";
import { footballBoardExample } from "./football-board-example";

const store = createBoardEditorStore({
  initialBoard: footballBoardExample,
  initialToolId: "select",
  tools: [selectTool, handTool],
});

export function FootballExampleApp() {
  return (
    <BoardEditorProvider store={store}>
      <BoardEditor className="relative h-dvh w-full overflow-hidden p-4">
        <BoardEditorCanvas />
        <BoardEditorToolbar className="absolute inset-x-4 bottom-4 mx-auto">
          <BoardEditorToolControl toolId="select" />
          <BoardEditorToolControl toolId="hand" />
        </BoardEditorToolbar>
      </BoardEditor>
    </BoardEditorProvider>
  );
}
