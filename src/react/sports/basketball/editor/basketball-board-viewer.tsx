import type { CanvasObjectRendererRegistry } from "../../../../core/rendering/canvas/types";
import type { BoardViewerCanvasProps } from "../../../adapter/viewer/board-viewer";
import { ThemedBoardViewerCanvas } from "../../../board/theme/themed-board-viewer";
import { basketballTheme } from "../theme/basketball-theme";

export function getBasketballObjectRenderers(
  objectRenderers?: CanvasObjectRendererRegistry,
): CanvasObjectRendererRegistry {
  return {
    ...basketballTheme.objectRenderers,
    ...objectRenderers,
  };
}

export type BasketballBoardViewerCanvasProps = BoardViewerCanvasProps;

export function BasketballBoardViewerCanvas({
  objectRenderers,
  ...props
}: BasketballBoardViewerCanvasProps) {
  return (
    <ThemedBoardViewerCanvas
      {...props}
      objectRenderers={objectRenderers}
      theme={basketballTheme}
    />
  );
}
