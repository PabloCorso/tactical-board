import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PLAYER_TOOL_ID } from "../../../core/tools/player-tool-state";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";

export type BoardEditorTeamPanelContextValue = {
  open: boolean;
  openTeamPanel: () => void;
  closeTeamPanel: () => void;
};

const BoardEditorTeamPanelContext =
  createContext<BoardEditorTeamPanelContextValue | null>(null);

export type BoardEditorTeamPanelProviderProps = PropsWithChildren & {
  defaultOpen?: boolean;
};

export function BoardEditorTeamPanelProvider({
  children,
  defaultOpen = false,
}: BoardEditorTeamPanelProviderProps) {
  const editorStore = useBoardEditorContext();
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    return editorStore.subscribe((state, previousState) => {
      if (
        previousState.ui.activeToolId === PLAYER_TOOL_ID &&
        state.ui.activeToolId !== PLAYER_TOOL_ID
      ) {
        setOpen(false);
      }
    });
  }, [editorStore]);

  const value = useMemo<BoardEditorTeamPanelContextValue>(
    () => ({
      open,
      openTeamPanel: () => setOpen(true),
      closeTeamPanel: () => setOpen(false),
    }),
    [open],
  );

  return (
    <BoardEditorTeamPanelContext.Provider value={value}>
      {children}
    </BoardEditorTeamPanelContext.Provider>
  );
}

export function useBoardEditorTeamPanel() {
  const value = useContext(BoardEditorTeamPanelContext);

  if (!value) {
    throw new Error(
      "useBoardEditorTeamPanel must be used within BoardEditorTeamPanelProvider",
    );
  }

  return value;
}

export function useBoardEditorTeamPanelOptional() {
  return useContext(BoardEditorTeamPanelContext);
}
