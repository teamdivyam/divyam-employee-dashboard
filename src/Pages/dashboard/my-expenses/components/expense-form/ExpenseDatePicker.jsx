/* eslint-disable react/prop-types */
import { Input } from "@components/components/ui/input";

export default function ExpenseDatePicker({ value, error, disabled, onChange, onBlur }) {
  return (
    <Input
      type="date"
      aria-label="Expense Date"
      aria-invalid={Boolean(error)}
      value={value || ""}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      className={`expense-native-date h-8 min-w-0 px-2.5 ${error ? "border-destructive" : ""}`}
    />
  );
}
