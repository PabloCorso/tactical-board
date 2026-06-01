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
  getFootballPitchFitPadding,
  getFootballPitchOrientation,
  getFootballPitchOrientationLabel,
  getFootballPitchVariant,
  remapObjectToFrameRotation,
  useBoardEditorToolbarDock,
  type Board,
  type BoardEditorNavigationMode,
  type BoardEditorFrameVariantOption,
  type FootballPitchVariant,
} from "../../react";

export type FootballBoardEditorExampleProps = {
  boardId?: string;
  boardName?: string;
  className?: string;
  initialBoard?: Board;
  navigationMode?: BoardEditorNavigationMode;
  renderHostToolbar?: () => ReactNode;
  translatePitchLabel?: (
    value: FootballPitchVariant,
    defaultLabel: string,
  ) => string;
};

type FootballBoardEditorToolbarDockProps = {
  pitchOptions: Array<BoardEditorFrameVariantOption<FootballPitchVariant>>;
};

export function FootballBoardEditorExample({
  boardId = "draft-board",
  boardName = "Draft board",
  className = "relative h-dvh w-full overflow-hidden",
  initialBoard,
  navigationMode,
  renderHostToolbar,
  translatePitchLabel,
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
        fitPadding: getFootballPitchFitPadding,
        navigationMode,
        tools: createFootballTools(),
      }),
    [boardId, boardName, initialBoard, navigationMode],
  );

  return (
    <BoardEditorProvider store={store}>
      <BoardEditor className={className}>
        <BoardEditorCanvas />
        <BoardEditorShapePolygonDone />
        <BoardEditorCanvasToolbar />
        <BoardEditorSelectionToolbar />
        {renderHostToolbar?.()}
        <BoardEditorToolbarDockProvider>
          <FootballBoardEditorToolbarDock pitchOptions={pitchOptions} />
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
            fitPadding={getFootballPitchFitPadding()}
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

              return {
                label: `Rotate pitch to ${orientationLabel}`,
                buttonLabel: "Rotate",
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
