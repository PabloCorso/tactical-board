import {
  ArrowArcRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  LineSegmentIcon,
  LineSegmentsIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import {
  type ArrowBodyStyle,
  type ArrowHeadStyle,
  type ArrowLineStyle,
  type ArrowObject,
} from "../../core/objects/arrow-object";
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
import type { IconRender } from "./ui/icon";

const BODY_STYLE_OPTIONS: Array<{
  value: ArrowBodyStyle;
  label: string;
}> = [
  { value: "straight", label: "Straight" },
  { value: "curved", label: "Curved" },
];

const HEAD_OPTIONS: Array<{
  value: ArrowHeadStyle;
  label: string;
}> = [
  { value: "none", label: "Off" },
  { value: "triangle", label: "Arrow" },
];

const WEIGHT_OPTIONS = [
  { label: "Thin", value: "0.2", strokeWidth: 0.2 },
  { label: "Bold", value: "0.6", strokeWidth: 0.6 },
] as const;

const LINE_STYLE_OPTIONS: Array<{
  value: ArrowLineStyle;
  label: string;
}> = [
  { label: "Solid", value: "solid" },
  { label: "Dashed", value: "dashed" },
] as const;

function getWeightValue(strokeWidth: number) {
  return strokeWidth > 0.4 ? "0.6" : "0.2";
}

function getWeightLabel(strokeWidth: number) {
  return (
    WEIGHT_OPTIONS.find(
      (option) => option.value === getWeightValue(strokeWidth),
    )?.label ?? "Weight"
  );
}

function getHeadIcon(
  side: "start" | "end",
  head: ArrowHeadStyle,
): IconRender {
  if (head === "none") {
    return <LineSegmentIcon weight="bold" />;
  }

  return side === "start" ? (
    <ArrowLeftIcon weight="bold" />
  ) : (
    <ArrowRightIcon weight="bold" />
  );
}

function getBodyStyleIcon(bodyStyle: ArrowBodyStyle): IconRender {
  return bodyStyle === "curved" ? (
    <ArrowArcRightIcon weight="bold" />
  ) : (
    <ArrowRightIcon weight="bold" />
  );
}

type ArrowHeadPopoverContentProps = {
  activeHead: ArrowHeadStyle;
  side: "start" | "end";
  onSelect: (value: ArrowHeadStyle) => void;
};

function ArrowHeadPopoverContent({
  activeHead,
  side,
  onSelect,
}: ArrowHeadPopoverContentProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {HEAD_OPTIONS.map((option) => (
        <BoardEditorToolbarOptionButton
          key={option.value}
          active={activeHead === option.value}
          ariaLabel={`${side} head ${option.label}`}
          icon={getHeadIcon(side, option.value)}
          onClick={() => onSelect(option.value)}
        />
      ))}
    </div>
  );
}

type ArrowBodyPopoverContentProps = {
  selectedObject: ArrowObject;
  onSelect: (value: ArrowBodyStyle) => void;
};

function ArrowBodyPopoverContent({
  selectedObject,
  onSelect,
}: ArrowBodyPopoverContentProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {BODY_STYLE_OPTIONS.map((option) => (
        <BoardEditorToolbarOptionButton
          key={option.value}
          active={selectedObject.props.bodyStyle === option.value}
          ariaLabel={`Arrow body ${option.label}`}
          icon={getBodyStyleIcon(option.value)}
          onClick={() => onSelect(option.value)}
        />
      ))}
    </div>
  );
}

type ArrowLineStylePopoverContentProps = {
  lineStyle: ArrowLineStyle;
  onSelect: (value: ArrowLineStyle) => void;
};

function ArrowLineStylePopoverContent({
  lineStyle,
  onSelect,
}: ArrowLineStylePopoverContentProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {LINE_STYLE_OPTIONS.map((option) => (
        <BoardEditorToolbarOptionButton
          key={option.value}
          active={lineStyle === option.value}
          ariaLabel={`Arrow line style ${option.label}`}
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

type ArrowWeightPopoverContentProps = {
  strokeWidth: number;
  onSelect: (value: number) => void;
};

function ArrowWeightPopoverContent({
  strokeWidth,
  onSelect,
}: ArrowWeightPopoverContentProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {WEIGHT_OPTIONS.map((option) => (
        <BoardEditorToolbarOptionButton
          key={option.value}
          active={getWeightValue(strokeWidth) === option.value}
          ariaLabel={`Arrow weight ${option.label}`}
          icon={
            <span className="flex h-5 w-10 items-center justify-center">
              <span
                className="rounded-full bg-current"
                style={{
                  width: 28,
                  height: option.strokeWidth > 0.4 ? 4.5 : 2.5,
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

type ArrowColorPopoverContentProps = {
  color: string;
  onSelect: (value: string) => void;
};

function ArrowColorPopoverContent({
  color,
  onSelect,
}: ArrowColorPopoverContentProps) {
  return (
    <ColorPicker
      value={color}
      onChange={onSelect}
      presetColors={[...DEFAULT_PRESET_COLORS]}
    />
  );
}

export function BoardEditorArrowSelectionToolbar({
  className,
  selectedObject,
  toolbarLeft,
  toolbarTop,
}: BoardEditorSelectionToolbarRendererProps<ArrowObject>) {
  const store = useBoardEditorContext();
  const toolApi = createToolApi(store);

  const updateArrow = (updater: (arrow: ArrowObject) => ArrowObject) => {
    toolApi.updateObjects([selectedObject.id], (object) =>
      updater(object as ArrowObject),
    );
  };

  const updateArrowProps = (props: Partial<ArrowObject["props"]>) => {
    updateArrow((arrow) => ({
      ...arrow,
      props: {
        ...arrow.props,
        ...props,
      },
    }));
  };

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        zIndex: 10,
      }}
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
          <BoardEditorToolbarPopoverButton
            ariaLabel="Arrow color"
            tooltip={`Color: ${selectedObject.props.color}`}
            showCaret={false}
            content={
              <ArrowColorPopoverContent
                color={selectedObject.props.color}
                onSelect={(value) => updateArrowProps({ color: value })}
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
            ariaLabel="Arrow line style"
            tooltip="Line style"
            content={
              <ArrowLineStylePopoverContent
                lineStyle={selectedObject.props.lineStyle}
                onSelect={(value) => updateArrowProps({ lineStyle: value })}
              />
            }
            icon={<LineSegmentsIcon weight="bold" />}
          />

          <BoardEditorToolbarPopoverButton
            ariaLabel="Arrow weight"
            tooltip={`Weight: ${getWeightLabel(selectedObject.props.strokeWidth)}`}
            content={
              <ArrowWeightPopoverContent
                strokeWidth={selectedObject.props.strokeWidth}
                onSelect={(value) => updateArrowProps({ strokeWidth: value })}
              />
            }
            icon={
              <span className="flex h-5 w-10 items-center justify-center">
                <span
                  className="rounded-full bg-current"
                  style={{
                    width: 28,
                    height: selectedObject.props.strokeWidth > 0.4 ? 4.5 : 2.5,
                  }}
                />
              </span>
            }
          />

          <BoardEditorToolbarPopoverButton
            ariaLabel="Arrow start head"
            tooltip="Start head"
            content={
              <ArrowHeadPopoverContent
                activeHead={selectedObject.props.startHead}
                side="start"
                onSelect={(value) => updateArrowProps({ startHead: value })}
              />
            }
            icon={getHeadIcon("start", selectedObject.props.startHead)}
          />

          <BoardEditorToolbarPopoverButton
            ariaLabel="Arrow body style"
            tooltip="Body style"
            content={
              <ArrowBodyPopoverContent
                selectedObject={selectedObject}
                onSelect={(value) => updateArrowProps({ bodyStyle: value })}
              />
            }
            icon={getBodyStyleIcon(selectedObject.props.bodyStyle)}
          />

          <BoardEditorToolbarPopoverButton
            ariaLabel="Arrow end head"
            tooltip="End head"
            content={
              <ArrowHeadPopoverContent
                activeHead={selectedObject.props.endHead}
                side="end"
                onSelect={(value) => updateArrowProps({ endHead: value })}
              />
            }
            icon={getHeadIcon("end", selectedObject.props.endHead)}
          />

          <BoardEditorToolbarButton
            aria-label="Delete arrow"
            iconBefore={<TrashIcon />}
            onClick={() => toolApi.deleteObjects([selectedObject.id])}
            tooltip="Delete"
          />
        </BoardEditorToolbar>
      </div>
    </div>
  );
}
