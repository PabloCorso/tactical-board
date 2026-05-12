import type { Board } from "./types";

export function createBoard(input: Board): Board {
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
