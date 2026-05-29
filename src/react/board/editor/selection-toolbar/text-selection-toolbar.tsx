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
import { Input } from "../../../ui/inputs";

export function BoardEditorTextSelectionToolbar({
  className,
  selectedObject,
  toolbarLeft,
  toolbarTop,
  toolbarBottom,
  viewportWidth,
  viewportHeight,
}: BoardEditorSelectionToolbarRendererProps<TextObject>) {
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
        <Input
          aria-label="Text size"
          className="border-tb-border-default bg-tb-background-screen text-tb-text-primary h-8 w-12 px-2 text-center text-sm font-medium md:text-sm"
          min={12}
          max={144}
          onBlur={() => setFontSizeAnchor(null)}
          onChange={(event) =>
            updateText({ fontSize: Number(event.target.value) || 12 })
          }
          onFocus={() =>
            setFontSizeAnchor({
              left: toolbarLeft,
              top: toolbarTop,
              bottom: toolbarBottom,
            })
          }
          type="number"
          value={selectedObject.props.fontSize}
          wrapperProps={{ className: "h-10 w-auto" }}
        />

        <BoardEditorToolbarPopoverButton
          ariaLabel="Text color"
          tooltip="Color"
          popoverSide="top"
          content={
            <ColorPicker
              value={selectedObject.props.color}
              onChange={(value) => updateText({ color: value })}
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
