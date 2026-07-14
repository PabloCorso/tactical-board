import type { ComponentProps } from "react";
import { cn } from "../../../ui/misc";
import {
  PopoverDescription,
  PopoverTitle,
  type PopoverDescriptionProps,
  type PopoverTitleProps,
} from "../../../ui/popover";
import {
  BoardEditorToolbarPopover,
  BoardEditorToolbarPopoverContent,
  BoardEditorToolbarPopoverTrigger,
  type BoardEditorToolbarPopoverContentProps,
  type BoardEditorToolbarPopoverProps,
  type BoardEditorToolbarPopoverTriggerProps,
} from "../toolbar/editor-toolbar";

export type BoardEditorSelectionToolbarPopoverProps =
  BoardEditorToolbarPopoverProps;

export function BoardEditorSelectionToolbarPopover(
  props: BoardEditorSelectionToolbarPopoverProps,
) {
  return <BoardEditorToolbarPopover {...props} />;
}

export type BoardEditorSelectionToolbarPopoverTriggerProps =
  BoardEditorToolbarPopoverTriggerProps;

export function BoardEditorSelectionToolbarPopoverTrigger(
  props: BoardEditorSelectionToolbarPopoverTriggerProps,
) {
  return <BoardEditorToolbarPopoverTrigger {...props} />;
}

export type BoardEditorSelectionToolbarPopoverContentProps =
  BoardEditorToolbarPopoverContentProps;

export function BoardEditorSelectionToolbarPopoverContent({
  className,
  side = "top",
  sideOffset = 8,
  ...props
}: BoardEditorSelectionToolbarPopoverContentProps) {
  return (
    <BoardEditorToolbarPopoverContent
      {...props}
      side={side}
      sideOffset={sideOffset}
      className={cn("gap-2 p-2", className)}
    />
  );
}

export type BoardEditorSelectionToolbarPopoverHeaderProps =
  ComponentProps<"div">;

export function BoardEditorSelectionToolbarPopoverHeader({
  className,
  ...props
}: BoardEditorSelectionToolbarPopoverHeaderProps) {
  return (
    <div
      {...props}
      className={cn("flex min-w-0 flex-col gap-0.5", className)}
    />
  );
}

export type BoardEditorSelectionToolbarPopoverTitleProps = PopoverTitleProps;

export function BoardEditorSelectionToolbarPopoverTitle({
  className,
  ...props
}: BoardEditorSelectionToolbarPopoverTitleProps) {
  return (
    <PopoverTitle
      {...props}
      className={cn("m-0 text-sm leading-5 font-semibold", className)}
    />
  );
}

export type BoardEditorSelectionToolbarPopoverDescriptionProps =
  PopoverDescriptionProps;

export function BoardEditorSelectionToolbarPopoverDescription({
  className,
  ...props
}: BoardEditorSelectionToolbarPopoverDescriptionProps) {
  return (
    <PopoverDescription
      {...props}
      className={cn("text-tb-text-tertiary m-0 text-xs leading-4", className)}
    />
  );
}
