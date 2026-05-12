import { Button, type ButtonProps } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export type BoardEditorToolbarButtonProps = ButtonProps & {
  active?: boolean;
  tooltip?: React.ReactNode;
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
          variant={active ? "secondary" : "ghost"}
          {...props}
        />
      </TooltipTrigger>
      <TooltipContent>{tooltip || ariaLabel}</TooltipContent>
    </Tooltip>
  );
}
