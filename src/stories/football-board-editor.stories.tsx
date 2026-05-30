import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { footballShowcaseBoard } from "../examples/football/football-showcase-board";
import type { Board } from "../core/board/types";
import type { BoardEditorState } from "../core/editor/types";
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
  createFootballTools,
  FOOTBALL_PITCH_OPTIONS,
  FOOTBALL_PITCH_TOOL_ID,
  footballTheme,
  footballThemeAdapters,
  getFootballPitchFitPadding,
  getFootballPitchVariant,
  useBoardEditorToolbarDock,
  FootballPitchPreview,
} from "../react";

type FootballBoardStoryProps = {
  initialBoard?: Board;
  navigationMode?: BoardEditorState["ui"]["navigationMode"];
};

const footballPitchFrameOptions = FOOTBALL_PITCH_OPTIONS.map((option) => ({
  ...option,
  createFrame: () => createFootballPitch(option.value),
  renderIcon: () => (
    <FootballPitchPreview
      className="rounded-sm"
      variant={option.value}
      width={24}
      height={24}
    />
  ),
  renderPreview: () => (
    <FootballPitchPreview
      className="rounded-md"
      variant={option.value}
      width={78}
      height={48}
    />
  ),
}));

function FootballToolbarDockExample() {
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
            toolId={FOOTBALL_PITCH_TOOL_ID}
            options={footballPitchFrameOptions}
            getValue={getFootballPitchVariant}
          />
        </BoardPrimaryToolbar>
      </div>
      {toolbarDock.secondaryToolbarOpen ? (
        <>
          <BoardEditorFrameVariantDefaultsToolbar
            toolId={FOOTBALL_PITCH_TOOL_ID}
            options={footballPitchFrameOptions}
            fitPadding={getFootballPitchFitPadding()}
            getValue={getFootballPitchVariant}
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

function FootballBoardStory({
  initialBoard,
  navigationMode,
}: FootballBoardStoryProps = {}) {
  const store = useMemo(
    () =>
      createBoardEditorStore({
        initialBoard: initialBoard ?? createFootballBoard(),
        fitPadding: getFootballPitchFitPadding,
        navigationMode,
        tools: createFootballTools(),
      }),
    [initialBoard, navigationMode],
  );

  return (
    <BoardEditorProvider store={store}>
      <BoardEditor className="relative h-dvh w-full overflow-hidden">
        <BoardEditorCanvas />
        <BoardEditorShapePolygonDone />
        <BoardEditorCanvasToolbar />
        <BoardEditorSelectionToolbar />
        <BoardEditorToolbarDockProvider>
          <FootballToolbarDockExample />
        </BoardEditorToolbarDockProvider>
      </BoardEditor>
    </BoardEditorProvider>
  );
}

const meta = {
  title: "React/Board Editor/Football",
  component: FootballBoardStory,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Interactive reference for composing the React board editor with a football-specific board document, tools, defaults, toolbar workflow, icons, and canvas renderers.",
      },
    },
  },
} satisfies Meta<typeof FootballBoardStory>;

export default meta;

type Story = StoryObj<typeof meta>;

const frameComparisonScale = 0.5;
const fullPitchFrame = createFootballPitch("full-pitch");
const halfPitchFrame = createFootballPitch("half-pitch");
const reducedSpaceFrame = createFootballPitch("reduced-space");

export const EmptyBoard: Story = {};

export const ShowcaseBoard: Story = {
  args: {
    initialBoard: footballShowcaseBoard,
  },
};

export const ContainedNavigation: Story = {
  args: {
    initialBoard: footballShowcaseBoard,
    navigationMode: "contained",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Football editor with contained navigation: zooming is allowed, but pan and scroll stay constrained to the fit-to-view pitch frame.",
      },
    },
  },
};

export const Pitches: Story = {
  parameters: {
    layout: "centered",
  },
  render: () => (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-end gap-8">
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground text-sm">Full pitch</div>
          <FootballPitchPreview
            className="rounded-md"
            height={fullPitchFrame.height * frameComparisonScale}
            variant="full-pitch"
            width={fullPitchFrame.width * frameComparisonScale}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground text-sm">Half pitch</div>
          <FootballPitchPreview
            className="rounded-md"
            height={halfPitchFrame.height * frameComparisonScale}
            variant="half-pitch"
            width={halfPitchFrame.width * frameComparisonScale}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground text-sm">Reduced space</div>
          <FootballPitchPreview
            className="rounded-md"
            height={reducedSpaceFrame.height * frameComparisonScale}
            variant="reduced-space"
            width={reducedSpaceFrame.width * frameComparisonScale}
          />
        </div>
      </div>
    </div>
  ),
};
