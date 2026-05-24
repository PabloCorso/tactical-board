import { BoardEditorToolControl } from "../components/board-editor-tool-control";
import { useBoardEditorContext } from "../components/board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarSeparator,
  type BoardEditorToolbarProps,
} from "../components/board-editor-toolbar";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import {
  FootballArrowToolIcon,
  FootballEquipmentToolIcon,
  FootballPlayerToolIcon,
  FootballShapeToolIcon,
} from "./football-tool-icons";
import {
  FOOTBALL_PITCH_TOOL_ID,
  FootballPitchSurfacePreview,
  getFootballPitchSurfaceVariant,
} from "./football-pitch-surface-icons";

export type FootballPrimaryToolbarProps = Omit<
  BoardEditorToolbarProps,
  "children"
>;

export function FootballPrimaryToolbar({
  orientation = "vertical",
  ...toolbarProps
}: FootballPrimaryToolbarProps) {
  return (
    <BoardEditorToolbar {...toolbarProps} orientation={orientation}>
      <BoardEditorToolControl toolId="select" />
      <BoardEditorToolControl toolId="hand" />
      <BoardEditorToolControl
        toolId="player"
        icon={<FootballPlayerToolIcon />}
      />
      <BoardEditorToolControl
        toolId="equipment"
        icon={<FootballEquipmentToolIcon />}
      />
      <BoardEditorToolControl toolId="text" />
      <BoardEditorToolControl toolId="arrow" icon={<FootballArrowToolIcon />} />
      <BoardEditorToolControl toolId="shape" icon={<FootballShapeToolIcon />} />
      <BoardEditorToolbarSeparator />
      <FootballPitchToolControl />
    </BoardEditorToolbar>
  );
}

function FootballPitchToolControl() {
  const store = useBoardEditorContext();
  const variant = useBoardEditorStore(store, (state) =>
    getFootballPitchSurfaceVariant(state.board.surface.markup?.variant),
  );

  return (
    <BoardEditorToolControl
      toolId={FOOTBALL_PITCH_TOOL_ID}
      icon={
        <FootballPitchSurfacePreview
          className="rounded-sm"
          variant={variant}
          width={24}
          height={16}
        />
      }
    />
  );
}
