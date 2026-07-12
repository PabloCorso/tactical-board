import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { CaretLeftIcon, XIcon } from "@phosphor-icons/react";
import { getBoardPlayerGroups } from "../../../core/board/player-groups";
import type { Board, PlayerGroup } from "../../../core/board/types";
import { createToolApi } from "../../../core/editor/create-tool-api";
import { getPlayerToolState } from "../../../core/tools/player-tool-state";
import type { ToolApi } from "../../../core/tools/types";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { Button } from "../../ui/button";
import { Drawer, DrawerContent } from "../../ui/drawer";
import { InlineTextField } from "../../ui/inline-text-field";
import { cn } from "../../ui/misc";
import { useMediaQuery } from "../../ui/use-media-query";
import { useBoardEditorLabels } from "../editor/board-editor-labels";
import { renamePlayerGroup } from "./player-team-commands";
import { useBoardEditorTeamPanel } from "./team-panel-context";

export type BoardEditorTeamPanelActiveGroupContext = {
  board: Board;
  group: PlayerGroup;
  groupIndex: number;
  groups: PlayerGroup[];
  onLocatePlayer?: () => void;
  toolApi: ToolApi;
};

const BoardEditorTeamPanelActiveGroupContextValue =
  createContext<BoardEditorTeamPanelActiveGroupContext | null>(null);

export function useBoardEditorTeamPanelActiveGroup() {
  const value = useContext(BoardEditorTeamPanelActiveGroupContextValue);

  if (!value) {
    throw new Error(
      "useBoardEditorTeamPanelActiveGroup must be used within a team panel",
    );
  }

  return value;
}

export type BoardEditorTeamPanelProps = {
  className?: string;
  children?: ReactNode;
};

export function BoardEditorTeamPanelDock({
  className,
  children,
}: BoardEditorTeamPanelProps) {
  const labels = useBoardEditorLabels();
  const teamPanel = useBoardEditorTeamPanel();

  if (!teamPanel.open) {
    return null;
  }

  return (
    <TeamPanelActiveGroupProvider>
      <aside
        aria-label={labels.teamPanel.title}
        className={cn(
          "bg-tb-background-surface divide-tb-border-default pointer-events-auto flex max-h-[calc(100dvh-1rem)] w-48 flex-col divide-y overflow-hidden rounded-xl shadow-lg",
          "tb-dock-panel-enter",
          className,
        )}
      >
        <div className="flex items-center p-1.5">
          <TeamPanelBackButton onClick={teamPanel.closeTeamPanel} />
          <TeamPanelTitle />
        </div>
        {children}
      </aside>
    </TeamPanelActiveGroupProvider>
  );
}

export function BoardEditorTeamPanelDrawer({
  className,
  children,
}: BoardEditorTeamPanelProps) {
  const labels = useBoardEditorLabels();
  const teamPanel = useBoardEditorTeamPanel();
  const isSmallScreen = useMediaQuery("(max-width: 640px)");

  if (!isSmallScreen) {
    return null;
  }

  return (
    <Drawer
      open={teamPanel.open}
      onOpenChange={(open) => {
        if (!open) {
          teamPanel.closeTeamPanel();
        }
      }}
      swipeDirection="down"
      modal={false}
    >
      <TeamPanelActiveGroupProvider onLocatePlayer={teamPanel.closeTeamPanel}>
        <DrawerContent
          aria-label={labels.teamPanel.title}
          showBackdrop={false}
          popupClassName={cn(
            "pointer-events-auto flex flex-col shadow-lg data-[swipe-direction=down]:max-h-[65dvh]",
            className,
          )}
          className="divide-tb-border-default flex min-h-0 flex-1 flex-col divide-y"
        >
          <div className="flex items-center gap-2">
            <TeamPanelTitle />
            <TeamPanelCloseButton onClick={teamPanel.closeTeamPanel} />
          </div>
          {children}
        </DrawerContent>
      </TeamPanelActiveGroupProvider>
    </Drawer>
  );
}

function TeamPanelTitle() {
  const labels = useBoardEditorLabels();
  const { group, toolApi } = useBoardEditorTeamPanelActiveGroup();

  return (
    <InlineTextField
      value={group.name ?? ""}
      aria-label={labels.teamPanel.teamName}
      placeholder={labels.secondaryToolbar.playerGroup}
      containerClassName="min-w-0 flex-1"
      className="h-6 w-full max-w-full text-sm font-medium"
      mirrorClassName="h-6 w-full text-sm font-medium"
      onCommit={(name) => renamePlayerGroup(toolApi, group.id, name)}
    />
  );
}

function TeamPanelBackButton({ onClick }: { onClick: () => void }) {
  const labels = useBoardEditorLabels();

  return (
    <Button
      variant="ghost"
      size="sm"
      iconOnly
      aria-label={labels.teamPanel.backToPlayerGroups}
      className="text-tb-text-secondary h-6 w-6 shrink-0 rounded-md"
      iconBefore={<CaretLeftIcon />}
      iconSize="xs"
      onClick={onClick}
    />
  );
}

function TeamPanelCloseButton({ onClick }: { onClick: () => void }) {
  const labels = useBoardEditorLabels();

  return (
    <Button
      variant="ghost"
      size="sm"
      iconOnly
      aria-label={labels.teamPanel.close}
      className="text-tb-text-secondary h-6 w-6 shrink-0 rounded-md"
      iconBefore={<XIcon />}
      iconSize="xs"
      onClick={onClick}
    />
  );
}

function useActiveTeamPanelGroup() {
  const editorStore = useBoardEditorContext();
  const toolApi = useMemo(() => createToolApi(editorStore), [editorStore]);
  const board = useBoardEditorStore(editorStore, (state) => state.board);
  const activeGroupId = useBoardEditorStore(
    editorStore,
    (state) => getPlayerToolState(state.toolState).activeGroupId,
  );
  const groups = getBoardPlayerGroups(board);
  const activeGroup =
    groups.find((group) => group.id === activeGroupId) ?? groups[0];

  return { activeGroup, board, groups, toolApi };
}

type TeamPanelActiveGroupProviderProps = PropsWithChildren<{
  onLocatePlayer?: () => void;
}>;

function TeamPanelActiveGroupProvider({
  children,
  onLocatePlayer,
}: TeamPanelActiveGroupProviderProps) {
  const { activeGroup, board, groups, toolApi } = useActiveTeamPanelGroup();

  if (!activeGroup) {
    return null;
  }

  const groupIndex = groups.findIndex((group) => group.id === activeGroup.id);
  const value = {
    board,
    group: activeGroup,
    groupIndex,
    groups,
    onLocatePlayer,
    toolApi,
  };

  return (
    <BoardEditorTeamPanelActiveGroupContextValue.Provider value={value}>
      {children}
    </BoardEditorTeamPanelActiveGroupContextValue.Provider>
  );
}

export function BoardEditorTeamPanelContent({ children }: PropsWithChildren) {
  const { group } = useBoardEditorTeamPanelActiveGroup();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        key={group.id}
        className="divide-tb-border-default flex min-h-0 flex-1 flex-col divide-y overflow-y-auto overscroll-contain"
      >
        {children}
      </div>
    </div>
  );
}
