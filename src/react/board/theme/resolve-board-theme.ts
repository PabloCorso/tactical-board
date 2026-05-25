import type {
  BoardTheme,
  BoardThemeAdapters,
  ResolvedBoardTheme,
} from "./board-theme";
import { createBoardObjectRenderers } from "./create-board-object-renderers";

export function resolveBoardTheme({
  adapters,
  theme,
}: {
  adapters?: BoardThemeAdapters;
  theme: BoardTheme;
}): ResolvedBoardTheme {
  return {
    ...theme,
    adapters,
    objectRenderers: createBoardObjectRenderers({ adapters, theme }),
  };
}
