import type { PropsWithChildren, ReactNode } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { cn } from "./misc";
import { Button, type ButtonProps } from "./ui/button";
import type { IconRender } from "./ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export type BoardEditorToolbarProps = PropsWithChildren & {
  className?: string;
};

export function BoardEditorToolbar({
  children,
  className,
}: BoardEditorToolbarProps) {
  return (
    <aside
      className={cn(
        "border-default bg-surface/90 mx-auto flex w-max flex-nowrap items-center justify-center gap-2 rounded-[20px] border p-2 shadow-lg backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export type BoardEditorToolbarButtonProps = ButtonProps & {
  active?: boolean;
  tooltip?: ReactNode;
};

export function BoardEditorToolbarButton({
  active = false,
  "aria-label": ariaLabel,
  tooltip,
  ...props
}: BoardEditorToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          title={ariaLabel}
          variant={active ? "outline" : "ghost"}
          {...props}
        />
      </TooltipTrigger>
      <TooltipContent>{tooltip || ariaLabel}</TooltipContent>
    </Tooltip>
  );
}

export type BoardEditorToolbarPopoverButtonProps = {
  ariaLabel: string;
  tooltip?: string;
  icon: IconRender;
  content: ReactNode;
  showCaret?: boolean;
};

export function BoardEditorToolbarPopoverButton({
  ariaLabel,
  tooltip,
  icon,
  content,
  showCaret = true,
}: BoardEditorToolbarPopoverButtonProps) {
  return (
    <Popover>
      <PopoverTrigger>
        <BoardEditorToolbarButton
          aria-label={ariaLabel}
          iconBefore={icon}
          iconAfter={
            showCaret ? (
              <CaretDownIcon aria-hidden="true" className="opacity-75" />
            ) : undefined
          }
          iconSize="xl"
          tooltip={tooltip}
        />
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={8}
        className="w-auto min-w-max"
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}

export type BoardEditorToolbarOptionButtonProps = {
  active: boolean;
  ariaLabel: string;
  onClick: () => void;
  icon: IconRender;
};

export function BoardEditorToolbarOptionButton({
  active,
  ariaLabel,
  onClick,
  icon,
}: BoardEditorToolbarOptionButtonProps) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      aria-label={ariaLabel}
      aria-pressed={active}
      iconBefore={icon}
      iconSize="xl"
      onClick={onClick}
    />
  );
}
