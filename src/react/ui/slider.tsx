import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "./misc";

export type SliderProps = SliderPrimitive.Root.Props<number> & {
  controlClassName?: string;
  thumbAriaLabel?: string;
};

export function Slider({
  className,
  controlClassName,
  disabled,
  thumbAriaLabel,
  ...props
}: SliderProps) {
  return (
    <SliderPrimitive.Root
      className={cn("w-full", className)}
      disabled={disabled}
      {...props}
    >
      <SliderPrimitive.Control
        className={cn(
          "flex h-7 w-full touch-none items-center select-none",
          controlClassName,
        )}
      >
        <SliderPrimitive.Track className="bg-tb-neutral-soft relative h-1.5 w-full rounded-full">
          <SliderPrimitive.Indicator className="bg-tb-accent absolute h-full rounded-full" />
          <SliderPrimitive.Thumb
            getAriaLabel={thumbAriaLabel ? () => thumbAriaLabel : undefined}
            className={cn(
              "bg-tb-background-surface border-tb-accent absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-xs outline-hidden",
              "focus-visible:focus-ring data-[dragging]:scale-110",
              disabled && "cursor-not-allowed opacity-40",
            )}
          />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}
