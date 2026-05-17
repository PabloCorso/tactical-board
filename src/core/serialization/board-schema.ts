import type { Board, Document } from "../board/types";
import type { ParseBoardResult, ParseDocumentResult } from "./types";

export function serializeDocument(document: Document): string {
  return JSON.stringify(document, null, 2);
}

export function parseDocument(input: string): ParseDocumentResult {
  try {
    const parsed = JSON.parse(input) as Document;
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

// Compatibility helpers kept for Board-facing callers.
export function serializeBoard(board: Board): string {
  return serializeDocument(board);
}

export function parseBoard(input: string): ParseBoardResult {
  return parseDocument(input);
}
