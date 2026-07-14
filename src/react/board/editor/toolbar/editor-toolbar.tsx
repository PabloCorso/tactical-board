import {
  createContext,
  type ComponentProps,
  type ComponentPropsWithRef,
  type ReactNode,
  useContext,
} from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { cn } from "../../../ui/misc";
import { Button, type ButtonProps } from "../../../ui/button";
import type { IconRender } from "../../../ui/icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  type PopoverContentProps,
} from "../../../ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type TooltipContentProps,
} from "../../../ui/tooltip";
import { useBoardEditorToolbarFloatingPortal } from "./toolbar-dock";

export type BoardEditorToolbarOrientation = "horizontal" | "vertical";

type BoardEditorToolbarContextValue = {
  activeVariant: BoardEditorToolbarButtonActiveVariant;
  controlSize: NonNullable<ButtonProps["size"]>;
  orientation: BoardEditorToolbarOrientation;
  tooltipSide: TooltipContentProps["side"];
};

const BoardEditorToolbarContext = createContext<BoardEditorToolbarContextValue>(
  {
    activeVariant: "outline",
    controlSize: "md",
    orientation: "horizontal",
    tooltipSide: "top",
  },
);

export type BoardEditorToolbarProps = ComponentPropsWithRef<"aside"> & {
  activeVariant?: BoardEditorToolbarButtonActiveVariant;
  contentClassName?: string;
  controlSize?: NonNullable<ButtonProps["size"]>;
  density?: "default" | "compact";
  orientation?: BoardEditorToolbarOrientation;
  tooltipSide?: TooltipContentProps["side"];
};

export function BoardEditorToolbar({
  activeVariant = "outline",
  children,
  className,
  contentClassName,
  controlSize = "md",
  density = "default",
  orientation = "horizontal",
  tooltipSide = "top",
  ...props
}: BoardEditorToolbarProps) {
  return (
    <BoardEditorToolbarContext.Provider
      value={{ activeVariant, controlSize, orientation, tooltipSide }}
    >
      <aside
        {...props}
        role="toolbar"
        aria-orientation={orientation}
        className={cn(
          "bg-tb-background-surface pointer-events-auto mx-auto inline-flex max-h-full w-max max-w-full overflow-hidden rounded-xl shadow-lg",
          "max-h-[calc(100dvh-1rem)] max-w-[calc(100dvw-1rem)]",
          className,
        )}
      >
        <div
          className={cn(
            "bg-tb-background-surface flex max-h-full max-w-full flex-nowrap items-center justify-start gap-0.5 overflow-auto overscroll-contain",
            density === "compact" ? "p-0.5" : "p-1",
            "max-h-[calc(100dvh-1.5rem)] max-w-[calc(100dvw-1.5rem)]",
            orientation === "vertical" && "flex-col",
            contentClassName,
          )}
        >
          {children}
        </div>
      </aside>
    </BoardEditorToolbarContext.Provider>
  );
}

export type BoardEditorToolbarGroupProps = ComponentPropsWithRef<"div"> & {
  orientation?: BoardEditorToolbarOrientation;
};

export function BoardEditorToolbarGroup({
  orientation: orientationProp,
  className,
  ...props
}: BoardEditorToolbarGroupProps) {
  const { orientation: toolbarOrientation } = useContext(
    BoardEditorToolbarContext,
  );
  const orientation = orientationProp ?? toolbarOrientation;

  return (
    <div
      role="group"
      className={cn(
        "flex min-w-0 items-center gap-0.5",
        orientation === "vertical" && "flex-col",
        className,
      )}
      {...props}
    />
  );
}

export type BoardEditorToolbarButtonActiveVariant = "outline" | "accent";

export type BoardEditorToolbarButtonProps = ButtonProps & {
  active?: boolean;
  activeVariant?: BoardEditorToolbarButtonActiveVariant;
  tooltip?: ReactNode | false;
};

export function BoardEditorToolbarButton({
  active = false,
  activeVariant: activeVariantProp,
  "aria-label": ariaLabel,
  tooltip,
  iconSize = "xl",
  className,
  size: sizeProp,
  ...props
}: BoardEditorToolbarButtonProps) {
  const {
    activeVariant: toolbarActiveVariant,
    controlSize,
    tooltipSide,
  } = useContext(BoardEditorToolbarContext);
  const activeVariant = activeVariantProp ?? toolbarActiveVariant;
  const size = sizeProp ?? controlSize;
  const tooltipContent = tooltip === false ? null : (tooltip ?? ariaLabel);
  const useAccentActiveState = active && activeVariant === "accent";
  const button = (
    <Button
      variant={useAccentActiveState ? "primary" : active ? "outline" : "ghost"}
      size={size}
      iconSize={iconSize}
      iconClassName="text-[var(--tb-toolbar-icon-primary)]"
      className={cn(
        active && !useAccentActiveState && "border-tb-neutral-soft-active",
        useAccentActiveState &&
          "[--tb-toolbar-icon-primary:var(--tb-text-on-accent)]",
        className,
      )}
      aria-label={ariaLabel}
      {...props}
    />
  );

  if (!tooltipContent) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger>{button}</TooltipTrigger>
      <TooltipContent side={tooltipSide}>{tooltipContent}</TooltipContent>
    </Tooltip>
  );
}

export type BoardEditorToolbarSeparatorProps = ComponentPropsWithRef<"div"> & {
  orientation?: BoardEditorToolbarOrientation;
};

export function BoardEditorToolbarSeparator({
  orientation: orientationProp,
  className,
  ...props
}: BoardEditorToolbarSeparatorProps) {
  const { orientation: toolbarOrientation } = useContext(
    BoardEditorToolbarContext,
  );
  const orientation = orientationProp ?? toolbarOrientation;

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "bg-tb-border-default shrink-0",
        orientation === "horizontal" && "mx-0.5 w-px self-stretch",
        orientation === "vertical" && "my-0.5 h-px self-stretch",
        className,
      )}
      {...props}
    />
  );
}

export type BoardEditorToolbarPopoverProps = ComponentProps<typeof Popover>;

export function BoardEditorToolbarPopover(
  props: BoardEditorToolbarPopoverProps,
) {
  return <Popover {...props} />;
}

export type BoardEditorToolbarPopoverTriggerProps = Omit<
  BoardEditorToolbarButtonProps,
  "children" | "iconAfter" | "iconBefore" | "tooltip"
> & {
  children: IconRender;
  showCaret?: boolean;
  tooltip?: ReactNode | false;
};

export function BoardEditorToolbarPopoverTrigger({
  active = false,
  "aria-label": ariaLabel,
  children,
  className,
  showCaret = true,
  tooltip,
  ...props
}: BoardEditorToolbarPopoverTriggerProps) {
  const { tooltipSide } = useContext(BoardEditorToolbarContext);
  const tooltipContent = tooltip === false ? null : (tooltip ?? ariaLabel);
  const trigger = (
    <PopoverTrigger>
      <BoardEditorToolbarButton
        {...props}
        active={active}
        aria-label={ariaLabel}
        aria-pressed={active || undefined}
        className={cn("px-2", className)}
        iconBefore={children}
        iconAfter={
          showCaret ? (
            <CaretDownIcon
              aria-hidden="true"
              className="text-tb-text-secondary"
            />
          ) : undefined
        }
        iconSize="xl"
        iconAfterSize="sm"
        tooltip={false}
      />
    </PopoverTrigger>
  );

  if (!tooltipContent) {
    return trigger;
  }

  return (
    <Tooltip>
      <TooltipTrigger>{trigger}</TooltipTrigger>
      <TooltipContent side={tooltipSide}>{tooltipContent}</TooltipContent>
    </Tooltip>
  );
}

export type BoardEditorToolbarPopoverContentProps = Omit<
  PopoverContentProps,
  "portalContainer" | "positionMethod"
>;

export function BoardEditorToolbarPopoverContent({
  className,
  ...props
}: BoardEditorToolbarPopoverContentProps) {
  const floatingPortal = useBoardEditorToolbarFloatingPortal();

  return (
    <PopoverContent
      {...props}
      portalContainer={floatingPortal.container}
      positionMethod={floatingPortal.positionMethod}
      className={cn("w-auto min-w-max gap-0.5 p-1", className)}
    />
  );
}

export type BoardEditorToolbarOptionButtonProps = Omit<
  ButtonProps,
  "children" | "iconBefore" | "size" | "variant"
> & {
  active: boolean;
  ariaLabel: string;
  icon: IconRender;
};

export function BoardEditorToolbarOptionButton({
  active,
  ariaLabel,
  icon,
  className,
  ...props
}: BoardEditorToolbarOptionButtonProps) {
  const { controlSize } = useContext(BoardEditorToolbarContext);

  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "rounded-lg",
        { "border-tb-neutral-soft-active": active },
        className,
      )}
      iconBefore={icon}
      iconSize="xl"
      size={controlSize}
      {...props}
    />
  );
}
