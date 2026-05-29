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
import { Input } from "../../../ui/inputs";

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
        <Input
          aria-label="Player label"
          className="border-tb-border-default bg-tb-background-screen text-tb-text-primary h-8 w-12 px-2 text-center text-sm font-medium md:text-sm"
          onChange={(event) => updatePlayer({ label: event.target.value })}
          value={selectedObject.props.label ?? ""}
          wrapperProps={{ className: "h-10 w-auto" }}
        />

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
