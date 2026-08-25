/* eslint-disable react/prop-types */
import { Search } from "lucide-react";
import { Input } from "@components/components/ui/input";
import ExpenseFilterSelect from "./ExpenseFilterSelect";
import {
  CATEGORY_OPTIONS,
  EXPENSE_FOR_OPTIONS,
  PAYMENT_SOURCE_OPTIONS,
} from "./expense.constants";

export default function ExpenseFilters({ filters, onChange }) {
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
        <ExpenseFilterSelect ariaLabel="Filter by expense for" value={filters.expenseFor} onValueChange={(value) => onChange("expenseFor", value)} options={EXPENSE_FOR_OPTIONS} allValue="All Expense" allLabel="All Expense" />
        <ExpenseFilterSelect ariaLabel="Filter by payment source" value={filters.paymentSource} onValueChange={(value) => onChange("paymentSource", value)} options={PAYMENT_SOURCE_OPTIONS} allValue="All Payment Source" allLabel="All Payment Sources" />
        <ExpenseFilterSelect ariaLabel="Filter by category" value={filters.category} onValueChange={(value) => onChange("category", value)} options={CATEGORY_OPTIONS} allValue="All Category" allLabel="All Categories" />
      </div>
    </div>
  );
}
