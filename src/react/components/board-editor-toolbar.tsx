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
        "mx-auto flex w-fit flex-wrap items-center justify-center gap-2 rounded-[20px] border border-white/8 bg-white/5 p-2 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </aside>
  );
}
