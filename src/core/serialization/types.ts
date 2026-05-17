import type { Document } from "../board/types";

export interface ParseDocumentResult {
  ok: boolean;
  board?: Document;
  error?: string;
}

// Compatibility result name kept for Board-facing callers.
export type ParseBoardResult = ParseDocumentResult;
