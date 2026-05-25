import { useMemo } from "react";
import { createToolApi } from "../../../../core/editor/create-tool-api";
import { getViewportToFitFrame } from "../../../../core/editor/viewport-utils";
import { useBoardEditorContext } from "../../../adapter/editor/board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarButton,
  type BoardEditorToolbarProps,
} from "../../../board/editor/toolbar/editor-toolbar";
import { useBoardEditorStore } from "../../../adapter/editor/use-board-editor-store";
import { BoardSecondaryToolbar } from "../../../board/toolbar/secondary-toolbar";
import { createFootballPitch } from "../board/football-board";
import {
  FOOTBALL_PITCH_OPTIONS,
  FOOTBALL_PITCH_TOOL_ID,
  FootballPitchPreview,
  getFootballPitchVariant,
} from "../theme/football-pitch-icons";
import { footballTheme, footballThemeAdapters } from "../theme/football-theme";

export type FootballSecondaryToolbarProps = Omit<
  BoardEditorToolbarProps,
  "children"
>;

export function FootballSecondaryToolbar({
  orientation = "vertical",
  ...toolbarProps
}: FootballSecondaryToolbarProps) {
  const editorStore = useBoardEditorContext();
  const toolApi = useMemo(() => createToolApi(editorStore), [editorStore]);
  const state = useBoardEditorStore(
    editorStore,
    (currentState) => currentState,
  );

  if (state.ui.activeToolId === FOOTBALL_PITCH_TOOL_ID) {
    const variant = getFootballPitchVariant(state.board.frame.markup?.variant);

    return (
      <BoardEditorToolbar {...toolbarProps} orientation={orientation}>
        {FOOTBALL_PITCH_OPTIONS.map((option) => (
          <BoardEditorToolbarButton
            active={variant === option.value}
            aria-label={option.label}
            className="h-auto w-auto p-1.5"
            key={option.value}
            onClick={() => {
              const frame = createFootballPitch(option.value);
              toolApi.setFrame(frame);

              if (state.ui.canvasRect) {
                state.actions.setViewport(
                  getViewportToFitFrame({
                    frame,
                    canvasRect: state.ui.canvasRect,
                  }),
                );
              }
            }}
            tooltip={option.label}
          >
            <FootballPitchPreview
              className="rounded-md"
              variant={option.value}
              width={104}
              height={64}
            />
          </BoardEditorToolbarButton>
        ))}
      </BoardEditorToolbar>
    );
  }

  return (
    <BoardSecondaryToolbar
      {...toolbarProps}
      adapters={footballThemeAdapters}
      orientation={orientation}
      theme={footballTheme}
    />
  );
}
