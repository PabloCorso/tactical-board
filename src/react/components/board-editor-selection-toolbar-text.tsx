import { useState } from "react";
import type { TextObject } from "../../core/objects/text-object";
import { createToolApi } from "../../core/editor/create-tool-api";
import { updateTextObjectFromAnchor } from "../../core/editor/text-editing";
import { useBoardEditorContext } from "./board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarPopoverButton,
} from "./board-editor-toolbar";
import { BoardEditorSelectionToolbarPositioner } from "./board-editor-selection-toolbar-positioner";
import { BoardEditorSelectionActionsMenu } from "./board-editor-selection-actions-menu";
import type { BoardEditorSelectionToolbarRendererProps } from "./board-editor-selection-toolbar-types";
import { ColorPicker, DEFAULT_PRESET_COLORS } from "./ui/color-picker";

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
        <label className="focus-within:focus-ring border-default bg-screen flex h-10 items-center rounded-lg border px-2">
          <span className="sr-only">Text size</span>
          <input
            aria-label="Text size"
            className="text-primary w-14 bg-transparent text-center text-sm font-medium outline-none"
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
          />
        </label>

        <BoardEditorToolbarPopoverButton
          ariaLabel="Text color"
          tooltip={`Color: ${selectedObject.props.color}`}
          showCaret={false}
          content={
            <ColorPicker
              value={selectedObject.props.color}
              onChange={(value) => updateText({ color: value })}
              presetColors={[...DEFAULT_PRESET_COLORS]}
            />
          }
          icon={
            <span
              className="border-default inline-flex h-5 w-5 rounded-full border"
              style={{ backgroundColor: selectedObject.props.color }}
            >
              <span className="sr-only">{selectedObject.props.color}</span>
            </span>
          }
        />

        <BoardEditorSelectionActionsMenu
          selectedObjectIds={[selectedObject.id]}
        />
      </BoardEditorToolbar>
    </BoardEditorSelectionToolbarPositioner>
  );
}
