import {
  setArrowKind,
  THICK_ARROW_STROKE_WIDTH,
  THIN_ARROW_STROKE_WIDTH,
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
  BoardEditorToolbarSeparator,
  BoardEditorToolbarToggleButton,
  BoardEditorToolbarToggleGroup,
} from "../toolbar/editor-toolbar";
import { BoardEditorSelectionToolbarPositioner } from "./selection-toolbar-positioner";
import type { BoardEditorSelectionToolbarRendererProps } from "./selection-toolbar-types";
import type { IconRender } from "../../../ui/icon";
import { LineStyleIcon } from "./line-style-icon";
import {
  useBoardEditorLabels,
  type BoardEditorLabels,
} from "../board-editor-labels";
import {
  BoardEditorSelectionToolbarPopover,
  BoardEditorSelectionToolbarPopoverContent,
  BoardEditorSelectionToolbarPopoverTrigger,
} from "./selection-toolbar-popover";
import { BoardEditorObjectColorSelectionControl } from "./object-color-selection-control";

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

const THICKNESS_OPTIONS = [
  { value: "thin", strokeWidth: THIN_ARROW_STROKE_WIDTH },
  { value: "thick", strokeWidth: THICK_ARROW_STROKE_WIDTH },
] as const;

const HEAD_STYLE_OPTIONS: Array<{
  value: ArrowHeadStyle;
}> = [{ value: "none" }, { value: "triangle" }] as const;

function getBodyStyleIcon(kind: ArrowKind): IconRender {
  return (
    <BoardEditorArrowIcon
      draftStyle={{
        kind,
        startHead: "none",
        endHead: "none",
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
      layout="horizontal"
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
    <BoardEditorToolbarToggleGroup
      aria-label={labels.selectionToolbar.arrowBodyStyle}
      value={[selectedObject.props.kind]}
      onValueChange={(values) => {
        const value = values[0];

        if (value) {
          onSelect(value);
        }
      }}
    >
      {BODY_STYLE_OPTIONS.map((option) => (
        <BoardEditorToolbarToggleButton
          key={option.value}
          value={option.value}
          aria-label={labels.selectionToolbar.arrowStyle[option.value]}
          icon={getBodyStyleIcon(option.value)}
        />
      ))}
    </BoardEditorToolbarToggleGroup>
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
  const groupLabel =
    side === "start"
      ? labels.selectionToolbar.arrowLeftHead
      : labels.selectionToolbar.arrowRightHead;

  return (
    <BoardEditorToolbarToggleGroup
      aria-label={groupLabel}
      value={[headStyle]}
      onValueChange={(values) => {
        const value = values[0];

        if (value) {
          onSelect(value);
        }
      }}
    >
      {HEAD_STYLE_OPTIONS.map((option) => (
        <BoardEditorToolbarToggleButton
          key={option.value}
          value={option.value}
          aria-label={
            option.value === "triangle"
              ? labels.selectionToolbar.arrowHead.arrow
              : labels.selectionToolbar.arrowHead.none
          }
          icon={getHeadStyleIcon(option.value, side)}
        />
      ))}
    </BoardEditorToolbarToggleGroup>
  );
}

type ArrowLinePopoverContentProps = {
  labels: BoardEditorLabels;
  lineStyle: ArrowLineStyle;
  onLineStyleSelect: (value: ArrowLineStyle) => void;
  onStrokeWidthSelect: (value: number) => void;
  strokeWidth: number;
};

function ArrowLinePopoverContent({
  labels,
  lineStyle,
  onLineStyleSelect,
  onStrokeWidthSelect,
  strokeWidth,
}: ArrowLinePopoverContentProps) {
  const selectedThickness = THICKNESS_OPTIONS.find(
    (option) => option.strokeWidth === strokeWidth,
  )?.value;

  return (
    <>
      <BoardEditorToolbarToggleGroup
        aria-label={labels.selectionToolbar.lineStyle}
        value={[lineStyle]}
        onValueChange={(values) => {
          const value = values[0];

          if (value) {
            onLineStyleSelect(value);
          }
        }}
      >
        {LINE_STYLE_OPTIONS.map((option) => (
          <BoardEditorToolbarToggleButton
            key={option.value}
            value={option.value}
            aria-label={labels.selectionToolbar.lineValue[option.value]}
            icon={<LineStyleIcon dashed={option.value === "dashed"} />}
          />
        ))}
      </BoardEditorToolbarToggleGroup>

      <BoardEditorToolbarSeparator orientation="horizontal" />

      <BoardEditorToolbarToggleGroup
        aria-label={labels.selectionToolbar.thickness}
        value={selectedThickness ? [selectedThickness] : []}
        onValueChange={(values) => {
          const value = values[0];
          const option = THICKNESS_OPTIONS.find(
            (candidate) => candidate.value === value,
          );

          if (option) {
            onStrokeWidthSelect(option.strokeWidth);
          }
        }}
      >
        {THICKNESS_OPTIONS.map((option) => (
          <BoardEditorToolbarToggleButton
            key={option.value}
            value={option.value}
            aria-label={labels.selectionToolbar.thicknessValue[option.value]}
            icon={<LineStyleIcon strokeWidth={option.strokeWidth} />}
          />
        ))}
      </BoardEditorToolbarToggleGroup>
    </>
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
          <BoardEditorSelectionToolbarPopover>
            <BoardEditorSelectionToolbarPopoverTrigger
              aria-label={labels.selectionToolbar.arrowLeftHead}
              tooltip={labels.selectionToolbar.arrowLeftHead}
            >
              {getHeadStyleIcon(selectedObject.props.startHead, "start")}
            </BoardEditorSelectionToolbarPopoverTrigger>
            <BoardEditorSelectionToolbarPopoverContent className="flex-row items-center gap-0.5 p-1">
              <ArrowHeadPopoverContent
                labels={labels}
                headStyle={selectedObject.props.startHead}
                side="start"
                onSelect={(value) => updateArrowProps({ startHead: value })}
              />
            </BoardEditorSelectionToolbarPopoverContent>
          </BoardEditorSelectionToolbarPopover>

          <BoardEditorSelectionToolbarPopover>
            <BoardEditorSelectionToolbarPopoverTrigger
              aria-label={labels.selectionToolbar.arrowBodyStyle}
              tooltip={labels.selectionToolbar.arrowBodyStyle}
            >
              {getBodyStyleIcon(selectedObject.props.kind)}
            </BoardEditorSelectionToolbarPopoverTrigger>
            <BoardEditorSelectionToolbarPopoverContent className="flex-row items-center gap-0.5 p-1">
              <ArrowBodyPopoverContent
                labels={labels}
                selectedObject={selectedObject}
                onSelect={updateBodyStyle}
              />
            </BoardEditorSelectionToolbarPopoverContent>
          </BoardEditorSelectionToolbarPopover>

          <BoardEditorSelectionToolbarPopover>
            <BoardEditorSelectionToolbarPopoverTrigger
              aria-label={labels.selectionToolbar.arrowRightHead}
              tooltip={labels.selectionToolbar.arrowRightHead}
            >
              {getHeadStyleIcon(selectedObject.props.endHead, "end")}
            </BoardEditorSelectionToolbarPopoverTrigger>
            <BoardEditorSelectionToolbarPopoverContent className="flex-row items-center gap-0.5 p-1">
              <ArrowHeadPopoverContent
                labels={labels}
                headStyle={selectedObject.props.endHead}
                side="end"
                onSelect={(value) => updateArrowProps({ endHead: value })}
              />
            </BoardEditorSelectionToolbarPopoverContent>
          </BoardEditorSelectionToolbarPopover>
        </BoardEditorToolbarGroup>

        <BoardEditorToolbarSeparator />

        <BoardEditorToolbarGroup>
          <BoardEditorSelectionToolbarPopover>
            <BoardEditorSelectionToolbarPopoverTrigger
              aria-label={labels.selectionToolbar.arrowLine}
              tooltip={labels.selectionToolbar.arrowLine}
            >
              <LineStyleIcon
                dashed={selectedObject.props.lineStyle === "dashed"}
                strokeWidth={selectedObject.props.strokeWidth}
              />
            </BoardEditorSelectionToolbarPopoverTrigger>
            <BoardEditorSelectionToolbarPopoverContent className="flex-row items-center gap-0.5 p-1">
              <ArrowLinePopoverContent
                labels={labels}
                lineStyle={selectedObject.props.lineStyle}
                strokeWidth={selectedObject.props.strokeWidth}
                onLineStyleSelect={(value) =>
                  updateArrowProps({ lineStyle: value })
                }
                onStrokeWidthSelect={(value) =>
                  updateArrowProps({ strokeWidth: value })
                }
              />
            </BoardEditorSelectionToolbarPopoverContent>
          </BoardEditorSelectionToolbarPopover>

          <BoardEditorObjectColorSelectionControl
            selectedObjects={[selectedObject]}
          />
        </BoardEditorToolbarGroup>

        <BoardEditorToolbarSeparator />
        <BoardEditorSelectionActionsMenu
          selectedObjectIds={[selectedObject.id]}
        />
      </BoardEditorToolbar>
    </BoardEditorSelectionToolbarPositioner>
  );
}
