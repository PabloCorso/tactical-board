import type { Board, BoardObjectBase } from "../board/types";
import type { ParseBoardResult } from "./types";

export function serializeBoard<TObject extends BoardObjectBase>(
  board: Board<TObject>,
): string {
  return JSON.stringify(board, null, 2);
}

export function parseBoard<TObject extends BoardObjectBase>(
  input: string,
): ParseBoardResult<TObject> {
  try {
    const parsed = JSON.parse(input) as Board<TObject>;
    return {
      ok: true,
      board: parsed,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown parse error",
    };
  }
}
