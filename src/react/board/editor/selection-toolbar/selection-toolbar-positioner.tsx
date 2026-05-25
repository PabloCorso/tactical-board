import { type PropsWithChildren, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "../../../adapter/editor/use-isomorphic-layout-effect";

const VIEWPORT_PADDING_PX = 10;

export type SelectionToolbarPlacement = "top" | "bottom";

export function getSelectionToolbarPlacement(input: {
  anchorLeft: number;
  anchorTop: number;
  anchorBottom: number;
  toolbarWidth: number;
  toolbarHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  viewportPadding?: number;
}) {
  const {
    anchorLeft,
    anchorTop,
    anchorBottom,
    toolbarWidth,
    toolbarHeight,
    viewportWidth,
    viewportHeight,
    viewportPadding = VIEWPORT_PADDING_PX,
  } = input;
  const minCenterX = viewportPadding + toolbarWidth / 2;
  const maxCenterX = viewportWidth - viewportPadding - toolbarWidth / 2;
  const left =
    minCenterX > maxCenterX
      ? viewportWidth / 2
      : Math.min(Math.max(anchorLeft, minCenterX), maxCenterX);
  const topVisibleTop = anchorTop - toolbarHeight;
  const bottomVisibleBottom = anchorBottom + toolbarHeight;
  const topOverflow = Math.max(0, viewportPadding - topVisibleTop);
  const bottomOverflow = Math.max(
    0,
    bottomVisibleBottom - (viewportHeight - viewportPadding),
  );
  const placement: SelectionToolbarPlacement =
    topOverflow <= bottomOverflow ? "top" : "bottom";

  return {
    left,
    top: placement === "top" ? anchorTop : anchorBottom,
    placement,
    transform:
      placement === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
  };
}

export type BoardEditorSelectionToolbarPositionerProps = PropsWithChildren<{
  anchorLeft: number;
  anchorTop: number;
  anchorBottom: number;
  viewportWidth: number;
  viewportHeight: number;
}>;

export function BoardEditorSelectionToolbarPositioner({
  anchorLeft,
  anchorTop,
  anchorBottom,
  viewportWidth,
  viewportHeight,
  children,
}: BoardEditorSelectionToolbarPositionerProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [toolbarSize, setToolbarSize] = useState({ width: 0, height: 0 });

  useIsomorphicLayoutEffect(() => {
    const node = contentRef.current;

    if (!node) {
      return;
    }

    const measure = () => {
      const rect = node.getBoundingClientRect();

      setToolbarSize((current) =>
        current.width === rect.width && current.height === rect.height
          ? current
          : { width: rect.width, height: rect.height },
      );
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const position = getSelectionToolbarPlacement({
    anchorLeft,
    anchorTop,
    anchorBottom,
    toolbarWidth: toolbarSize.width,
    toolbarHeight: toolbarSize.height,
    viewportWidth,
    viewportHeight,
  });

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 10 }}
    >
      <div
        ref={contentRef}
        className="pointer-events-auto absolute"
        style={{
          left: position.left,
          top: position.top,
          transform: position.transform,
        }}
      >
        {children}
      </div>
    </div>
  );
}
