import type { ReactNode } from "react";
import type { Board } from "../../core/board/types";
import type { BoardObjectBase } from "../../core/board/types";
import { useCanvasRenderer } from "../hooks/use-canvas-renderer";

interface BoardViewProps<TObject extends BoardObjectBase = BoardObjectBase> {
  board: Board<TObject>;
  title?: ReactNode;
  meta?: ReactNode;
}

const shellClassName =
  "overflow-hidden rounded-[24px] border border-[#d6bb672e] bg-[rgba(9,25,21,0.72)] shadow-[0_20px_60px_rgba(0,0,0,0.25)]";
const shellHeaderClassName =
  "flex items-end justify-between gap-4 px-5 pt-5 max-[760px]:items-start";
const shellMetaClassName = "m-0 max-w-[70ch] text-[rgba(243,239,223,0.76)]";
const viewCanvasClassName =
  "m-5 block h-[460px] w-[calc(100%-2.5rem)] overflow-hidden rounded-[20px]";

export function BoardView<TObject extends BoardObjectBase>({
  board,
  title,
  meta,
}: BoardViewProps<TObject>) {
  const canvasRef = useCanvasRenderer({
    board,
    viewport: {
      pan: { x: 0, y: 0 },
      zoom: 1,
    },
  });

  return (
    <section className={shellClassName}>
      {(title || meta) && (
        <header className={shellHeaderClassName}>
          <div>{title}</div>
          {meta ? <div className={shellMetaClassName}>{meta}</div> : null}
        </header>
      )}

      <canvas className={viewCanvasClassName} ref={canvasRef} />
    </section>
  );
}
