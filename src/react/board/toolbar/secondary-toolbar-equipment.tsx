import { useMemo } from "react";
import { EQUIPMENT_OBJECT_TYPE } from "../../../core/objects/equipment-object";
import {
  createThemeObjectDefinition,
  type BoardTheme,
  type BoardThemeAdapters,
} from "../theme/board-theme";
import { getThemeEquipmentDefinitions } from "../theme/equipment-object-adapter";
import { createToolApi } from "../../../core/editor/create-tool-api";
import {
  EQUIPMENT_TOOL_ID,
  getEquipmentToolState,
} from "../../../core/tools/equipment-tool-state";
import {
  BoardEditorToolbar,
  BoardEditorToolbarButton,
  type BoardEditorToolbarProps,
} from "../editor/toolbar/editor-toolbar";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { useBoardEditorToolbarDockOptional } from "../editor/toolbar/toolbar-dock";
import { BoardEquipmentDefinitionIcon } from "./equipment-tool-icons";
import { setToolStatePatch } from "./secondary-toolbar-commands";
import { useBoardEditorTheme } from "../theme/board-editor-theme-context";

export type BoardEditorEquipmentToolbarProps = Omit<
  BoardEditorToolbarProps,
  "children"
> & {
  adapters?: BoardThemeAdapters;
  theme?: Pick<BoardTheme, "objects">;
};

export function BoardEditorEquipmentToolbar(
  props: BoardEditorEquipmentToolbarProps,
) {
  const editorStore = useBoardEditorContext();
  const active = useBoardEditorStore(
    editorStore,
    (state) => state.ui.activeToolId === EQUIPMENT_TOOL_ID,
  );

  if (!active) {
    return null;
  }

  return <BoardEditorEquipmentToolbarContent {...props} />;
}

function BoardEditorEquipmentToolbarContent({
  adapters,
  theme,
  orientation = "vertical",
  ...toolbarProps
}: BoardEditorEquipmentToolbarProps) {
  const editorStore = useBoardEditorContext();
  const toolbarDock = useBoardEditorToolbarDockOptional();
  const toolApi = useMemo(() => createToolApi(editorStore), [editorStore]);
  const toolState = useBoardEditorStore(
    editorStore,
    (state) => state.toolState,
  );
  const equipmentState = useMemo(
    () => getEquipmentToolState(toolState),
    [toolState],
  );
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

  if (equipmentDefinitions.length === 0 || !equipmentRenderer) {
    return null;
  }

  return (
    <BoardEditorToolbar
      {...toolbarProps}
      orientation={orientation}
      tooltipSide="right"
    >
      {equipmentDefinitions.map((definition) => (
        <BoardEditorToolbarButton
          aria-label={definition.label}
          active={equipmentState.draftStyle.kind === definition.kind}
          className="aspect-square px-0"
          iconBefore={
            <BoardEquipmentDefinitionIcon
              definition={definition}
              renderer={equipmentRenderer}
              size={24}
            />
          }
          key={definition.kind}
          onClick={() => {
            setToolStatePatch(toolApi, EQUIPMENT_TOOL_ID, equipmentState, {
              draftStyle: {
                ...equipmentState.draftStyle,
                kind: definition.kind,
              },
            });
            toolbarDock?.requestDismiss();
          }}
          iconSize="xl"
          size="md"
          tooltip={definition.label}
        />
      ))}
    </BoardEditorToolbar>
  );
}
