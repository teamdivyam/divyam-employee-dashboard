/* eslint-disable react/prop-types */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";

export default function ExpenseFilterSelect({
  ariaLabel,
  value,
  onValueChange,
  options,
  allValue,
  allLabel,
  disabled = false,
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="h-8 w-full text-[10px] sm:w-[175px]" aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option} className="text-xs">
            {option === allValue ? allLabel : option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

