import type { ReactNode } from "react";
import type { BoardObject } from "../../core/board/types";

export type BoardEditorSelectionToolbarRendererProps<
  TObject extends BoardObject = BoardObject,
> = {
  className?: string;
  selectedObject: TObject;
  toolbarLeft: number;
  toolbarTop: number;
};

export type BoardEditorSelectionToolbarRenderer<
  TObject extends BoardObject = BoardObject,
> = (props: BoardEditorSelectionToolbarRendererProps<TObject>) => ReactNode;
