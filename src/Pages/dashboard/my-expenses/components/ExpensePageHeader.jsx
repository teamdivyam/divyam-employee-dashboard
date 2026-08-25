/* eslint-disable react/prop-types */
import { Download, Loader2, Plus } from "lucide-react";
import { Button } from "@components/components/ui/button";
import MonthFilterControl from "@components/components/MonthFilterControl";

export default function ExpensePageHeader({
  monthFilters,
  onMonthChange,
  downloadDisabled,
  downloading,
  onDownload,
  onAddExpense,
}) {
  return (
    <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">My Expenses</h1>
      <div className="flex flex-wrap items-center gap-2">
        <div className="[&>div>span]:text-[13px]">
          <MonthFilterControl filters={monthFilters} onFilterChange={onMonthChange} />
        </div>
        <Button type="button" variant="outline" className="h-8 gap-1.5 px-3 text-[10px]" disabled={downloadDisabled || downloading} onClick={onDownload}>
          {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Download Statement
        </Button>
        <Button type="button" className="h-8 gap-1.5 px-3 text-[10px]" onClick={onAddExpense}>
          <Plus className="h-3.5 w-3.5" />
          Add Expense
        </Button>
      </div>
    </header>
  );
}
