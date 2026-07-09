import * as React from "react";
import { cn } from "./misc";
import { Icon, type IconProps } from "./icon";

export type InputProps = React.ComponentPropsWithRef<"input"> & {
  iconBefore?: IconProps["children"] | null;
  iconAfter?: IconProps["children"] | null;
  iconSize?: IconProps["size"];
  wrapperProps?: React.ComponentPropsWithRef<"div">;
};

export function Input({
  className,
  wrapperProps,
  iconBefore,
  iconAfter,
  iconSize,
  ...props
}: InputProps) {
  return (
    <div
      {...wrapperProps}
      className={cn(
        "relative inline-flex w-full items-center",
        wrapperProps?.className,
      )}
    >
      <input
        className={cn(
          "border-tb-border-default bg-tb-background-screen text-tb-text-primary transition-interactive flex h-10 w-full min-w-0 rounded-lg border px-3 text-base leading-5 outline-hidden md:text-sm",
          "placeholder:text-tb-text-secondary hover:border-tb-neutral-soft-active focus-visible:focus-ring",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "aria-[invalid]:border-tb-danger aria-[invalid]:[--tb-focus-ring:var(--tb-danger)]",
          { "pl-9": iconBefore, "pr-9": iconAfter },
          className,
        )}
        {...props}
      />
      {iconBefore && (
        <Icon
          size={iconSize}
          className="text-tb-text-tertiary pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2 items-center justify-center leading-none"
        >
          {iconBefore}
        </Icon>
      )}
      {iconAfter && (
        <Icon
          size={iconSize}
          className="text-tb-text-tertiary pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center leading-none"
        >
          {iconAfter}
        </Icon>
      )}
    </div>
  );
}
