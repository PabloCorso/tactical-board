import type { Board, BoardObjectBase } from "./types";

export function createBoard<TObject extends BoardObjectBase>(
  input: Board<TObject>,
): Board<TObject> {
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
