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
          "border-accent bg-accent text-on-accent shadow-xs hover:border-accent-hover hover:bg-accent-hover focus-visible:ring-offset-2 active:border-accent-active active:bg-accent-active",
        alternative:
          "border-alternative-soft bg-alternative-soft text-alternative-on-soft [--focus-ring:var(--color-alternative)] hover:border-alternative-soft-hover hover:bg-alternative-soft-hover active:border-alternative-soft-active active:bg-alternative-soft-active",
        secondary:
          "border-neutral-soft bg-neutral-soft text-primary hover:border-neutral-soft-hover hover:bg-neutral-soft-hover active:border-neutral-soft-active active:bg-neutral-soft-active",
        outline:
          "border-default bg-screen text-primary hover:border-neutral-soft-active hover:bg-neutral-soft active:bg-neutral-soft-hover data-popup-open:border-neutral-soft-active data-popup-open:bg-neutral-soft",
        ghost:
          "bg-transparent text-primary hover:bg-neutral-soft active:bg-neutral-soft-hover data-popup-open:bg-neutral-soft",
        danger:
          "border-danger bg-danger text-on-color shadow-xs [--focus-ring:var(--danger)] hover:border-danger-hover hover:bg-danger-hover focus-visible:ring-offset-2 active:border-danger-active active:bg-danger-active",
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
