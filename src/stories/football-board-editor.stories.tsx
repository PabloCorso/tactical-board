import type { Meta, StoryObj } from "@storybook/react-vite";
import { footballShowcaseBoard } from "../examples/football/football-showcase-board";
import { FootballBoardEditor } from "../react";
import { createFootballPitch } from "../react/sports/football/board/football-board";
import { FootballPitchPreview } from "../react/sports/football/theme/football-pitch-icons";

const meta = {
  title: "React/Board Editor/Football",
  component: FootballBoardEditor,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Interactive reference for composing the React board editor with a football-specific board document, tools, defaults, toolbar workflow, icons, and canvas renderers.",
      },
    },
  },
} satisfies Meta<typeof FootballBoardEditor>;

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

export const ContainedNavigationWithPadding: Story = {
  args: {
    initialBoard: footballShowcaseBoard,
    fitPadding: 24,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Contained navigation with a 24px viewport frame padding around the pitch.",
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
