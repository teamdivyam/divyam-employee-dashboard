/* eslint-disable react/prop-types */
import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MIN_MONTH = new Date(2026, 6, 1);

export function MonthFilterControl({ filters, onFilterChange }) {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const selectedMonth = new Date(
    filters.year,
    filters.month === "All" ? now.getMonth() : filters.month - 1,
    1,
  );
  const isPreviousDisabled = selectedMonth <= MIN_MONTH;
  const isNextDisabled = selectedMonth >= currentMonth;

  const label = useMemo(() => {
    if (filters.month === "All") return `All ${filters.year}`;

    return new Date(filters.year, filters.month - 1, 1).toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  }, [filters.month, filters.year]);

  const shiftMonth = (direction) => {
    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + direction, 1);

    if (date < MIN_MONTH || date > currentMonth) return;

    onFilterChange((current) => ({
      ...current,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    }));
  };

  return (
    <div className="flex h-8 overflow-hidden rounded-md border border-border bg-secondary text-secondary-foreground text-xs">
      <button
        type="button"
        onClick={() => shiftMonth(-1)}
        disabled={isPreviousDisabled}
        className="grid w-8 place-items-center text-secondary-foreground transition-colors hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className="grid min-w-[104px] place-items-center border-x border-border px-3 text-xs font-medium text-secondary-foreground">
        {label}
      </span>
      <button
        type="button"
        onClick={() => shiftMonth(1)}
        disabled={isNextDisabled}
        className="grid w-8 place-items-center text-secondary-foreground transition-colors hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Next month"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default MonthFilterControl;
