import {
  createContext,
  type ComponentPropsWithRef,
  type PropsWithChildren,
  type ReactNode,
  useContext,
} from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { cn } from "./misc";
import { Button, type ButtonProps } from "./ui/button";
import type { IconRender } from "./ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type BoardEditorToolbarOrientation = "horizontal" | "vertical";

type BoardEditorToolbarContextValue = {
  orientation: BoardEditorToolbarOrientation;
};

const BoardEditorToolbarContext = createContext<BoardEditorToolbarContextValue>(
  { orientation: "horizontal" },
);

export type BoardEditorToolbarProps = PropsWithChildren & {
  className?: string;
  orientation?: BoardEditorToolbarOrientation;
};

export function BoardEditorToolbar({
  children,
  className,
  orientation = "horizontal",
}: BoardEditorToolbarProps) {
  return (
    <BoardEditorToolbarContext.Provider value={{ orientation }}>
      <aside
        role="toolbar"
        aria-orientation={orientation}
        className={cn(
          "bg-surface/90 mx-auto inline-flex w-max flex-nowrap items-center justify-center gap-0.5 rounded-xl border p-1 shadow-lg backdrop-blur-sm",
          "aria-[orientation=vertical]:flex-col",
          className,
        )}
      >
        {children}
      </aside>
    </BoardEditorToolbarContext.Provider>
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
  iconSize = "xl",
  ...props
}: BoardEditorToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          variant={active ? "outline" : "ghost"}
          iconSize={iconSize}
          {...props}
        />
      </TooltipTrigger>
      <TooltipContent>{tooltip || ariaLabel}</TooltipContent>
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
        "shrink-0 bg-(--border-default)",
        "aria-[orientation=horizontal]:mx-0.5 aria-[orientation=horizontal]:w-px aria-[orientation=horizontal]:self-stretch",
        "aria-[orientation=vertical]:my-0.5 aria-[orientation=vertical]:h-px aria-[orientation=vertical]:self-stretch",
        className,
      )}
      {...props}
    />
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
              <CaretDownIcon aria-hidden="true" className="text-secondary" />
            ) : undefined
          }
          iconSize="xl"
          iconAfterSize="sm"
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
