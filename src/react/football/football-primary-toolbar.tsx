import { BoardEditorToolControl } from "../components/board-editor-tool-control";
import { BoardEditorToolbar } from "../components/board-editor-toolbar";
import {
  FootballArrowToolIcon,
  FootballEquipmentToolIcon,
  FootballPlayerToolIcon,
  FootballShapeToolIcon,
} from "./football-tool-icons";

export type FootballPrimaryToolbarProps = {
  className?: string;
};

export function FootballPrimaryToolbar({
  className = "flex-col",
}: FootballPrimaryToolbarProps) {
  return (
    <BoardEditorToolbar className={className}>
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
