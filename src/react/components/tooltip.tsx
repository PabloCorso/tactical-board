import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export interface TooltipProps {
  children: ReactNode;
  content?: ReactNode;
  sideOffset?: number;
}

interface TooltipPosition {
  left: number;
  top: number;
}

export function Tooltip({ children, content, sideOffset = 10 }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  useEffect(
    function syncTooltipPosition() {
      if (!open || !content) {
        return;
      }

      const updatePosition = () => {
        const trigger = triggerRef.current;

        if (!trigger) {
          return;
        }

        const rect = trigger.getBoundingClientRect();
        setPosition({
          left: rect.left + rect.width / 2,
          top: rect.top - sideOffset,
        });
      };

      updatePosition();

      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);

      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    },
    [content, open, sideOffset],
  );

  const tooltip =
    open && content && position
      ? createPortal(
          <div
            className="border-default bg-surface text-primary pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shadow-lg"
            id={tooltipId}
            role="tooltip"
            style={
              {
                left: `${position.left}px`,
                top: `${position.top}px`,
              } satisfies CSSProperties
            }
          >
            {content}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        aria-describedby={content ? tooltipId : undefined}
        className="inline-flex"
        onBlur={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        ref={triggerRef}
      >
        {children}
      </span>
      {tooltip}
    </>
  );
}
