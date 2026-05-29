import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import * as React from "react";
import { cn } from "./misc";
import { floatingContentClassName } from "./floating-content";

export type PopoverProps = PopoverPrimitive.Root.Props;

export const Popover = PopoverPrimitive.Root;

export type PopoverTriggerProps = Omit<
  PopoverPrimitive.Trigger.Props,
  "children" | "render"
> & {
  children: PopoverPrimitive.Trigger.Props["render"];
};

export function PopoverTrigger({ children, ...props }: PopoverTriggerProps) {
  return <PopoverPrimitive.Trigger render={children} {...props} />;
}

export type PopoverContentProps = PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    | "align"
    | "alignOffset"
    | "collisionPadding"
    | "positionMethod"
    | "side"
    | "sideOffset"
  > & {
    portalContainer?: PopoverPrimitive.Portal.Props["container"];
  };

export function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  collisionPadding = 8,
  positionMethod = "fixed",
  portalContainer,
  side = "bottom",
  sideOffset = 4,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal container={portalContainer}>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        positionMethod={positionMethod}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          data-tactical-board
          className={floatingContentClassName(
            "border-tb-border-default bg-tb-background-surface text-tb-text-primary z-50 flex max-h-(--available-height) w-72 flex-col gap-2.5 overflow-x-hidden overflow-y-auto rounded-lg border p-2.5 text-sm shadow-lg outline-hidden",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export type PopoverHeaderProps = React.ComponentProps<"div">;

export function PopoverHeader({ className, ...props }: PopoverHeaderProps) {
  return <div className={cn("flex flex-col gap-0.5", className)} {...props} />;
}

export type PopoverTitleProps = PopoverPrimitive.Title.Props;

export function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return (
    <PopoverPrimitive.Title
      className={cn("font-medium", className)}
      {...props}
    />
  );
}

export type PopoverDescriptionProps = PopoverPrimitive.Description.Props;

export function PopoverDescription({
  className,
  ...props
}: PopoverDescriptionProps) {
  return (
    <PopoverPrimitive.Description
      className={cn("text-tb-text-secondary", className)}
      {...props}
    />
  );
}
