import { useEffect, useRef } from "react";
import type { Board } from "../../../core/board/types";
import type { Viewport } from "../../../core/geometry/types";
import { createCanvasRenderer } from "../../../core/rendering/canvas/create-canvas-renderer";
import type {
  AssetResolver,
  CanvasRenderer,
} from "../../../core/rendering/canvas/types";

type UseCanvasRendererOptions = {
  assetResolver?: AssetResolver;
  board: Board;
  viewport: Viewport;
};

export function useCanvasRenderer({
  assetResolver,
  board,
  viewport,
}: UseCanvasRendererOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  useEffect(
    function renderCanvas() {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      if (!rendererRef.current) {
        rendererRef.current = createCanvasRenderer();
      }

      rendererRef.current.render({
        canvas,
        board,
        viewport,
        assetResolver,
        requestRender: () => {
          rendererRef.current?.render({
            canvas,
            board,
            viewport,
            assetResolver,
          });
        },
      });
    },
    [assetResolver, board, viewport],
  );

  useEffect(
    function observeCanvasResize() {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const observer =
        typeof ResizeObserver === "undefined"
          ? undefined
          : new ResizeObserver(() => {
              if (!rendererRef.current) {
                rendererRef.current = createCanvasRenderer();
              }

              rendererRef.current.render({
                canvas,
                board,
                viewport,
                assetResolver,
                requestRender: () => {
                  rendererRef.current?.render({
                    canvas,
                    board,
                    viewport,
                    assetResolver,
                  });
                },
              });
            });

      observer?.observe(canvas);

      return () => {
        observer?.disconnect();
      };
    },
    [assetResolver, board, viewport],
  );

  return canvasRef;
}
