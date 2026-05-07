import type { Board, BoardObjectBase } from "../board/types";

export interface ParseBoardResult<
  TObject extends BoardObjectBase = BoardObjectBase,
> {
  ok: boolean;
  board?: Board<TObject>;
  error?: string;
}
