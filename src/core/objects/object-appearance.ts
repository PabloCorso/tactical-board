export type ObjectAppearance =
  | {
      kind: "render";
      renderer?: string;
    }
  | {
      kind: "svg";
      svg: string;
    }
  | {
      kind: "image";
      src: string;
    }
  | {
      kind: "sprite";
      src: string;
      frame: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    };

export const DEFAULT_RENDER_APPEARANCE: ObjectAppearance = {
  kind: "render",
};

export function cloneObjectAppearance(
  appearance: ObjectAppearance = DEFAULT_RENDER_APPEARANCE,
): ObjectAppearance {
  switch (appearance.kind) {
    case "render":
      return {
        kind: "render",
        renderer: appearance.renderer,
      };
    case "svg":
      return {
        kind: "svg",
        svg: appearance.svg,
      };
    case "image":
      return {
        kind: "image",
        src: appearance.src,
      };
    case "sprite":
      return {
        kind: "sprite",
        src: appearance.src,
        frame: {
          ...appearance.frame,
        },
      };
  }
}
