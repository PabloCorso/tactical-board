import type { ToolId } from "../../../core/board/types";
import type { ToolApi } from "../../../core/tools/types";

type ToolStateWithDraftStyle<TDraftStyle> = {
  draftStyle: TDraftStyle;
};

export function setToolStatePatch<TState extends Record<string, unknown>>(
  toolApi: Pick<ToolApi, "setToolState">,
  toolId: ToolId,
  currentState: TState,
  patch: Partial<TState>,
) {
  toolApi.setToolState(toolId, {
    ...currentState,
    ...patch,
  });
}

export function mergeToolDraftStyle<
  TDraftStyle extends Record<string, unknown>,
  TState extends ToolStateWithDraftStyle<TDraftStyle> & Record<string, unknown>,
>(
  toolApi: Pick<ToolApi, "setToolState">,
  toolId: ToolId,
  currentState: TState,
  draftStyle: Partial<TDraftStyle>,
) {
  setToolStatePatch(toolApi, toolId, currentState, {
    draftStyle: {
      ...(currentState.draftStyle as TDraftStyle),
      ...draftStyle,
    },
  } as unknown as Partial<TState>);
}
