import { BoardEditorToolControl } from "../components/board-editor-tool-control";
import {
  BoardEditorToolbar,
  type BoardEditorToolbarProps,
} from "../components/board-editor-toolbar";
import {
  FootballArrowToolIcon,
  FootballEquipmentToolIcon,
  FootballPlayerToolIcon,
  FootballShapeToolIcon,
} from "./football-tool-icons";

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
    </BoardEditorToolbar>
  );
}
