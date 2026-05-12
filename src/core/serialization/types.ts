import type { Board } from "../board/types";

export interface ParseBoardResult {
  ok: boolean;
  board?: Board;
  error?: string;
}
