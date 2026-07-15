import { createToolApi } from "../../../core/editor/create-tool-api";
import {
  ARROW_TOOL_ID,
  getArrowToolState,
} from "../../../core/tools/arrow-tool-state";
import {
  ArrowTool,
  type ArrowToolDefault,
} from "../../../core/tools/arrow-tool";
import { BOARD_ARROW_DEFAULTS } from "../theme/board-tool-defaults";
import {
  BoardEditorToolbar,
  BoardEditorToolbarButton,
  type BoardEditorToolbarProps,
} from "../editor/toolbar/editor-toolbar";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { cn } from "../../ui/misc";
import { useBoardEditorLabels } from "../editor/board-editor-labels";
import { BoardArrowDefaultIcon } from "./arrow-tool-icons";
import { useBoardEditorToolbarDockOptional } from "../editor/toolbar/toolbar-dock";
import { mergeToolDraftStyle } from "./secondary-toolbar-commands";
import { useMemo } from "react";
import { matchesDraftStyle } from "./secondary-toolbar-utils";

export type BoardEditorArrowToolbarProps = Omit<
  BoardEditorToolbarProps,
  "children"
> & {
  defaults?: readonly ArrowToolDefault[];
};

export function BoardEditorArrowToolbar(props: BoardEditorArrowToolbarProps) {
  const editorStore = useBoardEditorContext();
  const active = useBoardEditorStore(
    editorStore,
    (state) => state.ui.activeToolId === ARROW_TOOL_ID,
  );
  const registeredDefaults = useBoardEditorStore(editorStore, (state) => {
    const arrowTool = state.toolRegistry.definitions[ARROW_TOOL_ID];

    return arrowTool instanceof ArrowTool ? arrowTool.getDefaults() : undefined;
  });
  const defaults = props.defaults ?? registeredDefaults ?? BOARD_ARROW_DEFAULTS;

  if (!active || defaults.length === 0) {
    return null;
  }

  return <BoardEditorArrowToolbarContent {...props} defaults={defaults} />;
}

type BoardEditorArrowToolbarContentProps = Omit<
  BoardEditorArrowToolbarProps,
  "defaults"
> & {
  defaults: readonly ArrowToolDefault[];
};

function BoardEditorArrowToolbarContent({
  defaults,
  orientation = "vertical",
  contentClassName,
  ...toolbarProps
}: BoardEditorArrowToolbarContentProps) {
  const labels = useBoardEditorLabels();
  const editorStore = useBoardEditorContext();
  const toolbarDock = useBoardEditorToolbarDockOptional();
  const toolApi = useMemo(() => createToolApi(editorStore), [editorStore]);
  const toolState = useBoardEditorStore(
    editorStore,
    (state) => state.toolState,
  );
  const arrowState = useMemo(() => getArrowToolState(toolState), [toolState]);

  return (
    <BoardEditorToolbar
      {...toolbarProps}
      contentClassName={cn("items-stretch", contentClassName)}
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
            className="w-full min-w-36 justify-start px-3"
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
            tooltip={false}
          >
            {buttonLabel}
          </BoardEditorToolbarButton>
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
    "arrow-curved": labels.secondaryToolbar.arrowDefaults.curved,
    "arrow-double": labels.secondaryToolbar.arrowDefaults.double,
    "arrow-line": labels.secondaryToolbar.arrowDefaults.line,
    "arrow-straight": labels.secondaryToolbar.arrowDefaults.straight,
    "arrow-wavy": labels.secondaryToolbar.arrowDefaults.wavy,
    cross: labels.secondaryToolbar.arrowDefaults.cross,
    "curved-run": labels.secondaryToolbar.arrowDefaults.curvedRun,
    dribble: labels.secondaryToolbar.arrowDefaults.dribble,
    line: labels.secondaryToolbar.arrowDefaults.line,
    pass: labels.secondaryToolbar.arrowDefaults.pass,
    run: labels.secondaryToolbar.arrowDefaults.run,
    shot: labels.secondaryToolbar.arrowDefaults.shot,
  };

  return (
    toolDefault.tooltip ??
    toolDefault.label ??
    defaultLabels[toolDefault.id] ??
    toolDefault.id
  );
}
