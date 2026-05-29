import type {
  ShapeFillStyle,
  ShapeLineStyle,
  ShapeObject,
} from "../../../../core/objects/shape-object";
import { updateShapeObject } from "../../../../core/objects/shape-object";
import { createToolApi } from "../../../../core/editor/create-tool-api";
import { BoardEditorSelectionActionsMenu } from "./selection-actions-menu";
import { useBoardEditorContext } from "../../../adapter/editor/board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarOptionButton,
  BoardEditorToolbarPopoverButton,
  BoardEditorToolbarSeparator,
} from "../toolbar/editor-toolbar";
import { BoardEditorSelectionToolbarPositioner } from "./selection-toolbar-positioner";
import type { BoardEditorSelectionToolbarRendererProps } from "./selection-toolbar-types";
import { ColorPicker, DEFAULT_BOARD_COLORS } from "../../../ui/color-picker";
import { LineStyleIcon } from "./line-style-icon";

const LINE_STYLE_OPTIONS: Array<{
  value: ShapeLineStyle;
  label: string;
}> = [
  { label: "Solid", value: "solid" },
  { label: "Dashed", value: "dashed" },
];

const FILL_STYLE_OPTIONS: Array<{
  value: ShapeFillStyle;
  label: string;
}> = [
  { value: "none", label: "None" },
  { value: "solid", label: "Solid" },
  { value: "diagonal-stripes", label: "Stripes" },
];

const BORDER_STYLE_OPTIONS = [
  { value: true, label: "Bordered" },
  { value: false, label: "Borderless" },
] as const;

function ShapeFillStyleIcon({ value }: { value: ShapeFillStyle }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center">
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          fill={value === "none" ? "none" : "currentColor"}
          fillOpacity={value === "none" ? 1 : 0.2}
          stroke="currentColor"
          strokeWidth="2"
        />
        {value === "diagonal-stripes" ? (
          <path
            d="M4 19 L19 4 M10 21 L21 10 M3 13 L13 3"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ) : null}
      </svg>
    </span>
  );
}

function ShapeBorderStyleIcon({ bordered }: { bordered: boolean }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center">
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          fill="currentColor"
          fillOpacity="0.12"
          stroke={bordered ? "currentColor" : "none"}
          strokeWidth="2"
        />
      </svg>
    </span>
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
          icon={<LineStyleIcon dashed={option.value === "dashed"} />}
          onClick={() => onSelect(option.value)}
        />
      ))}
    </div>
  );
}

function ShapeFillPopoverContent({
  value,
  onSelect,
}: {
  value: ShapeFillStyle;
  onSelect: (nextValue: ShapeFillStyle) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {FILL_STYLE_OPTIONS.map((option) => (
        <BoardEditorToolbarOptionButton
          key={option.value}
          active={value === option.value}
          ariaLabel={`Shape style ${option.label}`}
          icon={<ShapeFillStyleIcon value={option.value} />}
          onClick={() => onSelect(option.value)}
        />
      ))}
    </div>
  );
}

function ShapeBorderPopoverContent({
  value,
  onSelect,
}: {
  value: boolean;
  onSelect: (nextValue: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {BORDER_STYLE_OPTIONS.map((option) => (
        <BoardEditorToolbarOptionButton
          key={String(option.value)}
          active={value === option.value}
          ariaLabel={`Shape border ${option.label}`}
          icon={<ShapeBorderStyleIcon bordered={option.value} />}
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
  toolbarBottom,
  viewportWidth,
  viewportHeight,
}: BoardEditorSelectionToolbarRendererProps<ShapeObject>) {
  const store = useBoardEditorContext();
  const toolApi = createToolApi(store);

  const updateShapeProps = (props: Partial<ShapeObject["props"]>) => {
    toolApi.updateObjects([selectedObject.id], (object) =>
      updateShapeObject(object as ShapeObject, props),
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
        <BoardEditorToolbarPopoverButton
          ariaLabel="Shape color"
          tooltip="Color"
          popoverSide="top"
          content={
            <ColorPicker
              value={selectedObject.props.color}
              onChange={(value) => updateShapeProps({ color: value })}
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

        <BoardEditorToolbarPopoverButton
          ariaLabel="Shape line style"
          tooltip="Line style"
          popoverSide="top"
          content={
            <ShapeLineStylePopoverContent
              lineStyle={selectedObject.props.lineStyle}
              onSelect={(value) => updateShapeProps({ lineStyle: value })}
            />
          }
          icon={
            <LineStyleIcon
              dashed={selectedObject.props.lineStyle === "dashed"}
            />
          }
        />

        <BoardEditorToolbarPopoverButton
          ariaLabel="Shape fill style"
          tooltip="Fill style"
          popoverSide="top"
          content={
            <ShapeFillPopoverContent
              value={selectedObject.props.fillStyle}
              onSelect={(value) => updateShapeProps({ fillStyle: value })}
            />
          }
          icon={<ShapeFillStyleIcon value={selectedObject.props.fillStyle} />}
        />

        <BoardEditorToolbarPopoverButton
          ariaLabel="Shape border style"
          tooltip="Border"
          popoverSide="top"
          content={
            <ShapeBorderPopoverContent
              value={selectedObject.props.bordered}
              onSelect={(value) => updateShapeProps({ bordered: value })}
            />
          }
          icon={
            <ShapeBorderStyleIcon bordered={selectedObject.props.bordered} />
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
