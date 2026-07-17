import {
  ArrowCounterClockwiseIcon,
  HashStraightIcon,
  PaletteIcon,
  PlusIcon,
  TextTIcon,
} from "@phosphor-icons/react";
import { type ReactNode, useId } from "react";
import type { PlayerCaptionStyle } from "../../../../core/board/types";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
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
  BoardEditorSelectionToolbarPopover,
  BoardEditorSelectionToolbarPopoverContent,
  BoardEditorSelectionToolbarPopoverTitle,
  BoardEditorSelectionToolbarPopoverTrigger,
} from "./selection-toolbar-popover";

export type PlayerLabelSelectionControlProps = {
  customized: boolean;
  fontSize: number;
  label?: string;
  labelColor: string;
  labels: BoardEditorLabels;
  onChange: (label: string) => void;
  onReset: () => void;
  onStyleChange: (patch: { color?: string; fontSize?: number }) => void;
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
}: PlayerLabelSelectionControlProps) {
  const titleId = useId();

  return (
    <BoardEditorSelectionToolbarPopover>
      <BoardEditorSelectionToolbarPopoverTrigger
        aria-label={labels.selectionToolbar.playerLabel}
        tooltip={labels.selectionToolbar.playerLabel}
      >
        {label ? (
          <span className="flex size-6 items-center justify-center text-xs font-bold tabular-nums">
            {label.slice(0, 3)}
          </span>
        ) : (
          <HashStraightIcon />
        )}
      </BoardEditorSelectionToolbarPopoverTrigger>
      <BoardEditorSelectionToolbarPopoverContent className="w-40 min-w-0">
        <PlayerPopoverTitle
          customized={customized}
          id={titleId}
          onReset={onReset}
          resetLabel={labels.selectionToolbar.resetLabelStyle}
        >
          {labels.selectionToolbar.playerLabel}
        </PlayerPopoverTitle>
        <Input
          aria-labelledby={titleId}
          className="h-6 rounded-md px-2 text-sm font-medium md:text-sm"
          onChange={(event) => onChange(event.currentTarget.value)}
          value={label ?? ""}
        />
        <PlayerLabelFields
          labels={labels}
          value={{ color: labelColor, fontSize }}
          onChange={onStyleChange}
        />
      </BoardEditorSelectionToolbarPopoverContent>
    </BoardEditorSelectionToolbarPopover>
  );
}

export type PlayerCaptionSelectionControlProps = {
  fallbackBackgroundColor: string;
  caption: PlayerCaptionStyle;
  customized: boolean;
  labels: BoardEditorLabels;
  onChange: (caption: PlayerCaptionStyle) => void;
  onReset: () => void;
  onTextChange: (text: string) => void;
  text?: string;
};

export function PlayerCaptionSelectionControl({
  caption,
  customized,
  fallbackBackgroundColor,
  labels,
  onChange,
  onReset,
  onTextChange,
  text,
}: PlayerCaptionSelectionControlProps) {
  const titleId = useId();

  return (
    <BoardEditorSelectionToolbarPopover>
      <BoardEditorSelectionToolbarPopoverTrigger
        aria-label={labels.playerAppearance.caption}
        tooltip={labels.playerAppearance.caption}
      >
        <CaptionTriggerIcon hasCaption={Boolean(text)} />
      </BoardEditorSelectionToolbarPopoverTrigger>
      <BoardEditorSelectionToolbarPopoverContent className="w-40 min-w-0">
        <PlayerPopoverTitle
          customized={customized}
          id={titleId}
          onReset={onReset}
          resetLabel={labels.selectionToolbar.resetCaptionStyle}
        >
          {labels.playerAppearance.caption}
        </PlayerPopoverTitle>
        <Input
          aria-labelledby={titleId}
          className="h-6 rounded-md px-2 text-sm font-medium md:text-sm"
          onChange={(event) => onTextChange(event.currentTarget.value)}
          value={text ?? ""}
        />
        <PlayerCaptionFields
          caption={caption}
          fallbackBackgroundColor={fallbackBackgroundColor}
          labels={labels}
          onChange={onChange}
        />
      </BoardEditorSelectionToolbarPopoverContent>
    </BoardEditorSelectionToolbarPopover>
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
  value,
}: PlayerAppearanceSelectionControlProps) {
  return (
    <BoardEditorSelectionToolbarPopover>
      <BoardEditorSelectionToolbarPopoverTrigger
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
            size={24}
            className="rounded-md"
          />
        ) : (
          <PaletteIcon className="size-5" />
        )}
      </BoardEditorSelectionToolbarPopoverTrigger>
      <BoardEditorSelectionToolbarPopoverContent className="w-48 min-w-0 gap-3">
        <PlayerPopoverTitle
          customized={customized}
          onReset={onReset}
          resetLabel={labels.selectionToolbar.resetAppearanceStyle}
        >
          {labels.playerAppearance.appearance}
        </PlayerPopoverTitle>
        <PlayerAppearanceFields
          appearanceRenderers={appearanceRenderers}
          appearances={appearances}
          labels={labels}
          value={value}
          onChange={onChange}
        />
      </BoardEditorSelectionToolbarPopoverContent>
    </BoardEditorSelectionToolbarPopover>
  );
}

function CaptionTriggerIcon({ hasCaption }: { hasCaption: boolean }) {
  return (
    <span className="relative flex size-6 items-center justify-center">
      <TextTIcon className="size-6" />
      {!hasCaption ? (
        <PlusIcon
          weight="bold"
          className="absolute -right-0.5 bottom-0.5 size-2.5 rounded-full p-px"
        />
      ) : null}
    </span>
  );
}

type PlayerPopoverTitleProps = {
  children: ReactNode;
  customized: boolean;
  id?: string;
  onReset: () => void;
  resetLabel: string;
};

function PlayerPopoverTitle({
  children,
  customized,
  id,
  onReset,
  resetLabel,
}: PlayerPopoverTitleProps) {
  return (
    <div className="flex min-h-6 items-center justify-between gap-3">
      <BoardEditorSelectionToolbarPopoverTitle id={id}>
        {children}
      </BoardEditorSelectionToolbarPopoverTitle>
      {customized ? (
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={resetLabel}
          title={resetLabel}
          className="text-tb-text-secondary size-5 rounded-sm"
          iconBefore={<ArrowCounterClockwiseIcon />}
          iconSize="xs"
          onClick={onReset}
        />
      ) : null}
    </div>
  );
}
