import { createContext, useContext } from "react";
import type { BoardEditorStore } from "../../../core/store/board-editor-store";
import type { BoardEditorInstance } from "./board-editor-instance";

export const BoardEditorContext = createContext<BoardEditorStore | null>(null);
export const BoardEditorInstanceContext =
  createContext<BoardEditorInstance | null>(null);

export function useBoardEditorContext() {
  const store = useContext(BoardEditorContext);

  if (!store) {
    throw new Error(
      "BoardEditor components must be rendered inside <BoardEditorProvider />.",
    );
  }

  return store;
}

export function useBoardEditorInstance() {
  const editor = useContext(BoardEditorInstanceContext);

  if (!editor) {
    throw new Error(
      "useBoardEditorInstance must be used within <BoardEditorProvider />.",
    );
  }

  return editor;
}
