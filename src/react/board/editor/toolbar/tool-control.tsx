import type { ToolId } from "../../../../core/board/types";
import { ARROW_TOOL_ID } from "../../../../core/tools/arrow-tool-state";
import { EQUIPMENT_OBJECT_TYPE } from "../../../../core/objects/equipment-object";
import { EQUIPMENT_TOOL_ID } from "../../../../core/tools/equipment-tool-state";
import { PLAYER_TOOL_ID } from "../../../../core/tools/player-tool-state";
import { SELECT_TOOL_ID } from "../../../../core/tools/select-tool-state";
import { SHAPE_TOOL_ID } from "../../../../core/tools/shape-tool-state";
import { TEXT_TOOL_ID } from "../../../../core/tools/text-tool-state";
import { useMemo } from "react";
import { useBoardEditorStore } from "../../../adapter/editor/use-board-editor-store";
import { useBoardEditorContext } from "../../../adapter/editor/board-editor-context";
import {
  createThemeObjectRenderer,
  type BoardTheme,
  type BoardThemeAdapters,
} from "../../theme/board-theme";
import { getThemeEquipmentDefinitions } from "../../theme/equipment-object-adapter";
import {
  BoardArrowToolIcon,
  BoardEquipmentToolIcon,
  BoardPlayerToolIcon,
  BoardShapeToolIcon,
} from "../../toolbar/tool-icons";
import { getDefaultToolIcon } from "./default-tool-icons";
import { BoardEditorToolbarButton } from "./editor-toolbar";
import type { IconRender } from "../../../ui/icon";

export type BoardEditorToolControlProps = {
  toolId: ToolId;
  label?: string;
  icon?: IconRender;
  className?: string;
};

export function BoardEditorToolControl({
  toolId,
  label,
  icon,
  className,
}: BoardEditorToolControlProps) {
  const store = useBoardEditorContext();
  const activeToolId = useBoardEditorStore(
    store,
    (state) => state.ui.activeToolId,
  );
  const tool = useBoardEditorStore(
    store,
    (state) => state.toolRegistry.definitions[toolId],
  );
  const actions = useBoardEditorStore(store, (state) => state.actions);

  if (!tool) {
    return null;
  }

  const resolvedLabel = label ?? tool.label;
  const resolvedIcon = icon ?? getDefaultToolIcon(toolId);

  return (
    <BoardEditorToolbarButton
      active={activeToolId === toolId}
      aria-label={resolvedLabel}
      className={className}
      iconBefore={resolvedIcon}
      onClick={() => actions.setActiveTool(toolId)}
      tooltip={resolvedLabel}
    />
  );
}

export type BoardEditorDefaultToolControlProps = Omit<
  BoardEditorToolControlProps,
  "toolId"
>;

export type BoardEditorEquipmentToolControlProps =
  BoardEditorDefaultToolControlProps & {
    adapters?: BoardThemeAdapters;
    theme?: Pick<BoardTheme, "objects">;
  };

export function BoardEditorSelectToolControl(
  props: BoardEditorDefaultToolControlProps,
) {
  return <BoardEditorToolControl {...props} toolId={SELECT_TOOL_ID} />;
}

export function BoardEditorHandToolControl(
  props: BoardEditorDefaultToolControlProps,
) {
  return <BoardEditorToolControl {...props} toolId="hand" />;
}

export function BoardEditorPlayerToolControl({
  icon = <BoardPlayerToolIcon />,
  ...props
}: BoardEditorDefaultToolControlProps) {
  return (
    <BoardEditorToolControl {...props} icon={icon} toolId={PLAYER_TOOL_ID} />
  );
}

export function BoardEditorEquipmentToolControl({
  adapters,
  icon,
  theme,
  ...props
}: BoardEditorEquipmentToolControlProps) {
  const equipmentDefinitions = getThemeEquipmentDefinitions(theme);
  const equipmentRenderer = useMemo(
    () =>
      createThemeObjectRenderer({
        adapters,
        theme,
        type: EQUIPMENT_OBJECT_TYPE,
      }),
    [adapters, theme],
  );
  const resolvedIcon =
    icon ??
    (equipmentRenderer ? (
      <BoardEquipmentToolIcon
        definitions={equipmentDefinitions}
        renderer={equipmentRenderer}
      />
    ) : undefined);

  return (
    <BoardEditorToolControl
      {...props}
      icon={resolvedIcon}
      toolId={EQUIPMENT_TOOL_ID}
    />
  );
}

export function BoardEditorTextToolControl(
  props: BoardEditorDefaultToolControlProps,
) {
  return <BoardEditorToolControl {...props} toolId={TEXT_TOOL_ID} />;
}

export function BoardEditorArrowToolControl({
  icon = <BoardArrowToolIcon />,
  ...props
}: BoardEditorDefaultToolControlProps) {
  return (
    <BoardEditorToolControl {...props} icon={icon} toolId={ARROW_TOOL_ID} />
  );
}

export function BoardEditorShapeToolControl({
  icon = <BoardShapeToolIcon />,
  ...props
}: BoardEditorDefaultToolControlProps) {
  return (
    <BoardEditorToolControl {...props} icon={icon} toolId={SHAPE_TOOL_ID} />
  );
}
