import { cn } from "#app/utils/misc.tsx";

export type TeamPanelSectionProps = React.ComponentProps<"section">;

export function TeamPanelSection({
  children,
  className,
  ...props
}: TeamPanelSectionProps) {
  return (
    <section
      className={cn("py-2.6 flex flex-col gap-2 p-3", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export type TeamPanelSectionTitleProps = React.ComponentProps<"h3">;

export function TeamPanelSectionTitle({
  children,
  className,
  ...props
}: TeamPanelSectionTitleProps) {
  return (
    <h3
      className={cn(
        "text-tb-text-secondary m-0 text-xs leading-4 font-semibold",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}
