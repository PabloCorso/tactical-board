import { TrashIcon } from "@phosphor-icons/react";
import {
  updateEquipmentObject,
  type EquipmentObject,
} from "../../core/objects/equipment-object";
import { createToolApi } from "../../core/editor/create-tool-api";
import { useBoardEditorContext } from "./board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarButton,
  BoardEditorToolbarPopoverButton,
} from "./board-editor-toolbar";
import type { BoardEditorSelectionToolbarRendererProps } from "./board-editor-selection-toolbar-types";
import { ColorPicker, DEFAULT_PRESET_COLORS } from "./ui/color-picker";

export function BoardEditorEquipmentSelectionToolbar({
  className,
  selectedObject,
  toolbarLeft,
  toolbarTop,
}: BoardEditorSelectionToolbarRendererProps<EquipmentObject>) {
  const store = useBoardEditorContext();
  const toolApi = createToolApi(store);
  const capabilities = selectedObject.props.definition.capabilities ?? {};

  const updateEquipment = (
    input: Parameters<typeof updateEquipmentObject>[1],
  ) => {
    toolApi.updateObjects([selectedObject.id], (object) =>
      updateEquipmentObject(object as EquipmentObject, input),
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
          {capabilities.label ? (
            <label className="focus-within:focus-ring border-default bg-screen flex h-10 items-center rounded-lg border px-2">
              <span className="sr-only">Equipment label</span>
              <input
                aria-label="Equipment label"
                className="text-primary w-18 bg-transparent text-center text-sm font-medium outline-none"
                onChange={(event) => updateEquipment({ label: event.target.value })}
                value={selectedObject.props.label ?? ""}
              />
            </label>
          ) : null}

          {capabilities.color ? (
            <BoardEditorToolbarPopoverButton
              ariaLabel="Equipment color"
              tooltip={`Color: ${selectedObject.props.color ?? selectedObject.props.definition.color ?? "default"}`}
              showCaret={false}
              content={
                <ColorPicker
                  value={
                    selectedObject.props.color ??
                    selectedObject.props.definition.color ??
                    "#111827"
                  }
                  onChange={(value) => updateEquipment({ color: value })}
                  presetColors={[...DEFAULT_PRESET_COLORS]}
                />
              }
              icon={
                <span
                  className="border-default inline-flex h-5 w-5 rounded-full border"
                  style={{
                    backgroundColor:
                      selectedObject.props.color ??
                      selectedObject.props.definition.color ??
                      "#111827",
                  }}
                >
                  <span className="sr-only">
                    {selectedObject.props.color ??
                      selectedObject.props.definition.color ??
                      "#111827"}
                  </span>
                </span>
              }
            />
          ) : null}

          <BoardEditorToolbarButton
            aria-label="Delete"
            iconBefore={
              <TrashIcon aria-hidden="true" className="size-4" weight="bold" />
            }
            onClick={() => toolApi.deleteObjects([selectedObject.id])}
            tooltip="Delete"
          />
        </BoardEditorToolbar>
      </div>
    </div>
  );
}
