import { useStore } from "zustand";
import type { BoardEditorState } from "../../core/editor/types";
import type { BoardEditorStore } from "../../core/store/create-board-editor-store";

export function useBoardEditorStore<T>(
  store: BoardEditorStore,
  selector: (state: BoardEditorState) => T,
): T {
  return useStore(store, selector);
}
