import { useStore } from "zustand";
import { useContext } from "react";
import type { BoardEditorState } from "../../../core/editor/types";
import type { BoardEditorStore } from "../../../core/store/board-editor-store";
import { BoardEditorContext } from "./board-editor-context";

export function useBoardEditorStore<T>(
  selector: (state: BoardEditorState) => T,
): T;
export function useBoardEditorStore<T>(
  store: BoardEditorStore,
  selector: (state: BoardEditorState) => T,
): T;
export function useBoardEditorStore<T>(
  storeOrSelector: BoardEditorStore | ((state: BoardEditorState) => T),
  explicitSelector?: (state: BoardEditorState) => T,
): T {
  const inheritedStore = useContext(BoardEditorContext);
  const usesInheritedStore = typeof storeOrSelector === "function";
  const store = usesInheritedStore ? inheritedStore : storeOrSelector;
  const selector = usesInheritedStore ? storeOrSelector : explicitSelector;

  if (!store || !selector) {
    throw new Error(
      "useBoardEditorStore(selector) must be used within <BoardEditorProvider />.",
    );
  }

  return useStore(store, selector);
}
