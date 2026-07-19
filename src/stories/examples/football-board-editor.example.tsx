import { useMemo } from "react";
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorCanvasToolbar,
  BoardEditorFrameVariantDefaultsToolbar,
  BoardEditorFrameVariantToolControl,
  BoardEditorProvider,
  BoardEditorSecondaryToolbars,
  BoardEditorSelectionToolbar,
  BoardEditorShapePolygonDone,
  BoardEditorTeamPanelDrawer,
  BoardEditorTeamPanelContent,
  BoardEditorTeamPanelProvider,
  BoardEditorToolbarDock,
  BoardEditorToolbarDockProvider,
  BoardPrimaryToolbar,
  createBoardEditorStore,
  createFootballBoard,
  createFootballPitch,
  createNextFootballPitchFrame,
  createFootballEditorConfig,
  FootballTeamPanelAppearance,
  FootballTeamFormationSection,
  TeamPanelCaptionSection,
  TeamPanelPlayerLabelSection,
  TeamPanelDeleteSection,
  FOOTBALL_PITCH_OPTIONS,
  FOOTBALL_PITCH_TOOL_ID,
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

function FootballPlayerGroupPanelContent() {
  return (
    <BoardEditorTeamPanelContent>
      <FootballTeamPanelAppearance />
      <TeamPanelPlayerLabelSection />
      <TeamPanelCaptionSection />
      <FootballTeamFormationSection />
      <TeamPanelDeleteSection />
    </BoardEditorTeamPanelContent>
  );
}

export function FootballBoardEditorExample({
  boardId = "draft-board",
  boardName = "Draft board",
  className = "relative h-dvh w-full overflow-hidden",
  initialBoard,
  labels,
  navigationMode,
  translatePitchLabel,
  translateRotatePitchAction,
}: FootballBoardEditorExampleProps = {}) {
  const config = useMemo(() => createFootballEditorConfig(), []);
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
        ...config,
      }),
    [boardId, boardName, config, initialBoard, navigationMode],
  );

  return (
    <BoardEditorProvider config={config} labels={labels} store={store}>
      <BoardEditor className={className}>
        <BoardEditorTeamPanelProvider>
          <BoardEditorCanvas />
          <BoardEditorShapePolygonDone />
          <BoardEditorCanvasToolbar />
          <BoardEditorSelectionToolbar />

          <BoardEditorToolbarDockProvider>
            <FootballBoardEditorToolbarDock
              pitchOptions={pitchOptions}
              translateRotatePitchAction={translateRotatePitchAction}
            />
          </BoardEditorToolbarDockProvider>
          <BoardEditorTeamPanelDrawer>
            <FootballPlayerGroupPanelContent />
          </BoardEditorTeamPanelDrawer>
        </BoardEditorTeamPanelProvider>
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
    createFrame: (context) =>
      createFootballPitch({
        orientation: context?.active ? context.frame.orientation : undefined,
        variant: option.value,
      }),
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
        <BoardPrimaryToolbar>
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
          <BoardEditorSecondaryToolbars>
            <FootballPlayerGroupPanelContent />
          </BoardEditorSecondaryToolbars>
        </>
      ) : null}
    </BoardEditorToolbarDock>
  );
}
