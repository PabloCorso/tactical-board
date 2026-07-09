import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "./misc";

export type SwitchProps = SwitchPrimitive.Root.Props;

export function Switch({ className, children, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "focus-visible:focus-ring bg-tb-neutral-soft transition-interactive relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent",
        "hover:bg-tb-neutral-soft-hover active:bg-tb-neutral-soft-active data-[checked]:bg-tb-accent data-[checked]:hover:bg-tb-accent-hover data-[checked]:active:bg-tb-accent-active",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {children}
      <SwitchPrimitive.Thumb className="bg-tb-background-surface pointer-events-none block h-4 w-4 translate-x-0.5 rounded-full shadow-xs transition-transform data-[checked]:translate-x-4" />
    </SwitchPrimitive.Root>
  );
}
