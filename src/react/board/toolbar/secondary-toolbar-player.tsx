import { Fragment, type ReactElement, useMemo } from "react";
import { PencilSimpleIcon, XIcon } from "@phosphor-icons/react";
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
  useBoardEditorToolbarDockOptional,
  BoardEditorToolbar,
  BoardEditorToolbarButton,
  BoardEditorToolbarSeparator,
  type BoardEditorToolbarProps,
} from "../editor/toolbar/editor-toolbar";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { useBoardEditorLabels } from "../editor/board-editor-labels";
import { BoardPlayerDefaultIcon } from "./tool-icons";
import { setToolStatePatch } from "./secondary-toolbar-commands";
import { Button } from "../../ui/button";
import { InlineTextField } from "../../ui/inline-text-field";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../../ui/popover";
import { Switch } from "../../ui/switch";
import { cn } from "../../ui/misc";
import type { PlayerGroup } from "../../../core/board/types";
import type { BoardTheme, BoardThemeAdapters } from "../theme/board-theme";
import {
  PlayerAppearanceFields,
  type PlayerAppearanceFieldValue,
} from "../player/player-appearance-fields";
import {
  addPlayerGroupCommand,
  applyPlayerGroupStylePatch,
  getPlayerGroupDraftStyle,
  renamePlayerGroup,
  setPlayerGroupAutoNumberingCommand,
  type PlayerGroupStylePatch,
} from "../team/player-team-commands";
import { useBoardEditorTeamPanelOptional } from "../team/team-panel-context";

export { getPlayerGroupDraftStyle } from "../team/player-team-commands";

export type BoardEditorPlayerToolbarProps = Omit<
  BoardEditorToolbarProps,
  "children"
> & {
  adapters?: BoardThemeAdapters;
  theme?: Pick<BoardTheme, "playerAppearances">;
};

export function BoardEditorPlayerGroupToolbar({
  adapters,
  contentClassName,
  orientation = "vertical",
  theme,
  ...toolbarProps
}: BoardEditorPlayerToolbarProps) {
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

  const playerState = getPlayerToolState(toolState);
  const playerTool = toolRegistry.definitions[PLAYER_TOOL_ID];
  const playerGroups = getBoardPlayerGroups(board);
  const usesNumericLabels =
    playerTool instanceof PlayerTool &&
    playerTool.labelStrategy === "numeric-by-color";

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

        const selectGroup = () => {
          setToolStatePatch(toolApi, PLAYER_TOOL_ID, playerState, {
            activeGroupId: group.id,
            draftStyle,
          });

          toolbarDock?.requestDismiss();
        };

        const editButton = (
          <Button
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-6 w-full min-w-0 justify-between px-1.5")}
            aria-label={buttonLabel}
            onClick={
              teamPanel ? () => teamPanel.openTeamPanel(group.id) : undefined
            }
          >
            <span className="text-tb-text-primary truncate text-left text-xs leading-4">
              {buttonLabel}
            </span>
            <span className="text-tb-text-secondary" aria-hidden="true">
              <PencilSimpleIcon />
            </span>
          </Button>
        );

        return (
          <Fragment key={group.id}>
            <div className={cn("relative flex w-20 min-w-0 flex-col gap-0.5")}>
              {teamPanel ? (
                editButton
              ) : (
                <PlayerGroupEditPopover
                  appearanceRenderers={adapters?.playerAppearanceRenderers}
                  group={group}
                  labels={labels}
                  theme={theme}
                  onAutoNumberingChange={(autoNumbering) =>
                    setPlayerGroupAutoNumberingCommand(
                      toolApi,
                      group.id,
                      autoNumbering,
                    )
                  }
                  onAppearanceChange={(patch) =>
                    applyPlayerGroupStylePatch(
                      toolApi,
                      group.id,
                      patch as PlayerGroupStylePatch,
                    )
                  }
                  onNameChange={(name) =>
                    renamePlayerGroup(toolApi, group.id, name)
                  }
                >
                  {editButton}
                </PlayerGroupEditPopover>
              )}

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

function PlayerGroupEditPopover({
  appearanceRenderers,
  group,
  labels,
  theme,
  children,
  onAutoNumberingChange,
  onAppearanceChange,
  onNameChange,
}: {
  appearanceRenderers?: BoardThemeAdapters["playerAppearanceRenderers"];
  group: PlayerGroup;
  labels: ReturnType<typeof useBoardEditorLabels>;
  theme?: Pick<BoardTheme, "playerAppearances">;
  children: ReactElement;
  onAutoNumberingChange: (value: boolean) => void;
  onAppearanceChange: (patch: Partial<PlayerAppearanceFieldValue>) => void;
  onNameChange: (value: string) => void;
}) {
  const editLabel = labels.secondaryToolbar.editPlayerGroup;
  const nameLabel = labels.secondaryToolbar.teamName;
  const autoNumberingLabel = labels.secondaryToolbar.autoNumberSequencing;

  return (
    <Popover>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent
        side="right"
        sideOffset={6}
        initialFocus={false}
        className="w-56 gap-1.5 p-2"
        onClick={(event) => event.stopPropagation()}
      >
        <PopoverHeader className="gap-1">
          <div className="flex h-7 items-center justify-between gap-2">
            <PopoverTitle className="sr-only">{editLabel}</PopoverTitle>
            <InlineTextField
              value={group.name ?? ""}
              aria-label={nameLabel}
              placeholder={labels.secondaryToolbar.playerGroup}
              containerClassName="min-w-0 flex-1"
              className="w-full max-w-full text-sm"
              mirrorClassName="text-sm"
              onCommit={onNameChange}
            />
            <PopoverClose>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label={`Close ${editLabel}`}
                className="text-tb-text-secondary h-6 w-6 rounded-md"
                iconBefore={<XIcon />}
                iconSize="xs"
              />
            </PopoverClose>
          </div>
        </PopoverHeader>

        <div className="flex flex-col gap-1.5">
          <PlayerAppearanceFields
            appearanceRenderers={appearanceRenderers}
            labels={labels}
            theme={theme}
            value={{
              color: group.style.color ?? "#111827",
              colors: group.style.colors,
              fontSize: group.style.fontSize,
              appearanceId: group.style.appearanceId,
              options: group.style.options,
              asset: group.style.asset,
              caption: group.style.caption,
            }}
            onChange={onAppearanceChange}
          />

          <div className="flex h-7 items-center justify-between gap-3">
            <span className="text-tb-text-secondary text-xs font-medium">
              {autoNumberingLabel}
            </span>
            <Switch
              checked={isBoardPlayerGroupAutoNumberingEnabled(group)}
              aria-label={autoNumberingLabel}
              onCheckedChange={onAutoNumberingChange}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
