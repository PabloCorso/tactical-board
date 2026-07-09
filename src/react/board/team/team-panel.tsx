import {
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import {
  CrosshairSimpleIcon,
  TrashIcon,
  UploadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  getBoardPlayerGroups,
  getPlayerGroupMemberObjects,
  isBoardPlayerGroupAutoNumberingEnabled,
} from "../../../core/board/player-groups";
import type { Board, PlayerGroup } from "../../../core/board/types";
import {
  updatePlayerObject,
  type PlayerObject,
} from "../../../core/objects/player-object";
import { parsePlayerNumericLabel } from "../../../core/tools/player-labels";
import { createToolApi } from "../../../core/editor/create-tool-api";
import type { ToolApi } from "../../../core/tools/types";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { Button } from "../../ui/button";
import { Drawer, DrawerContent } from "../../ui/drawer";
import { InlineTextField } from "../../ui/inline-text-field";
import { Input } from "../../ui/input";
import { Switch } from "../../ui/switch";
import { cn } from "../../ui/misc";
import { useMediaQuery } from "../../ui/use-media-query";
import { useBoardEditorLabels } from "../editor/board-editor-labels";
import type {
  BoardTheme,
  BoardThemeAdapters,
  BoardThemePlayerAppearanceDefinition,
} from "../theme/board-theme";
import { getThemePlayerAppearanceDefinitions } from "../theme/board-theme";
import {
  PlayerAppearanceColorFields,
  PlayerAppearanceOptionFields,
  PlayerAppearancePreview,
  PlayerCaptionStyleFields,
  getPlayerAppearanceChangePatch,
  readUploadedAsset,
  type PlayerAppearanceFieldValue,
} from "../player/player-appearance-fields";
import {
  applyPlayerGroupStylePatch,
  deletePlayerGroupCommand,
  renamePlayerGroup,
  setPlayerGroupAutoNumberingCommand,
  type PlayerGroupStylePatch,
} from "./player-team-commands";
import { useBoardEditorTeamPanel } from "./team-panel-context";

export type BoardEditorTeamPanelSectionContext = {
  board: Board;
  group: PlayerGroup;
  groupIndex: number;
  toolApi: ToolApi;
};

export type BoardEditorTeamPanelProps = {
  adapters?: BoardThemeAdapters;
  className?: string;
  theme?: Pick<BoardTheme, "playerAppearances" | "playerPresets">;
  /**
   * Extra sections for the current team, rendered between appearance and roster
   * sections. Hosts and sport layers use this to add product-specific tools
   * (for example football formations) without the panel knowing the sport.
   */
  children?: (context: BoardEditorTeamPanelSectionContext) => ReactNode;
};

const TEAM_PANEL_INSET_CLASS = "px-3";
const TEAM_PANEL_SECTION_BODY_CLASS = "flex flex-col gap-1.5 px-3 py-2";
const TEAM_PANEL_FIELD_ROW_CLASS =
  "flex min-h-7 items-center justify-between gap-2";
const TEAM_PANEL_IMAGE_APPEARANCE_ID = "image";
const TEAM_PANEL_APPEARANCE_MODE_IDS = [
  "circle",
  "football-shirt",
  TEAM_PANEL_IMAGE_APPEARANCE_ID,
];
const LEGACY_FOOTBALL_RINGED_CIRCLE_APPEARANCE_ID = "football-ringed-circle";
const CIRCLE_APPEARANCE_ID = "circle";
const LEGACY_RING_PATTERN = "ring";

/** Consistent section chrome for Team panel content, including host sections. */
export function BoardEditorTeamPanelSection({
  children,
  className,
  contentClassName,
  title,
}: PropsWithChildren<{
  className?: string;
  contentClassName?: string;
  title?: string;
}>) {
  return (
    <section className={cn("border-tb-border-default border-t", className)}>
      <div className={cn(TEAM_PANEL_SECTION_BODY_CLASS, contentClassName)}>
        {title ? (
          <h3 className="text-tb-text-secondary m-0 text-xs leading-4 font-semibold">
            {title}
          </h3>
        ) : null}
        {children}
      </div>
    </section>
  );
}

function getTeamPanelAppearanceModeId(appearanceId: string | undefined) {
  if (!appearanceId) {
    return CIRCLE_APPEARANCE_ID;
  }

  if (appearanceId === LEGACY_FOOTBALL_RINGED_CIRCLE_APPEARANCE_ID) {
    return CIRCLE_APPEARANCE_ID;
  }

  return appearanceId;
}

function getTeamPanelStyleValue(
  group: PlayerGroup,
): PlayerAppearanceFieldValue {
  const appearanceId = getTeamPanelAppearanceModeId(group.style.appearanceId);
  const options =
    group.style.appearanceId === LEGACY_FOOTBALL_RINGED_CIRCLE_APPEARANCE_ID
      ? { ...group.style.options, pattern: LEGACY_RING_PATTERN }
      : group.style.options;

  return {
    color: group.style.color ?? "#111827",
    colors: group.style.colors,
    fontSize: group.style.fontSize,
    appearanceId,
    options,
    asset: group.style.asset,
    caption: group.style.caption,
  };
}

function getTeamAppearanceChangePatch({
  appearance,
  current,
}: {
  appearance: BoardThemePlayerAppearanceDefinition;
  current: PlayerAppearanceFieldValue;
}): Partial<PlayerAppearanceFieldValue> {
  const colors: Record<string, string> = {};
  const options: Record<string, unknown> = {};

  for (const role of appearance.colors ?? []) {
    const currentValue = current.colors?.[role.id];

    if (currentValue) {
      colors[role.id] = currentValue;
    }
  }

  for (const option of appearance.options ?? []) {
    const currentValue = current.options?.[option.id];
    const allowedByChoices =
      !option.choices ||
      option.choices.some((choice) => choice.value === currentValue);

    if (currentValue !== undefined && allowedByChoices) {
      options[option.id] = currentValue;
    }
  }

  const patch = getPlayerAppearanceChangePatch(appearance);
  const nextPatch = Object.keys(options).length
    ? {
        ...patch,
        options: {
          ...(patch.options ?? {}),
          ...options,
        },
      }
    : patch;

  return Object.keys(colors).length > 0
    ? {
        ...nextPatch,
        colors: {
          ...(nextPatch.colors ?? {}),
          ...colors,
        },
      }
    : nextPatch;
}

function normalizeLegacyRingedCirclePatch({
  current,
  patch,
}: {
  current: PlayerGroup;
  patch: Partial<PlayerAppearanceFieldValue>;
}): Partial<PlayerAppearanceFieldValue> {
  if (
    current.style.appearanceId !==
      LEGACY_FOOTBALL_RINGED_CIRCLE_APPEARANCE_ID ||
    patch.appearanceId
  ) {
    return patch;
  }

  return {
    appearanceId: CIRCLE_APPEARANCE_ID,
    options: {
      pattern: LEGACY_RING_PATTERN,
      ...current.style.options,
      ...patch.options,
    },
    ...patch,
  };
}

function getVisibleColorAppearance({
  appearance,
  value,
}: {
  appearance: BoardThemePlayerAppearanceDefinition;
  value: PlayerAppearanceFieldValue;
}) {
  const selectedPattern =
    value.options?.pattern ??
    appearance.options?.find((option) => option.id === "pattern")?.defaultValue;

  if (selectedPattern === "solid") {
    return {
      ...appearance,
      colors: [],
    };
  }

  return appearance;
}

function TeamAppearanceModeSelector({
  appearanceRenderers,
  appearances,
  label,
  uploadImageLabel,
  value,
  onChange,
}: {
  appearanceRenderers?: BoardThemeAdapters["playerAppearanceRenderers"];
  appearances: BoardThemePlayerAppearanceDefinition[];
  label: string;
  uploadImageLabel: string;
  value: PlayerAppearanceFieldValue;
  onChange: (patch: Partial<PlayerAppearanceFieldValue>) => void;
}) {
  const modes = TEAM_PANEL_APPEARANCE_MODE_IDS.map((id) =>
    appearances.find((appearance) => appearance.id === id),
  ).filter((appearance): appearance is BoardThemePlayerAppearanceDefinition =>
    Boolean(appearance),
  );

  const buttonClassName = (active: boolean) =>
    cn(
      "border-tb-border-default bg-tb-background-screen hover:bg-tb-neutral-soft focus-visible:focus-ring transition-interactive box-border flex h-12 min-w-0 cursor-pointer items-center justify-center rounded-md border p-1 outline-hidden",
      active && "border-tb-accent ring-tb-accent/30 ring-2",
    );

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid grid-cols-3 gap-1.5"
    >
      {modes.map((appearance) => {
        const active = value.appearanceId === appearance.id;

        if (appearance.id === TEAM_PANEL_IMAGE_APPEARANCE_ID) {
          return (
            <label
              key={appearance.id}
              role="radio"
              aria-checked={active}
              aria-label={uploadImageLabel}
              title={uploadImageLabel}
              tabIndex={0}
              className={buttonClassName(active)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.currentTarget
                    .querySelector<HTMLInputElement>("input")
                    ?.click();
                }
              }}
            >
              {active && value.asset?.src ? (
                <span
                  className="size-full rounded-sm bg-cover bg-center"
                  style={{ backgroundImage: `url("${value.asset.src}")` }}
                />
              ) : (
                <UploadSimpleIcon className="text-tb-text-secondary size-4 shrink-0" />
              )}
              <input
                type="file"
                accept="image/*,.svg"
                className="sr-only"
                tabIndex={-1}
                aria-label={uploadImageLabel}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];

                  if (file) {
                    readUploadedAsset(file, (asset) =>
                      onChange(
                        getPlayerAppearanceChangePatch(appearance, {
                          asset,
                        }),
                      ),
                    );
                  }

                  event.currentTarget.value = "";
                }}
              />
            </label>
          );
        }

        return (
          <button
            key={appearance.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={appearance.label}
            title={appearance.label}
            className={buttonClassName(active)}
            onClick={() =>
              onChange(
                getTeamAppearanceChangePatch({ appearance, current: value }),
              )
            }
          >
            <PlayerAppearancePreview
              appearanceRenderers={appearanceRenderers}
              asset={value.asset}
              appearance={appearance}
              color={value.color}
              colors={value.colors}
              options={value.options}
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * A non-modal editing surface for the current team: appearance presets, colors,
 * numbering, sizing, caption defaults, roster, and host-provided sections.
 * Docks to the right on large screens and becomes a bottom drawer on small
 * ones, so the board stays visible while editing.
 */
export function BoardEditorTeamPanel({
  adapters,
  className,
  theme,
  children,
}: BoardEditorTeamPanelProps) {
  const labels = useBoardEditorLabels();
  const teamPanel = useBoardEditorTeamPanel();
  const editorStore = useBoardEditorContext();
  const toolApi = useMemo(() => createToolApi(editorStore), [editorStore]);
  const board = useBoardEditorStore(editorStore, (state) => state.board);
  const isSmallScreen = useMediaQuery("(max-width: 640px)");

  const groups = getBoardPlayerGroups(board);
  const activeGroup =
    groups.find((group) => group.id === teamPanel.activeGroupId) ?? groups[0];

  if (!activeGroup) {
    return null;
  }

  const content = (
    <>
      <div
        className={cn(
          TEAM_PANEL_INSET_CLASS,
          "flex min-h-10 items-center gap-2 py-1.5",
        )}
      >
        <h2 className="text-tb-text-secondary m-0 min-w-0 flex-1 truncate text-sm font-medium">
          {labels.teamPanel.title}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={labels.teamPanel.close}
          className="text-tb-text-secondary h-7 w-7 shrink-0 rounded-md"
          iconBefore={<XIcon />}
          iconSize="xs"
          onClick={teamPanel.closeTeamPanel}
        />
      </div>

      <TeamPanelBody
        key={activeGroup.id}
        adapters={adapters}
        board={board}
        canDelete={groups.length > 1}
        group={activeGroup}
        groupIndex={groups.findIndex((group) => group.id === activeGroup.id)}
        labels={labels}
        theme={theme}
        toolApi={toolApi}
        onLocatePlayer={isSmallScreen ? teamPanel.closeTeamPanel : undefined}
      >
        {children}
      </TeamPanelBody>
    </>
  );

  if (isSmallScreen) {
    return (
      <Drawer
        open={teamPanel.open}
        onOpenChange={(open) => {
          if (!open) {
            teamPanel.closeTeamPanel();
          }
        }}
        swipeDirection="down"
        modal={false}
      >
        <DrawerContent
          aria-label={labels.teamPanel.title}
          showBackdrop={false}
          popupClassName={cn(
            "pointer-events-auto flex flex-col shadow-lg data-[swipe-direction=down]:max-h-[65dvh]",
            className,
          )}
          className="flex min-h-0 flex-1 flex-col"
        >
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  if (!teamPanel.open) {
    return null;
  }

  return (
    <aside
      aria-label={labels.teamPanel.title}
      className={cn(
        "bg-tb-background-surface pointer-events-auto absolute top-4 right-4 z-10 flex max-h-[calc(100dvh-2rem)] w-72 flex-col overflow-hidden rounded-xl shadow-lg",
        className,
      )}
    >
      {content}
    </aside>
  );
}

function TeamPanelBody({
  adapters,
  board,
  canDelete,
  children,
  group,
  groupIndex,
  labels,
  theme,
  toolApi,
  onLocatePlayer,
}: {
  adapters?: BoardThemeAdapters;
  board: Board;
  canDelete: boolean;
  group: PlayerGroup;
  groupIndex: number;
  labels: ReturnType<typeof useBoardEditorLabels>;
  theme?: Pick<BoardTheme, "playerAppearances" | "playerPresets">;
  toolApi: ToolApi;
  onLocatePlayer?: () => void;
  children?: BoardEditorTeamPanelProps["children"];
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const members = [...getPlayerGroupMemberObjects(board, group.id)].sort(
    (a, b) => {
      const aLabel = parsePlayerNumericLabel(a.props.label);
      const bLabel = parsePlayerNumericLabel(b.props.label);

      if (aLabel !== undefined && bLabel !== undefined) {
        return aLabel - bLabel;
      }

      return aLabel !== undefined ? -1 : bLabel !== undefined ? 1 : 0;
    },
  );
  const appearances = getThemePlayerAppearanceDefinitions(theme);
  const selectedAppearance =
    appearances.find(
      (appearance) =>
        appearance.id ===
        getTeamPanelAppearanceModeId(group.style.appearanceId),
    ) ?? appearances[0];
  const styleValue = getTeamPanelStyleValue(group);
  const showAppearanceControls =
    selectedAppearance.id !== TEAM_PANEL_IMAGE_APPEARANCE_ID;
  const colorAppearance = getVisibleColorAppearance({
    appearance: selectedAppearance,
    value: styleValue,
  });
  const updateGroupStyle = (patch: Partial<PlayerAppearanceFieldValue>) => {
    applyPlayerGroupStylePatch(
      toolApi,
      group.id,
      normalizeLegacyRingedCirclePatch({
        current: group,
        patch,
      }) as PlayerGroupStylePatch,
    );
  };
  const updateMember = (
    member: PlayerObject,
    input: Parameters<typeof updatePlayerObject>[1],
  ) => {
    toolApi.updateObjects([member.id], (object) =>
      updatePlayerObject(object as PlayerObject, input),
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-1">
      <BoardEditorTeamPanelSection
        className="border-t-0"
        contentClassName="pt-1"
      >
        <InlineTextField
          value={group.name ?? ""}
          aria-label={labels.teamPanel.teamName}
          placeholder={labels.teamPanel.teamName}
          containerClassName="min-w-0 w-full"
          className="w-full max-w-full text-sm font-medium"
          mirrorClassName="w-full text-sm font-medium"
          onCommit={(name) => renamePlayerGroup(toolApi, group.id, name)}
        />
        <div className={TEAM_PANEL_FIELD_ROW_CLASS}>
          <span className="text-tb-text-secondary text-xs font-medium">
            {labels.teamPanel.autoNumbering}
          </span>
          <Switch
            checked={isBoardPlayerGroupAutoNumberingEnabled(group)}
            aria-label={labels.teamPanel.autoNumbering}
            onCheckedChange={(checked) =>
              setPlayerGroupAutoNumberingCommand(toolApi, group.id, checked)
            }
          />
        </div>
        <div className={TEAM_PANEL_FIELD_ROW_CLASS}>
          <span className="text-tb-text-secondary text-xs font-medium">
            {labels.teamPanel.playerSize}
          </span>
          <Input
            type="number"
            min={4}
            step={1}
            aria-label={labels.teamPanel.playerSize}
            className="h-7 rounded-md px-2 text-sm md:text-sm"
            wrapperProps={{ className: "w-20" }}
            value={group.style.size ?? ""}
            onChange={(event) => {
              const size = Number(event.currentTarget.value);

              if (Number.isFinite(size) && size > 0) {
                applyPlayerGroupStylePatch(toolApi, group.id, { size });
              }
            }}
          />
        </div>
      </BoardEditorTeamPanelSection>

      <BoardEditorTeamPanelSection title={labels.teamPanel.kit}>
        <TeamAppearanceModeSelector
          appearanceRenderers={adapters?.playerAppearanceRenderers}
          label={labels.teamPanel.kit}
          appearances={appearances}
          uploadImageLabel={labels.teamPanel.uploadImage}
          value={styleValue}
          onChange={updateGroupStyle}
        />
        {showAppearanceControls ? (
          <>
            <PlayerAppearanceOptionFields
              appearance={selectedAppearance}
              value={styleValue}
              onChange={updateGroupStyle}
            />
            <PlayerAppearanceColorFields
              appearance={colorAppearance}
              labels={labels}
              value={styleValue}
              onChange={updateGroupStyle}
            />
          </>
        ) : null}
      </BoardEditorTeamPanelSection>

      {children?.({ board, group, groupIndex, toolApi })}

      <BoardEditorTeamPanelSection title={labels.teamPanel.roster}>
        {members.length === 0 ? (
          <p className="text-tb-text-secondary m-0 text-xs">
            {labels.teamPanel.rosterEmpty}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-1.5">
                <Input
                  aria-label={labels.teamPanel.playerNumber}
                  className="h-7 rounded-md px-1.5 text-center text-sm md:text-sm"
                  wrapperProps={{ className: "w-10 shrink-0" }}
                  value={member.props.label ?? ""}
                  onChange={(event) =>
                    updateMember(member, { label: event.currentTarget.value })
                  }
                />
                <Input
                  aria-label={labels.teamPanel.playerName}
                  className="h-7 rounded-md px-2 text-sm md:text-sm"
                  wrapperProps={{ className: "min-w-0 flex-1" }}
                  value={member.props.caption?.text ?? ""}
                  onChange={(event) =>
                    updateMember(member, {
                      caption: {
                        ...member.props.caption,
                        text: event.currentTarget.value,
                      },
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={labels.teamPanel.selectPlayerOnBoard}
                  className="text-tb-text-secondary h-7 w-7 shrink-0 rounded-md"
                  iconBefore={<CrosshairSimpleIcon />}
                  iconSize="xs"
                  onClick={() => {
                    toolApi.resetTool();
                    toolApi.setSelectedObjectIds([member.id]);
                    onLocatePlayer?.();
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </BoardEditorTeamPanelSection>

      <details className="border-tb-border-default border-t">
        <summary
          className={cn(
            TEAM_PANEL_INSET_CLASS,
            "text-tb-text-secondary cursor-pointer py-2 text-xs leading-4 font-semibold select-none",
          )}
        >
          {labels.teamPanel.captionDefaults}
        </summary>
        <div
          className={cn(TEAM_PANEL_INSET_CLASS, "flex flex-col gap-1.5 pb-2")}
        >
          <PlayerCaptionStyleFields
            caption={group.style.caption ?? {}}
            labels={labels}
            onChange={(caption) => updateGroupStyle({ caption })}
          />
        </div>
      </details>

      {canDelete ? (
        confirmingDelete ? (
          <div
            className={cn(
              TEAM_PANEL_INSET_CLASS,
              "border-tb-border-default flex items-center justify-between gap-2 border-t py-2",
            )}
          >
            <span className="text-tb-text-secondary min-w-0 flex-1 text-xs">
              {labels.teamPanel.confirmDeleteTeam(members.length)}
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                deletePlayerGroupCommand(toolApi, group.id);
                setConfirmingDelete(false);
              }}
            >
              {labels.selectionActions.delete}
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              TEAM_PANEL_INSET_CLASS,
              "border-tb-border-default border-t py-2",
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              className="text-tb-danger -mx-1 justify-start gap-2 px-1.5"
              iconBefore={<TrashIcon />}
              iconSize="sm"
              onClick={() => setConfirmingDelete(true)}
            >
              {labels.teamPanel.deleteTeam}
            </Button>
          </div>
        )
      ) : null}
    </div>
  );
}
