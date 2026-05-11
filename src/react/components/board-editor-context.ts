import { createContext, useContext } from "react";
import type { BoardEditorStore } from "../../core/store/board-editor-store";

export const BoardEditorContext = createContext<BoardEditorStore | null>(null);

export function useBoardEditorContext() {
  const store = useContext(BoardEditorContext);

  if (!store) {
    throw new Error(
      "BoardEditor components must be rendered inside <BoardEditorProvider />.",
    );
  }

  return store;
}
