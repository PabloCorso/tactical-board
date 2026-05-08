import type { Board, BoardObjectBase } from "../../core/board/types";
import type { Viewport } from "../../core/geometry/types";

export interface CanvasRenderRequest<
  TObject extends BoardObjectBase = BoardObjectBase,
> {
  canvas: HTMLCanvasElement;
  board: Board<TObject>;
  viewport: Viewport;
  selectedObjectIds?: string[];
  selectionMarquee?: {
    start: {
      x: number;
      y: number;
    };
    end: {
      x: number;
      y: number;
    };
  };
}

export interface CanvasRenderer {
  render: <TObject extends BoardObjectBase>(
    request: CanvasRenderRequest<TObject>,
  ) => void;
}
