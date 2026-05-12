import type { PropsWithChildren } from "react";
import { cn } from "./misc";

export type BoardEditorToolbarProps = PropsWithChildren & {
  className?: string;
};

export function BoardEditorToolbar({
  children,
  className,
}: BoardEditorToolbarProps) {
  return (
    <aside
      className={cn(
        "border-default bg-surface/90 mx-auto flex w-fit flex-wrap items-center justify-center gap-2 rounded-[20px] border p-2 shadow-lg backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </aside>
  );
}
