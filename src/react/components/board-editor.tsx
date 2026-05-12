import type { PropsWithChildren, ReactNode } from "react";
import type { BoardEditorStore } from "../../core/store/board-editor-store";
import { useBoardEditorCanvas } from "../hooks/use-board-editor-canvas";
import {
  BoardEditorContext,
  useBoardEditorContext,
} from "./board-editor-context";
import { cn } from "./misc";
export { BoardEditorArrowRouteDone } from "./board-editor-arrow-route-done";

export type BoardEditorProps = {
  children?: ReactNode;
  className?: string;
};

export type BoardEditorProviderProps = PropsWithChildren & {
  store: BoardEditorStore;
};

export type BoardEditorCanvasProps = {
  className?: string;
  frameClassName?: string;
};

export function BoardEditorProvider({
  store,
  children,
}: BoardEditorProviderProps) {
  return (
    <BoardEditorContext.Provider value={store}>
      {children}
    </BoardEditorContext.Provider>
  );
}

export function BoardEditor({ children, className }: BoardEditorProps) {
  return (
    <div
      className={cn(
        "flex min-h-full w-full min-w-0 flex-1 flex-col",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BoardEditorCanvas({
  className,
  frameClassName,
}: BoardEditorCanvasProps) {
  const store = useBoardEditorContext();
  const { canvasRef } = useBoardEditorCanvas({ store });

  return (
    <div
      className={cn("relative min-h-0 w-full min-w-0 flex-1", frameClassName)}
    >
      <canvas
        className={className ?? "block size-full touch-none overflow-hidden"}
        ref={canvasRef}
        tabIndex={0}
      />
    </div>
  );
}
