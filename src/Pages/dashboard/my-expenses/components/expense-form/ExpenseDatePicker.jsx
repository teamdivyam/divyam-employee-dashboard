/* eslint-disable react/prop-types */
import { CalendarDays } from "lucide-react";
import { Button } from "@components/components/ui/button";
import { Calendar } from "@components/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@components/components/ui/popover";
import { expenseDateFromValue, expenseDateToValue, formatExpenseDateValue } from "../expense.utils";

export default function ExpenseDatePicker({ value, error, onChange }) {
  const selectedDate = expenseDateFromValue(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label="Expense Date"
          className={`h-8 w-full justify-start gap-2 px-2.5 text-left text-[11px] font-normal ${error ? "border-destructive" : ""}`}
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value ? formatExpenseDateValue(value) : "Select expense date"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onChange(expenseDateToValue(date))}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

