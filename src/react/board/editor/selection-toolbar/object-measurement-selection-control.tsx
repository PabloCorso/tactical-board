import { Ruler } from "@phosphor-icons/react";
import type { BoardObject, CaptionStyle } from "../../../../core/board/types";
import { createToolApi } from "../../../../core/editor/create-tool-api";
import { ARROW_OBJECT_TYPE } from "../../../../core/objects/arrow-object";
import {
  getObjectMeasurementSelectionState,
  getObjectMeasurementStyleSelectionState,
  updateObjectMeasurementStyle,
  updateObjectMeasurementVisibility,
} from "../../../../core/objects/object-properties";
import { useBoardEditorContext } from "../../../adapter/editor/board-editor-context";
import { CaptionStyleFields } from "../../player/player-caption-fields";
import { Switch } from "../../../ui/switch";
import { useBoardEditorLabels } from "../board-editor-labels";
import {
  BoardEditorSelectionToolbarPopover,
  BoardEditorSelectionToolbarPopoverContent,
  BoardEditorSelectionToolbarPopoverTitle,
  BoardEditorSelectionToolbarPopoverTrigger,
} from "./selection-toolbar-popover";

export type BoardEditorObjectMeasurementSelectionControlProps = {
  selectedObjects: BoardObject[];
};

export function BoardEditorObjectMeasurementSelectionControl({
  selectedObjects,
}: BoardEditorObjectMeasurementSelectionControlProps) {
  const labels = useBoardEditorLabels();
  const store = useBoardEditorContext();
  const toolApi = createToolApi(store);
  const visibilityState = getObjectMeasurementSelectionState(selectedObjects);
  const styleState = getObjectMeasurementStyleSelectionState(selectedObjects);

  if (!visibilityState || !styleState) {
    return null;
  }

  const objectIds = selectedObjects.map((object) => object.id);
  const updateVisibility = (visible: boolean) =>
    toolApi.updateObjects(objectIds, (object) =>
      updateObjectMeasurementVisibility(object, visible),
    );
  const updateStyle = (style: Partial<CaptionStyle>) =>
    toolApi.updateObjects(objectIds, (object) =>
      updateObjectMeasurementStyle(object, style),
    );
  const style: CaptionStyle = {
    placement: styleState.placement.value,
    distance: styleState.distance.value,
    fontSize: styleState.fontSize.value,
    color: styleState.color.value,
    backgroundStyle: styleState.backgroundStyle.value,
    backgroundColor: styleState.backgroundColor.value,
  };
  const mixed = {
    placement: styleState.placement.mixed,
    distance: styleState.distance.mixed,
    fontSize: styleState.fontSize.mixed,
    color: styleState.color.mixed,
    backgroundStyle: styleState.backgroundStyle.mixed,
    backgroundColor: styleState.backgroundColor.mixed,
  };
  const triggerLabel = visibilityState.mixed
    ? labels.selectionToolbar.measurementMixed
    : labels.selectionToolbar.measurement;
  const placements = selectedObjects.some(
    (object) => object.type === ARROW_OBJECT_TYPE,
  )
    ? (["top", "bottom"] as const)
    : (["left", "top", "right", "bottom"] as const);

  return (
    <BoardEditorSelectionToolbarPopover
      onOpenChange={(open) => {
        if (open && !visibilityState.visible && !visibilityState.mixed) {
          updateVisibility(true);
        }
      }}
    >
      <BoardEditorSelectionToolbarPopoverTrigger
        active={visibilityState.visible || visibilityState.mixed}
        aria-label={triggerLabel}
        tooltip={triggerLabel}
      >
        <Ruler
          weight={
            visibilityState.mixed
              ? "duotone"
              : visibilityState.visible
                ? "fill"
                : "regular"
          }
        />
      </BoardEditorSelectionToolbarPopoverTrigger>

      <BoardEditorSelectionToolbarPopoverContent className="w-48 min-w-0">
        <div className="flex min-h-5 items-center justify-between gap-3">
          <BoardEditorSelectionToolbarPopoverTitle>
            {labels.selectionToolbar.measurement}
          </BoardEditorSelectionToolbarPopoverTitle>
          <span className="flex items-center gap-2">
            {visibilityState.mixed ? (
              <span className="text-tb-text-tertiary text-xs">
                {labels.selectionToolbar.mixedValue}
              </span>
            ) : null}
            <Switch
              aria-label={labels.selectionToolbar.measurement}
              checked={visibilityState.mixed ? false : visibilityState.visible}
              onCheckedChange={(visible) => updateVisibility(visible)}
            />
          </span>
        </div>

        <CaptionStyleFields
          labels={labels}
          mixed={mixed}
          placements={[...placements]}
          style={style}
          onChange={updateStyle}
        />
      </BoardEditorSelectionToolbarPopoverContent>
    </BoardEditorSelectionToolbarPopover>
  );
}
