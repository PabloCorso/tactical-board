import type { Board } from "../board/types";
import type { ParseBoardResult } from "./types";

export function serializeBoard(board: Board): string {
  return JSON.stringify(board, null, 2);
}

export function parseBoard(input: string): ParseBoardResult {
  try {
    const parsed = JSON.parse(input) as Board;
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
