import type {
  BoardTheme,
  BoardThemeAdapters,
  ResolvedBoardTheme,
} from "./board-theme";
import { createBoardObjectDefinitions } from "./create-board-object-definitions";

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
    objectDefinitions: createBoardObjectDefinitions({ adapters, theme }),
  };
}
