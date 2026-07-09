import { createToolApi } from "../../../core/editor/create-tool-api";
import {
  ARROW_TOOL_ID,
  getArrowToolState,
} from "../../../core/tools/arrow-tool-state";
import type { ArrowToolDefault } from "../../../core/tools/arrow-tool";
import {
  BoardEditorToolbar,
  BoardEditorToolbarButton,
  type BoardEditorToolbarProps,
} from "../editor/toolbar/editor-toolbar";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { useBoardEditorLabels } from "../editor/board-editor-labels";
import { BoardArrowDefaultIcon } from "./tool-icons";
import { useBoardEditorToolbarDockOptional } from "../editor/toolbar/editor-toolbar";
import { mergeToolDraftStyle } from "./secondary-toolbar-commands";
import { useMemo } from "react";
import { matchesDraftStyle } from "./secondary-toolbar-utils";

export type BoardEditorArrowToolbarProps = Omit<
  BoardEditorToolbarProps,
  "children"
> & {
  defaults: ArrowToolDefault[];
};

export function BoardEditorArrowToolbar({
  defaults,
  orientation = "vertical",
  ...toolbarProps
}: BoardEditorArrowToolbarProps) {
  const labels = useBoardEditorLabels();
  const editorStore = useBoardEditorContext();
  const toolbarDock = useBoardEditorToolbarDockOptional();
  const toolApi = useMemo(() => createToolApi(editorStore), [editorStore]);
  const toolState = useBoardEditorStore(
    editorStore,
    (state) => state.toolState,
  );
  const arrowState = useMemo(() => getArrowToolState(toolState), [toolState]);

  if (defaults.length === 0) {
    return null;
  }

  return (
    <BoardEditorToolbar
      {...toolbarProps}
      orientation={orientation}
      tooltipSide="right"
    >
      {defaults.map((toolDefault) => {
        const draftStyle = {
          ...arrowState.draftStyle,
          ...toolDefault.draftStyle,
        };

        const buttonLabel = getArrowDefaultLabel(toolDefault, labels);

        return (
          <BoardEditorToolbarButton
            aria-label={buttonLabel}
            active={matchesDraftStyle(
              arrowState.draftStyle,
              toolDefault.draftStyle,
            )}
            className="aspect-square px-0"
            iconBefore={
              <BoardArrowDefaultIcon
                draftStyle={draftStyle}
                className="h-6 w-6 overflow-visible"
                width={24}
                height={24}
              />
            }
            key={toolDefault.id}
            onClick={() => {
              mergeToolDraftStyle(toolApi, ARROW_TOOL_ID, arrowState, {
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

function getArrowDefaultLabel(
  toolDefault: ArrowToolDefault,
  labels: ReturnType<typeof useBoardEditorLabels>,
) {
  const defaultLabels: Record<string, string> = {
    dribble: labels.secondaryToolbar.arrowDefaults.dribble,
    line: labels.secondaryToolbar.arrowDefaults.line,
    "lofted-pass": labels.secondaryToolbar.arrowDefaults.loftedPass,
    run: labels.secondaryToolbar.arrowDefaults.run,
    screen: labels.secondaryToolbar.arrowDefaults.screen,
  };

  return (
    toolDefault.tooltip ??
    toolDefault.label ??
    defaultLabels[toolDefault.id] ??
    toolDefault.id
  );
}
