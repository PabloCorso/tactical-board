import type { Board, ObjectId } from "../board/types";
import type {
  BoardEditorHistoryEntry,
  BoardEditorHistoryState,
  BoardEditorSelectionState,
  BoardEditorState,
} from "./types";

const MAX_HISTORY_ENTRIES = 100;

type DocumentState = Pick<BoardEditorState, "board" | "history" | "selection">;

export type DocumentTransactionResult = DocumentState;

function createHistoryEntry(state: DocumentState): BoardEditorHistoryEntry {
  return {
    board: state.board,
    selectedObjectIds: state.selection.selectedObjectIds,
  };
}

function pushHistoryEntry(
  history: BoardEditorHistoryEntry[],
  entry: BoardEditorHistoryEntry,
) {
  if (history.length >= MAX_HISTORY_ENTRIES) {
    return [...history.slice(1), entry];
  }

  return [...history, entry];
}

/** Keeps Object identity and ordering aligned, treating byId keys as canonical. */
export function normalizeDocument(document: Board): Board {
  const { objects } = document;
  let byId = objects.byId;

  for (const [objectId, object] of Object.entries(objects.byId)) {
    if (object.id === objectId) {
      continue;
    }

    if (byId === objects.byId) {
      byId = { ...objects.byId };
    }
    byId[objectId] = { ...object, id: objectId };
  }

  const seen = new Set<ObjectId>();
  const order = objects.order.filter((objectId) => {
    if (!byId[objectId] || seen.has(objectId)) {
      return false;
    }

    seen.add(objectId);
    return true;
  });

  for (const objectId of Object.keys(byId)) {
    if (!seen.has(objectId)) {
      order.push(objectId);
    }
  }

  const orderChanged =
    order.length !== objects.order.length ||
    order.some((objectId, index) => objectId !== objects.order[index]);

  if (byId === objects.byId && !orderChanged) {
    return document;
  }

  return {
    ...document,
    objects: {
      ...objects,
      byId,
      order,
    },
  };
}

export function reconcileDocumentSelection(
  document: Board,
  objectIds: ObjectId[],
): BoardEditorSelectionState {
  const seen = new Set<ObjectId>();

  return {
    selectedObjectIds: objectIds.filter((objectId) => {
      if (!document.objects.byId[objectId] || seen.has(objectId)) {
        return false;
      }

      seen.add(objectId);
      return true;
    }),
  };
}

function selectionsEqual(
  a: BoardEditorSelectionState,
  b: BoardEditorSelectionState,
) {
  return (
    a.selectedObjectIds.length === b.selectedObjectIds.length &&
    a.selectedObjectIds.every(
      (objectId, index) => objectId === b.selectedObjectIds[index],
    )
  );
}

export function createDocumentTransaction() {
  let historyBatchDepth = 0;
  let hasRecordedHistoryForActiveBatch = false;

  const resetHistoryBatch = () => {
    historyBatchDepth = 0;
    hasRecordedHistoryForActiveBatch = false;
  };

  const recordHistory = (state: DocumentState): BoardEditorHistoryState => {
    if (historyBatchDepth > 0 && hasRecordedHistoryForActiveBatch) {
      return { ...state.history, future: [] };
    }

    if (historyBatchDepth > 0) {
      hasRecordedHistoryForActiveBatch = true;
    }

    return {
      past: pushHistoryEntry(state.history.past, createHistoryEntry(state)),
      future: [],
    };
  };

  return {
    beginHistoryBatch: () => {
      historyBatchDepth += 1;
    },
    endHistoryBatch: () => {
      historyBatchDepth = Math.max(0, historyBatchDepth - 1);

      if (historyBatchDepth === 0) {
        hasRecordedHistoryForActiveBatch = false;
      }
    },
    commit: (
      state: DocumentState,
      update: (document: Board) => Board,
    ): DocumentTransactionResult | undefined => {
      const board = normalizeDocument(update(state.board));
      const selection = reconcileDocumentSelection(
        board,
        state.selection.selectedObjectIds,
      );

      if (board === state.board) {
        return selectionsEqual(selection, state.selection)
          ? undefined
          : { ...state, selection };
      }

      return {
        board,
        selection,
        history: recordHistory(state),
      };
    },
    undo: (state: DocumentState): DocumentTransactionResult | undefined => {
      resetHistoryBatch();
      const previousEntry = state.history.past.at(-1);

      if (!previousEntry) {
        return undefined;
      }

      const board = normalizeDocument(previousEntry.board);

      return {
        board,
        selection: reconcileDocumentSelection(
          board,
          previousEntry.selectedObjectIds,
        ),
        history: {
          past: state.history.past.slice(0, -1),
          future: [createHistoryEntry(state), ...state.history.future],
        },
      };
    },
    redo: (state: DocumentState): DocumentTransactionResult | undefined => {
      resetHistoryBatch();
      const nextEntry = state.history.future[0];

      if (!nextEntry) {
        return undefined;
      }

      const board = normalizeDocument(nextEntry.board);

      return {
        board,
        selection: reconcileDocumentSelection(
          board,
          nextEntry.selectedObjectIds,
        ),
        history: {
          past: pushHistoryEntry(state.history.past, createHistoryEntry(state)),
          future: state.history.future.slice(1),
        },
      };
    },
  };
}
