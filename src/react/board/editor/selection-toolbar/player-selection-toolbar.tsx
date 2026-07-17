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
  BoardEditorToolbarGroup,
  BoardEditorToolbarSeparator,
} from "../toolbar/editor-toolbar";
import { BoardEditorSelectionToolbarPositioner } from "./selection-toolbar-positioner";
import { BoardEditorSelectionActionsMenu } from "./selection-actions-menu";
import type { BoardEditorSelectionToolbarRendererProps } from "./selection-toolbar-types";
import { DropdownMenuItem } from "../../../ui/dropdown-menu";
import { useBoardEditorLabels } from "../board-editor-labels";
import { getThemePlayerAppearanceDefinitions } from "../../theme/board-theme";
import {
  movePlayerToGroup,
  resetPlayerStyleToGroup,
} from "../../team/player-team-commands";
import {
  PlayerAppearanceSelectionControl,
  PlayerCaptionSelectionControl,
  PlayerLabelSelectionControl,
} from "./player-selection-controls";
import { PlayerTeamSelectionControl } from "./player-team-selection-control";

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
        controlSize="sm"
      >
        {playerGroups.length > 1 ? (
          <>
            <PlayerTeamSelectionControl
              playerGroups={playerGroups}
              value={selectedObject.props.groupId ?? ""}
              onValueChange={(value) => {
                movePlayerToGroup(toolApi, selectedObject.id, value);
              }}
            />
            <BoardEditorToolbarSeparator />
          </>
        ) : null}

        <BoardEditorToolbarGroup>
          <PlayerLabelSelectionControl
            customized={hasLabelStyleOverride}
            fontSize={effectiveStyle.fontSize}
            label={selectedObject.props.label}
            labelColor={labelColor}
            labels={labels}
            onChange={(label) => updatePlayer({ label })}
            onStyleChange={(patch) =>
              applyPlayerStylePatch({
                ...(patch.color !== undefined
                  ? { labelColor: patch.color }
                  : {}),
                ...(patch.fontSize !== undefined
                  ? { fontSize: patch.fontSize }
                  : {}),
              })
            }
            onReset={() =>
              applyPlayerStylePatch({
                fontSize: undefined,
                labelColor: undefined,
              })
            }
          />
          <PlayerCaptionSelectionControl
            caption={effectiveStyle.caption ?? {}}
            customized={hasCaptionStyleOverride}
            fallbackBackgroundColor={effectiveStyle.color}
            labels={labels}
            text={selectedObject.props.caption?.text}
            onChange={(caption) => applyPlayerStylePatch({ caption })}
            onTextChange={(text) =>
              updatePlayer({
                caption: { ...selectedObject.props.caption, text },
              })
            }
            onReset={() => applyPlayerStylePatch({ caption: undefined })}
          />
        </BoardEditorToolbarGroup>

        <BoardEditorToolbarSeparator />

        <PlayerAppearanceSelectionControl
          appearance={appearance}
          appearanceRenderers={adapters?.playerAppearanceRenderers}
          appearances={theme?.playerAppearances}
          customized={hasAppearanceOverride}
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
          onReset={resetAppearance}
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
