import { useMemo } from "react";
import type { BoardEditorState } from "../../core/editor/types";
import { createPlayerObject, PLAYER_OBJECT_TYPE } from "../../core/objects/player-object";
import { useBoardEditorContext } from "../../react/components/board-editor-context";
import { useBoardEditorStore } from "../../react/hooks/use-board-editor-store";
import { renderPlayer } from "../../tools/player-tool";
import { getPlayerToolState, PLAYER_TOOL_ID, type PlayerDraftStyle } from "../../tools/player-tool-state";
import { FOOTBALL_PLAYER_PRESET_COLORS } from "./football-example-catalog";
import { FootballToolIconCanvas } from "./football-tool-icon-canvas";

function parseNumericLabel(label: unknown) {
  if (typeof label !== "string" || label.trim() === "") {
    return undefined;
  }

  const value = Number.parseInt(label, 10);

  if (!Number.isFinite(value) || String(value) !== label.trim()) {
    return undefined;
  }

  return value;
}

function getCurrentPlayerLabel(
  state: Pick<BoardEditorState, "toolState" | "board">,
  color: string,
) {
  const playerState = getPlayerToolState(state.toolState);
  const colorKey = color.trim().toLowerCase();
  const nextLabelFromState = playerState.nextNumericLabelByColor[colorKey] ?? 1;
  const nextLabelFromBoard =
    Math.max(
      0,
      ...Object.values(state.board.objects.byId)
        .filter(
          (object) =>
            object.type === PLAYER_OBJECT_TYPE &&
            typeof object.props.color === "string" &&
            object.props.color.trim().toLowerCase() === colorKey,
        )
        .map((object) => parseNumericLabel(object.props.label))
        .filter((value): value is number => typeof value === "number"),
    ) + 1;

  return String(Math.max(nextLabelFromState, nextLabelFromBoard));
}

export function FootballPlayerPresetIcon({
  draftStyle,
  label,
  className = "h-5 w-5",
  width = 20,
  height = 20,
}: {
  draftStyle: PlayerDraftStyle;
  label: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  const player = useMemo(
    () =>
      createPlayerObject({
        id: "player-icon-preview",
        position: { x: 0, y: 0 },
        size: {
          width: draftStyle.size,
          height: draftStyle.size,
          mode: "world",
        },
        color: draftStyle.color,
        label,
        appearance: draftStyle.appearance,
      }),
    [draftStyle, label],
  );

  return (
    <FootballToolIconCanvas
      object={player}
      renderer={renderPlayer}
      className={className}
      width={width}
      height={height}
    />
  );
}

export function FootballPlayerToolIcon() {
  const store = useBoardEditorContext();
  const rawPlayerToolState = useBoardEditorStore(
    store,
    (state) => state.toolState[PLAYER_TOOL_ID],
  );
  const board = useBoardEditorStore(store, (state) => state.board);
  const toolState = useMemo(
    () => ({
      [PLAYER_TOOL_ID]: rawPlayerToolState,
    }),
    [rawPlayerToolState],
  );
  const draftStyle = useMemo(
    () => getPlayerToolState(toolState).draftStyle,
    [toolState],
  );
  const color = draftStyle.color || (FOOTBALL_PLAYER_PRESET_COLORS[0] ?? "#111827");
  const label = useMemo(
    () => getCurrentPlayerLabel({ toolState, board }, color),
    [board, color, toolState],
  );

  return <FootballPlayerPresetIcon draftStyle={draftStyle} label={label} />;
}
