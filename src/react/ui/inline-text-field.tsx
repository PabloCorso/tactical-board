import * as React from "react";
import { cn } from "./misc";

const inlineTextFieldBoxClassName =
  "box-border h-7 min-w-4 max-w-full appearance-none rounded-md border px-2 py-0 text-sm leading-5 font-medium";

export type InlineTextFieldProps = Omit<
  React.ComponentPropsWithRef<"input">,
  "onChange" | "onKeyDown" | "value"
> & {
  value: string;
  onCommit: (value: string) => void;
  onCancel?: () => void;
  selectOnFocus?: boolean;
  containerClassName?: string;
  mirrorClassName?: string;
  displayClassName?: string;
};

export function InlineTextField({
  className,
  containerClassName,
  displayClassName,
  mirrorClassName,
  onBlur,
  onCancel,
  onCommit,
  onFocus,
  placeholder,
  selectOnFocus = true,
  value,
  children: _children,
  ...props
}: InlineTextFieldProps) {
  const [draftValue, setDraftValue] = React.useState(value);
  const [editing, setEditing] = React.useState(false);
  const [syncedValue, setSyncedValue] = React.useState(value);
  const cancelBlurRef = React.useRef(false);
  const skipBlurCommitRef = React.useRef(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  if (!editing && syncedValue !== value) {
    setSyncedValue(value);
    setDraftValue(value);
  }

  React.useEffect(() => {
    if (!editing) {
      return;
    }

    const input = inputRef.current;
    input?.focus();

    if (selectOnFocus) {
      input?.select();
    }
  }, [editing, selectOnFocus]);

  const commit = React.useCallback(() => {
    if (draftValue !== value) {
      onCommit(draftValue);
    }
  }, [draftValue, onCommit, value]);

  const displayValue = value || placeholder || "";
  const mirrorValue = editing ? draftValue : displayValue;
  const inputValue = editing ? draftValue : value;

  return (
    <span
      className={cn(
        "inline-grid max-w-full min-w-0 items-center overflow-visible align-middle",
        containerClassName,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          inlineTextFieldBoxClassName,
          "invisible col-start-1 row-start-1 truncate border-transparent whitespace-pre",
          mirrorClassName,
        )}
      >
        {mirrorValue || " "}
      </span>
      <input
        {...props}
        ref={inputRef}
        value={inputValue}
        placeholder={placeholder}
        readOnly={!editing || props.readOnly}
        className={cn(
          inlineTextFieldBoxClassName,
          "focus-visible:focus-ring col-start-1 row-start-1 truncate outline-hidden",
          editing
            ? "border-tb-border-default bg-tb-background-screen text-tb-text-primary"
            : "text-tb-text-primary hover:bg-tb-neutral-soft transition-interactive cursor-text border-transparent bg-transparent",
          !editing && !displayValue && "text-tb-text-secondary",
          props.disabled && "cursor-not-allowed opacity-40",
          className,
          !editing && displayClassName,
        )}
        onChange={(event) => setDraftValue(event.currentTarget.value)}
        onFocus={(event) => {
          if (!props.disabled && !props.readOnly) {
            setEditing(true);
          }

          onFocus?.(event);
        }}
        onBlur={(event) => {
          setEditing(false);

          if (cancelBlurRef.current) {
            cancelBlurRef.current = false;
            setDraftValue(value);
            onCancel?.();
          } else if (skipBlurCommitRef.current) {
            skipBlurCommitRef.current = false;
          } else if (editing) {
            commit();
          }

          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          if (
            !editing &&
            !props.disabled &&
            !props.readOnly &&
            (event.key === "Enter" || event.key === " ")
          ) {
            event.preventDefault();
            setEditing(true);
            return;
          }

          if (event.key === "Enter") {
            event.preventDefault();
            commit();
            skipBlurCommitRef.current = true;
            event.currentTarget.blur();
            return;
          }

          if (event.key === "Escape") {
            event.preventDefault();
            cancelBlurRef.current = true;
            setDraftValue(value);
            event.currentTarget.blur();
          }
        }}
      />
    </span>
  );
}
