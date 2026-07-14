import {
  ArrowCounterClockwiseIcon,
  HashStraightIcon,
  PaletteIcon,
  TextTIcon,
} from "@phosphor-icons/react";
import type { PlayerCaptionStyle } from "../../../../core/board/types";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { PopoverTitle } from "../../../ui/popover";
import type {
  BoardThemePlayerAppearanceDefinition,
  PlayerAppearanceRendererRegistry,
} from "../../theme/board-theme";
import { PlayerAppearanceFields } from "../../player/player-appearance-fields";
import { PlayerAppearancePreview } from "../../player/player-appearance-preview";
import type { PlayerAppearanceFieldValue } from "../../player/player-appearance-utils";
import { PlayerCaptionFields } from "../../player/player-caption-fields";
import { PlayerLabelFields } from "../../player/player-label-fields";
import type { BoardEditorLabels } from "../board-editor-labels";
import {
  BoardEditorToolbarPopover,
  BoardEditorToolbarPopoverContent,
  BoardEditorToolbarPopoverTrigger,
} from "../toolbar/editor-toolbar";

export type PlayerLabelSelectionControlProps = {
  customized: boolean;
  fontSize: number;
  label?: string;
  labelColor: string;
  labels: BoardEditorLabels;
  onChange: (label: string) => void;
  onReset: () => void;
  onStyleChange: (patch: { color?: string; fontSize?: number }) => void;
  teamName?: string;
};

export function PlayerLabelSelectionControl({
  customized,
  fontSize,
  label,
  labelColor,
  labels,
  onChange,
  onReset,
  onStyleChange,
  teamName,
}: PlayerLabelSelectionControlProps) {
  return (
    <BoardEditorToolbarPopover>
      <BoardEditorToolbarPopoverTrigger
        aria-label={labels.selectionToolbar.playerLabel}
        tooltip={labels.selectionToolbar.playerLabel}
      >
        {label ? (
          <span className="flex size-6 items-center justify-center text-xs font-semibold tabular-nums">
            {label.slice(0, 3)}
          </span>
        ) : (
          <HashStraightIcon />
        )}
      </BoardEditorToolbarPopoverTrigger>
      <BoardEditorToolbarPopoverContent
        className="w-60 min-w-0"
        side="top"
        sideOffset={8}
      >
        <div className="flex flex-col gap-3 p-1">
          <PlayerPopoverHeader
            customized={customized}
            title={labels.selectionToolbar.playerLabel}
            teamName={teamName}
            labels={labels}
          />
          <label className="flex flex-col gap-0.5">
            <span className="text-tb-text-secondary text-xs font-medium">
              {labels.selectionToolbar.labelText}
            </span>
            <Input
              aria-label={labels.selectionToolbar.labelText}
              className="h-8 rounded-md px-2 text-sm font-medium md:text-sm"
              onChange={(event) => onChange(event.currentTarget.value)}
              value={label ?? ""}
            />
          </label>
          <PlayerLabelFields
            labels={labels}
            value={{ color: labelColor, fontSize }}
            onChange={onStyleChange}
          />
          {customized ? (
            <ResetStyleButton
              label={labels.selectionToolbar.resetLabelStyle}
              onClick={onReset}
            />
          ) : null}
        </div>
      </BoardEditorToolbarPopoverContent>
    </BoardEditorToolbarPopover>
  );
}

export type PlayerCaptionSelectionControlProps = {
  caption: PlayerCaptionStyle;
  customized: boolean;
  labels: BoardEditorLabels;
  onChange: (caption: PlayerCaptionStyle) => void;
  onReset: () => void;
  onTextChange: (text: string) => void;
  teamName?: string;
  text?: string;
};

export function PlayerCaptionSelectionControl({
  caption,
  customized,
  labels,
  onChange,
  onReset,
  onTextChange,
  teamName,
  text,
}: PlayerCaptionSelectionControlProps) {
  return (
    <BoardEditorToolbarPopover>
      <BoardEditorToolbarPopoverTrigger
        aria-label={labels.playerAppearance.caption}
        tooltip={labels.playerAppearance.caption}
      >
        <TextTIcon />
      </BoardEditorToolbarPopoverTrigger>
      <BoardEditorToolbarPopoverContent
        className="w-64 min-w-0"
        side="top"
        sideOffset={8}
      >
        <div className="flex flex-col gap-3 p-1">
          <PlayerPopoverHeader
            customized={customized}
            title={labels.playerAppearance.caption}
            teamName={teamName}
            labels={labels}
          />
          <label className="flex flex-col gap-0.5">
            <span className="text-tb-text-secondary text-xs font-medium">
              {labels.selectionToolbar.captionText}
            </span>
            <Input
              aria-label={labels.selectionToolbar.captionText}
              className="h-8 rounded-md px-2 text-sm font-medium md:text-sm"
              onChange={(event) => onTextChange(event.currentTarget.value)}
              value={text ?? ""}
            />
          </label>
          <PlayerCaptionFields
            caption={caption}
            labels={labels}
            onChange={onChange}
          />
          {customized ? (
            <ResetStyleButton
              label={labels.selectionToolbar.resetCaptionStyle}
              onClick={onReset}
            />
          ) : null}
        </div>
      </BoardEditorToolbarPopoverContent>
    </BoardEditorToolbarPopover>
  );
}

export type PlayerAppearanceSelectionControlProps = {
  appearance?: BoardThemePlayerAppearanceDefinition;
  appearanceRenderers?: PlayerAppearanceRendererRegistry;
  appearances?: BoardThemePlayerAppearanceDefinition[];
  customized: boolean;
  labels: BoardEditorLabels;
  onChange: (patch: Partial<PlayerAppearanceFieldValue>) => void;
  onReset: () => void;
  teamName?: string;
  value: PlayerAppearanceFieldValue;
};

export function PlayerAppearanceSelectionControl({
  appearance,
  appearanceRenderers,
  appearances,
  customized,
  labels,
  onChange,
  onReset,
  teamName,
  value,
}: PlayerAppearanceSelectionControlProps) {
  return (
    <BoardEditorToolbarPopover>
      <BoardEditorToolbarPopoverTrigger
        aria-label={labels.playerAppearance.appearance}
        tooltip={labels.playerAppearance.appearance}
      >
        {appearance ? (
          <PlayerAppearancePreview
            appearanceRenderers={appearanceRenderers}
            appearance={appearance}
            asset={value.asset}
            color={value.color}
            colors={value.colors}
            options={value.options}
            className="size-6 rounded-md"
          />
        ) : (
          <PaletteIcon />
        )}
      </BoardEditorToolbarPopoverTrigger>
      <BoardEditorToolbarPopoverContent
        className="w-72 min-w-0"
        side="top"
        sideOffset={8}
      >
        <div className="flex flex-col gap-2">
          <div className="px-2 pt-1">
            <PlayerPopoverHeader
              customized={customized}
              title={labels.playerAppearance.appearance}
              teamName={teamName}
              labels={labels}
            />
          </div>
          <PlayerAppearanceFields
            appearanceRenderers={appearanceRenderers}
            appearances={appearances}
            labels={labels}
            value={value}
            onChange={onChange}
          />
          {customized ? (
            <div className="px-1 pb-1">
              <ResetStyleButton
                label={labels.selectionToolbar.resetAppearanceStyle}
                onClick={onReset}
              />
            </div>
          ) : null}
        </div>
      </BoardEditorToolbarPopoverContent>
    </BoardEditorToolbarPopover>
  );
}

type PlayerPopoverHeaderProps = {
  customized: boolean;
  labels: BoardEditorLabels;
  title: string;
  teamName?: string;
};

function PlayerPopoverHeader({
  customized,
  labels,
  title,
  teamName,
}: PlayerPopoverHeaderProps) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <PopoverTitle className="text-sm font-semibold">{title}</PopoverTitle>
        <p className="text-tb-text-tertiary truncate text-xs">
          {customized
            ? labels.selectionToolbar.customPlayerStyle
            : teamName
              ? labels.selectionToolbar.usingTeamStyle(teamName)
              : labels.selectionToolbar.usingDefaultStyle}
        </p>
      </div>
      {customized ? (
        <span className="bg-tb-accent mt-1 size-1.5 shrink-0 rounded-full" />
      ) : null}
    </div>
  );
}

function ResetStyleButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-tb-text-secondary h-7 justify-start px-2 text-xs"
      iconBefore={<ArrowCounterClockwiseIcon />}
      iconSize="sm"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
