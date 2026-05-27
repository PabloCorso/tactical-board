import * as React from "react";
import { cn } from "#app/utils/misc";
import { Icon, type IconProps } from "./icon.tsx";

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
          "border-input bg-input text-primary transition-interactive flex h-10 w-full min-w-0 rounded-lg border px-3 text-base leading-5 outline-hidden md:text-sm",
          "placeholder:text-placeholder hover:border-input-hover focus-visible:focus-ring",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "aria-[invalid]:border-danger aria-[invalid]:[--focus-ring:var(--danger)]",
          { "pl-9": iconBefore, "pr-9": iconAfter },
          className,
        )}
        {...props}
      />
      {iconBefore && (
        <Icon
          size={iconSize}
          className="text-tertiary pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2 items-center justify-center leading-none"
        >
          {iconBefore}
        </Icon>
      )}
      {iconAfter && (
        <Icon
          size={iconSize}
          className="text-tertiary pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center leading-none"
        >
          {iconAfter}
        </Icon>
      )}
    </div>
  );
}
