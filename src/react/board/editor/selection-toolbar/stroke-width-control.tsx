import { NumberInput } from "../../../ui/number-input";
import { PopoverTitle } from "../../../ui/popover";
import { BoardEditorToolbarPopoverButton } from "../toolbar/editor-toolbar";

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
    <BoardEditorToolbarPopoverButton
      ariaLabel={label}
      tooltip={label}
      popoverSide="top"
      popoverContentClassName="w-48 min-w-0"
      icon={<StrokeWidthIcon value={value} />}
      content={
        <div className="flex flex-col gap-2 p-1">
          <PopoverTitle className="text-sm font-semibold">{label}</PopoverTitle>
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
        </div>
      }
    />
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
