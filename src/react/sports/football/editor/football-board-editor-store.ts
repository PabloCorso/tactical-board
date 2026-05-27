import type { Board } from "../../../../core/board/types";
import type { BoardEditorState } from "../../../../core/editor/types";
import { createBoardEditorStore } from "../../../../core/store/board-editor-store";
import { SELECT_TOOL_ID } from "../../../../core/tools/select-tool-state";
import { createFootballBoard } from "../board/football-board";
import { createFootballTools } from "../theme/football-tools";

export type CreateFootballBoardEditorStoreOptions = {
  navigationMode?: BoardEditorState["ui"]["navigationMode"];
};

export function createFootballBoardEditorStore(
  initialBoard: Board = createFootballBoard(),
  { navigationMode }: CreateFootballBoardEditorStoreOptions = {},
) {
  return createBoardEditorStore({
    initialBoard,
    initialToolId: SELECT_TOOL_ID,
    navigationMode,
    tools: createFootballTools(),
  });
}
