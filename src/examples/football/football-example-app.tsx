import { createBoardEditorStore } from "../../core/store/create-board-editor-store";
import { BoardEditor } from "../../react/components/board-editor";
import { BoardView } from "../../react/components/board-view";
import { useBoardEditorStore } from "../../react/hooks/use-board-editor-store";
import { handTool } from "../../tools/hand-tool";
import { selectTool } from "../../tools/select-tool";
import { footballBoardExample } from "./football-board-example";

const store = createBoardEditorStore({
  initialBoard: footballBoardExample,
  initialToolId: "select",
  tools: [selectTool, handTool],
});

export function FootballExampleApp() {
  const activeToolId = useBoardEditorStore(
    store,
    (state) => state.ui.activeToolId,
  );
  const selectedObjectIds = useBoardEditorStore(
    store,
    (state) => state.ui.selectedObjectIds,
  );
  const activeTool = useBoardEditorStore(
    store,
    (state) => state.toolRegistry.definitions[state.ui.activeToolId],
  );
  const actions = useBoardEditorStore(store, (state) => state.actions);

  return (
    <main className="grid gap-7 px-8 py-8 text-[#f3efdf] max-[760px]:px-[18px]">
      <section className="grid max-w-[900px] gap-3">
        <p className="m-0 text-[0.8rem] font-bold tracking-[0.16em] text-[#d6bb67] uppercase">
          Football Example
        </p>
        <h1 className="m-0 max-w-[14ch] text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.05]">
          Pressure-testing the tactical board architecture with a concrete sport
          setup.
        </h1>
        <p className="m-0 max-w-[70ch] text-[rgba(243,239,223,0.76)]">
          This screen belongs to the example layer, not the generic React
          adapter. It composes the reusable editor and board view with
          football-flavored copy and controls.
        </p>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
        <BoardEditor
          meta={
            <>
              Active tool: <strong>{activeToolId}</strong>
              {activeTool ? ` · ${activeTool.label}` : ""}
            </>
          }
          store={store}
          title={
            <>
              <p className="m-0 text-[0.8rem] font-bold tracking-[0.16em] text-[#d6bb67] uppercase">
                Editor
              </p>
              <h2 className="m-0 leading-[1.05]">
                {footballBoardExample.metadata.name ?? "Untitled board"}
              </h2>
            </>
          }
          toolbar={
            <>
              <button
                className="cursor-pointer rounded-[14px] border border-[#d6bb6738] bg-white/6 px-3 py-2.5 text-left text-inherit"
                onClick={() => actions.setActiveTool("select")}
                type="button"
              >
                Select
              </button>
              <button
                className="cursor-pointer rounded-[14px] border border-[#d6bb6738] bg-white/6 px-3 py-2.5 text-left text-inherit"
                onClick={() => actions.setActiveTool("hand")}
                type="button"
              >
                Hand
              </button>
              <button
                className="cursor-pointer rounded-[14px] border border-[#d6bb6738] bg-white/6 px-3 py-2.5 text-left text-inherit"
                onClick={() =>
                  actions.moveObjects(selectedObjectIds, { x: 1, y: 0 })
                }
                type="button"
              >
                Nudge Selection
              </button>
            </>
          }
        />

        <BoardView
          board={footballBoardExample}
          meta={
            <>
              {footballBoardExample.surface.presetId} ·{" "}
              {footballBoardExample.objects.order.length} objects
            </>
          }
          title={
            <>
              <p className="m-0 text-[0.8rem] font-bold tracking-[0.16em] text-[#d6bb67] uppercase">
                Read-only View
              </p>
              <h2 className="m-0 leading-[1.05]">Renderer Preview</h2>
            </>
          }
        />
      </section>
    </main>
  );
}
