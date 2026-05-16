export { DEFAULT_PRESET_COLORS } from "../../../core/colors/preset-colors";
import { DEFAULT_PRESET_COLORS } from "../../../core/colors/preset-colors";
import { cn } from "#app/utils/misc";

const CUSTOM_COLOR_SWATCH_BACKGROUND =
  "radial-gradient(50% 50% at 50% 50%, #ffffff 0%, transparent 100%), conic-gradient(from 0deg at 50% 50%, red, #ffa800 47.73deg, #ff0 79.56deg, #0f0 121.33deg, #0ff 180.99deg, #00f 238.67deg, #f0f 294.36deg, red 360deg), #c4c4c4";

const CUSTOM_COLOR_RING_MASK =
  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)";

function normalizeColor(value: string) {
  return value.trim().toLowerCase();
}

export type ColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  presetColors?: string[];
  className?: string;
};

export function ColorPicker({
  value,
  onChange,
  label,
  presetColors = [...DEFAULT_PRESET_COLORS],
  className,
}: ColorPickerProps) {
  const normalizedValue = normalizeColor(value);
  const isPresetColor = presetColors.some(
    (color) => normalizeColor(color) === normalizedValue,
  );

  return (
    <div className={cn("flex min-w-52 flex-col gap-3", className)}>
      {label ? (
        <div className="text-secondary text-xs font-medium tracking-[0.16em] uppercase">
          {label}
        </div>
      ) : null}

      <div className="grid grid-cols-11 gap-2">
        {presetColors.map((color) => {
          const isActive = normalizeColor(color) === normalizedValue;

          return (
            <button
              key={color}
              type="button"
              aria-label={`Select color ${color}`}
              aria-pressed={isActive}
              className={cn(
                "border-default focus-visible:focus-ring relative h-8 w-8 cursor-pointer rounded-full border transition-transform",
                isActive &&
                  "ring-accent ring-offset-surface ring-2 ring-offset-2",
              )}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
            >
              <span className="sr-only">{color}</span>
            </button>
          );
        })}

        <label
          className={cn(
            "focus-within:focus-ring relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-transform",
            !isPresetColor && "ring-offset-surface ring-2 ring-offset-2",
          )}
          aria-label="Choose custom color"
        >
          <span
            className={cn(
              "border-default pointer-events-none h-full w-full rounded-full border",
              !isPresetColor && "border-transparent",
            )}
            style={{
              background: isPresetColor
                ? CUSTOM_COLOR_SWATCH_BACKGROUND
                : undefined,
              backgroundColor: isPresetColor ? undefined : value,
            }}
          />
          {!isPresetColor ? (
            <span
              className="pointer-events-none absolute inset-0 rounded-full p-[2px]"
              style={{
                background: CUSTOM_COLOR_SWATCH_BACKGROUND,
                WebkitMask: CUSTOM_COLOR_RING_MASK,
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
          ) : null}
          <input
            type="color"
            value={value}
            aria-label="Choose custom color"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
