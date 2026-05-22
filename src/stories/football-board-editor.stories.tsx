import type { Meta, StoryObj } from "@storybook/react-vite";
import { footballShowcaseBoard } from "../examples/football/football-showcase-board";
import { FootballBoardEditor } from "../react";

const meta = {
  title: "React/Board Editor/Football",
  component: FootballBoardEditor,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Interactive reference for composing the React board editor with a football-specific board document, tools, presets, toolbar workflow, icons, and canvas renderers.",
      },
    },
  },
} satisfies Meta<typeof FootballBoardEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EmptyBoard: Story = {};

export const ShowcaseBoard: Story = {
  args: {
    initialBoard: footballShowcaseBoard,
  },
};
