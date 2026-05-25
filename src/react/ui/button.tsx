import type { Ref } from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./misc";
import { Icon, type IconProps, type IconRender } from "./icon";
import { Spinner } from "./spinner";

export const buttonVariants = cva(
  [
    "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent font-medium whitespace-nowrap transition-interactive focus-visible:focus-ring",
    "disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40",
  ],
  {
    variants: {
      variant: {
        primary:
          "border-tb-accent bg-tb-accent text-tb-text-on-accent shadow-xs hover:border-tb-accent-hover hover:bg-tb-accent-hover focus-visible:ring-offset-2 active:border-tb-accent-active active:bg-tb-accent-active",
        alternative:
          "border-tb-neutral-soft bg-tb-neutral-soft text-tb-text-primary [--tb-focus-ring:var(--tb-accent)] hover:border-tb-neutral-soft-hover hover:bg-tb-neutral-soft-hover active:border-tb-neutral-soft-active active:bg-tb-neutral-soft-active",
        secondary:
          "border-tb-neutral-soft bg-tb-neutral-soft text-tb-text-primary hover:border-tb-neutral-soft-hover hover:bg-tb-neutral-soft-hover active:border-tb-neutral-soft-active active:bg-tb-neutral-soft-active",
        outline:
          "border-tb-border-default bg-tb-background-screen text-tb-text-primary hover:border-tb-neutral-soft-active hover:bg-tb-neutral-soft active:bg-tb-neutral-soft-hover data-popup-open:border-tb-neutral-soft-active data-popup-open:bg-tb-neutral-soft",
        ghost:
          "bg-transparent text-tb-text-primary hover:bg-tb-neutral-soft active:bg-tb-neutral-soft-hover data-popup-open:bg-tb-neutral-soft",
        danger:
          "border-tb-danger bg-tb-danger text-tb-text-on-color shadow-xs [--tb-focus-ring:var(--tb-danger)] hover:border-tb-danger-hover hover:bg-tb-danger-hover focus-visible:ring-offset-2 active:border-tb-danger-active active:bg-tb-danger-active",
      },
      size: {
        sm: "h-8 gap-1.5 px-2.5 text-xs",
        md: "h-10 gap-2 px-3 text-sm",
        lg: "h-12 gap-2.5 px-4 text-base",
      },
      iconOnly: { true: "px-0", false: "" },
    },
    compoundVariants: [
      { iconOnly: true, size: "sm", className: "w-8" },
      { iconOnly: true, size: "md", className: "w-10" },
      { iconOnly: true, size: "lg", className: "w-12" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      iconOnly: false,
    },
  },
);

export type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    disabled?: boolean;
    loading?: boolean;
    iconBefore?: IconRender;
    iconAfter?: IconRender;
    iconSize?: IconProps["size"];
    iconBeforeSize?: IconProps["size"];
    iconAfterSize?: IconProps["size"];
    ref?: Ref<HTMLButtonElement>;
  };

export function Button({
  variant,
  size = "md",
  iconSize = size,
  disabled = false,
  loading = false,
  iconBefore,
  iconAfter,
  children,
  className,
  iconOnly: iconOnlyProp,
  iconBeforeSize,
  iconAfterSize,
  ...props
}: ButtonProps) {
  const hasSingleIcon =
    !children && (iconBefore ? !iconAfter : Boolean(iconAfter));
  const iconOnly = iconOnlyProp ?? hasSingleIcon;
  const isDisabled = disabled || loading;
  const iconBeforeContent = loading ? <Spinner /> : iconBefore;
  const iconAfterContent = iconOnly && loading ? undefined : iconAfter;
  const iconClassName = iconOnly ? undefined : "text-current/80";

  return (
    <ButtonPrimitive
      type="button"
      className={cn(buttonVariants({ variant, size, iconOnly, className }))}
      aria-busy={loading || undefined}
      disabled={isDisabled}
      {...props}
    >
      {iconBeforeContent && (
        <Icon
          size={iconBeforeSize ?? iconSize}
          className={cn(iconClassName, !iconOnly && "-ml-0.5")}
        >
          {iconBeforeContent}
        </Icon>
      )}
      {children}
      {iconAfterContent && (
        <Icon
          size={iconAfterSize ?? iconSize}
          className={cn(iconClassName, !iconOnly && "-mr-0.5")}
        >
          {iconAfterContent}
        </Icon>
      )}
    </ButtonPrimitive>
  );
}
