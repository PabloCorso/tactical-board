import { NumberInput } from "../../../ui/number-input";
import {
  BoardEditorSelectionToolbarPopover,
  BoardEditorSelectionToolbarPopoverContent,
  BoardEditorSelectionToolbarPopoverTitle,
  BoardEditorSelectionToolbarPopoverTrigger,
} from "./selection-toolbar-popover";

export type BoardEditorStrokeWidthControlProps = {
  label: string;
  onChange: (strokeWidth: number) => void;
  value: number;
};

export function BoardEditorStrokeWidthControl({
  label,
  onChange,
  value,
}: BoardEditorStrokeWidthControlProps) {
  return (
    <BoardEditorSelectionToolbarPopover>
      <BoardEditorSelectionToolbarPopoverTrigger
        aria-label={label}
        tooltip={label}
      >
        <StrokeWidthIcon value={value} />
      </BoardEditorSelectionToolbarPopoverTrigger>
      <BoardEditorSelectionToolbarPopoverContent className="w-48 min-w-0">
        <BoardEditorSelectionToolbarPopoverTitle>
          {label}
        </BoardEditorSelectionToolbarPopoverTitle>
        <label className="flex items-center justify-between gap-3">
          <span className="text-tb-text-secondary text-xs font-medium">
            {label}
          </span>
          <NumberInput
            aria-label={label}
            className="border-tb-border-default bg-tb-background-screen text-tb-text-primary h-7 w-20 rounded-md px-2 text-sm md:text-sm"
            min={0.25}
            max={12}
            step={0.25}
            value={value}
            onValueChange={(nextValue) =>
              onChange(Math.min(12, Math.max(0.25, nextValue)))
            }
          />
        </label>
      </BoardEditorSelectionToolbarPopoverContent>
    </BoardEditorSelectionToolbarPopover>
  );
}

function StrokeWidthIcon({ value }: { value: number }) {
  return (
    <span className="flex size-6 items-center justify-center">
      <svg
        aria-hidden="true"
        className="size-6 overflow-visible"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M2 12 H22"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth={Math.min(6, Math.max(1, value))}
        />
      </svg>
    </span>
  );
}
