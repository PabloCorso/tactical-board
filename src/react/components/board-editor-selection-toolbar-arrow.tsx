import {
  ArrowArcRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CaretDownIcon,
  LineSegmentIcon,
  LineSegmentsIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import {
  type ArrowBodyStyle,
  type ArrowHeadStyle,
  type ArrowObject,
} from "../../core/objects/arrow-object";
import { createToolApi } from "../../core/editor/create-tool-api";
import { useBoardEditorContext } from "./board-editor-context";
import { BoardEditorToolbar } from "./board-editor-toolbar";
import { BoardEditorToolbarButton } from "./board-editor-toolbar-button";
import type { BoardEditorSelectionToolbarRendererProps } from "./board-editor-selection-toolbar-types";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import type { IconProps } from "./ui/icon";

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

const DASHED_OPTIONS = [
  { label: "Solid", value: false },
  { label: "Dashed", value: true },
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
): IconProps["children"] {
  if (head === "none") {
    return <LineSegmentIcon weight="bold" />;
  }

  return side === "start" ? (
    <ArrowLeftIcon weight="bold" />
  ) : (
    <ArrowRightIcon weight="bold" />
  );
}

function getBodyStyleIcon(bodyStyle: ArrowBodyStyle): IconProps["children"] {
  return bodyStyle === "curved" ? (
    <ArrowArcRightIcon weight="bold" />
  ) : (
    <ArrowRightIcon weight="bold" />
  );
}

type ArrowPopoverButtonProps = {
  ariaLabel: string;
  tooltip?: string;
  icon: IconProps["children"];
  content: ReactNode;
};

function ArrowPopoverButton({
  ariaLabel,
  tooltip,
  icon,
  content,
}: ArrowPopoverButtonProps) {
  return (
    <Popover>
      <PopoverTrigger>
        <BoardEditorToolbarButton
          aria-label={ariaLabel}
          iconBefore={icon}
          iconAfter={<CaretDownIcon className="opacity-75" />}
          iconSize="xl"
          tooltip={tooltip}
        />
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={8}
        className="w-auto min-w-max"
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}

type ArrowOptionButtonProps = {
  active: boolean;
  ariaLabel: string;
  onClick: () => void;
  icon: IconProps["children"];
};

function ArrowOptionButton({
  active,
  ariaLabel,
  onClick,
  icon,
}: ArrowOptionButtonProps) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      aria-label={ariaLabel}
      aria-pressed={active}
      iconBefore={icon}
      iconSize="xl"
      onClick={onClick}
    />
  );
}

type ArrowHeadPopoverContentProps = {
  activeHead: ArrowHeadStyle;
  side: "start" | "end";
  selectedObject: ArrowObject;
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
        <ArrowOptionButton
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
        <ArrowOptionButton
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

type ArrowDashedPopoverContentProps = {
  dashed: boolean;
  onSelect: (value: boolean) => void;
};

function ArrowDashedPopoverContent({
  dashed,
  onSelect,
}: ArrowDashedPopoverContentProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {DASHED_OPTIONS.map((option) => (
        <ArrowOptionButton
          key={option.label}
          active={dashed === option.value}
          ariaLabel={`Arrow line style ${option.label}`}
          icon={
            <span className="flex h-5 w-10 items-center justify-center">
              <span
                className="bg-current"
                style={{
                  width: 28,
                  height: 2.5,
                  borderRadius: 9999,
                  opacity: option.value ? 0.6 : 1,
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
        <ArrowOptionButton
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
          <ArrowPopoverButton
            ariaLabel="Arrow line style"
            tooltip="Line style"
            content={
              <ArrowDashedPopoverContent
                dashed={selectedObject.props.dashed}
                onSelect={(value) => updateArrowProps({ dashed: value })}
              />
            }
            icon={<LineSegmentsIcon weight="bold" />}
          />

          <ArrowPopoverButton
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

          <ArrowPopoverButton
            ariaLabel="Arrow start head"
            tooltip="Start head"
            content={
              <ArrowHeadPopoverContent
                activeHead={selectedObject.props.startHead}
                side="start"
                selectedObject={selectedObject}
                onSelect={(value) => updateArrowProps({ startHead: value })}
              />
            }
            icon={getHeadIcon("start", selectedObject.props.startHead)}
          />

          <ArrowPopoverButton
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

          <ArrowPopoverButton
            ariaLabel="Arrow end head"
            tooltip="End head"
            content={
              <ArrowHeadPopoverContent
                activeHead={selectedObject.props.endHead}
                side="end"
                selectedObject={selectedObject}
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
