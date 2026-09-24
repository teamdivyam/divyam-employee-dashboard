/* eslint-disable react/prop-types */
import { useState } from "react";
import { ArrowUpDown, Eye, FileText, MoreVertical } from "lucide-react";

import { Badge } from "@components/components/ui/badge";
import { Button } from "@components/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./EventTable";
import { currency, idOf, shortDate } from "../eventFinance.utils";
import { ErrorState, LoadingState } from "./EventCostSettlementSummary";
import FinancePaginationFooter from "./FinancePaginationFooter";

const approvalClasses = {
  Approved:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  Pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  Rejected:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
  Cancelled: "border-border bg-muted text-muted-foreground",
};

const settlementClasses = {
  "Reimbursement Due":
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  "Company Paid":
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  "Advance Adjusted":
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  Reimbursed:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
};

function SortButton({
  label,
  sortBy,
  activeSort,
  onSort,
  align = "left",
}) {
  return (
    <button
      type="button"
      onClick={() => onSort(sortBy)}
      className={`${align === "right" ? "ml-auto" : ""} inline-flex items-center gap-1.5`}
    >
      {label}
      <ArrowUpDown
        className={`h-3.5 w-3.5 ${activeSort === sortBy ? "text-primary" : "text-muted-foreground"}`}
      />
    </button>
  );
}

function ExpenseDetailDialog({ expense, onOpenChange }) {
  return (
    <Dialog
      open={Boolean(expense)}
      onOpenChange={(open) => !open && onOpenChange(null)}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense?.expenseTitle}</DialogTitle>
          <DialogDescription>
            {expense?.expenseId} · {shortDate(expense?.date)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Category</p>
            <p className="font-medium">{expense?.category}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="font-medium">{currency(expense?.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid By</p>
            <p className="font-medium">{expense?.paidByName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Funding Source</p>
            <p className="font-medium">{expense?.fundingSource}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Approval</p>
            <p className="font-medium">{expense?.approvalStatus}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Settlement</p>
            <p className="font-medium">
              {expense?.settlementStatus === "Not Applicable"
                ? "–"
                : expense?.settlementStatus}
            </p>
          </div>
        </div>

        {expense?.notes ? (
          <p className="text-sm text-muted-foreground">{expense.notes}</p>
        ) : null}

        {expense?.billReceipt?.fileUrl ? (
          <Button variant="outline" asChild>
            <a
              href={expense.billReceipt.fileUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Bill / Receipt
            </a>
          </Button>
        ) : (
          <p className="text-sm font-medium text-destructive">
            Supporting proof is missing.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(null)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExpenseActions({ expense, onView }) {
  return (
    <div className="flex justify-end gap-1">
      <Button size="sm" variant="outline" className="gap-1 text-blue-700" onClick={() => onView(expense)}>
        <Eye className="mr-2 h-4 w-4" />
        View
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            aria-label={`Actions for ${expense.expenseTitle}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onView(expense)}>
            <Eye className="mr-2 h-4 w-4" />
            View details
          </DropdownMenuItem>
          {expense.billReceipt?.fileUrl ? (
            <DropdownMenuItem asChild>
              <a
                href={expense.billReceipt.fileUrl}
                target="_blank"
                rel="noreferrer"
              >
                <FileText className="mr-2 h-4 w-4" />
                Open bill
              </a>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function EventExpenseRegister({
  data,
  filters,
  onFiltersChange,
  loading,
  error,
  onRetry,
}) {
  const [expenseDetail, setExpenseDetail] = useState(null);

  const updateSort = (sortBy) =>
    onFiltersChange({
      ...filters,
      sortBy,
      sortOrder:
        filters.sortBy === sortBy && filters.sortOrder === "desc"
          ? "asc"
          : "desc",
      page: 1,
    });

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState error={error} onRetry={onRetry} />;

  return (
    <div className="space-y-3">
      <div className="min-w-0">
          <div className="max-w-full overflow-x-auto">
            <Table headerVariant="section" className="min-w-[1050px] text-xs">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Expense / Category</TableHead>
                  <TableHead>
                    <SortButton
                      label="Expense Date"
                      sortBy="date"
                      activeSort={filters.sortBy}
                      onSort={updateSort}
                    />
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium">
                    <SortButton
                      label="Amount"
                      sortBy="amount"
                      activeSort={filters.sortBy}
                      onSort={updateSort}
                      align="right"
                    />
                  </TableHead>
                  <TableHead>Paid By / Source</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Settlement</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead className="text-right text-xs font-medium">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.expenses?.length ? (
                  data.expenses.map((expense) => (
                    <TableRow key={idOf(expense)}>
                      <TableCell>
                        <p className="text-xs font-normal text-foreground">
                          {expense.expenseTitle}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {expense.category}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {shortDate(expense.date)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {currency(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-normal text-foreground">{expense.paidByName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {expense.fundingSource}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            approvalClasses[expense.approvalStatus] ||
                            approvalClasses.Pending
                          }
                        >
                          {expense.approvalStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {expense.settlementStatus &&
                        expense.settlementStatus !== "Not Applicable" ? (
                          <Badge
                            variant="outline"
                            className={
                              settlementClasses[expense.settlementStatus] ||
                              "border-border bg-muted text-muted-foreground"
                            }
                          >
                            {expense.settlementStatus}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {expense.billReceipt?.fileUrl ? (
                          <Button size="sm" variant="outline" asChild>
                            <a
                              href={expense.billReceipt.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              View Bill
                            </a>
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive">
                            <FileText className="h-4 w-4" />
                            Missing
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ExpenseActions
                          expense={expense}
                          onView={setExpenseDetail}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-40 text-center text-muted-foreground"
                    >
                      No event expenses match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <FinancePaginationFooter
            pagination={data?.pagination}
            totalKey="totalExpenses"
            onChange={(values) =>
              onFiltersChange({ ...filters, ...values })
            }
          />
      </div>

      <ExpenseDetailDialog
        expense={expenseDetail}
        onOpenChange={setExpenseDetail}
      />
    </div>
  );
}
