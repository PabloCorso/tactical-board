import { Fragment, type ReactNode, useMemo } from "react";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import {
  getBoardPlayerGroups,
  isBoardPlayerGroupAutoNumberingEnabled,
} from "../../../core/board/player-groups";
import { PlayerTool } from "../../../core/tools/player-tool";
import { getNextNumericPlayerLabel } from "../../../core/tools/player-labels";
import { createToolApi } from "../../../core/editor/create-tool-api";
import {
  getPlayerToolState,
  PLAYER_TOOL_ID,
} from "../../../core/tools/player-tool-state";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarButton,
  BoardEditorToolbarSeparator,
  type BoardEditorToolbarProps,
} from "../editor/toolbar/editor-toolbar";
import { useBoardEditorToolbarDockOptional } from "../editor/toolbar/toolbar-dock";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { useBoardEditorLabels } from "../editor/board-editor-labels";
import { BoardPlayerDefaultIcon } from "./player-tool-icons";
import { setToolStatePatch } from "./secondary-toolbar-commands";
import { Button } from "../../ui/button";
import { cn } from "../../ui/misc";
import { useMediaQuery } from "../../ui/use-media-query";
import type { BoardThemeAdapters } from "../theme/board-theme";
import {
  addPlayerGroupCommand,
  getPlayerGroupDraftStyle,
} from "../team/player-team-commands";
import { useBoardEditorTeamPanelOptional } from "../team/team-panel-context";
import { BoardEditorTeamPanelDock } from "../team/team-panel";

export { getPlayerGroupDraftStyle } from "../team/player-team-commands";

export type BoardEditorPlayerGroupToolbarProps = Omit<
  BoardEditorToolbarProps,
  "children"
> & {
  adapters?: BoardThemeAdapters;
  children?: ReactNode;
};

export function BoardEditorPlayerGroupToolbar(
  props: BoardEditorPlayerGroupToolbarProps,
) {
  const editorStore = useBoardEditorContext();
  const active = useBoardEditorStore(
    editorStore,
    (state) => state.ui.activeToolId === PLAYER_TOOL_ID,
  );

  if (!active) {
    return null;
  }

  return <BoardEditorPlayerGroupToolbarContent {...props} />;
}

function BoardEditorPlayerGroupToolbarContent({
  adapters,
  children,
  contentClassName,
  orientation = "vertical",
  ...toolbarProps
}: BoardEditorPlayerGroupToolbarProps) {
  const labels = useBoardEditorLabels();
  const editorStore = useBoardEditorContext();
  const toolbarDock = useBoardEditorToolbarDockOptional();
  const teamPanel = useBoardEditorTeamPanelOptional();
  const toolApi = useMemo(() => createToolApi(editorStore), [editorStore]);
  const board = useBoardEditorStore(editorStore, (state) => state.board);
  const toolState = useBoardEditorStore(
    editorStore,
    (state) => state.toolState,
  );
  const toolRegistry = useBoardEditorStore(
    editorStore,
    (state) => state.toolRegistry,
  );
  const isSmallScreen = useMediaQuery("(max-width: 640px)");

  const playerState = getPlayerToolState(toolState);
  const playerTool = toolRegistry.definitions[PLAYER_TOOL_ID];
  const playerGroups = getBoardPlayerGroups(board);
  const usesNumericLabels =
    playerTool instanceof PlayerTool &&
    playerTool.labelStrategy === "numeric-by-color";

  if (teamPanel?.open && !isSmallScreen) {
    return <BoardEditorTeamPanelDock>{children}</BoardEditorTeamPanelDock>;
  }

  return (
    <BoardEditorToolbar
      {...toolbarProps}
      contentClassName={cn("items-center gap-0.5", contentClassName)}
      orientation={orientation}
      tooltipSide="right"
    >
      {playerGroups.map((group, index) => {
        const color = group.style.color ?? playerState.draftStyle.color;
        const label =
          usesNumericLabels &&
          isBoardPlayerGroupAutoNumberingEnabled(group) &&
          typeof color === "string"
            ? getNextNumericPlayerLabel(board, color, group.id)
            : undefined;

        const draftStyle = getPlayerGroupDraftStyle(group);
        const buttonLabel = group.name ?? labels.secondaryToolbar.playerGroup;
        const isActive = playerState.activeGroupId === group.id;

        const activateGroup = () => {
          setToolStatePatch(toolApi, PLAYER_TOOL_ID, playerState, {
            activeGroupId: group.id,
            draftStyle,
          });
        };

        const selectGroup = () => {
          activateGroup();
          toolbarDock?.requestDismiss();
        };

        const openGroupPanel = () => {
          activateGroup();
          teamPanel?.openTeamPanel();
        };

        const editButton = teamPanel ? (
          <Button
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-6 w-full min-w-0 justify-between px-1.5")}
            aria-label={buttonLabel}
            onClick={openGroupPanel}
          >
            <span className="text-tb-text-primary truncate text-left text-xs leading-4">
              {buttonLabel}
            </span>
            <span className="text-tb-text-secondary" aria-hidden="true">
              <PencilSimpleIcon />
            </span>
          </Button>
        ) : null;

        return (
          <Fragment key={group.id}>
            <div className={cn("relative flex w-20 min-w-0 flex-col gap-0.5")}>
              {editButton}

              <Button
                variant={isActive ? "secondary" : "ghost"}
                size="md"
                className="h-11 min-h-0 w-full px-0"
                aria-label={buttonLabel}
                onClick={selectGroup}
              >
                <BoardPlayerDefaultIcon
                  appearanceRenderers={adapters?.playerAppearanceRenderers}
                  draftStyle={draftStyle}
                  label={label}
                  className="h-9 w-9 shrink-0"
                  width={30}
                  height={30}
                />
              </Button>
            </div>
            {index < playerGroups.length - 1 ? (
              <BoardEditorToolbarSeparator className="my-0" />
            ) : null}
          </Fragment>
        );
      })}

      {playerGroups.length > 0 ? (
        <BoardEditorToolbarSeparator className="my-0" />
      ) : null}
      <BoardEditorToolbarButton
        aria-label={labels.secondaryToolbar.addPlayerGroup}
        className="h-11 w-20"
        iconBefore={
          <span className="text-lg leading-none" aria-hidden="true">
            +
          </span>
        }
        onClick={() => {
          addPlayerGroupCommand(toolApi);
        }}
        iconSize="xl"
        size="sm"
        tooltip={labels.secondaryToolbar.addPlayerGroup}
      />
    </BoardEditorToolbar>
  );
}
