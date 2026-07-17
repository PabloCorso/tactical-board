import {
  THICK_SHAPE_STROKE_WIDTH,
  THIN_SHAPE_STROKE_WIDTH,
  updateShapeObject,
  type ShapeFillStyle,
  type ShapeLineStyle,
  type ShapeObject,
} from "../../../../core/objects/shape-object";
import { createToolApi } from "../../../../core/editor/create-tool-api";
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
import { BoardEditorObjectMeasurementSelectionControl } from "./object-measurement-selection-control";
import { useBoardEditorStore } from "../../../adapter/editor/use-board-editor-store";

const BORDER_STYLE_OPTIONS = [
  { value: "none" },
  { value: "solid" },
  { value: "dashed" },
] as const;

const THICKNESS_OPTIONS = [
  { value: "thin", strokeWidth: THIN_SHAPE_STROKE_WIDTH },
  { value: "thick", strokeWidth: THICK_SHAPE_STROKE_WIDTH },
] as const;

const FILL_STYLE_OPTIONS: Array<{
  value: ShapeFillStyle;
}> = [{ value: "none" }, { value: "solid" }, { value: "diagonal-stripes" }];

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

function ShapeBorderlessIcon() {
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
          stroke="none"
        />
      </svg>
    </span>
  );
}

function ShapeBorderPopoverContent({
  bordered,
  labels,
  lineStyle,
  onChange,
  strokeWidth,
}: {
  bordered: boolean;
  labels: BoardEditorLabels;
  lineStyle: ShapeLineStyle;
  onChange: (props: Partial<ShapeObject["props"]>) => void;
  strokeWidth: number;
}) {
  const borderStyle = bordered ? lineStyle : "none";
  const selectedThickness = THICKNESS_OPTIONS.find(
    (option) => option.strokeWidth === strokeWidth,
  )?.value;

  return (
    <>
      <BoardEditorToolbarToggleGroup
        aria-label={labels.selectionToolbar.shapeBorderStyle}
        value={[borderStyle]}
        onValueChange={(values) => {
          const value = values[0];

          if (value === "none") {
            onChange({ bordered: false });
          } else if (value) {
            onChange({ bordered: true, lineStyle: value });
          }
        }}
      >
        {BORDER_STYLE_OPTIONS.map((option) => (
          <BoardEditorToolbarToggleButton
            key={option.value}
            value={option.value}
            aria-label={
              option.value === "none"
                ? labels.selectionToolbar.shapeFillValue.none
                : labels.selectionToolbar.lineValue[option.value]
            }
            icon={
              option.value === "none" ? (
                <ShapeBorderlessIcon />
              ) : (
                <LineStyleIcon dashed={option.value === "dashed"} />
              )
            }
          />
        ))}
      </BoardEditorToolbarToggleGroup>

      <BoardEditorToolbarSeparator orientation="horizontal" />

      <BoardEditorToolbarToggleGroup
        aria-label={labels.selectionToolbar.thickness}
        disabled={!bordered}
        value={selectedThickness ? [selectedThickness] : []}
        onValueChange={(values) => {
          const value = values[0];
          const option = THICKNESS_OPTIONS.find(
            (candidate) => candidate.value === value,
          );

          if (option) {
            onChange({ strokeWidth: option.strokeWidth });
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

function ShapeFillPopoverContent({
  labels,
  value,
  onSelect,
}: {
  labels: BoardEditorLabels;
  value: ShapeFillStyle;
  onSelect: (nextValue: ShapeFillStyle) => void;
}) {
  return (
    <BoardEditorToolbarToggleGroup
      aria-label={labels.selectionToolbar.shapeFillStyle}
      value={[value]}
      onValueChange={(values) => {
        const nextValue = values[0];

        if (nextValue) {
          onSelect(nextValue);
        }
      }}
    >
      {FILL_STYLE_OPTIONS.map((option) => (
        <BoardEditorToolbarToggleButton
          key={option.value}
          value={option.value}
          aria-label={
            option.value === "diagonal-stripes"
              ? labels.selectionToolbar.shapeFillValue.stripes
              : labels.selectionToolbar.shapeFillValue[option.value]
          }
          icon={<ShapeFillStyleIcon value={option.value} />}
        />
      ))}
    </BoardEditorToolbarToggleGroup>
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
  const labels = useBoardEditorLabels();
  const store = useBoardEditorContext();
  const hasDocumentMeasurement = useBoardEditorStore(store, (state) =>
    Boolean(state.board.frame.measurement),
  );
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
      <BoardEditorToolbar
        aria-label={labels.selectionToolbar.shapeProperties}
        className={className}
        controlSize="sm"
      >
        <BoardEditorToolbarGroup>
          <BoardEditorObjectColorSelectionControl
            selectedObjects={[selectedObject]}
          />

          <BoardEditorSelectionToolbarPopover>
            <BoardEditorSelectionToolbarPopoverTrigger
              aria-label={labels.selectionToolbar.shapeBorderStyle}
              tooltip={labels.selectionToolbar.shapeBorderStyle}
            >
              {selectedObject.props.bordered ? (
                <LineStyleIcon
                  dashed={selectedObject.props.lineStyle === "dashed"}
                  strokeWidth={selectedObject.props.strokeWidth}
                />
              ) : (
                <ShapeBorderlessIcon />
              )}
            </BoardEditorSelectionToolbarPopoverTrigger>
            <BoardEditorSelectionToolbarPopoverContent className="flex-row items-center gap-0.5 p-1">
              <ShapeBorderPopoverContent
                bordered={selectedObject.props.bordered}
                labels={labels}
                lineStyle={selectedObject.props.lineStyle}
                strokeWidth={selectedObject.props.strokeWidth}
                onChange={updateShapeProps}
              />
            </BoardEditorSelectionToolbarPopoverContent>
          </BoardEditorSelectionToolbarPopover>

          <BoardEditorSelectionToolbarPopover>
            <BoardEditorSelectionToolbarPopoverTrigger
              aria-label={labels.selectionToolbar.shapeFillStyle}
              tooltip={labels.selectionToolbar.fillStyle}
            >
              <ShapeFillStyleIcon value={selectedObject.props.fillStyle} />
            </BoardEditorSelectionToolbarPopoverTrigger>
            <BoardEditorSelectionToolbarPopoverContent className="flex-row items-center gap-0.5 p-1">
              <ShapeFillPopoverContent
                labels={labels}
                value={selectedObject.props.fillStyle}
                onSelect={(value) => updateShapeProps({ fillStyle: value })}
              />
            </BoardEditorSelectionToolbarPopoverContent>
          </BoardEditorSelectionToolbarPopover>
        </BoardEditorToolbarGroup>

        {selectedObject.props.kind === "rectangle" && hasDocumentMeasurement ? (
          <>
            <BoardEditorToolbarSeparator />
            <BoardEditorToolbarGroup>
              <BoardEditorObjectMeasurementSelectionControl
                selectedObjects={[selectedObject]}
              />
            </BoardEditorToolbarGroup>
          </>
        ) : null}

        <BoardEditorToolbarSeparator />
        <BoardEditorSelectionActionsMenu
          selectedObjectIds={[selectedObject.id]}
        />
      </BoardEditorToolbar>
    </BoardEditorSelectionToolbarPositioner>
  );
}
