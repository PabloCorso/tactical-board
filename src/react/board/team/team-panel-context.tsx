import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";

export type BoardEditorTeamPanelContextValue = {
  open: boolean;
  activeGroupId?: string;
  openTeamPanel: (groupId?: string) => void;
  closeTeamPanel: () => void;
  setActiveGroupId: (groupId: string) => void;
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
  const [open, setOpen] = useState(defaultOpen);
  const [activeGroupId, setActiveGroupId] = useState<string | undefined>(
    undefined,
  );

  const value = useMemo<BoardEditorTeamPanelContextValue>(
    () => ({
      open,
      activeGroupId,
      openTeamPanel: (groupId) => {
        if (groupId) {
          setActiveGroupId(groupId);
        }

        setOpen(true);
      },
      closeTeamPanel: () => setOpen(false),
      setActiveGroupId,
    }),
    [activeGroupId, open],
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
