import { useMemo, type ReactNode } from "react";
import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import type { BoardFrameConfig, BoardObject } from "../../../core/board/types";
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
  BoardEditorToolbarSeparator,
  type BoardEditorToolbarProps,
} from "../editor/toolbar/editor-toolbar";
import { useBoardEditorToolbarDockOptional } from "../editor/toolbar/toolbar-dock";
import type { IconRender } from "../../ui/icon";

export type BoardEditorFrameVariantRenderContext<
  TValue extends string = string,
> = {
  active: boolean;
  frame: BoardFrameConfig;
  value: TValue;
};

export type BoardEditorFrameVariantOption<TValue extends string = string> = {
  label: string;
  value: TValue;
  createFrame: (
    context?: BoardEditorFrameVariantRenderContext<TValue>,
  ) => BoardFrameConfig;
  renderIcon?: (
    context?: BoardEditorFrameVariantRenderContext<TValue>,
  ) => IconRender;
  renderPreview?: (
    context?: BoardEditorFrameVariantRenderContext<TValue>,
  ) => ReactNode;
};

export type BoardEditorFrameVariantAction<TValue extends string = string> = {
  label: string;
  buttonLabel?: ReactNode;
  createFrame: () => BoardFrameConfig;
  icon?: IconRender;
  remapObject?: (context: {
    object: BoardObject;
    previousFrame: BoardFrameConfig;
    nextFrame: BoardFrameConfig;
  }) => BoardObject;
  value?: TValue;
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
  getAction?: (context: {
    frame: BoardFrameConfig;
    value: TValue | undefined;
  }) => BoardEditorFrameVariantAction<TValue> | undefined;
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
  const frame = useBoardEditorStore(store, (state) => state.board.frame);
  const option = options.find((candidate) => candidate.value === value);

  return (
    <BoardEditorToolControl
      toolId={toolId}
      label={label}
      icon={
        option && value
          ? option.renderIcon?.({ active: true, frame, value })
          : undefined
      }
    />
  );
}

export function BoardEditorFrameVariantDefaultsToolbar<
  TValue extends string = string,
>({
  toolId,
  options,
  fitPadding,
  getAction,
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
  const action = getAction?.({ frame: state.board.frame, value });
  const setFrame = (
    frame: BoardFrameConfig,
    remapObject?: BoardEditorFrameVariantAction<TValue>["remapObject"],
    resetTool = false,
  ) => {
    let nextObjects = state.board.objects;

    if (remapObject) {
      let changed = false;
      const nextById = { ...state.board.objects.byId };

      for (const objectId of state.board.objects.order) {
        const object = state.board.objects.byId[objectId];

        if (!object) {
          continue;
        }

        const nextObject = remapObject({
          object,
          previousFrame: state.board.frame,
          nextFrame: frame,
        });

        if (nextObject !== object) {
          changed = true;
          nextById[objectId] = nextObject;
        }
      }

      if (changed) {
        nextObjects = {
          ...state.board.objects,
          byId: nextById,
        };
      }
    }

    const nextBoard = {
      ...state.board,
      frame,
      objects: nextObjects,
    };

    if (remapObject) {
      toolApi.beginHistoryBatch();
    }

    try {
      toolApi.setFrame(frame);

      if (remapObject) {
        toolApi.updateObjects(
          state.board.objects.order,
          (object) => nextObjects.byId[object.id] ?? object,
        );
      }
    } finally {
      if (remapObject) {
        toolApi.endHistoryBatch();
      }
    }

    if (state.ui.canvasRect) {
      state.actions.setViewport(
        getViewportToFitBoard({
          board: nextBoard,
          canvasRect: state.ui.canvasRect,
          fitPadding,
        }),
      );
    }

    if (resetTool) {
      toolApi.resetTool();
    }
  };

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
            setFrame(
              option.createFrame({
                active: value === option.value,
                frame: state.board.frame,
                value: option.value,
              }),
              undefined,
              true,
            );
            toolbarDock?.requestDismiss();
          }}
          size="md"
          tooltip={option.label}
        >
          {option.renderPreview?.({
            active: value === option.value,
            frame: state.board.frame,
            value: option.value,
          })}
        </BoardEditorToolbarButton>
      ))}
      {action ? (
        <>
          <BoardEditorToolbarSeparator />
          <BoardEditorToolbarButton
            aria-label={action.label}
            iconBefore={action.icon ?? <ArrowClockwiseIcon />}
            onClick={() => setFrame(action.createFrame(), action.remapObject)}
            size="md"
            tooltip={false}
          >
            {action.buttonLabel ?? action.label}
          </BoardEditorToolbarButton>
        </>
      ) : null}
    </BoardEditorToolbar>
  );
}
