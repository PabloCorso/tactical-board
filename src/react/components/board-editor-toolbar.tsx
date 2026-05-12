import type { PropsWithChildren } from "react";
import { cn } from "./misc";

export interface BoardEditorToolbarProps extends PropsWithChildren {
  className?: string;
}

export function BoardEditorToolbar({
  children,
  className,
}: BoardEditorToolbarProps) {
  return (
    <aside
      className={cn(
        "mx-auto flex w-fit flex-wrap items-center justify-center gap-2 rounded-[20px] border border-white/10 bg-slate-950/80 p-2",
        className,
      )}
    >
      {children}
    </aside>
  );
}
