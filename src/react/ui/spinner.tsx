import { CircleDashedIcon, type IconProps } from "@phosphor-icons/react";
import { cn } from "./misc";

export function Spinner({ className, ...props }: IconProps) {
  return (
    <CircleDashedIcon className={cn("animate-spin", className)} {...props} />
  );
}
