import { useMemo, type ReactNode } from "react";
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorCanvasToolbar,
  BoardEditorFrameVariantDefaultsToolbar,
  BoardEditorFrameVariantToolControl,
  BoardEditorProvider,
  BoardEditorSecondaryToolbar,
  BoardEditorSelectionToolbar,
  BoardEditorShapePolygonDone,
  BoardEditorToolbarDock,
  BoardEditorToolbarDockProvider,
  BoardPrimaryToolbar,
  createBoardEditorStore,
  createFootballBoard,
  createFootballPitch,
  createNextFootballPitchFrame,
  createFootballTools,
  FOOTBALL_PITCH_OPTIONS,
  FOOTBALL_PITCH_TOOL_ID,
  footballTheme,
  footballThemeAdapters,
  FootballPitchPreview,
  getFootballPitchOrientation,
  getFootballPitchOrientationLabel,
  getFootballPitchVariant,
  remapObjectToFrameRotation,
  useBoardEditorToolbarDock,
  type Board,
  type BoardEditorNavigationMode,
  type BoardEditorFrameVariantOption,
  type BoardEditorLabelOverrides,
  type FootballPitchVariant,
} from "../../react";

export type FootballBoardEditorExampleProps = {
  boardId?: string;
  boardName?: string;
  className?: string;
  initialBoard?: Board;
  labels?: BoardEditorLabelOverrides;
  navigationMode?: BoardEditorNavigationMode;
  renderHostToolbar?: () => ReactNode;
  translatePitchLabel?: (
    value: FootballPitchVariant,
    defaultLabel: string,
  ) => string;
  translateRotatePitchAction?: (context: {
    defaultButtonLabel: string;
    defaultLabel: string;
    orientationLabel: string;
    variant: FootballPitchVariant;
  }) => {
    buttonLabel: string;
    label: string;
  };
};

type FootballBoardEditorToolbarDockProps = {
  pitchOptions: Array<BoardEditorFrameVariantOption<FootballPitchVariant>>;
  translateRotatePitchAction?: FootballBoardEditorExampleProps["translateRotatePitchAction"];
};

export function FootballBoardEditorExample({
  boardId = "draft-board",
  boardName = "Draft board",
  className = "relative h-dvh w-full overflow-hidden",
  initialBoard,
  labels,
  navigationMode,
  renderHostToolbar,
  translatePitchLabel,
  translateRotatePitchAction,
}: FootballBoardEditorExampleProps = {}) {
  const pitchOptions = useMemo(
    () => createFootballPitchFrameOptions(translatePitchLabel),
    [translatePitchLabel],
  );
  const store = useMemo(
    () =>
      createBoardEditorStore({
        initialBoard:
          initialBoard ?? createFootballBoard({ id: boardId, name: boardName }),
        navigationMode,
        tools: createFootballTools(),
      }),
    [boardId, boardName, initialBoard, navigationMode],
  );

  return (
    <BoardEditorProvider labels={labels} store={store}>
      <BoardEditor className={className}>
        <BoardEditorCanvas />
        <BoardEditorShapePolygonDone />
        <BoardEditorCanvasToolbar />
        <BoardEditorSelectionToolbar />
        {renderHostToolbar?.()}
        <BoardEditorToolbarDockProvider>
          <FootballBoardEditorToolbarDock
            pitchOptions={pitchOptions}
            translateRotatePitchAction={translateRotatePitchAction}
          />
        </BoardEditorToolbarDockProvider>
      </BoardEditor>
    </BoardEditorProvider>
  );
}

export function createFootballPitchFrameOptions(
  translatePitchLabel?: (
    value: FootballPitchVariant,
    defaultLabel: string,
  ) => string,
): Array<BoardEditorFrameVariantOption<FootballPitchVariant>> {
  return FOOTBALL_PITCH_OPTIONS.map((option) => ({
    ...option,
    createFrame: () => createFootballPitch(option.value),
    label: translatePitchLabel?.(option.value, option.label) ?? option.label,
    renderIcon: (context) => (
      <FootballPitchPreview
        className="rounded-sm"
        height={24}
        orientation={
          context?.active
            ? getFootballPitchOrientation(context.frame.orientation)
            : undefined
        }
        variant={option.value}
        width={24}
      />
    ),
    renderPreview: (context) => (
      <FootballPitchPreview
        className="rounded-md"
        height={48}
        orientation={
          context?.active
            ? getFootballPitchOrientation(context.frame.orientation)
            : undefined
        }
        variant={option.value}
        width={78}
      />
    ),
  }));
}

function FootballBoardEditorToolbarDock({
  pitchOptions,
  translateRotatePitchAction,
}: FootballBoardEditorToolbarDockProps) {
  const toolbarDock = useBoardEditorToolbarDock();

  return (
    <BoardEditorToolbarDock>
      <div onClick={toolbarDock.openSecondaryToolbar}>
        <BoardPrimaryToolbar
          adapters={footballThemeAdapters}
          showEquipment
          theme={footballTheme}
        >
          <BoardEditorFrameVariantToolControl
            getValue={getFootballPitchVariant}
            options={pitchOptions}
            toolId={FOOTBALL_PITCH_TOOL_ID}
          />
        </BoardPrimaryToolbar>
      </div>
      {toolbarDock.secondaryToolbarOpen ? (
        <>
          <BoardEditorFrameVariantDefaultsToolbar
            getAction={({ frame }) => {
              const nextFrame = createNextFootballPitchFrame(frame);

              if (!nextFrame) {
                return undefined;
              }

              const variant = getFootballPitchVariant(frame.markup?.variant);
              const nextOrientation = getFootballPitchOrientation(
                nextFrame.orientation,
              );
              const orientationLabel = getFootballPitchOrientationLabel({
                orientation: nextOrientation,
                variant,
              });
              const defaultLabel = `Rotate pitch to ${orientationLabel}`;
              const defaultButtonLabel = "Rotate";
              const actionLabels = translateRotatePitchAction?.({
                defaultButtonLabel,
                defaultLabel,
                orientationLabel,
                variant,
              });

              return {
                label: actionLabels?.label ?? defaultLabel,
                buttonLabel: actionLabels?.buttonLabel ?? defaultButtonLabel,
                createFrame: () => nextFrame,
                remapObject: remapObjectToFrameRotation,
              };
            }}
            getValue={getFootballPitchVariant}
            options={pitchOptions}
            toolId={FOOTBALL_PITCH_TOOL_ID}
          />
          <BoardEditorSecondaryToolbar
            adapters={footballThemeAdapters}
            theme={footballTheme}
          />
        </>
      ) : null}
    </BoardEditorToolbarDock>
  );
}
