/* eslint-disable react/prop-types */
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@components/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/components/ui/table";
import {
  displayText, formatCurrency, formatDate, formatOptionalCurrency, formatTime,
  getActionLabel, getAdjustment, getAdvanceId, getErrorMessage,
  getRecommendedAmount, hasApprovedAmount,
} from "./expense.utils";

export default function ExpenseTable({ activeTab, expenses, loading, error, onRetry, onView, onEdit }) {
  const isDraftTab = activeTab === "drafts";
  const isPendingReviewTab = activeTab === "pending-review";
  const columnCount = isDraftTab ? 7 : isPendingReviewTab ? 8 : 9;

  return (
    <Table>
      <TableHeader className="bg-muted/45">
        <TableRow className="hover:bg-muted/45">
          <TableHead className="min-w-[185px] px-3 text-[11px]">Expense Name</TableHead>
          <TableHead className="min-w-[150px] px-3 text-[11px]">Linked To</TableHead>
          <TableHead className="min-w-[115px] px-3 text-[11px]">Expense Date</TableHead>
          <TableHead className="min-w-[155px] px-3 text-[11px]">Payment Source</TableHead>
          <TableHead className="min-w-[110px] px-3 text-[11px]">Expense Amount</TableHead>
          {isDraftTab ? (
            <TableHead className="min-w-[115px] px-3 text-[11px]">Last Saved</TableHead>
          ) : (
            <TableHead className="min-w-[115px] px-3 text-[11px]">
              {isPendingReviewTab ? "Recommended Amount" : "Approved Amount"}
            </TableHead>
          )}
          {!isDraftTab && !isPendingReviewTab ? (
            <TableHead className="min-w-[140px] px-3 text-[11px]">Adjustment</TableHead>
          ) : null}
          {!isDraftTab ? (
            <TableHead className="min-w-[130px] px-3 text-[11px]">Status</TableHead>
          ) : null}
          <TableHead className="min-w-[105px] px-3 text-right text-[11px]">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && !expenses.length ? (
          <TableRow>
            <TableCell colSpan={columnCount} className="h-40 text-center text-xs text-muted-foreground">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-primary" />
              Loading expenses...
            </TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={columnCount} className="h-40 text-center text-xs text-muted-foreground">
              <p>{getErrorMessage(error, "Unable to load expenses")}</p>
              <Button variant="outline" size="sm" className="mt-2 h-7 text-[11px]" onClick={onRetry}>
                Try again
              </Button>
            </TableCell>
          </TableRow>
        ) : expenses.length ? (
          expenses.map((expense) => (
            <ExpenseRow
              key={expense._id || expense.expenseId}
              activeTab={activeTab}
              expense={expense}
              onView={onView}
              onEdit={onEdit}
            />
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columnCount} className="h-40 text-center text-xs text-muted-foreground">
              <FileText className="mx-auto mb-2 h-7 w-7 opacity-60" />
              No expenses found for these filters.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function ExpenseRow({ activeTab, expense, onView, onEdit }) {
  const actionLabel = getActionLabel(expense.status);
  const isDraftTab = activeTab === "drafts";
  const isPendingReviewTab = activeTab === "pending-review";

  return (
    <TableRow className="text-xs">
      <TableCell className="px-3 py-2">
        <p className="max-w-[210px] truncate font-medium text-foreground">{displayText(expense.expenseName)}</p>
        <p className="mt-0.5 max-w-[210px] truncate text-[11px] text-muted-foreground">
          {displayText(expense.expenseId)} · {displayText(expense.category)}
        </p>
      </TableCell>
      <TableCell className="px-3 py-2 font-medium text-primary">{displayText(expense.linkedTo)}</TableCell>
      <TableCell className="px-3 py-2">{formatDate(expense.expenseDate)}</TableCell>
      <TableCell className="px-3 py-2">
        <p>{displayText(expense.paymentSource)}</p>
        {expense.advanceExpense ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{getAdvanceId(expense.advanceExpense)}</p>
        ) : null}
      </TableCell>
      <TableCell className="px-3 py-2 font-medium tabular-nums">{formatCurrency(expense.expenseAmount)}</TableCell>
      {isDraftTab ? (
        <TableCell className="px-3 py-2 tabular-nums">
          <p className="font-medium text-foreground">{formatDate(expense.updatedAt)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{formatTime(expense.updatedAt)}</p>
        </TableCell>
      ) : (
        <TableCell className="px-3 py-2 font-medium tabular-nums">
          {isPendingReviewTab
            ? formatOptionalCurrency(getRecommendedAmount(expense))
            : hasApprovedAmount(expense) ? formatCurrency(expense.amountCover) : "-"}
        </TableCell>
      )}
      {!isDraftTab && !isPendingReviewTab ? (
        <TableCell className="px-3 py-2">{getAdjustment(expense)}</TableCell>
      ) : null}
      {!isDraftTab ? (
        <TableCell className="px-3 py-2"><StatusBadge status={expense.status} /></TableCell>
      ) : null}
      <TableCell className="px-3 py-2 text-right">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 whitespace-nowrap px-2 text-[10px] text-primary"
          onClick={() => actionLabel === "Edit" ? onEdit(expense) : onView(expense)}
        >
          {actionLabel}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function StatusBadge({ status, large = false }) {
  const value = displayText(status);
  const normalized = value.toLowerCase();
  let className = "border-border bg-muted text-foreground/80";

  if (normalized.includes("approved")) {
    className = "border-[hsl(var(--chart-2)/0.40)] bg-[hsl(var(--chart-2)/0.15)] text-[hsl(var(--chart-2))]";
  } else if (normalized.includes("correction") || normalized.includes("reject")) {
    className = "border-[hsl(var(--chart-4)/0.40)] bg-[hsl(var(--chart-4)/0.15)] text-[hsl(var(--chart-4))]";
  } else if (normalized.includes("pending") || normalized.includes("review")) {
    className = "border-[hsl(var(--chart-3)/0.40)] bg-[hsl(var(--chart-3)/0.15)] text-[hsl(var(--chart-3))]";
  } else if (normalized.includes("submitted")) {
    className = "border-primary/40 bg-primary/15 text-primary";
  }

  return (
    <span className={`inline-flex whitespace-nowrap rounded border px-2 py-0.5 font-medium brightness-90 dark:brightness-110 ${large ? "text-xs" : "text-[11px]"} ${className}`}>
      {value}
    </span>
  );
}

