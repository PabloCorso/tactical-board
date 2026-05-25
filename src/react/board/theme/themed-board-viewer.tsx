import { useMemo } from "react";
import {
  BoardViewerCanvas,
  type BoardViewerCanvasProps,
} from "../../adapter/viewer/board-viewer";
import type { ResolvedBoardTheme } from "./board-theme";

export type ThemedBoardViewerCanvasProps = BoardViewerCanvasProps & {
  theme: ResolvedBoardTheme;
};

export function ThemedBoardViewerCanvas({
  objectRenderers,
  theme,
  ...props
}: ThemedBoardViewerCanvasProps) {
  const mergedObjectRenderers = useMemo(
    () => ({
      ...theme.objectRenderers,
      ...objectRenderers,
    }),
    [objectRenderers, theme],
  );

  return (
    <BoardViewerCanvas {...props} objectRenderers={mergedObjectRenderers} />
  );
}
