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
  BoardEditorToolbarGroup,
  BoardEditorToolbarOptionButton,
  BoardEditorToolbarPopover,
  BoardEditorToolbarPopoverContent,
  BoardEditorToolbarPopoverTrigger,
  BoardEditorToolbarSeparator,
} from "../toolbar/editor-toolbar";
import { BoardEditorSelectionToolbarPositioner } from "./selection-toolbar-positioner";
import type { BoardEditorSelectionToolbarRendererProps } from "./selection-toolbar-types";
import {
  ColorPicker,
  ColorSwatch,
  DEFAULT_BOARD_COLORS,
} from "../../../ui/color-picker";
import type { IconRender } from "../../../ui/icon";
import { LineStyleIcon } from "./line-style-icon";
import {
  useBoardEditorLabels,
  type BoardEditorLabels,
} from "../board-editor-labels";
import { BoardEditorStrokeWidthControl } from "./stroke-width-control";

const BODY_STYLE_OPTIONS: Array<{
  value: ArrowKind;
}> = [
  { value: "straight" },
  { value: "curved" },
  { value: "wavy" },
  { value: "double" },
];

const LINE_STYLE_OPTIONS: Array<{
  value: ArrowLineStyle;
}> = [{ value: "solid" }, { value: "dashed" }] as const;

const HEAD_STYLE_OPTIONS: Array<{
  value: ArrowHeadStyle;
}> = [{ value: "none" }, { value: "triangle" }] as const;

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
  labels: BoardEditorLabels;
  selectedObject: ArrowObject;
  onSelect: (value: ArrowKind) => void;
};

function ArrowBodyPopoverContent({
  labels,
  selectedObject,
  onSelect,
}: ArrowBodyPopoverContentProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {BODY_STYLE_OPTIONS.map((option) => (
        <BoardEditorToolbarOptionButton
          key={option.value}
          active={selectedObject.props.kind === option.value}
          ariaLabel={labels.selectionToolbar.arrowBodyOption(
            labels.selectionToolbar.arrowStyle[option.value],
          )}
          icon={getBodyStyleIcon(option.value)}
          onClick={() => onSelect(option.value)}
        />
      ))}
    </div>
  );
}

type ArrowHeadPopoverContentProps = {
  labels: BoardEditorLabels;
  headStyle: ArrowHeadStyle;
  side: "start" | "end";
  onSelect: (value: ArrowHeadStyle) => void;
};

function ArrowHeadPopoverContent({
  labels,
  headStyle,
  side,
  onSelect,
}: ArrowHeadPopoverContentProps) {
  const labelSide = side === "start" ? "left" : "right";

  return (
    <div className="grid grid-cols-2 gap-2">
      {HEAD_STYLE_OPTIONS.map((option) => (
        <BoardEditorToolbarOptionButton
          key={option.value}
          active={headStyle === option.value}
          ariaLabel={labels.selectionToolbar.arrowHeadOption(
            labelSide,
            option.value === "triangle"
              ? labels.selectionToolbar.arrowHead.arrow
              : labels.selectionToolbar.arrowHead.none,
          )}
          icon={getHeadStyleIcon(option.value, side)}
          onClick={() => onSelect(option.value)}
        />
      ))}
    </div>
  );
}

type ArrowLineStylePopoverContentProps = {
  labels: BoardEditorLabels;
  lineStyle: ArrowLineStyle;
  onSelect: (value: ArrowLineStyle) => void;
};

function ArrowLineStylePopoverContent({
  labels,
  lineStyle,
  onSelect,
}: ArrowLineStylePopoverContentProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {LINE_STYLE_OPTIONS.map((option) => (
        <BoardEditorToolbarOptionButton
          key={option.value}
          active={lineStyle === option.value}
          ariaLabel={labels.selectionToolbar.arrowLineOption(
            labels.selectionToolbar.lineValue[option.value],
          )}
          icon={<LineStyleIcon dashed={option.value === "dashed"} />}
          onClick={() => onSelect(option.value)}
        />
      ))}
    </div>
  );
}

type ArrowColorPopoverContentProps = {
  color: string;
  labels: BoardEditorLabels;
  onSelect: (value: string) => void;
};

function ArrowColorPopoverContent({
  color,
  labels,
  onSelect,
}: ArrowColorPopoverContentProps) {
  return (
    <ColorPicker
      value={color}
      onChange={onSelect}
      chooseCustomColorLabel={labels.colorPicker.chooseCustomColor}
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
  const labels = useBoardEditorLabels();
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
      <BoardEditorToolbar
        aria-label={labels.selectionToolbar.arrowProperties}
        className={className}
        controlSize="sm"
      >
        <BoardEditorToolbarGroup>
          <BoardEditorToolbarPopover>
            <BoardEditorToolbarPopoverTrigger
              aria-label={labels.selectionToolbar.arrowLeftHead}
              tooltip={labels.selectionToolbar.arrowLeftHead}
            >
              {getHeadStyleIcon(selectedObject.props.startHead, "start")}
            </BoardEditorToolbarPopoverTrigger>
            <BoardEditorToolbarPopoverContent side="top" sideOffset={8}>
              <ArrowHeadPopoverContent
                labels={labels}
                headStyle={selectedObject.props.startHead}
                side="start"
                onSelect={(value) => updateArrowProps({ startHead: value })}
              />
            </BoardEditorToolbarPopoverContent>
          </BoardEditorToolbarPopover>

          <BoardEditorToolbarPopover>
            <BoardEditorToolbarPopoverTrigger
              aria-label={labels.selectionToolbar.arrowBodyStyle}
              tooltip={labels.selectionToolbar.arrowBodyStyle}
            >
              {getBodyStyleIcon(selectedObject.props.kind)}
            </BoardEditorToolbarPopoverTrigger>
            <BoardEditorToolbarPopoverContent side="top" sideOffset={8}>
              <ArrowBodyPopoverContent
                labels={labels}
                selectedObject={selectedObject}
                onSelect={updateBodyStyle}
              />
            </BoardEditorToolbarPopoverContent>
          </BoardEditorToolbarPopover>

          <BoardEditorToolbarPopover>
            <BoardEditorToolbarPopoverTrigger
              aria-label={labels.selectionToolbar.arrowRightHead}
              tooltip={labels.selectionToolbar.arrowRightHead}
            >
              {getHeadStyleIcon(selectedObject.props.endHead, "end")}
            </BoardEditorToolbarPopoverTrigger>
            <BoardEditorToolbarPopoverContent side="top" sideOffset={8}>
              <ArrowHeadPopoverContent
                labels={labels}
                headStyle={selectedObject.props.endHead}
                side="end"
                onSelect={(value) => updateArrowProps({ endHead: value })}
              />
            </BoardEditorToolbarPopoverContent>
          </BoardEditorToolbarPopover>
        </BoardEditorToolbarGroup>

        <BoardEditorToolbarSeparator />

        <BoardEditorToolbarGroup>
          <BoardEditorToolbarPopover>
            <BoardEditorToolbarPopoverTrigger
              aria-label={labels.selectionToolbar.arrowLineStyle}
              tooltip={labels.selectionToolbar.lineStyle}
            >
              <LineStyleIcon
                dashed={selectedObject.props.lineStyle === "dashed"}
              />
            </BoardEditorToolbarPopoverTrigger>
            <BoardEditorToolbarPopoverContent side="top" sideOffset={8}>
              <ArrowLineStylePopoverContent
                labels={labels}
                lineStyle={selectedObject.props.lineStyle}
                onSelect={(value) => updateArrowProps({ lineStyle: value })}
              />
            </BoardEditorToolbarPopoverContent>
          </BoardEditorToolbarPopover>

          <BoardEditorStrokeWidthControl
            label={labels.selectionToolbar.strokeWidth}
            value={selectedObject.props.strokeWidth}
            onChange={(strokeWidth) => updateArrowProps({ strokeWidth })}
          />

          <BoardEditorToolbarPopover>
            <BoardEditorToolbarPopoverTrigger
              aria-label={labels.selectionToolbar.arrowColor}
              tooltip={labels.selectionToolbar.color}
            >
              <ColorSwatch
                value={selectedObject.props.color}
                className="size-6"
              />
            </BoardEditorToolbarPopoverTrigger>
            <BoardEditorToolbarPopoverContent side="top" sideOffset={8}>
              <ArrowColorPopoverContent
                color={selectedObject.props.color}
                labels={labels}
                onSelect={(value) => updateArrowProps({ color: value })}
              />
            </BoardEditorToolbarPopoverContent>
          </BoardEditorToolbarPopover>
        </BoardEditorToolbarGroup>

        <BoardEditorToolbarSeparator />
        <BoardEditorSelectionActionsMenu
          selectedObjectIds={[selectedObject.id]}
        />
      </BoardEditorToolbar>
    </BoardEditorSelectionToolbarPositioner>
  );
}
