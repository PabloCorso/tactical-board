import {
  createContext,
  type ComponentPropsWithRef,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";
import type { PopoverContentProps } from "../../../ui/popover";
import { cn } from "../../../ui/misc";

export type BoardEditorToolbarDockPlacement =
  | "top"
  | "right"
  | "bottom"
  | "left";

export type BoardEditorToolbarDockProps = ComponentPropsWithRef<"div"> & {
  contentClassName?: string;
  placement?: BoardEditorToolbarDockPlacement;
};

export function BoardEditorToolbarDock({
  children,
  className,
  contentClassName,
  placement = "left",
  ...props
}: BoardEditorToolbarDockProps) {
  const placementClassName = {
    bottom: "inset-x-4 bottom-4 justify-center",
    left: "inset-y-4 left-2 items-center",
    right: "inset-y-4 right-4 items-center",
    top: "inset-x-4 top-4 justify-center",
  } satisfies Record<BoardEditorToolbarDockPlacement, string>;

  return (
    <div
      {...props}
      data-placement={placement}
      className={cn(
        "pointer-events-none absolute flex min-h-0 min-w-0",
        placementClassName[placement],
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none flex max-h-full min-h-0 max-w-full min-w-0 items-center gap-2",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export type BoardEditorToolbarDockProviderProps = PropsWithChildren & {
  defaultSecondaryToolbarOpen?: boolean;
  dismissSecondaryToolbarOnSelect?: boolean;
};

export function BoardEditorToolbarDockProvider({
  children,
  defaultSecondaryToolbarOpen = true,
  dismissSecondaryToolbarOnSelect = true,
}: BoardEditorToolbarDockProviderProps) {
  const [secondaryToolbarOpen, setSecondaryToolbarOpen] = useState(
    defaultSecondaryToolbarOpen,
  );
  const value = useMemo<BoardEditorToolbarDockContextValue>(
    () => ({
      secondaryToolbarOpen,
      openSecondaryToolbar: () => setSecondaryToolbarOpen(true),
      closeSecondaryToolbar: () => setSecondaryToolbarOpen(false),
      requestDismiss: () => {
        if (dismissSecondaryToolbarOnSelect) {
          setSecondaryToolbarOpen(false);
        }
      },
    }),
    [dismissSecondaryToolbarOnSelect, secondaryToolbarOpen],
  );

  return (
    <BoardEditorToolbarDockContext.Provider value={value}>
      {children}
    </BoardEditorToolbarDockContext.Provider>
  );
}

export function useBoardEditorToolbarDock() {
  const value = useContext(BoardEditorToolbarDockContext);

  if (!value) {
    throw new Error(
      "useBoardEditorToolbarDock must be used within BoardEditorToolbarDockProvider",
    );
  }

  return value;
}

export function useBoardEditorToolbarDockOptional() {
  return useContext(BoardEditorToolbarDockContext);
}

type BoardEditorToolbarFloatingPortalContextValue = {
  container: HTMLElement | null;
  positionMethod: PopoverContentProps["positionMethod"];
};

export function BoardEditorToolbarFloatingPortalProvider({
  children,
  container,
  positionMethod,
}: PropsWithChildren<BoardEditorToolbarFloatingPortalContextValue>) {
  return (
    <BoardEditorToolbarFloatingPortalContext.Provider
      value={{ container, positionMethod }}
    >
      {children}
    </BoardEditorToolbarFloatingPortalContext.Provider>
  );
}

export function useBoardEditorToolbarFloatingPortal() {
  return useContext(BoardEditorToolbarFloatingPortalContext);
}

type BoardEditorToolbarDockContextValue = {
  secondaryToolbarOpen: boolean;
  openSecondaryToolbar: () => void;
  closeSecondaryToolbar: () => void;
  requestDismiss: () => void;
};

const BoardEditorToolbarDockContext =
  createContext<BoardEditorToolbarDockContextValue | null>(null);

const BoardEditorToolbarFloatingPortalContext =
  createContext<BoardEditorToolbarFloatingPortalContextValue>({
    container: null,
    positionMethod: "fixed",
  });
