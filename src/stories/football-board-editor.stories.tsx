import type { Meta, StoryObj } from "@storybook/react-vite";
import { FootballExampleApp } from "../examples/football/football-example-app";

const meta = {
  title: "React/Board Editor/Football Example",
  component: FootballExampleApp,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Interactive reference for composing the React board editor with a football-specific board document, tools, presets, toolbar workflow, icons, and canvas renderers.",
      },
    },
  },
} satisfies Meta<typeof FootballExampleApp>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FullEditor: Story = {};
