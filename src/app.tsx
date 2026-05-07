import { createBoardEditorStore } from "./core/store/create-board-editor-store";
import { footballBoardExample } from "./examples/football/football-board-example";
import { handTool } from "./presets/tools/hand-tool";
import { selectTool } from "./presets/tools/select-tool";
import { BoardEditor } from "./react/components/board-editor";

const store = createBoardEditorStore({
  initialBoard: footballBoardExample,
  initialToolId: "select",
  tools: [selectTool, handTool],
});

export default function App() {
  return <BoardEditor store={store} />;
}
