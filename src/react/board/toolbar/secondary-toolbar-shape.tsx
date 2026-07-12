import { useMemo } from "react";
import type { ShapeToolDefault } from "../../../core/tools/shape-tool";
import { BOARD_SHAPE_DEFAULTS } from "../theme/board-tool-defaults";
import {
  SHAPE_TOOL_ID,
  getShapeToolState,
} from "../../../core/tools/shape-tool-state";
import {
  BoardEditorToolbar,
  BoardEditorToolbarButton,
  type BoardEditorToolbarProps,
} from "../editor/toolbar/editor-toolbar";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { useBoardEditorLabels } from "../editor/board-editor-labels";
import { BoardShapeDefaultIcon } from "./tool-icons";
import { useBoardEditorToolbarDockOptional } from "../editor/toolbar/editor-toolbar";
import { createToolApi } from "../../../core/editor/create-tool-api";
import { mergeToolDraftStyle } from "./secondary-toolbar-commands";
import { matchesDraftStyle } from "./secondary-toolbar-utils";

export type BoardEditorShapeToolbarProps = Omit<
  BoardEditorToolbarProps,
  "children"
> & {
  defaults?: readonly ShapeToolDefault[];
};

export function BoardEditorShapeToolbar(props: BoardEditorShapeToolbarProps) {
  const editorStore = useBoardEditorContext();
  const active = useBoardEditorStore(
    editorStore,
    (state) => state.ui.activeToolId === SHAPE_TOOL_ID,
  );
  const defaults = props.defaults ?? BOARD_SHAPE_DEFAULTS;

  if (!active || defaults.length === 0) {
    return null;
  }

  return <BoardEditorShapeToolbarContent {...props} defaults={defaults} />;
}

type BoardEditorShapeToolbarContentProps = Omit<
  BoardEditorShapeToolbarProps,
  "defaults"
> & {
  defaults: readonly ShapeToolDefault[];
};

function BoardEditorShapeToolbarContent({
  defaults,
  orientation = "vertical",
  ...toolbarProps
}: BoardEditorShapeToolbarContentProps) {
  const labels = useBoardEditorLabels();
  const editorStore = useBoardEditorContext();
  const toolbarDock = useBoardEditorToolbarDockOptional();
  const toolApi = useMemo(() => createToolApi(editorStore), [editorStore]);
  const toolState = useBoardEditorStore(
    editorStore,
    (state) => state.toolState,
  );
  const shapeState = useMemo(() => getShapeToolState(toolState), [toolState]);

  return (
    <BoardEditorToolbar
      {...toolbarProps}
      orientation={orientation}
      tooltipSide="right"
    >
      {defaults.map((toolDefault) => {
        const draftStyle = {
          ...shapeState.draftStyle,
          ...toolDefault.draftStyle,
        };

        const buttonLabel = getShapeDefaultLabel(toolDefault, labels);

        return (
          <BoardEditorToolbarButton
            aria-label={buttonLabel}
            active={matchesDraftStyle(
              shapeState.draftStyle,
              toolDefault.draftStyle,
            )}
            className="aspect-square px-0"
            iconBefore={
              <BoardShapeDefaultIcon
                draftStyle={draftStyle}
                className="h-6 w-6"
                width={24}
                height={24}
              />
            }
            key={toolDefault.id}
            onClick={() => {
              mergeToolDraftStyle(toolApi, SHAPE_TOOL_ID, shapeState, {
                ...toolDefault.draftStyle,
              });
              toolbarDock?.requestDismiss();
            }}
            iconSize="xl"
            size="md"
            tooltip={buttonLabel}
          />
        );
      })}
    </BoardEditorToolbar>
  );
}

function getShapeDefaultLabel(
  toolDefault: ShapeToolDefault,
  labels: ReturnType<typeof useBoardEditorLabels>,
) {
  const defaultLabels: Record<string, string> = {
    "shape-diamond": labels.secondaryToolbar.shapeDefaults.diamond,
    "shape-oval": labels.secondaryToolbar.shapeDefaults.oval,
    "shape-polygon": labels.secondaryToolbar.shapeDefaults.polygon,
    "shape-rectangle": labels.secondaryToolbar.shapeDefaults.rectangle,
    "shape-triangle": labels.secondaryToolbar.shapeDefaults.triangle,
  };

  return (
    toolDefault.tooltip ??
    toolDefault.label ??
    defaultLabels[toolDefault.id] ??
    toolDefault.id
  );
}
