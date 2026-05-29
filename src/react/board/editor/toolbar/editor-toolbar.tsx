import {
  createContext,
  type ComponentPropsWithRef,
  forwardRef,
  type PropsWithChildren,
  type Ref,
  type RefCallback,
  type ReactNode,
  useContext,
} from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { cn } from "../../../ui/misc";
import { Button, type ButtonProps } from "../../../ui/button";
import type { IconRender } from "../../../ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type TooltipContentProps,
} from "../../../ui/tooltip";

export type BoardEditorToolbarOrientation = "horizontal" | "vertical";
export type BoardEditorToolbarDockPlacement =
  | "top"
  | "right"
  | "bottom"
  | "left";

type BoardEditorToolbarContextValue = {
  orientation: BoardEditorToolbarOrientation;
  tooltipSide: TooltipContentProps["side"];
};

const BoardEditorToolbarContext = createContext<BoardEditorToolbarContextValue>(
  { orientation: "horizontal", tooltipSide: "top" },
);

export type BoardEditorToolbarProps = PropsWithChildren & {
  className?: string;
  contentClassName?: string;
  density?: "default" | "compact";
  orientation?: BoardEditorToolbarOrientation;
  tooltipSide?: TooltipContentProps["side"];
};

export type BoardEditorToolbarDockProps = PropsWithChildren & {
  className?: string;
  contentClassName?: string;
  placement?: BoardEditorToolbarDockPlacement;
};

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) {
    return;
  }

  if (typeof ref === "function") {
    ref(value);
    return;
  }

  ref.current = value;
}

export function BoardEditorToolbar({
  children,
  className,
  contentClassName,
  density = "default",
  orientation = "horizontal",
  tooltipSide = "top",
}: BoardEditorToolbarProps) {
  return (
    <BoardEditorToolbarContext.Provider value={{ orientation, tooltipSide }}>
      <aside
        role="toolbar"
        aria-orientation={orientation}
        className={cn(
          "border-tb-border-default bg-tb-background-surface pointer-events-auto mx-auto inline-flex max-h-full w-max max-w-full overflow-hidden rounded-xl border shadow-lg",
          "max-h-[calc(100dvh-1rem)] max-w-[calc(100dvw-1rem)]",
          className,
        )}
      >
        <div
          className={cn(
            "bg-tb-background-surface flex max-h-full max-w-full flex-nowrap items-center justify-start gap-0.5 overflow-auto overscroll-contain",
            density === "compact" ? "p-0.5" : "p-1",
            "max-h-[calc(100dvh-1.5rem)] max-w-[calc(100dvw-1.5rem)]",
            orientation === "vertical" && "flex-col",
            contentClassName,
          )}
        >
          {children}
        </div>
      </aside>
    </BoardEditorToolbarContext.Provider>
  );
}

export const BoardEditorToolbarDock = forwardRef<
  HTMLDivElement,
  BoardEditorToolbarDockProps
>(function BoardEditorToolbarDock(
  { children, className, contentClassName, placement = "left" },
  forwardedRef,
) {
  const ref: RefCallback<HTMLDivElement> = (element) => {
    setRef(forwardedRef, element);
  };
  const placementClassName = {
    bottom: "inset-x-4 bottom-4 justify-center",
    left: "inset-y-4 left-2 items-center",
    right: "inset-y-4 right-4 items-center",
    top: "inset-x-4 top-4 justify-center",
  } satisfies Record<BoardEditorToolbarDockPlacement, string>;

  return (
    <div
      data-placement={placement}
      ref={ref}
      className={cn(
        "pointer-events-none absolute flex min-h-0 min-w-0",
        placementClassName[placement],
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none flex max-h-full min-h-0 max-w-full min-w-0 items-center gap-2",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
});

export type BoardEditorToolbarButtonProps = ButtonProps & {
  active?: boolean;
  tooltip?: ReactNode | false;
};

function focusEditorCanvasFromElement(element: HTMLElement | null) {
  const root = element?.closest("[data-board-editor-root]");
  const canvas = root?.querySelector("canvas");

  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  requestAnimationFrame(() => {
    canvas.focus();
  });
}

export function BoardEditorToolbarButton({
  active = false,
  "aria-label": ariaLabel,
  tooltip,
  iconSize = "xl",
  className,
  onClick,
  ...props
}: BoardEditorToolbarButtonProps) {
  const { tooltipSide } = useContext(BoardEditorToolbarContext);
  const tooltipContent = tooltip === false ? null : (tooltip ?? ariaLabel);
  const button = (
    <Button
      variant={active ? "outline" : "ghost"}
      iconSize={iconSize}
      iconClassName="text-[var(--tb-toolbar-icon-primary)]"
      className={cn(
        active &&
          "border-tb-neutral-soft-active shadow-[inset_0_0_0_1px_var(--tb-neutral-soft-active)]",
        className,
      )}
      aria-label={ariaLabel}
      onClick={(event) => {
        onClick?.(event);
        focusEditorCanvasFromElement(event.currentTarget);
      }}
      {...props}
    />
  );

  if (!tooltipContent) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger>{button}</TooltipTrigger>
      <TooltipContent side={tooltipSide}>{tooltipContent}</TooltipContent>
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
        "bg-tb-border-default shrink-0",
        orientation === "horizontal" && "mx-0.5 w-px self-stretch",
        orientation === "vertical" && "my-0.5 h-px self-stretch",
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
  const { tooltipSide } = useContext(BoardEditorToolbarContext);

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger>
          <PopoverTrigger>
            <Button
              variant="ghost"
              aria-label={ariaLabel}
              className="px-2"
              iconBefore={icon}
              iconAfter={
                showCaret ? (
                  <CaretDownIcon
                    aria-hidden="true"
                    className="text-tb-text-secondary"
                  />
                ) : undefined
              }
              iconSize="xl"
              iconAfterSize="sm"
              size="md"
            />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>
          {tooltip || ariaLabel}
        </TooltipContent>
      </Tooltip>
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
      className={cn(
        active &&
          "border-tb-neutral-soft-active shadow-[inset_0_0_0_1px_var(--tb-neutral-soft-active)]",
      )}
      iconBefore={icon}
      iconSize="xl"
      onClick={(event) => {
        onClick();
        focusEditorCanvasFromElement(event.currentTarget);
      }}
      size="md"
    />
  );
}
