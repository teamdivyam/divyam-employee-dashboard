/* eslint-disable react/prop-types */
import { Search } from "lucide-react";
import { Input } from "@components/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import {
  CATEGORY_OPTIONS,
  EXPENSE_FOR_OPTIONS,
  PAYMENT_SOURCE_OPTIONS,
} from "./expense.constants";

export default function ExpenseFilters({ filters, onChange }) {
  const selectFilters = [
    {
      ariaLabel: "Filter by expense for",
      key: "expenseFor",
      options: EXPENSE_FOR_OPTIONS,
      allValue: "All Expense",
      allLabel: "All Expense",
    },
    {
      ariaLabel: "Filter by payment source",
      key: "paymentSource",
      options: PAYMENT_SOURCE_OPTIONS,
      allValue: "All Payment Source",
      allLabel: "All Payment Sources",
    },
    {
      ariaLabel: "Filter by category",
      key: "category",
      options: CATEGORY_OPTIONS,
      allValue: "All Category",
      allLabel: "All Categories",
    },
  ];

  return (
    <div className="flex flex-col gap-2 border-b border-border p-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-[310px]">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) => onChange("search", event.target.value)}
          placeholder="Search expense, Claim ID, event or client..."
          className="h-8 pl-8 text-[9px] placeholder:text-[11px]"
          aria-label="Search expenses"
        />
      </div>
      <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-3">
        {selectFilters.map(({ ariaLabel, key, options, allValue, allLabel }) => (
          <Select key={key} value={filters[key]} onValueChange={(value) => onChange(key, value)}>
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
        ))}
      </div>
    </div>
  );
}
