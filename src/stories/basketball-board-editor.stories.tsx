import type { Meta, StoryObj } from "@storybook/react-vite";
import { BasketballBoardEditor, createBasketballBoard } from "../react";

const meta = {
  title: "React/Board Editor/Basketball",
  component: BasketballBoardEditor,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Second sport reference for the board editor. It reuses the generic editor, viewer renderers, player, arrow, shape, and text tools with a basketball court frame.",
      },
    },
  },
} satisfies Meta<typeof BasketballBoardEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EmptyBoard: Story = {};

export const ContainedNavigationWithPadding: Story = {
  args: {
    initialBoard: createBasketballBoard(),
    fitPadding: 24,
  },
};
