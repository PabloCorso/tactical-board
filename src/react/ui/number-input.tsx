import * as React from "react";
import { Input, type InputProps } from "./input";

export type NumberInputProps = Omit<
  InputProps,
  "defaultValue" | "onChange" | "type" | "value"
> & {
  value: number;
  onValueChange: (value: number) => void;
};

export function NumberInput({
  value,
  onValueChange,
  ...props
}: NumberInputProps) {
  const [editableValue, setEditableValue] = React.useState(String(value));
  const [previousValue, setPreviousValue] = React.useState(value);

  if (value !== previousValue) {
    setPreviousValue(value);
    setEditableValue(
      editableValue !== "" && Number(editableValue) === value
        ? editableValue
        : String(value),
    );
  }

  return (
    <Input
      {...props}
      type="number"
      value={editableValue}
      onChange={(event) => {
        const nextEditableValue = event.currentTarget.value;
        setEditableValue(nextEditableValue);

        const nextValue = event.currentTarget.valueAsNumber;
        if (nextEditableValue !== "" && !Number.isNaN(nextValue)) {
          onValueChange(nextValue);
        }
      }}
    />
  );
}
