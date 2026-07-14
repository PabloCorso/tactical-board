import type { TextObject } from "../../../../core/objects/text-object";
import { createToolApi } from "../../../../core/editor/create-tool-api";
import { updateTextObjectFromAnchor } from "../../../../core/tools/text-editing";
import { useBoardEditorContext } from "../../../adapter/editor/board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarPopoverButton,
  BoardEditorToolbarSeparator,
} from "../toolbar/editor-toolbar";
import { BoardEditorSelectionToolbarPositioner } from "./selection-toolbar-positioner";
import { BoardEditorSelectionActionsMenu } from "./selection-actions-menu";
import type { BoardEditorSelectionToolbarRendererProps } from "./selection-toolbar-types";
import {
  ColorPicker,
  ColorSwatch,
  DEFAULT_BOARD_COLORS,
} from "../../../ui/color-picker";
import { NumberInput } from "../../../ui/number-input";
import { useBoardEditorLabels } from "../board-editor-labels";
import { PopoverTitle } from "../../../ui/popover";

export function BoardEditorTextSelectionToolbar({
  className,
  selectedObject,
  toolbarLeft,
  toolbarTop,
  toolbarBottom,
  viewportWidth,
  viewportHeight,
}: BoardEditorSelectionToolbarRendererProps<TextObject>) {
  const labels = useBoardEditorLabels();
  const store = useBoardEditorContext();
  const toolApi = createToolApi(store);

  const updateText = (input: Partial<TextObject["props"]>) =>
    updateTextObjectFromAnchor(toolApi, selectedObject.id, input);

  return (
    <BoardEditorSelectionToolbarPositioner
      anchorLeft={toolbarLeft}
      anchorTop={toolbarTop}
      anchorBottom={toolbarBottom}
      viewportWidth={viewportWidth}
      viewportHeight={viewportHeight}
    >
      <BoardEditorToolbar
        aria-label={labels.selectionToolbar.textProperties}
        className={className}
      >
        <BoardEditorToolbarPopoverButton
          ariaLabel={labels.selectionToolbar.textSize}
          tooltip={labels.selectionToolbar.textSize}
          popoverSide="top"
          popoverContentClassName="w-48 min-w-0"
          icon={
            <span className="flex size-6 items-center justify-center text-xs font-semibold tabular-nums">
              {selectedObject.props.fontSize}
            </span>
          }
          content={
            <div className="flex flex-col gap-2 p-1">
              <PopoverTitle className="text-sm font-semibold">
                {labels.selectionToolbar.textSize}
              </PopoverTitle>
              <label className="flex items-center justify-between gap-3">
                <span className="text-tb-text-secondary text-xs font-medium">
                  {labels.selectionToolbar.textSize}
                </span>
                <NumberInput
                  aria-label={labels.selectionToolbar.textSize}
                  className="border-tb-border-default bg-tb-background-screen text-tb-text-primary h-7 w-20 rounded-md px-2 text-sm md:text-sm"
                  min={12}
                  max={144}
                  onValueChange={(fontSize) => updateText({ fontSize })}
                  value={selectedObject.props.fontSize}
                />
              </label>
            </div>
          }
        />

        <BoardEditorToolbarPopoverButton
          ariaLabel={labels.selectionToolbar.textColor}
          tooltip={labels.selectionToolbar.color}
          popoverSide="top"
          content={
            <ColorPicker
              value={selectedObject.props.color}
              onChange={(value) => updateText({ color: value })}
              chooseCustomColorLabel={labels.colorPicker.chooseCustomColor}
              defaultColors={[...DEFAULT_BOARD_COLORS]}
            />
          }
          icon={
            <ColorSwatch
              value={selectedObject.props.color}
              className="size-6"
            />
          }
        />
        <BoardEditorToolbarSeparator />
        <BoardEditorSelectionActionsMenu
          selectedObjectIds={[selectedObject.id]}
        />
      </BoardEditorToolbar>
    </BoardEditorSelectionToolbarPositioner>
  );
}
