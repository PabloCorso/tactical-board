import {
  ArrowCounterClockwiseIcon,
  HashStraightIcon,
  PaletteIcon,
  TextTIcon,
} from "@phosphor-icons/react";
import {
  DEFAULT_PLAYER_SIZE,
  updatePlayerObject,
  type PlayerObject,
} from "../../../../core/objects/player-object";
import {
  getBoardPlayerGroup,
  getBoardPlayerGroups,
  resolvePlayerGroupStyle,
} from "../../../../core/board/player-groups";
import {
  resolveEffectivePlayerStyle,
  updatePlayerStyle as updatePlayerStyleInBoard,
  type PlayerStylePatch,
} from "../../../../core/board/player-style";
import { getContrastingPlayerLabelColor } from "../../../../core/tools/player-tool";
import { createToolApi } from "../../../../core/editor/create-tool-api";
import { useBoardEditorContext } from "../../../adapter/editor/board-editor-context";
import { useBoardEditorStore } from "../../../adapter/editor/use-board-editor-store";
import {
  BoardEditorToolbar,
  BoardEditorToolbarPopoverButton,
  BoardEditorToolbarSeparator,
} from "../toolbar/editor-toolbar";
import { BoardEditorSelectionToolbarPositioner } from "./selection-toolbar-positioner";
import { BoardEditorSelectionActionsMenu } from "./selection-actions-menu";
import type { BoardEditorSelectionToolbarRendererProps } from "./selection-toolbar-types";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../../../ui/select";
import { DropdownMenuItem } from "../../../ui/dropdown-menu";
import { PopoverTitle } from "../../../ui/popover";
import { useBoardEditorLabels } from "../board-editor-labels";
import {
  PlayerAppearanceFields,
  PlayerAppearancePreview,
} from "../../player/player-appearance-fields";
import { PlayerLabelFields } from "../../player/player-label-fields";
import { PlayerCaptionFields } from "../../player/player-caption-fields";
import { getThemePlayerAppearanceDefinitions } from "../../theme/board-theme";
import {
  movePlayerToGroup,
  resetPlayerStyleToGroup,
} from "../../team/player-team-commands";

export function BoardEditorPlayerSelectionToolbar({
  adapters,
  className,
  selectedObject,
  theme,
  toolbarLeft,
  toolbarTop,
  toolbarBottom,
  viewportWidth,
  viewportHeight,
}: BoardEditorSelectionToolbarRendererProps<PlayerObject>) {
  const labels = useBoardEditorLabels();
  const store = useBoardEditorContext();
  const board = useBoardEditorStore(store, (state) => state.board);
  const toolApi = createToolApi(store);
  const playerGroups = getBoardPlayerGroups(board);
  const playerGroup = getBoardPlayerGroup(board, selectedObject.props.groupId);
  const groupStyle = playerGroup
    ? resolvePlayerGroupStyle(playerGroup)
    : undefined;
  const effectiveStyle = resolveEffectivePlayerStyle(board, selectedObject);
  const appearances = getThemePlayerAppearanceDefinitions(theme);
  const appearance =
    appearances.find(
      (candidate) => candidate.id === effectiveStyle.appearanceId,
    ) ?? appearances[0];
  const labelColor =
    effectiveStyle.labelColor ??
    getContrastingPlayerLabelColor(effectiveStyle.color);
  const groupSize = groupStyle?.size ?? DEFAULT_PLAYER_SIZE;
  const hasLabelStyleOverride =
    selectedObject.props.fontSize !== undefined ||
    selectedObject.props.labelColor !== undefined;
  const hasCaptionStyleOverride =
    selectedObject.props.caption?.style !== undefined;
  const hasAppearanceOverride =
    selectedObject.props.color !== undefined ||
    selectedObject.props.colors !== undefined ||
    selectedObject.props.appearanceId !== undefined ||
    selectedObject.props.options !== undefined ||
    selectedObject.props.asset !== undefined ||
    effectiveStyle.size !== groupSize;
  const hasAnyStyleOverride =
    hasLabelStyleOverride || hasCaptionStyleOverride || hasAppearanceOverride;

  const updatePlayer = (input: Parameters<typeof updatePlayerObject>[1]) => {
    toolApi.updateObjects([selectedObject.id], (object) =>
      updatePlayerObject(object as PlayerObject, input),
    );
  };

  const applyPlayerStylePatch = (input: PlayerStylePatch) => {
    toolApi.updateObjects([selectedObject.id], (object) =>
      updatePlayerStyleInBoard(object as PlayerObject, input),
    );
  };

  const resetAppearance = () => {
    applyPlayerStylePatch({
      color: undefined,
      colors: undefined,
      size: groupSize,
      appearanceId: undefined,
      options: undefined,
      asset: undefined,
    });
  };

  return (
    <BoardEditorSelectionToolbarPositioner
      anchorLeft={toolbarLeft}
      anchorTop={toolbarTop}
      anchorBottom={toolbarBottom}
      viewportWidth={viewportWidth}
      viewportHeight={viewportHeight}
    >
      <BoardEditorToolbar
        aria-label={labels.selectionToolbar.playerProperties}
        className={className}
      >
        {playerGroups.length > 1 ? (
          <>
            <Select
              value={selectedObject.props.groupId ?? ""}
              onValueChange={(value) => {
                if (typeof value === "string" && value) {
                  movePlayerToGroup(toolApi, selectedObject.id, value);
                }
              }}
            >
              <SelectTrigger
                aria-label={labels.selectionToolbar.playerTeam}
                className="h-10 w-auto max-w-32 rounded-lg px-3 text-sm"
              >
                {() => (
                  <span className="truncate">
                    {playerGroup?.name ?? labels.selectionToolbar.playerTeam}
                  </span>
                )}
              </SelectTrigger>
              <SelectContent>
                {playerGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="border-tb-border-default size-3 shrink-0 rounded-full border"
                        style={{ backgroundColor: group.style.color }}
                      />
                      <span className="truncate">{group.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <BoardEditorToolbarSeparator />
          </>
        ) : null}

        <BoardEditorToolbarPopoverButton
          ariaLabel={labels.selectionToolbar.playerLabel}
          tooltip={labels.selectionToolbar.playerLabel}
          popoverSide="top"
          popoverContentClassName="w-60 min-w-0"
          icon={
            selectedObject.props.label ? (
              <span className="flex size-6 items-center justify-center text-xs font-semibold tabular-nums">
                {selectedObject.props.label.slice(0, 3)}
              </span>
            ) : (
              <HashStraightIcon />
            )
          }
          content={
            <div className="flex flex-col gap-3 p-1">
              <PlayerPopoverHeader
                customized={hasLabelStyleOverride}
                title={labels.selectionToolbar.playerLabel}
                teamName={playerGroup?.name}
              />
              <label className="flex flex-col gap-0.5">
                <span className="text-tb-text-secondary text-xs font-medium">
                  {labels.selectionToolbar.labelText}
                </span>
                <Input
                  aria-label={labels.selectionToolbar.labelText}
                  className="h-8 rounded-md px-2 text-sm font-medium md:text-sm"
                  onChange={(event) =>
                    updatePlayer({ label: event.currentTarget.value })
                  }
                  value={selectedObject.props.label ?? ""}
                />
              </label>
              <PlayerLabelFields
                labels={labels}
                value={{ color: labelColor, fontSize: effectiveStyle.fontSize }}
                onChange={(patch) =>
                  applyPlayerStylePatch({
                    ...(patch.color !== undefined
                      ? { labelColor: patch.color }
                      : {}),
                    ...(patch.fontSize !== undefined
                      ? { fontSize: patch.fontSize }
                      : {}),
                  })
                }
              />
              {hasLabelStyleOverride ? (
                <ResetStyleButton
                  label={labels.selectionToolbar.resetLabelStyle}
                  onClick={() =>
                    applyPlayerStylePatch({
                      fontSize: undefined,
                      labelColor: undefined,
                    })
                  }
                />
              ) : null}
            </div>
          }
        />

        <BoardEditorToolbarPopoverButton
          ariaLabel={labels.playerAppearance.caption}
          tooltip={labels.playerAppearance.caption}
          popoverSide="top"
          popoverContentClassName="w-64 min-w-0"
          icon={<TextTIcon />}
          content={
            <div className="flex flex-col gap-3 p-1">
              <PlayerPopoverHeader
                customized={hasCaptionStyleOverride}
                title={labels.playerAppearance.caption}
                teamName={playerGroup?.name}
              />
              <label className="flex flex-col gap-0.5">
                <span className="text-tb-text-secondary text-xs font-medium">
                  {labels.selectionToolbar.captionText}
                </span>
                <Input
                  aria-label={labels.selectionToolbar.captionText}
                  className="h-8 rounded-md px-2 text-sm font-medium md:text-sm"
                  onChange={(event) =>
                    updatePlayer({
                      caption: {
                        ...selectedObject.props.caption,
                        text: event.currentTarget.value,
                      },
                    })
                  }
                  value={selectedObject.props.caption?.text ?? ""}
                />
              </label>
              <PlayerCaptionFields
                caption={effectiveStyle.caption ?? {}}
                labels={labels}
                onChange={(caption) => applyPlayerStylePatch({ caption })}
              />
              {hasCaptionStyleOverride ? (
                <ResetStyleButton
                  label={labels.selectionToolbar.resetCaptionStyle}
                  onClick={() => applyPlayerStylePatch({ caption: undefined })}
                />
              ) : null}
            </div>
          }
        />

        <BoardEditorToolbarSeparator />

        <BoardEditorToolbarPopoverButton
          ariaLabel={labels.playerAppearance.appearance}
          tooltip={labels.playerAppearance.appearance}
          popoverSide="top"
          popoverContentClassName="w-72 min-w-0"
          icon={
            appearance ? (
              <PlayerAppearancePreview
                appearanceRenderers={adapters?.playerAppearanceRenderers}
                appearance={appearance}
                asset={effectiveStyle.asset}
                color={effectiveStyle.color}
                colors={effectiveStyle.colors}
                options={effectiveStyle.options}
                className="size-6 rounded-md"
              />
            ) : (
              <PaletteIcon />
            )
          }
          content={
            <div className="flex flex-col gap-2">
              <div className="px-2 pt-1">
                <PlayerPopoverHeader
                  customized={hasAppearanceOverride}
                  title={labels.playerAppearance.appearance}
                  teamName={playerGroup?.name}
                />
              </div>
              <PlayerAppearanceFields
                appearanceRenderers={adapters?.playerAppearanceRenderers}
                appearances={theme?.playerAppearances}
                labels={labels}
                value={{
                  color: effectiveStyle.color,
                  colors: effectiveStyle.colors,
                  size: effectiveStyle.size,
                  appearanceId: effectiveStyle.appearanceId,
                  options: effectiveStyle.options,
                  asset: effectiveStyle.asset,
                }}
                onChange={applyPlayerStylePatch}
              />
              {hasAppearanceOverride ? (
                <div className="px-1 pb-1">
                  <ResetStyleButton
                    label={labels.selectionToolbar.resetAppearanceStyle}
                    onClick={resetAppearance}
                  />
                </div>
              ) : null}
            </div>
          }
        />

        <BoardEditorToolbarSeparator />
        <BoardEditorSelectionActionsMenu
          selectedObjectIds={[selectedObject.id]}
        >
          {playerGroup && hasAnyStyleOverride ? (
            <DropdownMenuItem
              onClick={() =>
                resetPlayerStyleToGroup(toolApi, selectedObject.id)
              }
            >
              {labels.selectionToolbar.resetToTeamStyle}
            </DropdownMenuItem>
          ) : null}
        </BoardEditorSelectionActionsMenu>
      </BoardEditorToolbar>
    </BoardEditorSelectionToolbarPositioner>
  );
}

function PlayerPopoverHeader({
  customized,
  title,
  teamName,
}: {
  customized: boolean;
  title: string;
  teamName?: string;
}) {
  const labels = useBoardEditorLabels();

  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <PopoverTitle className="text-sm font-semibold">{title}</PopoverTitle>
        <p className="text-tb-text-tertiary truncate text-xs">
          {customized
            ? labels.selectionToolbar.customPlayerStyle
            : teamName
              ? labels.selectionToolbar.usingTeamStyle(teamName)
              : labels.selectionToolbar.usingDefaultStyle}
        </p>
      </div>
      {customized ? (
        <span className="bg-tb-accent mt-1 size-1.5 shrink-0 rounded-full" />
      ) : null}
    </div>
  );
}

function ResetStyleButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-tb-text-secondary h-7 justify-start px-2 text-xs"
      iconBefore={<ArrowCounterClockwiseIcon />}
      iconSize="sm"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
