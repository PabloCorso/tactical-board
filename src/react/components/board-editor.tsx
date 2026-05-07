import type { ReactNode } from "react";
import type { BoardEditorStore } from "../../core/store/create-board-editor-store";
import { useBoardEditorCanvas } from "../hooks/use-board-editor-canvas";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";

interface BoardEditorProps {
  store: BoardEditorStore;
  title?: ReactNode;
  meta?: ReactNode;
  toolbar?: ReactNode;
}

const shellClassName =
  "overflow-hidden rounded-[24px] border border-[#d6bb672e] bg-[rgba(9,25,21,0.72)] shadow-[0_20px_60px_rgba(0,0,0,0.25)]";
const shellHeaderClassName =
  "flex items-end justify-between gap-4 px-5 pt-5 max-[760px]:items-start";
const shellMetaClassName = "m-0 max-w-[70ch] text-[rgba(243,239,223,0.76)]";
const editorLayoutClassName =
  "grid gap-4 p-5 grid-cols-1 has-[aside]:grid-cols-[120px_minmax(0,1fr)] max-[760px]:has-[aside]:grid-cols-1";
const toolbarClassName = "grid content-start gap-2.5";
const boardCanvasClassName =
  "block w-full overflow-hidden rounded-[20px] touch-none";
const editorCanvasClassName = `${boardCanvasClassName} h-[420px]`;
const editorCanvasFrameClassName = "relative";
const toolChipClassName =
  "absolute top-4 right-4 z-10 rounded-full border border-[#d6bb6747] bg-[rgba(9,25,21,0.72)] px-2.5 py-1 text-[0.8rem] uppercase tracking-[0.06em] text-[rgba(243,239,223,0.88)]";

export function BoardEditor({ store, title, meta, toolbar }: BoardEditorProps) {
  const activeTool = useBoardEditorStore(
    store,
    (state) => state.toolRegistry.definitions[state.ui.activeToolId],
  );
  const { canvasRef } = useBoardEditorCanvas({ store });

  return (
    <section className={shellClassName}>
      {(title || meta) && (
        <header className={shellHeaderClassName}>
          <div>{title}</div>
          {meta ? <div className={shellMetaClassName}>{meta}</div> : null}
        </header>
      )}

      <div className={editorLayoutClassName}>
        {toolbar ? <aside className={toolbarClassName}>{toolbar}</aside> : null}

        <div className={editorCanvasFrameClassName}>
          <canvas className={editorCanvasClassName} ref={canvasRef} />
          {activeTool ? (
            <div className={toolChipClassName}>{activeTool.label}</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
