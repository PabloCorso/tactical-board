import type { Board, Document } from "../board/types";
import type { ParseBoardResult, ParseDocumentResult } from "./types";

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function serializeDocument(document: Document): string {
  return JSON.stringify(document, null, 2);
}

export function parseDocument(input: string): ParseDocumentResult {
  try {
    const parsed: unknown = JSON.parse(input);

    if (!isJsonObject(parsed)) {
      return { ok: false, error: "Document must be a JSON object" };
    }

    return { ok: true, document: parsed as unknown as Document };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown parse error",
    };
  }
}

export function serializeBoard(board: Board): string {
  return serializeDocument(board);
}

export function parseBoard(input: string): ParseBoardResult {
  const result = parseDocument(input);

  return result.ok ? { ok: true, board: result.document as Board } : result;
}
