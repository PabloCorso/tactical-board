import { useEffect, useMemo, useRef } from "react";
import { createBoardEditorRuntime } from "../../../core/editor/board-editor-runtime";
import type { AssetResolver } from "../../../core/rendering/canvas/types";
import type { BoardEditorStore } from "../../../core/store/board-editor-store";

type UseBoardEditorCanvasOptions = {
  assetResolver?: AssetResolver;
  extendBackground?: boolean;
  store: BoardEditorStore;
};

export function useBoardEditorCanvas({
  assetResolver,
  extendBackground,
  store,
}: UseBoardEditorCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtime = useMemo(
    () => createBoardEditorRuntime({ assetResolver, extendBackground, store }),
    [assetResolver, extendBackground, store],
  );

  useEffect(
    function mountBoardEditorRuntime() {
      const canvas = canvasRef.current;

      if (canvas) {
        runtime.mount(canvas);
      }

      return () => {
        runtime.unmount();
      };
    },
    [runtime],
  );

  return {
    canvasRef,
  };
}
