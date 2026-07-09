import { Drawer as DrawerPrimitive } from "@base-ui/react";
import * as React from "react";
import { cn } from "./misc";

export type DrawerProps = DrawerPrimitive.Root.Props;
export const Drawer = DrawerPrimitive.Root;

export type DrawerTriggerProps = Omit<
  DrawerPrimitive.Trigger.Props,
  "children" | "render"
> & { children: DrawerPrimitive.Trigger.Props["render"] };
export function DrawerTrigger({ children, ...props }: DrawerTriggerProps) {
  return <DrawerPrimitive.Trigger render={children} {...props} />;
}

export type DrawerPortalProps = DrawerPrimitive.Portal.Props;
export const DrawerPortal = DrawerPrimitive.Portal;

export type DrawerCloseProps = Omit<
  DrawerPrimitive.Close.Props,
  "children" | "render"
> & { children: DrawerPrimitive.Close.Props["render"] };

export function DrawerClose({ children, ...props }: DrawerCloseProps) {
  return <DrawerPrimitive.Close render={children} {...props} />;
}

export type DrawerSwipeAreaProps = DrawerPrimitive.SwipeArea.Props;

export function DrawerSwipeArea({ className, ...props }: DrawerSwipeAreaProps) {
  return (
    <DrawerPrimitive.SwipeArea
      className={cn(
        "absolute z-10",

        // swipe right => left edge drawer
        "data-[swipe-direction=right]:inset-y-0 data-[swipe-direction=right]:left-0 data-[swipe-direction=right]:w-10",

        // swipe left => right edge drawer
        "data-[swipe-direction=left]:inset-y-0 data-[swipe-direction=left]:right-0 data-[swipe-direction=left]:w-10",

        // swipe up => bottom edge drawer
        "data-[swipe-direction=up]:inset-x-0 data-[swipe-direction=up]:bottom-0 data-[swipe-direction=up]:h-10",

        // swipe down => top edge drawer
        "data-[swipe-direction=down]:inset-x-0 data-[swipe-direction=down]:top-0 data-[swipe-direction=down]:h-10",

        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none absolute text-xs font-bold tracking-[0.12em] whitespace-nowrap uppercase",

          // swipe right => left edge drawer
          "data-[swipe-direction=right]:top-1/2 data-[swipe-direction=right]:left-0 data-[swipe-direction=right]:ml-2 data-[swipe-direction=right]:-translate-y-1/2 data-[swipe-direction=right]:rotate-90",

          // swipe left => right edge drawer
          "data-[swipe-direction=left]:top-1/2 data-[swipe-direction=left]:right-0 data-[swipe-direction=left]:mr-2 data-[swipe-direction=left]:-translate-y-1/2 data-[swipe-direction=left]:-rotate-90",

          // swipe up => bottom edge drawer
          "data-[swipe-direction=up]:bottom-0 data-[swipe-direction=up]:left-1/2 data-[swipe-direction=up]:mb-2 data-[swipe-direction=up]:-translate-x-1/2",

          // swipe down => top edge drawer
          "data-[swipe-direction=down]:top-0 data-[swipe-direction=down]:left-1/2 data-[swipe-direction=down]:mt-2 data-[swipe-direction=down]:-translate-x-1/2",
        )}
      />
    </DrawerPrimitive.SwipeArea>
  );
}

export type DrawerBackdropProps = DrawerPrimitive.Backdrop.Props;

export function DrawerBackdrop({ className, ...props }: DrawerBackdropProps) {
  return (
    <DrawerPrimitive.Backdrop
      className={cn(
        "fixed inset-0 isolate z-50 min-h-dvh bg-black/80 opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:opacity-0 data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-[starting-style]:opacity-0 data-[swiping]:duration-0 supports-backdrop-filter:backdrop-blur-xs",
        className,
      )}
      {...props}
    />
  );
}

export type DrawerContentProps = DrawerPrimitive.Content.Props & {
  popupClassName?: string;
  showBackdrop?: boolean;
  viewportClassName?: string;
};

export function DrawerContent({
  className,
  children,
  popupClassName,
  showBackdrop = true,
  viewportClassName,
  ...props
}: DrawerContentProps) {
  return (
    <DrawerPortal>
      {showBackdrop ? <DrawerBackdrop /> : null}
      <DrawerPrimitive.Viewport
        className={cn(
          "fixed inset-0 z-50 flex p-[var(--viewport-padding)] [--viewport-padding:0px]",
          viewportClassName,
        )}
      >
        <DrawerPrimitive.Popup
          data-tactical-board
          className={cn(
            "group/drawer-popup bg-tb-background-surface text-tb-text-primary relative touch-auto overflow-y-auto overscroll-contain transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] outline-none [--bleed:3rem] data-[swiping]:duration-0 data-[swiping]:select-none",

            // left
            "data-[swipe-direction=left]:mr-auto data-[swipe-direction=left]:-ml-[var(--bleed)] data-[swipe-direction=left]:h-full data-[swipe-direction=left]:w-[calc(20rem+var(--bleed))] data-[swipe-direction=left]:max-w-[calc(100vw-3rem+var(--bleed))] data-[swipe-direction=left]:[transform:translateX(var(--drawer-swipe-movement-x))] data-[swipe-direction=left]:pl-(--bleed) data-[swipe-direction=left]:data-[ending-style]:[transform:translateX(calc(-100%+var(--bleed)-var(--viewport-padding)-2px))] data-[swipe-direction=left]:data-[starting-style]:[transform:translateX(calc(-100%+var(--bleed)-var(--viewport-padding)-2px))]",

            // right
            "data-[swipe-direction=right]:-mr-[var(--bleed)] data-[swipe-direction=right]:ml-auto data-[swipe-direction=right]:h-full data-[swipe-direction=right]:w-[calc(20rem+var(--bleed))] data-[swipe-direction=right]:max-w-[calc(100vw-3rem+var(--bleed))] data-[swipe-direction=right]:[transform:translateX(var(--drawer-swipe-movement-x))] data-[swipe-direction=right]:pr-(--bleed) data-[swipe-direction=right]:data-[ending-style]:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-[swipe-direction=right]:data-[starting-style]:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))]",

            // down
            "data-[swipe-direction=down]:mt-auto data-[swipe-direction=down]:max-h-[calc(100dvh-var(--viewport-padding))] data-[swipe-direction=down]:w-full data-[swipe-direction=down]:[transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))] data-[swipe-direction=down]:rounded-t-[1rem] data-[swipe-direction=down]:data-[ending-style]:[transform:translateY(calc(100%+var(--viewport-padding)+2px))] data-[swipe-direction=down]:data-[starting-style]:[transform:translateY(calc(100%+var(--viewport-padding)+2px))]",

            // up
            "data-[swipe-direction=up]:mb-auto data-[swipe-direction=up]:max-h-[calc(100dvh-var(--viewport-padding))] data-[swipe-direction=up]:w-full data-[swipe-direction=up]:[transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))] data-[swipe-direction=up]:rounded-b-[1rem] data-[swipe-direction=up]:data-[ending-style]:[transform:translateY(calc(-100%-var(--viewport-padding)-2px))] data-[swipe-direction=up]:data-[starting-style]:[transform:translateY(calc(-100%-var(--viewport-padding)-2px))]",

            "data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
            popupClassName,
          )}
        >
          <DrawerPrimitive.Content
            className={cn("w-full", className)}
            {...props}
          >
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  );
}

export type DrawerHandleProps = React.ComponentPropsWithRef<"div">;

export function DrawerHandle({ className, ...props }: DrawerHandleProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "bg-tb-neutral-soft-hover h-1 w-12 rounded-full",
        className,
      )}
      {...props}
    />
  );
}

export type DrawerHeaderProps = React.ComponentProps<"div">;

export function DrawerHeader({ className, ...props }: DrawerHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 p-4 group-data-[swipe-direction=down]/drawer-popup:text-center group-data-[swipe-direction=up]/drawer-popup:text-center md:gap-0.5 md:text-left",
        className,
      )}
      {...props}
    />
  );
}

export type DrawerBodyProps = React.ComponentProps<"div">;

export function DrawerBody({ className, ...props }: DrawerBodyProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4",
        className,
      )}
      {...props}
    />
  );
}

export type DrawerFooterProps = React.ComponentProps<"div">;

export function DrawerFooter({ className, ...props }: DrawerFooterProps) {
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

export type DrawerTitleProps = React.ComponentProps<
  typeof DrawerPrimitive.Title
>;

export function DrawerTitle({ className, ...props }: DrawerTitleProps) {
  return (
    <DrawerPrimitive.Title
      className={cn("text-tb-text-primary text-base font-medium", className)}
      {...props}
    />
  );
}

export type DrawerDescriptionProps = React.ComponentProps<
  typeof DrawerPrimitive.Description
>;

export function DrawerDescription({
  className,
  ...props
}: DrawerDescriptionProps) {
  return (
    <DrawerPrimitive.Description
      className={cn("text-tb-text-secondary text-sm", className)}
      {...props}
    />
  );
}
