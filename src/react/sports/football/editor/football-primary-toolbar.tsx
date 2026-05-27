import { BoardEditorToolControl } from "../../../board/editor/toolbar/tool-control";
import { useBoardEditorContext } from "../../../adapter/editor/board-editor-context";
import type { BoardEditorToolbarProps } from "../../../board/editor/toolbar/editor-toolbar";
import { useBoardEditorStore } from "../../../adapter/editor/use-board-editor-store";
import { BoardPrimaryToolbar } from "../../../board/toolbar/primary-toolbar";
import {
  FOOTBALL_PITCH_TOOL_ID,
  FootballPitchPreview,
  getFootballPitchVariant,
} from "../theme/football-pitch-icons";
import { footballTheme, footballThemeAdapters } from "../theme/football-theme";

export type FootballPrimaryToolbarProps = Omit<
  BoardEditorToolbarProps,
  "children"
>;

export function FootballPrimaryToolbar({
  orientation = "vertical",
  ...toolbarProps
}: FootballPrimaryToolbarProps) {
  return (
    <BoardPrimaryToolbar
      {...toolbarProps}
      adapters={footballThemeAdapters}
      orientation={orientation}
      showEquipment
      theme={footballTheme}
    >
      <FootballPitchToolControl />
    </BoardPrimaryToolbar>
  );
}

function FootballPitchToolControl() {
  const store = useBoardEditorContext();
  const variant = useBoardEditorStore(store, (state) =>
    getFootballPitchVariant(state.board.frame.markup?.variant),
  );

  return (
    <BoardEditorToolControl
      toolId={FOOTBALL_PITCH_TOOL_ID}
      icon={
        <FootballPitchPreview
          className="rounded-sm"
          variant={variant}
          width={24}
          height={24}
        />
      }
    />
  );
}
