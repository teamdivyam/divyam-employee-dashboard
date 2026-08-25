/* eslint-disable react/prop-types */
import { Info } from "lucide-react";
import DataPagination from "@components/components/DataPagination";
import ExpenseFilters from "../ExpenseFilters";
import ExpenseTable from "../ExpenseTable";
import { PAGE_SIZE } from "../expense.constants";

export default function ExpenseListTabShell({
  tabValue,
  expenses,
  loading,
  error,
  onRetry,
  onView,
  filters,
  onFilterChange,
  page,
  totalRows,
  onPageChange,
}) {
  return (
    <>
      <ExpenseFilters filters={filters} onChange={onFilterChange} />
      <ExpenseTable activeTab={tabValue} expenses={expenses} loading={loading} error={error} onRetry={onRetry} onView={onView} />
      <DataPagination
        state={{ page, totalRows, rowsPerPage: PAGE_SIZE }}
        onPageChange={onPageChange}
        itemLabel="claims"
        className="[&>div:first-child]:text-[11px] [&>div:last-child>span]:text-[11px]"
      />
      <div className="m-3 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] leading-4 text-primary">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>Only approved expenses paid personally are eligible for reimbursement. Company-paid expenses are recorded but do not generate an employee reimbursement.</p>
      </div>
    </>
  );
}
