import { useState } from "react";
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
import { ColorPicker, DEFAULT_BOARD_COLORS } from "../../../ui/color-picker";
import { NumberInput } from "../../../ui/number-input";
import { useBoardEditorLabels } from "../board-editor-labels";

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
  const [fontSizeAnchor, setFontSizeAnchor] = useState<{
    left: number;
    top: number;
    bottom: number;
  } | null>(null);

  const updateText = (input: Partial<TextObject["props"]>) =>
    updateTextObjectFromAnchor(toolApi, selectedObject.id, input);

  const anchorLeft = fontSizeAnchor?.left ?? toolbarLeft;
  const anchorTop = fontSizeAnchor?.top ?? toolbarTop;
  const anchorBottom = fontSizeAnchor?.bottom ?? toolbarBottom;

  return (
    <BoardEditorSelectionToolbarPositioner
      anchorLeft={anchorLeft}
      anchorTop={anchorTop}
      anchorBottom={anchorBottom}
      viewportWidth={viewportWidth}
      viewportHeight={viewportHeight}
    >
      <BoardEditorToolbar className={className}>
        <NumberInput
          aria-label={labels.selectionToolbar.textSize}
          className="border-tb-border-default bg-tb-background-screen text-tb-text-primary h-10 w-12 px-2 text-center text-sm font-medium md:text-sm"
          min={12}
          max={144}
          onBlur={() => setFontSizeAnchor(null)}
          onValueChange={(fontSize) => updateText({ fontSize })}
          onFocus={() =>
            setFontSizeAnchor({
              left: toolbarLeft,
              top: toolbarTop,
              bottom: toolbarBottom,
            })
          }
          value={selectedObject.props.fontSize}
          wrapperProps={{ className: "h-10 w-auto" }}
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
            <span
              className="border-tb-border-default inline-flex h-6 w-6 rounded-full border"
              style={{ backgroundColor: selectedObject.props.color }}
            >
              <span className="sr-only">{selectedObject.props.color}</span>
            </span>
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
