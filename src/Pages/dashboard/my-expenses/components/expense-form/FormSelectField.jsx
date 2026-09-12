/* eslint-disable react/prop-types */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import CompactField from "./CompactField";

export default function FormSelectField({ label, required, value, placeholder, options, error, onValueChange }) {
  return (
    <CompactField label={label} required={required} error={error}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-label={label} className={`h-8 text-[11px] ${error ? "border-destructive" : ""}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option} className="text-[11px]">{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CompactField>
  );
}

