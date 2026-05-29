import {
  setArrowKind,
  updateArrowObject,
  type ArrowHeadStyle,
  type ArrowKind,
  type ArrowLineStyle,
  type ArrowObject,
} from "../../../../core/objects/arrow-object";
import { createToolApi } from "../../../../core/editor/create-tool-api";
import { BoardEditorArrowIcon } from "../arrow-icon";
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
import type { IconRender } from "../../../ui/icon";
import { LineStyleIcon } from "./line-style-icon";

const BODY_STYLE_OPTIONS: Array<{
  value: ArrowKind;
  label: string;
}> = [
  { value: "straight", label: "Straight" },
  { value: "curved", label: "Curved" },
  { value: "wavy", label: "Wavy" },
  { value: "double", label: "Double" },
];

const LINE_STYLE_OPTIONS: Array<{
  value: ArrowLineStyle;
  label: string;
}> = [
  { label: "Solid", value: "solid" },
  { label: "Dashed", value: "dashed" },
] as const;

const HEAD_STYLE_OPTIONS: Array<{
  value: ArrowHeadStyle;
  label: string;
}> = [
  { label: "None", value: "none" },
  { label: "Arrow", value: "triangle" },
] as const;

function getBodyStyleIcon(kind: ArrowKind): IconRender {
  return (
    <BoardEditorArrowIcon
      draftStyle={{
        kind,
        startHead: "none",
        endHead: "triangle",
      }}
      width={24}
      height={24}
      layout="compact"
    />
  );
}

function getHeadStyleIcon(
  headStyle: ArrowHeadStyle,
  side: "start" | "end",
): IconRender {
  return (
    <BoardEditorArrowIcon
      draftStyle={{
        kind: "straight",
        startHead: side === "start" ? headStyle : "none",
        endHead: side === "end" ? headStyle : "none",
      }}
      width={24}
      height={24}
      layout="compact"
    />
  );
}

type ArrowBodyPopoverContentProps = {
  selectedObject: ArrowObject;
  onSelect: (value: ArrowKind) => void;
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
          active={selectedObject.props.kind === option.value}
          ariaLabel={`Arrow body ${option.label}`}
          icon={getBodyStyleIcon(option.value)}
          onClick={() => onSelect(option.value)}
        />
      ))}
    </div>
  );
}

type ArrowHeadPopoverContentProps = {
  headStyle: ArrowHeadStyle;
  side: "start" | "end";
  onSelect: (value: ArrowHeadStyle) => void;
};

function ArrowHeadPopoverContent({
  headStyle,
  side,
  onSelect,
}: ArrowHeadPopoverContentProps) {
  const labelPrefix = side === "start" ? "Left" : "Right";

  return (
    <div className="grid grid-cols-2 gap-2">
      {HEAD_STYLE_OPTIONS.map((option) => (
        <BoardEditorToolbarOptionButton
          key={option.value}
          active={headStyle === option.value}
          ariaLabel={`${labelPrefix} arrow head ${option.label}`}
          icon={getHeadStyleIcon(option.value, side)}
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
          icon={<LineStyleIcon dashed={option.value === "dashed"} />}
          onClick={() => onSelect(option.value)}
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
      defaultColors={[...DEFAULT_BOARD_COLORS]}
    />
  );
}

export function BoardEditorArrowSelectionToolbar({
  className,
  selectedObject,
  toolbarLeft,
  toolbarTop,
  toolbarBottom,
  viewportWidth,
  viewportHeight,
}: BoardEditorSelectionToolbarRendererProps<ArrowObject>) {
  const store = useBoardEditorContext();
  const toolApi = createToolApi(store);

  const updateArrow = (updater: (arrow: ArrowObject) => ArrowObject) => {
    toolApi.updateObjects([selectedObject.id], (object) =>
      updater(object as ArrowObject),
    );
  };

  const updateArrowProps = (props: Partial<ArrowObject["props"]>) => {
    updateArrow((arrow) => updateArrowObject(arrow, props));
  };

  const updateBodyStyle = (value: ArrowKind) => {
    updateArrow((arrow) => setArrowKind(arrow, value));
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
          ariaLabel="Arrow left head"
          tooltip="Left head"
          popoverSide="top"
          content={
            <ArrowHeadPopoverContent
              headStyle={selectedObject.props.startHead}
              side="start"
              onSelect={(value) => updateArrowProps({ startHead: value })}
            />
          }
          icon={getHeadStyleIcon(selectedObject.props.startHead, "start")}
        />

        <BoardEditorToolbarPopoverButton
          ariaLabel="Arrow body style"
          tooltip="Body style"
          popoverSide="top"
          content={
            <ArrowBodyPopoverContent
              selectedObject={selectedObject}
              onSelect={updateBodyStyle}
            />
          }
          icon={getBodyStyleIcon(selectedObject.props.kind)}
        />

        <BoardEditorToolbarPopoverButton
          ariaLabel="Arrow right head"
          tooltip="Right head"
          popoverSide="top"
          content={
            <ArrowHeadPopoverContent
              headStyle={selectedObject.props.endHead}
              side="end"
              onSelect={(value) => updateArrowProps({ endHead: value })}
            />
          }
          icon={getHeadStyleIcon(selectedObject.props.endHead, "end")}
        />

        <BoardEditorToolbarSeparator />

        <BoardEditorToolbarPopoverButton
          ariaLabel="Arrow line style"
          tooltip="Line style"
          popoverSide="top"
          content={
            <ArrowLineStylePopoverContent
              lineStyle={selectedObject.props.lineStyle}
              onSelect={(value) => updateArrowProps({ lineStyle: value })}
            />
          }
          icon={
            <LineStyleIcon
              dashed={selectedObject.props.lineStyle === "dashed"}
            />
          }
        />

        <BoardEditorToolbarPopoverButton
          ariaLabel="Arrow color"
          tooltip="Color"
          popoverSide="top"
          content={
            <ArrowColorPopoverContent
              color={selectedObject.props.color}
              onSelect={(value) => updateArrowProps({ color: value })}
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
