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
import { useBoardEditorTeamPanelOptional } from "../../team/team-panel-context";
import {
  createThemeObjectDefinition,
  type BoardTheme,
  type BoardThemeAdapters,
} from "../../theme/board-theme";
import { getThemeEquipmentDefinitions } from "../../theme/equipment-object-adapter";
import { BoardArrowToolIcon } from "../../toolbar/arrow-tool-icons";
import { BoardEquipmentToolIcon } from "../../toolbar/equipment-tool-icons";
import { BoardPlayerToolIcon } from "../../toolbar/player-tool-icons";
import { BoardShapeToolIcon } from "../../toolbar/shape-tool-icons";
import { getDefaultToolIcon } from "./default-tool-icons";
import {
  BoardEditorToolbarButton,
  type BoardEditorToolbarButtonProps,
} from "./editor-toolbar";
import type { IconRender } from "../../../ui/icon";
import { useBoardEditorTheme } from "../../theme/board-editor-theme-context";

export type BoardEditorToolControlProps = Omit<
  BoardEditorToolbarButtonProps,
  "active" | "iconBefore"
> & {
  toolId: ToolId;
  label?: string;
  icon?: IconRender;
  onActivate?: (toolId: ToolId) => void;
};

export function BoardEditorToolControl({
  toolId,
  label,
  icon,
  className,
  activeVariant,
  onActivate,
  onClick,
  tooltip,
  ...props
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
      {...props}
      active={activeToolId === toolId}
      activeVariant={activeVariant}
      aria-label={resolvedLabel}
      className={className}
      iconBefore={resolvedIcon}
      onClick={(event) => {
        actions.setActiveTool(toolId);
        onActivate?.(toolId);
        onClick?.(event);
      }}
      tooltip={tooltip ?? resolvedLabel}
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

export type BoardEditorPlayerToolControlProps =
  BoardEditorDefaultToolControlProps & {
    adapters?: BoardThemeAdapters;
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
  adapters,
  icon,
  onActivate,
  ...props
}: BoardEditorPlayerToolControlProps) {
  const teamPanel = useBoardEditorTeamPanelOptional();
  const inheritedTheme = useBoardEditorTheme();
  const resolvedAdapters = adapters ?? inheritedTheme.adapters;
  const resolvedIcon = icon ?? (
    <BoardPlayerToolIcon
      appearanceRenderers={resolvedAdapters?.playerAppearanceRenderers}
    />
  );

  return (
    <BoardEditorToolControl
      {...props}
      icon={resolvedIcon}
      toolId={PLAYER_TOOL_ID}
      onActivate={(toolId) => {
        teamPanel?.closeTeamPanel();
        onActivate?.(toolId);
      }}
    />
  );
}

export function BoardEditorEquipmentToolControl({
  adapters,
  icon,
  theme,
  ...props
}: BoardEditorEquipmentToolControlProps) {
  const inheritedTheme = useBoardEditorTheme();
  const resolvedAdapters = adapters ?? inheritedTheme.adapters;
  const resolvedTheme = theme ?? inheritedTheme.theme;
  const equipmentDefinitions = getThemeEquipmentDefinitions(resolvedTheme);
  const equipmentRenderer = useMemo(
    () =>
      createThemeObjectDefinition({
        adapters: resolvedAdapters,
        theme: resolvedTheme,
        type: EQUIPMENT_OBJECT_TYPE,
      })?.canvas?.render,
    [resolvedAdapters, resolvedTheme],
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
