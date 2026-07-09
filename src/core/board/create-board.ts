import type { Board, Document } from "./types";
import { normalizeBoardPlayerGroups } from "./player-groups";

export function createDocument(input: Document): Document {
  return {
    ...input,
    metadata: input.metadata ?? {},
    style: input.style ?? {},
    objects: {
      byId: { ...input.objects.byId },
      order: [...input.objects.order],
    },
  };
}

// Compatibility helper kept for Board-facing callers.
// Prefer createDocument for new core Editor Engine code.
export function createBoard(input: Board): Board {
  const board = createDocument(input) as Board;

  return {
    ...board,
    playerGroups: normalizeBoardPlayerGroups(board.playerGroups),
  };
}
