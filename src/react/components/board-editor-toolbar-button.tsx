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
          "inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-[14px] border px-3 text-inherit transition-[background-color,border-color,color] duration-150",
          active
            ? "border-slate-600 bg-slate-800 text-slate-50"
            : "border-transparent bg-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-900 hover:text-slate-100",
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
