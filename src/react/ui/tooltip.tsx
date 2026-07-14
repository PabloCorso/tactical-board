import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "./misc";

export type TooltipProviderProps = TooltipPrimitive.Provider.Props;

export const TooltipProvider = TooltipPrimitive.Provider;

export type TooltipProps = TooltipPrimitive.Root.Props;

export const Tooltip = TooltipPrimitive.Root;

export type TooltipTriggerProps = Omit<
  TooltipPrimitive.Trigger.Props,
  "children" | "render"
> & {
  children: TooltipPrimitive.Trigger.Props["render"];
};

export function TooltipTrigger({ children, ...props }: TooltipTriggerProps) {
  return <TooltipPrimitive.Trigger render={children} {...props} />;
}

export type TooltipContentProps = TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    | "align"
    | "alignOffset"
    | "collisionPadding"
    | "positionMethod"
    | "side"
    | "sideOffset"
  >;

export function TooltipContent({
  align = "center",
  alignOffset = 0,
  collisionPadding = 8,
  positionMethod = "fixed",
  side = "top",
  sideOffset = 11,
  children,
  className,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        positionMethod={positionMethod}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-tactical-board
          className={cn(
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=inline-end]:slide-in-from-left-1 data-[side=inline-start]:slide-in-from-right-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 bg-tb-neutral text-tb-text-on-neutral z-50 max-w-72 origin-(--transform-origin) rounded-md px-2 py-1 text-sm font-medium shadow-md outline-hidden duration-100",
            className,
          )}
          {...props}
        >
          <TooltipArrow />
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export type TooltipArrowProps = TooltipPrimitive.Arrow.Props;

export function TooltipArrow({ className, ...props }: TooltipArrowProps) {
  return (
    <TooltipPrimitive.Arrow
      className={cn(
        "relative block h-[6px] w-3 overflow-clip",
        "data-[side=top]:-bottom-[6px] data-[side=top]:rotate-180",
        "data-[side=bottom]:-top-[6px] data-[side=bottom]:rotate-0",
        "data-[side=left]:-right-[9px] data-[side=left]:rotate-90",
        "data-[side=right]:-left-[9px] data-[side=right]:-rotate-90",
        "before:bg-tb-neutral before:absolute before:bottom-0 before:left-1/2 before:block before:size-[calc(6px*sqrt(2))] before:-translate-x-1/2 before:translate-y-1/2 before:rotate-45 before:content-['']",
        className,
      )}
      {...props}
    />
  );
}
