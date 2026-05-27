/// <reference types="vite/client" />

import addonDocs from "@storybook/addon-docs";
import addonA11y from "@storybook/addon-a11y";
import addonThemes, { withThemeByClassName } from "@storybook/addon-themes";
import { definePreview, type ReactRenderer } from "@storybook/react-vite";
import "../src/tailwind.css";

export default definePreview({
  decorators: [
    withThemeByClassName<ReactRenderer>({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
  ],

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    options: {
      storySort: {
        order: ["React", ["Board Editor", ["Football", "Basketball"]]],
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },

  addons: [addonA11y(), addonDocs(), addonThemes()],
});
