import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { type IconProps as PhosphorIconProps } from "@phosphor-icons/react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "./misc";

export const iconVariants = cva("shrink-0", {
  variants: {
    size: {
      "2xs": "h-3 w-3",
      xs: "h-3.5 w-3.5",
      sm: "h-4 w-4",
      md: "h-4.5 w-4.5",
      lg: "h-5 w-5",
      xl: "h-6 w-6",
      "2xl": "h-7 w-7",
      "3xl": "h-9 w-9",
      "4xl": "h-10 w-10",
      "5xl": "h-11 w-11",
      "6xl": "h-12 w-12",
      "7xl": "h-13 w-13",
    },
    interactive: { true: "", false: "pointer-events-none" },
  },
  defaultVariants: {
    size: "md",
    interactive: false,
  },
});

export type IconRender = useRender.ComponentProps<"svg">["render"];

export type IconProps = Omit<
  useRender.ComponentProps<"svg">,
  "children" | "render"
> &
  VariantProps<typeof iconVariants> &
  Omit<PhosphorIconProps, "size" | "color" | "children"> & {
    interactive?: boolean;
    children?: IconRender;
  };

export function Icon({
  size = "md",
  className,
  children,
  interactive,
  ...props
}: IconProps) {
  return useRender({
    defaultTagName: "svg",
    props: mergeProps<"svg">(
      {
        className: cn(iconVariants({ size, className, interactive })),
        "aria-hidden": interactive ? "true" : undefined,
      },
      props,
    ),
    render: children,
  });
}
