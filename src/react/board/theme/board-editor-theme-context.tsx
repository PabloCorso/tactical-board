import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from "react";
import type { BoardTheme, BoardThemeAdapters } from "./board-theme";

export type BoardEditorThemeContextValue = {
  adapters?: BoardThemeAdapters;
  theme?: BoardTheme;
};

const BoardEditorThemeContext =
  createContext<BoardEditorThemeContextValue | null>(null);

export type BoardEditorThemeProviderProps = PropsWithChildren &
  BoardEditorThemeContextValue;

export function BoardEditorThemeProvider({
  adapters,
  children,
  theme,
}: BoardEditorThemeProviderProps) {
  const value = useMemo(() => ({ adapters, theme }), [adapters, theme]);

  return (
    <BoardEditorThemeContext.Provider value={value}>
      {children}
    </BoardEditorThemeContext.Provider>
  );
}

export function useBoardEditorTheme(
  overrides: BoardEditorThemeContextValue = {},
): BoardEditorThemeContextValue {
  const inherited = useContext(BoardEditorThemeContext);

  return {
    adapters: overrides.adapters ?? inherited?.adapters,
    theme: overrides.theme ?? inherited?.theme,
  };
}
