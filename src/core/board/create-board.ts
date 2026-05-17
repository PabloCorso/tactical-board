import type { Board, Document } from "./types";

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
  return createDocument(input) as Board;
}
