import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "./misc";
import { Tooltip } from "./tooltip";

export interface BoardEditorToolbarButtonProps
  extends
    PropsWithChildren,
    Pick<
      ButtonHTMLAttributes<HTMLButtonElement>,
      "aria-label" | "disabled" | "onClick" | "type"
    > {
  active?: boolean;
  className?: string;
  tooltip?: string;
}

export function BoardEditorToolbarButton({
  active = false,
  "aria-label": ariaLabel,
  children,
  className,
  disabled,
  onClick,
  tooltip,
  type = "button",
}: BoardEditorToolbarButtonProps) {
  return (
    <Tooltip content={tooltip ?? ariaLabel}>
      <button
        aria-label={ariaLabel}
        className={cn(
          "inline-flex size-10 cursor-pointer items-center justify-center rounded-[14px] border text-inherit transition-[background-color,border-color,color] duration-150",
          active
            ? "border-white/12 bg-white/14 text-white"
            : "border-transparent bg-transparent text-neutral-400 hover:border-white/10 hover:bg-white/6 hover:text-neutral-100",
          disabled ? "cursor-not-allowed opacity-50" : undefined,
          className,
        )}
        disabled={disabled}
        onClick={onClick}
        type={type}
      >
        {children}
      </button>
    </Tooltip>
  );
}
