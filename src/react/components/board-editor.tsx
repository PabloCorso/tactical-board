import {
  createContext,
  type PropsWithChildren,
  type ReactNode,
  useContext,
} from "react";
import type { BoardEditorStore } from "../../core/store/create-board-editor-store";
import { useBoardEditorCanvas } from "../hooks/use-board-editor-canvas";

const boardEditorContext = createContext<BoardEditorStore | null>(null);

interface BoardEditorProps {
  store: BoardEditorStore;
  children?: ReactNode;
  toolbar?: ReactNode;
}

interface BoardEditorProviderProps extends PropsWithChildren {
  store: BoardEditorStore;
}

interface BoardEditorToolbarProps extends PropsWithChildren {
  className?: string;
}

interface BoardEditorCanvasProps {
  className?: string;
  frameClassName?: string;
}

function useBoardEditorContext() {
  const store = useContext(boardEditorContext);

  if (!store) {
    throw new Error(
      "BoardEditor components must be rendered inside <BoardEditor />.",
    );
  }

  return store;
}

export function BoardEditorProvider({
  store,
  children,
}: BoardEditorProviderProps) {
  return (
    <boardEditorContext.Provider value={store}>
      {children}
    </boardEditorContext.Provider>
  );
}

export function BoardEditor({ store, children, toolbar }: BoardEditorProps) {
  const content = children ?? (
    <>
      {toolbar ? <BoardEditorToolbar>{toolbar}</BoardEditorToolbar> : null}
      <BoardEditorCanvas />
    </>
  );

  return (
    <BoardEditorProvider store={store}>
      <section className="overflow-hidden rounded-[24px] border border-[#d6bb672e] bg-[rgba(9,25,21,0.72)] shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <div className="grid grid-cols-1 gap-4 p-5 has-[aside]:grid-cols-[120px_minmax(0,1fr)] max-[760px]:has-[aside]:grid-cols-1">
          {content}
        </div>
      </section>
    </BoardEditorProvider>
  );
}

export function BoardEditorToolbar({
  children,
  className,
}: BoardEditorToolbarProps) {
  return (
    <aside className={className ?? "grid content-start gap-2.5"}>
      {children}
    </aside>
  );
}

export function BoardEditorCanvas({
  className,
  frameClassName,
}: BoardEditorCanvasProps) {
  const store = useBoardEditorContext();
  const { canvasRef } = useBoardEditorCanvas({ store });

  return (
    <div className={frameClassName ?? "relative"}>
      <canvas
        className={
          className ??
          "block h-[420px] w-full touch-none overflow-hidden rounded-[20px]"
        }
        ref={canvasRef}
      />
    </div>
  );
}
