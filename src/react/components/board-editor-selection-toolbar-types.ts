import type { ComponentType } from "react";
import type { BoardObject } from "../../core/board/types";

export interface BoardEditorSelectionToolbarRendererProps<
  TObject extends BoardObject = BoardObject,
> {
  className?: string;
  selectedObject: TObject;
  toolbarLeft: number;
  toolbarTop: number;
  toolbarBottom: number;
  viewportHeight: number;
  viewportWidth: number;
}

export type BoardEditorSelectionToolbarRenderer<
  TObject extends BoardObject = BoardObject,
> = ComponentType<BoardEditorSelectionToolbarRendererProps<TObject>>;
