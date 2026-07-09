import { PaletteIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import {
  updatePlayerObject,
  type PlayerObject,
} from "../../../../core/objects/player-object";
import {
  getBoardPlayerGroup,
  getBoardPlayerGroups,
} from "../../../../core/board/player-groups";
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
import { ColorPicker, DEFAULT_BOARD_COLORS } from "../../../ui/color-picker";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../../../ui/select";
import { useBoardEditorLabels } from "../board-editor-labels";
import {
  PlayerAppearanceColorFields,
  readUploadedAsset,
} from "../../player/player-appearance-fields";
import { getThemePlayerAppearanceDefinitions } from "../../theme/board-theme";
import {
  movePlayerToGroup,
  resetPlayerStyleToGroup,
} from "../../team/player-team-commands";

/**
 * Per-player edits are intentionally a small set of overrides on top of the
 * team style — recoloring (say, the goalkeeper) or a photo — rather than a
 * full appearance editor, so a team keeps one coherent look. Team-wide
 * styling lives in the Team panel.
 */
export function BoardEditorPlayerSelectionToolbar({
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
  const appearance = getThemePlayerAppearanceDefinitions(theme).find(
    (candidate) =>
      candidate.id ===
      (selectedObject.props.appearanceId ?? playerGroup?.style.appearanceId),
  );

  const updatePlayer = (input: Parameters<typeof updatePlayerObject>[1]) => {
    toolApi.updateObjects([selectedObject.id], (object) =>
      updatePlayerObject(object as PlayerObject, input),
    );
  };

  return (
    <BoardEditorSelectionToolbarPositioner
      anchorLeft={toolbarLeft}
      anchorTop={toolbarTop}
      anchorBottom={toolbarBottom}
      viewportWidth={viewportWidth}
      viewportHeight={viewportHeight}
    >
      <BoardEditorToolbar className={className}>
        {playerGroups.length > 1 ? (
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
              className="h-10 w-auto max-w-28 px-3 text-sm"
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
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Input
          aria-label={labels.selectionToolbar.playerLabel}
          className="h-10 w-12 px-2 text-center text-sm font-medium md:text-sm"
          onChange={(event) => updatePlayer({ label: event.target.value })}
          value={selectedObject.props.label ?? ""}
          wrapperProps={{ className: "h-10 w-auto" }}
        />
        <Input
          aria-label={labels.playerAppearance.caption}
          className="h-10 w-28 px-3 text-sm font-medium md:text-sm"
          onChange={(event) =>
            updatePlayer({
              caption: {
                ...selectedObject.props.caption,
                text: event.target.value,
              },
            })
          }
          value={selectedObject.props.caption?.text ?? ""}
          wrapperProps={{ className: "h-10 w-auto" }}
        />

        <BoardEditorToolbarPopoverButton
          ariaLabel={labels.selectionToolbar.playerColor}
          tooltip={labels.selectionToolbar.color}
          popoverSide="top"
          content={
            <ColorPicker
              value={selectedObject.props.color}
              onChange={(value) => updatePlayer({ color: value })}
              chooseCustomColorLabel={labels.colorPicker.chooseCustomColor}
              defaultColors={[...DEFAULT_BOARD_COLORS]}
            />
          }
          icon={
            <span
              className="border-tb-border-default inline-flex h-6 w-6 rounded-full border"
              style={{ backgroundColor: selectedObject.props.color }}
            >
              <span className="sr-only">{selectedObject.props.color}</span>
            </span>
          }
        />
        <BoardEditorToolbarPopoverButton
          ariaLabel={labels.selectionToolbar.playerStyle}
          tooltip={labels.selectionToolbar.playerStyle}
          popoverSide="top"
          icon={<PaletteIcon />}
          content={
            <div className="flex w-56 flex-col gap-1.5 p-1">
              <PlayerAppearanceColorFields
                appearance={appearance}
                labels={labels}
                value={{
                  color: selectedObject.props.color,
                  colors: selectedObject.props.colors,
                }}
                onChange={(patch) =>
                  updatePlayer({
                    ...(patch.color !== undefined
                      ? { color: patch.color }
                      : {}),
                    ...("colors" in patch ? { colors: patch.colors } : {}),
                  })
                }
              />

              <div className="flex h-7 items-center justify-between gap-3">
                <span className="text-tb-text-secondary text-xs font-medium">
                  {labels.selectionToolbar.playerPhotoUpload}
                </span>
                <div className="flex items-center gap-1">
                  <label
                    className="border-tb-border-default bg-tb-background-screen hover:bg-tb-neutral-soft focus-visible:focus-ring transition-interactive flex h-7 cursor-pointer items-center gap-1.5 rounded-md border px-2 text-xs outline-hidden"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.currentTarget
                          .querySelector<HTMLInputElement>("input")
                          ?.click();
                      }
                    }}
                  >
                    <UploadSimpleIcon className="size-3.5" />
                    <input
                      type="file"
                      accept="image/*,.svg"
                      className="sr-only"
                      tabIndex={-1}
                      aria-label={labels.selectionToolbar.playerPhotoUpload}
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];

                        if (file) {
                          readUploadedAsset(file, (asset) =>
                            updatePlayer({
                              appearanceId: "image",
                              asset,
                            }),
                          );
                        }

                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {selectedObject.props.asset ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() =>
                        updatePlayer({
                          asset: undefined,
                          appearanceId: playerGroup?.style.appearanceId,
                        })
                      }
                    >
                      {labels.selectionToolbar.playerPhotoRemove}
                    </Button>
                  ) : null}
                </div>
              </div>

              {playerGroup ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 justify-start px-2 text-xs"
                  onClick={() =>
                    resetPlayerStyleToGroup(toolApi, selectedObject.id)
                  }
                >
                  {labels.selectionToolbar.resetToTeamStyle}
                </Button>
              ) : null}
            </div>
          }
        />
        <BoardEditorToolbarSeparator />
        <BoardEditorSelectionActionsMenu
          selectedObjectIds={[selectedObject.id]}
        />
      </BoardEditorToolbar>
    </BoardEditorSelectionToolbarPositioner>
  );
}
