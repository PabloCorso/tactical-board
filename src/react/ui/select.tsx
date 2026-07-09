import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CaretDownIcon, CaretUpIcon, CheckIcon } from "@phosphor-icons/react";
import * as React from "react";
import { cn } from "./misc";
import { floatingContentClassName } from "./floating-content";
import { Icon } from "./icon";

export type SelectItem<V = string> = {
  value: V;
  label: React.ReactNode;
};

function createItemsFromArray<
  T,
  TValueKey extends keyof T,
  TLabelKey extends keyof T,
>(
  arr: T[],
  valueKey: TValueKey,
  labelKey: TLabelKey,
  mapLabel?: (label: T[TLabelKey], item: T) => React.ReactNode,
): SelectItem<T[TValueKey]>[] {
  return arr.map((item) => {
    const raw = item[labelKey];
    return {
      value: item[valueKey],
      label: mapLabel ? mapLabel(raw, item) : (raw as React.ReactNode),
    };
  });
}

function createItemsFromObject<K extends string, V>(
  obj: Record<K, V>,
  mapLabel: (value: V, key: K) => React.ReactNode = (value) =>
    value as React.ReactNode,
): SelectItem<K>[] {
  return Object.entries(obj).map(([value, label]) => ({
    value: value as K,
    label: mapLabel(label as V, value as K),
  }));
}

function createItemsFromStrings<V extends string>(
  arr: readonly V[],
  mapLabel?: (value: V) => React.ReactNode,
): SelectItem<V>[] {
  return arr.map((value) => ({
    value,
    label: mapLabel ? mapLabel(value) : (value as React.ReactNode),
  }));
}

export const selectItems = {
  fromArray: createItemsFromArray,
  fromObject: createItemsFromObject,
  fromStrings: createItemsFromStrings,
};

export const toItems = selectItems.fromArray;
export const arrayToItems = selectItems.fromArray;
export const objectToItems = selectItems.fromObject;
export const stringsToItems = selectItems.fromStrings;

export type SelectProps<
  Value,
  Multiple extends boolean | undefined = false,
> = SelectPrimitive.Root.Props<Value, Multiple>;

export const Select = SelectPrimitive.Root;

type SelectValueProps = SelectPrimitive.Value.Props;

function SelectValue({ className, ...props }: SelectValueProps) {
  return (
    <SelectPrimitive.Value
      className={cn("flex min-w-0 flex-1 truncate text-left", className)}
      {...props}
    />
  );
}

export type SelectTriggerProps = Omit<
  SelectPrimitive.Trigger.Props,
  "children"
> & { placeholder?: string; children?: SelectValueProps["children"] };

export function SelectTrigger({
  children,
  className,
  placeholder,
  ...props
}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "border-tb-border-default bg-tb-background-screen text-tb-text-primary transition-interactive hover:border-tb-neutral-soft-active focus-visible:focus-ring data-placeholder:text-tb-text-secondary flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-3 text-base leading-5 outline-hidden md:text-sm",
        "aria-[invalid]:border-tb-danger disabled:cursor-not-allowed disabled:opacity-40 aria-[invalid]:[--tb-focus-ring:var(--tb-danger)]",
        className,
      )}
      {...props}
    >
      <SelectValue placeholder={placeholder}>{children}</SelectValue>
      <SelectPrimitive.Icon
        render={
          <Icon className="text-tb-text-tertiary shrink-0">
            <CaretDownIcon />
          </Icon>
        }
      />
    </SelectPrimitive.Trigger>
  );
}

export type SelectContentProps = SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >;

export function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = false,
  ...props
}: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-tactical-board
          data-align-trigger={alignItemWithTrigger}
          className={floatingContentClassName(
            "border-tb-border-default bg-tb-background-surface text-tb-text-primary relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 overflow-x-hidden overflow-y-auto rounded-lg border p-1 shadow-lg data-[align-trigger=true]:animate-none",
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

export type SelectGroupProps = SelectPrimitive.Group.Props;

export function SelectGroup({ className, ...props }: SelectGroupProps) {
  return (
    <SelectPrimitive.Group
      className={cn("scroll-my-1", className)}
      {...props}
    />
  );
}

export type SelectGroupLabel = SelectPrimitive.GroupLabel.Props;

export function SelectGroupLabel({ className, ...props }: SelectGroupLabel) {
  return (
    <SelectPrimitive.GroupLabel
      className={cn(
        "text-tb-text-tertiary px-2 py-1.5 text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}

export type SelectItemProps = SelectPrimitive.Item.Props;

export function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "text-tb-text-primary transition-interactive focus:bg-tb-neutral-soft data-highlighted:bg-tb-neutral-soft relative flex min-h-7 w-full cursor-default items-center gap-2 rounded-md py-1 pr-7 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        data-slot="select-item-indicator"
        className="text-tb-text-secondary pointer-events-none absolute right-2 flex items-center justify-center"
      >
        <Icon size="sm">
          <CheckIcon />
        </Icon>
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export type SelectSeparatorProps = SelectPrimitive.Separator.Props;

export function SelectSeparator({ className, ...props }: SelectSeparatorProps) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "bg-tb-border-default pointer-events-none -mx-1 my-1 h-px",
        className,
      )}
      {...props}
    />
  );
}

export type SelectScrollUpButton = SelectPrimitive.ScrollUpArrow.Props;

export function SelectScrollUpButton({
  className,
  ...props
}: SelectScrollUpButton) {
  return (
    <SelectPrimitive.ScrollUpArrow
      className={cn(
        "bg-tb-background-surface text-tb-text-tertiary top-0 z-10 flex w-full cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <Icon interactive>
        <CaretUpIcon />
      </Icon>
    </SelectPrimitive.ScrollUpArrow>
  );
}

export type SelectScrollDownButtonProps = SelectPrimitive.ScrollDownArrow.Props;

function SelectScrollDownButton({
  className,
  ...props
}: SelectScrollDownButtonProps) {
  return (
    <SelectPrimitive.ScrollDownArrow
      className={cn(
        "bg-tb-background-surface text-tb-text-tertiary bottom-0 z-10 flex w-full cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <Icon interactive>
        <CaretDownIcon />
      </Icon>
    </SelectPrimitive.ScrollDownArrow>
  );
}
