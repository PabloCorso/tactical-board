import { CopyIcon, TrashIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import type { BoardEditorState } from "../../core/editor/types";
import { createToolApi } from "../../core/editor/create-tool-api";
import type {
  ToolActionDefinition,
  ToolActionIcon,
} from "../../core/tools/types";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import { useBoardEditorContext } from "./board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarButton,
} from "./board-editor-toolbar";
import { cn } from "./misc";
import type { IconRender } from "./ui/icon";

export type BoardEditorSecondaryToolbarProps = {
  className?: string;
};

const EMPTY_SECONDARY_ACTIONS: [] = [];

function renderArrowActionIcon(
  variant: ToolActionIcon & { kind: "arrow" },
): IconRender {
  return (
    <span className="flex h-5 w-10 items-center justify-center">
      <svg
        aria-hidden="true"
        className="h-5 w-10"
        fill="none"
        viewBox="0 0 40 20"
      >
        {variant.value === "curved-solid" ? (
          <>
            <path
              d="M5 14 C15 4, 24 4, 32 9"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.25"
            />
            <path
              d="M29 5.5 L35 9 L30 14"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.25"
            />
          </>
        ) : variant.value === "curved-dashed" ? (
          <>
            <path
              d="M5 14 C15 4, 24 4, 32 9"
              stroke="currentColor"
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeWidth="2.25"
            />
            <path
              d="M29 5.5 L35 9 L30 14"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.25"
            />
          </>
        ) : variant.value === "wavy" ? (
          <>
            <path
              d="M4 10 C8 4, 12 16, 16 10 S24 4, 28 10 S31 14, 33 10"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.25"
            />
            <path
              d="M30 6.5 L36 10 L30 13.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.25"
            />
          </>
        ) : variant.value === "double" ? (
          <>
            <path
              d="M5 6.25 L32 6.25"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.25"
            />
            <path
              d="M5 13.75 L32 13.75"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.25"
            />
            <path
              d="M29 9 L35 10 L29 11"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.25"
            />
          </>
        ) : variant.value === "polyline" ? (
          <>
            <path
              d="M5 14 L15 8 L24 12 L32 7"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.25"
            />
            <path
              d="M29 4 L35 7 L29 10"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.25"
            />
          </>
        ) : (
          <>
            <path
              d="M5 10 L32 10"
              stroke="currentColor"
              strokeDasharray={
                variant.value === "straight-dashed" ? "4 4" : undefined
              }
              strokeLinecap="round"
              strokeWidth="2.25"
            />
            <path
              d="M29 6.5 L35 10 L29 13.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.25"
            />
          </>
        )}
      </svg>
    </span>
  );
}

function renderShapeActionIcon(
  variant: ToolActionIcon & { kind: "shape" },
): IconRender {
  return (
    <span className="flex h-5 w-10 items-center justify-center">
      <svg
        aria-hidden="true"
        className="h-5 w-10"
        fill="none"
        viewBox="0 0 40 20"
      >
        {variant.value === "oval" ? (
          <ellipse
            cx="20"
            cy="10"
            rx="11"
            ry="6"
            stroke="currentColor"
            strokeWidth="2.25"
          />
        ) : variant.value === "triangle" ? (
          <path
            d="M20 4 L31 16 L9 16 Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2.25"
          />
        ) : variant.value === "diamond" ? (
          <path
            d="M20 4 L31 10 L20 16 L9 10 Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2.25"
          />
        ) : variant.value === "polygon" ? (
          <path
            d="M10 13 L15 5 L28 6 L31 14 L18 16 Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2.25"
          />
        ) : (
          <rect
            x="9"
            y="4"
            width="22"
            height="12"
            rx="2"
            stroke="currentColor"
            strokeWidth="2.25"
          />
        )}
      </svg>
    </span>
  );
}

function getSecondaryActionIcon(action: ToolActionDefinition): IconRender {
  switch (action.icon?.kind) {
    case "system":
      if (action.icon.value === "duplicate") {
        return <CopyIcon aria-hidden="true" className="size-4" weight="bold" />;
      }

      if (action.icon.value === "delete") {
        return (
          <TrashIcon aria-hidden="true" className="size-4" weight="bold" />
        );
      }
      return undefined;
    case "color":
      return (
        <span
          className="border-default inline-flex h-5 w-5 rounded-full border"
          style={{ backgroundColor: action.icon.value }}
        >
          <span className="sr-only">{action.icon.value}</span>
        </span>
      );
    case "arrow":
      return renderArrowActionIcon(action.icon);
    case "shape":
      return renderShapeActionIcon(action.icon);
    default:
      return undefined;
  }
}

export function BoardEditorSecondaryToolbar({
  className,
}: BoardEditorSecondaryToolbarProps) {
  const store = useBoardEditorContext();
  const toolApi = useMemo(() => createToolApi(store), [store]);
  const state = useBoardEditorStore(store, (currentState) => currentState);
  const currentTool = state.toolRegistry.definitions[state.ui.activeToolId];
  const secondaryActions = useMemo(
    () =>
      currentTool?.getSecondaryActions?.(state as BoardEditorState) ??
      EMPTY_SECONDARY_ACTIONS,
    [currentTool, state],
  );

  if (secondaryActions.length === 0) {
    return null;
  }

  return (
    <BoardEditorToolbar className={cn("items-stretch", className)}>
      {secondaryActions.map((action) => {
        const icon = getSecondaryActionIcon(action);

        return (
          <BoardEditorToolbarButton
            aria-label={action.label}
            active={action.active}
            className="w-full justify-start"
            disabled={action.disabled}
            iconBefore={icon}
            key={action.id}
            onClick={() => action.onSelect(toolApi)}
            tooltip={action.tooltip ?? action.label}
          >
            {action.label}
          </BoardEditorToolbarButton>
        );
      })}
    </BoardEditorToolbar>
  );
}
