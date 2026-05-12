import { LineSegmentsIcon, SquareIcon, TrashIcon } from "@phosphor-icons/react";
import type {
  ShapeLineStyle,
  ShapeObject,
  ShapeStyle,
} from "../../core/objects/shape-object";
import { createToolApi } from "../../core/editor/create-tool-api";
import { useBoardEditorContext } from "./board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarButton,
  BoardEditorToolbarOptionButton,
  BoardEditorToolbarPopoverButton,
} from "./board-editor-toolbar";
import type { BoardEditorSelectionToolbarRendererProps } from "./board-editor-selection-toolbar-types";
import { ColorPicker, DEFAULT_PRESET_COLORS } from "./ui/color-picker";

const WEIGHT_OPTIONS = [
  { label: "Thin", value: "0.4", strokeWidth: 0.4 },
  { label: "Thick", value: "0.6", strokeWidth: 0.6 },
] as const;

const LINE_STYLE_OPTIONS: Array<{
  value: ShapeLineStyle;
  label: string;
}> = [
  { label: "Solid", value: "solid" },
  { label: "Dashed", value: "dashed" },
];

const FILL_STYLE_OPTIONS: Array<{
  value: ShapeStyle;
  label: string;
}> = [
  { value: "stroke", label: "Stroke" },
  { value: "fill", label: "Fill" },
  { value: "fill-stroke", label: "Both" },
];

function getWeightValue(strokeWidth: number) {
  return WEIGHT_OPTIONS.reduce((closest, option) =>
    Math.abs(option.strokeWidth - strokeWidth) <
    Math.abs(closest.strokeWidth - strokeWidth)
      ? option
      : closest,
  ).value;
}

function getWeightLabel(strokeWidth: number) {
  return (
    WEIGHT_OPTIONS.find(
      (option) => option.value === getWeightValue(strokeWidth),
    )?.label ?? "Weight"
  );
}

function ShapeLineStylePopoverContent({
  lineStyle,
  onSelect,
}: {
  lineStyle: ShapeLineStyle;
  onSelect: (value: ShapeLineStyle) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {LINE_STYLE_OPTIONS.map((option) => (
        <BoardEditorToolbarOptionButton
          key={option.value}
          active={lineStyle === option.value}
          ariaLabel={`Shape line style ${option.label}`}
          icon={
            <span className="flex h-5 w-10 items-center justify-center">
              <span
                className="bg-current"
                style={{
                  width: 28,
                  height: 2.5,
                  borderRadius: 9999,
                  opacity: option.value === "dashed" ? 0.6 : 1,
                }}
              />
            </span>
          }
          onClick={() => onSelect(option.value)}
        />
      ))}
    </div>
  );
}

function ShapeWeightPopoverContent({
  strokeWidth,
  onSelect,
}: {
  strokeWidth: number;
  onSelect: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {WEIGHT_OPTIONS.map((option) => (
        <BoardEditorToolbarOptionButton
          key={option.value}
          active={getWeightValue(strokeWidth) === option.value}
          ariaLabel={`Shape weight ${option.label}`}
          icon={
            <span className="flex h-5 w-10 items-center justify-center">
              <span
                className="rounded-full bg-current"
                style={{
                  width: 28,
                  height:
                    option.strokeWidth >= 0.6
                      ? 4.5
                      : option.strokeWidth >= 0.4
                        ? 3.5
                        : 2.5,
                }}
              />
            </span>
          }
          onClick={() => onSelect(option.strokeWidth)}
        />
      ))}
    </div>
  );
}

function ShapeFillPopoverContent({
  value,
  onSelect,
}: {
  value: ShapeStyle;
  onSelect: (nextValue: ShapeStyle) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {FILL_STYLE_OPTIONS.map((option) => (
        <BoardEditorToolbarOptionButton
          key={option.value}
          active={value === option.value}
          ariaLabel={`Shape style ${option.label}`}
          icon={
            <span className="flex h-5 w-10 items-center justify-center">
              <svg
                aria-hidden="true"
                className="h-5 w-10"
                fill="none"
                viewBox="0 0 40 20"
              >
                <rect
                  x="9"
                  y="4"
                  width="22"
                  height="12"
                  rx="2"
                  fill={
                    option.value === "fill" || option.value === "fill-stroke"
                      ? "currentColor"
                      : "none"
                  }
                  fillOpacity={
                    option.value === "fill" || option.value === "fill-stroke"
                      ? 0.25
                      : 1
                  }
                  stroke={
                    option.value === "fill" ? "none" : "currentColor"
                  }
                  strokeWidth="2"
                />
              </svg>
            </span>
          }
          onClick={() => onSelect(option.value)}
        />
      ))}
    </div>
  );
}

export function BoardEditorShapeSelectionToolbar({
  className,
  selectedObject,
  toolbarLeft,
  toolbarTop,
}: BoardEditorSelectionToolbarRendererProps<ShapeObject>) {
  const store = useBoardEditorContext();
  const toolApi = createToolApi(store);

  const updateShapeProps = (props: Partial<ShapeObject["props"]>) => {
    toolApi.updateObjects([selectedObject.id], (object) => ({
      ...(object as ShapeObject),
      props: {
        ...(object as ShapeObject).props,
        ...props,
      },
    }));
  };

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 10 }}>
      <div
        className="pointer-events-auto absolute"
        style={{
          left: toolbarLeft,
          top: toolbarTop,
          transform: "translate(-50%, -100%)",
        }}
      >
        <BoardEditorToolbar className={className}>
          <BoardEditorToolbarPopoverButton
            ariaLabel="Shape color"
            tooltip={`Color: ${selectedObject.props.color}`}
            showCaret={false}
            content={
              <ColorPicker
                value={selectedObject.props.color}
                onChange={(value) => updateShapeProps({ color: value })}
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

          <BoardEditorToolbarPopoverButton
            ariaLabel="Shape line style"
            tooltip="Line style"
            content={
              <ShapeLineStylePopoverContent
                lineStyle={selectedObject.props.lineStyle}
                onSelect={(value) => updateShapeProps({ lineStyle: value })}
              />
            }
            icon={<LineSegmentsIcon weight="bold" />}
          />

          <BoardEditorToolbarPopoverButton
            ariaLabel="Shape weight"
            tooltip={`Weight: ${getWeightLabel(selectedObject.props.strokeWidth)}`}
            content={
              <ShapeWeightPopoverContent
                strokeWidth={selectedObject.props.strokeWidth}
                onSelect={(value) => updateShapeProps({ strokeWidth: value })}
              />
            }
            icon={
              <span className="flex h-5 w-10 items-center justify-center">
                <span
                  className="rounded-full bg-current"
                  style={{
                    width: 28,
                    height:
                      selectedObject.props.strokeWidth >= 0.6
                        ? 4.5
                        : selectedObject.props.strokeWidth >= 0.4
                          ? 3.5
                          : 2.5,
                  }}
                />
              </span>
            }
          />

          <BoardEditorToolbarPopoverButton
            ariaLabel="Shape fill style"
            tooltip="Fill style"
            content={
              <ShapeFillPopoverContent
                value={selectedObject.props.style}
                onSelect={(value) => updateShapeProps({ style: value })}
              />
            }
            icon={<SquareIcon weight="bold" />}
          />

          <BoardEditorToolbarButton
            aria-label="Delete shape"
            iconBefore={<TrashIcon />}
            onClick={() => toolApi.deleteObjects([selectedObject.id])}
            tooltip="Delete"
          />
        </BoardEditorToolbar>
      </div>
    </div>
  );
}
