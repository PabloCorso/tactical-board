import { useEffect, useMemo, useRef } from "react";
import { createBoardEditorRuntime } from "../../core/editor/create-board-editor-runtime";
import type { BoardEditorStore } from "../../core/store/create-board-editor-store";

interface UseBoardEditorCanvasOptions {
  store: BoardEditorStore;
}

export function useBoardEditorCanvas({ store }: UseBoardEditorCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtime = useMemo(() => createBoardEditorRuntime({ store }), [store]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      runtime.mount(canvas);
    }

    return () => {
      runtime.unmount();
    };
  }, [runtime]);

  return {
    canvasRef,
  };
}
