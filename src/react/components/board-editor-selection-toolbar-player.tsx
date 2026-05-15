import {
  updatePlayerObject,
  type PlayerObject,
} from "../../core/objects/player-object";
import { createToolApi } from "../../core/editor/create-tool-api";
import { useBoardEditorContext } from "./board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarPopoverButton,
} from "./board-editor-toolbar";
import { BoardEditorSelectionActionsMenu } from "./board-editor-selection-actions-menu";
import type { BoardEditorSelectionToolbarRendererProps } from "./board-editor-selection-toolbar-types";
import { ColorPicker, DEFAULT_PRESET_COLORS } from "./ui/color-picker";

export function BoardEditorPlayerSelectionToolbar({
  className,
  selectedObject,
  toolbarLeft,
  toolbarTop,
}: BoardEditorSelectionToolbarRendererProps<PlayerObject>) {
  const store = useBoardEditorContext();
  const toolApi = createToolApi(store);

  const updatePlayer = (input: Parameters<typeof updatePlayerObject>[1]) => {
    toolApi.updateObjects([selectedObject.id], (object) =>
      updatePlayerObject(object as PlayerObject, input),
    );
  };

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 10 }}
    >
      <div
        className="pointer-events-auto absolute"
        style={{
          left: toolbarLeft,
          top: toolbarTop,
          transform: "translate(-50%, -100%)",
        }}
      >
        <BoardEditorToolbar className={className}>
          <label className="focus-within:focus-ring border-default bg-screen flex h-10 items-center rounded-lg border px-2">
            <span className="sr-only">Player label</span>
            <input
              aria-label="Player label"
              className="text-primary w-14 bg-transparent text-center text-sm font-medium outline-none"
              onChange={(event) => updatePlayer({ label: event.target.value })}
              value={selectedObject.props.label ?? ""}
            />
          </label>

          <BoardEditorToolbarPopoverButton
            ariaLabel="Player color"
            tooltip={`Color: ${selectedObject.props.color}`}
            showCaret={false}
            content={
              <ColorPicker
                value={selectedObject.props.color}
                onChange={(value) => updatePlayer({ color: value })}
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
      </div>
    </div>
  );
}
