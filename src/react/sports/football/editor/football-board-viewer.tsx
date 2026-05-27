import type { BoardViewerCanvasProps } from "../../../adapter/viewer/board-viewer";
import { ThemedBoardViewerCanvas } from "../../../board/theme/themed-board-viewer";
import { resolvedFootballTheme } from "../theme/football-theme";

export type FootballBoardViewerCanvasProps = BoardViewerCanvasProps;

export function FootballBoardViewerCanvas({
  objectRenderers,
  ...props
}: FootballBoardViewerCanvasProps) {
  return (
    <ThemedBoardViewerCanvas
      {...props}
      objectRenderers={objectRenderers}
      theme={resolvedFootballTheme}
    />
  );
}
