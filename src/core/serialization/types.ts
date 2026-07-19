import type { Board, Document } from "../board/types";

export type ParseDocumentResult =
  | {
      ok: true;
      document: Document;
    }
  | {
      ok: false;
      error: string;
    };

export type ParseBoardResult =
  | {
      ok: true;
      board: Board;
    }
  | {
      ok: false;
      error: string;
    };
