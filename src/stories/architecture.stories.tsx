import type { Meta, StoryObj } from "@storybook/react-vite";
import App from "../app";

const meta = {
  title: "Architecture/Football Scaffold",
  component: App,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof App>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
