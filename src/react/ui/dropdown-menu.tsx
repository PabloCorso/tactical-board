import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { type useRender } from "@base-ui/react/use-render";
import { CaretRightIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./misc";
import { Icon, type IconProps } from "./icon";

export type DropdownMenuProps = MenuPrimitive.Root.Props;

export const DropdownMenu = MenuPrimitive.Root;

export type DropdownMenuTriggerProps = Omit<
  MenuPrimitive.Trigger.Props,
  "children" | "render"
> & { children: MenuPrimitive.Trigger.Props["render"] };

export function DropdownMenuTrigger({
  children,
  ...props
}: DropdownMenuTriggerProps) {
  return <MenuPrimitive.Trigger render={children} {...props} />;
}

export type DropdownMenuContentProps = MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    | "align"
    | "alignOffset"
    | "collisionPadding"
    | "positionMethod"
    | "side"
    | "sideOffset"
  >;

export function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  collisionPadding = 8,
  positionMethod = "fixed",
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}: DropdownMenuContentProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        positionMethod={positionMethod}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-tactical-board
          className={cn(
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 border-tb-border-default bg-tb-background-surface text-tb-text-primary z-50 box-border max-h-(--available-height) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg border p-1.5 shadow-lg duration-100 outline-none data-closed:overflow-hidden",
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

export type DropdownMenuGroupProps = MenuPrimitive.Group.Props;

export const DropdownMenuGroup = MenuPrimitive.Group;

export type DropdownMenuGroupLabelProps = MenuPrimitive.GroupLabel.Props & {
  inset?: boolean;
};

export function DropdownMenuGroupLabel({
  className,
  inset,
  ...props
}: DropdownMenuGroupLabelProps) {
  return (
    <MenuPrimitive.GroupLabel
      data-inset={inset}
      className={cn(
        "text-tb-text-tertiary box-border px-2 py-1.5 text-xs font-medium data-inset:pl-8",
        className,
      )}
      {...props}
    />
  );
}

export const menuItemVariants = cva(
  [
    "group/menu-item relative flex min-h-7 w-full cursor-pointer items-center gap-2 rounded-md box-border px-2 py-1 text-sm outline-hidden transition-interactive select-none data-inset:pl-8",
    "disabled:pointer-events-none disabled:opacity-40",
  ],
  {
    variants: {
      color: {
        neutral:
          "bg-transparent text-tb-text-primary [--tb-focus-ring:var(--tb-neutral)] hover:bg-tb-background-item-hover focus:bg-tb-background-item-hover active:bg-tb-neutral-soft-hover",
        danger:
          "bg-transparent text-tb-text-danger-on-ghost [--tb-focus-ring:var(--tb-danger)] hover:bg-tb-danger-soft focus:bg-tb-danger-soft active:bg-tb-danger-soft-hover",
      },
    },
    defaultVariants: {
      color: "neutral",
    },
  },
);

export type DropdownMenuItemProps = MenuPrimitive.Item.Props &
  VariantProps<typeof menuItemVariants> & {
    inset?: boolean;
    icon?: useRender.RenderProp;
    iconSize?: IconProps["size"];
  };

export function DropdownMenuItem({
  children,
  className,
  inset,
  color,
  icon,
  iconSize = "sm",
  ...props
}: DropdownMenuItemProps) {
  return (
    <MenuPrimitive.Item
      data-inset={inset}
      className={cn(menuItemVariants({ color, className }))}
      {...props}
    >
      {icon ? (
        <Icon
          size={iconSize}
          className={
            color === "danger"
              ? "text-tb-text-danger-on-ghost/80"
              : "text-tb-text-tertiary"
          }
        >
          {icon}
        </Icon>
      ) : null}
      {children}
    </MenuPrimitive.Item>
  );
}

export type DropdownMenuSubProps = MenuPrimitive.SubmenuRoot.Props;

export const DropdownMenuSub = MenuPrimitive.SubmenuRoot;

export type DropdownMenuSubTriggerProps = MenuPrimitive.SubmenuTrigger.Props &
  VariantProps<typeof menuItemVariants> & {
    inset?: boolean;
  };

export function DropdownMenuSubTrigger({
  className,
  inset,
  color,
  children,
  ...props
}: DropdownMenuSubTriggerProps) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-inset={inset}
      className={cn(
        "data-open:bg-tb-neutral-soft-hover data-popup-open:bg-tb-neutral-soft-hover",
        menuItemVariants({ color, className }),
      )}
      {...props}
    >
      {children}
      <Icon size="sm" className="text-tb-text-tertiary ml-auto">
        <CaretRightIcon />
      </Icon>
    </MenuPrimitive.SubmenuTrigger>
  );
}

export type DropdownMenuSubContentProps = DropdownMenuContentProps;

export function DropdownMenuSubContent({
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}: DropdownMenuSubContentProps) {
  return (
    <DropdownMenuContent
      className={cn("w-auto min-w-[96px] shadow-lg", className)}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

export type DropdownMenuCheckboxItemProps = MenuPrimitive.CheckboxItem.Props &
  VariantProps<typeof menuItemVariants> & {
    inset?: boolean;
  };

export function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  color,
  inset,
  ...props
}: DropdownMenuCheckboxItemProps) {
  return (
    <MenuPrimitive.CheckboxItem
      data-inset={inset}
      className={cn(menuItemVariants({ color }), "pr-8 pl-2", className)}
      checked={checked}
      {...props}
    >
      <MenuPrimitive.CheckboxItemIndicator className="text-tb-text-secondary pointer-events-none absolute right-2 flex items-center justify-center">
        <Icon size="sm">
          <CheckIcon />
        </Icon>
      </MenuPrimitive.CheckboxItemIndicator>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

export type DropdownMenuRadioGroupProps = MenuPrimitive.RadioGroup.Props;

export const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup;

export type DropdownMenuRadioItemProps = MenuPrimitive.RadioItem.Props & {
  inset?: boolean;
};

export function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: DropdownMenuRadioItemProps) {
  return (
    <MenuPrimitive.RadioItem
      data-inset={inset}
      className={cn(
        menuItemVariants({ color: "neutral" }),
        "pr-8 pl-2",
        className,
      )}
      {...props}
    >
      <MenuPrimitive.RadioItemIndicator className="text-tb-text-secondary pointer-events-none absolute right-2 flex items-center justify-center">
        <Icon size="sm">
          <CheckIcon />
        </Icon>
      </MenuPrimitive.RadioItemIndicator>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

export type DropdownMenuSeparatorProps = MenuPrimitive.Separator.Props;

export function DropdownMenuSeparator({
  className,
  ...props
}: DropdownMenuSeparatorProps) {
  return (
    <MenuPrimitive.Separator
      className={cn("bg-tb-border-default my-1 box-border h-px", className)}
      {...props}
    />
  );
}
