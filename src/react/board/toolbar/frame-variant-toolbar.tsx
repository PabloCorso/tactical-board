import { useMemo, type ReactNode } from "react";
import type { BoardFrameConfig } from "../../../core/board/types";
import { createToolApi } from "../../../core/editor/create-tool-api";
import {
  getViewportToFitBoard,
  type FitPadding,
} from "../../../core/editor/viewport-utils";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { BoardEditorToolControl } from "../editor/toolbar/tool-control";
import {
  BoardEditorToolbar,
  BoardEditorToolbarButton,
  type BoardEditorToolbarProps,
  useBoardEditorToolbarDockOptional,
} from "../editor/toolbar/editor-toolbar";
import type { IconRender } from "../../ui/icon";

export type BoardEditorFrameVariantOption<TValue extends string = string> = {
  label: string;
  value: TValue;
  createFrame: () => BoardFrameConfig;
  renderIcon?: () => IconRender;
  renderPreview?: () => ReactNode;
};

export type BoardEditorFrameVariantToolControlProps<
  TValue extends string = string,
> = {
  toolId: string;
  label?: string;
  options: BoardEditorFrameVariantOption<TValue>[];
  getValue?: (value: unknown) => TValue;
};

export type BoardEditorFrameVariantDefaultsToolbarProps<
  TValue extends string = string,
> = Omit<BoardEditorToolbarProps, "children"> & {
  toolId: string;
  options: BoardEditorFrameVariantOption<TValue>[];
  fitPadding?: FitPadding;
  getValue?: (value: unknown) => TValue;
};

function getFrameVariantValue<TValue extends string>(
  value: unknown,
  options: BoardEditorFrameVariantOption<TValue>[],
  getValue?: (value: unknown) => TValue,
) {
  if (getValue) {
    return getValue(value);
  }

  if (typeof value === "string") {
    const option = options.find((candidate) => candidate.value === value);

    if (option) {
      return option.value;
    }
  }

  return options[0]?.value;
}

export function BoardEditorFrameVariantToolControl<
  TValue extends string = string,
>({
  toolId,
  label,
  options,
  getValue,
}: BoardEditorFrameVariantToolControlProps<TValue>) {
  const store = useBoardEditorContext();
  const value = useBoardEditorStore(store, (state) =>
    getFrameVariantValue(state.board.frame.markup?.variant, options, getValue),
  );
  const option = options.find((candidate) => candidate.value === value);

  return (
    <BoardEditorToolControl
      toolId={toolId}
      label={label}
      icon={option?.renderIcon?.()}
    />
  );
}

export function BoardEditorFrameVariantDefaultsToolbar<
  TValue extends string = string,
>({
  toolId,
  options,
  fitPadding,
  getValue,
  orientation = "vertical",
  ...toolbarProps
}: BoardEditorFrameVariantDefaultsToolbarProps<TValue>) {
  const editorStore = useBoardEditorContext();
  const toolbarDock = useBoardEditorToolbarDockOptional();
  const toolApi = useMemo(() => createToolApi(editorStore), [editorStore]);
  const state = useBoardEditorStore(
    editorStore,
    (currentState) => currentState,
  );

  if (state.ui.activeToolId !== toolId || options.length === 0) {
    return null;
  }

  const value = getFrameVariantValue(
    state.board.frame.markup?.variant,
    options,
    getValue,
  );

  return (
    <BoardEditorToolbar
      {...toolbarProps}
      orientation={orientation}
      tooltipSide="right"
    >
      {options.map((option) => (
        <BoardEditorToolbarButton
          active={value === option.value}
          aria-label={option.label}
          className="h-auto w-auto p-1"
          key={option.value}
          onClick={() => {
            const frame = option.createFrame();
            toolApi.setFrame(frame);

            if (state.ui.canvasRect) {
              state.actions.setViewport(
                getViewportToFitBoard({
                  board: { ...state.board, frame },
                  canvasRect: state.ui.canvasRect,
                  fitPadding,
                }),
              );
            }

            toolbarDock?.requestDismiss();
          }}
          size="md"
          tooltip={option.label}
        >
          {option.renderPreview?.()}
        </BoardEditorToolbarButton>
      ))}
    </BoardEditorToolbar>
  );
}
