import { createBoardEditorStore } from "./core/store/create-board-editor-store";
import { footballBoardExample } from "./examples/football/football-board-example";
import { BoardEditor } from "./react/components/board-editor";
import { handTool } from "./tools/hand-tool";
import { selectTool } from "./tools/select-tool";

const store = createBoardEditorStore({
  initialBoard: footballBoardExample,
  initialToolId: "select",
  tools: [selectTool, handTool],
});

export default function App() {
  return <BoardEditor store={store} />;
}
