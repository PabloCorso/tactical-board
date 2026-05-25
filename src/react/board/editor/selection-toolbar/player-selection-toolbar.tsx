import {
  updatePlayerObject,
  type PlayerObject,
} from "../../../../core/objects/player-object";
import { createToolApi } from "../../../../core/editor/create-tool-api";
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

export function BoardEditorPlayerSelectionToolbar({
  className,
  selectedObject,
  toolbarLeft,
  toolbarTop,
  toolbarBottom,
  viewportWidth,
  viewportHeight,
}: BoardEditorSelectionToolbarRendererProps<PlayerObject>) {
  const store = useBoardEditorContext();
  const toolApi = createToolApi(store);

  const updatePlayer = (input: Parameters<typeof updatePlayerObject>[1]) => {
    toolApi.updateObjects([selectedObject.id], (object) =>
      updatePlayerObject(object as PlayerObject, input),
    );
  };

  return (
    <BoardEditorSelectionToolbarPositioner
      anchorLeft={toolbarLeft}
      anchorTop={toolbarTop}
      anchorBottom={toolbarBottom}
      viewportWidth={viewportWidth}
      viewportHeight={viewportHeight}
    >
      <BoardEditorToolbar className={className}>
        <label className="focus-within:focus-ring border-tb-border-default bg-tb-background-screen flex h-10 items-center rounded-lg border px-2">
          <span className="sr-only">Player label</span>
          <input
            aria-label="Player label"
            className="text-tb-text-primary w-14 bg-transparent text-center text-sm font-medium outline-none"
            onChange={(event) => updatePlayer({ label: event.target.value })}
            value={selectedObject.props.label ?? ""}
          />
        </label>

        <BoardEditorToolbarPopoverButton
          ariaLabel="Player color"
          tooltip="Color"
          content={
            <ColorPicker
              value={selectedObject.props.color}
              onChange={(value) => updatePlayer({ color: value })}
              defaultColors={[...DEFAULT_BOARD_COLORS]}
            />
          }
          icon={
            <span
              className="border-tb-border-default inline-flex h-5 w-5 rounded-full border"
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
