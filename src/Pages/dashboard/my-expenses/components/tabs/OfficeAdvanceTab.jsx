/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { CalendarDays, Download, FileText, Info, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@components/components/ui/button";
import { Card } from "@components/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/components/ui/table";
import { EMPTY_ANALYTICS } from "../expense.constants";
import {
  displayPerson, displayText, firstPresent, formatCurrency, formatDate,
  getErrorMessage, numberOrZero,
} from "../expense.utils";

export default function OfficeAdvanceTab({ analytics, expenses, loading, error, monthPeriod, onRetry }) {
  const advanceModels = buildOfficeAdvanceModels(expenses, analytics);
  const [selectedAdvanceId, setSelectedAdvanceId] = useState(advanceModels[0].id);
  const availableIds = advanceModels.map((advance) => advance.id);

  useEffect(() => {
    if (!availableIds.includes(selectedAdvanceId)) setSelectedAdvanceId(advanceModels[0].id);
  }, [availableIds, advanceModels, selectedAdvanceId]);

  const advance = advanceModels.find((item) => item.id === selectedAdvanceId) || advanceModels[0];
  const adjustedAngle = advance.adjustedPercentage * 3.6;
  const pendingAngle = Math.min(
    adjustedAngle + (advance.received ? (advance.pendingReview / advance.received) * 360 : 0),
    360,
  );

  return (
    <div className="space-y-3 bg-muted/20 p-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="overflow-hidden border-border shadow-sm">
          <div className="flex min-h-11 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
            <h2 className="text-sm font-semibold">Office Advance &amp; Balance</h2>
            <Select value={advance.id} onValueChange={setSelectedAdvanceId}>
              <SelectTrigger className="h-8 w-[140px] text-[10px] font-medium" aria-label="Select office advance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {advanceModels.map((item) => (
                  <SelectItem key={item.id} value={item.id} className="text-xs">{item.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="p-4">
            <div className="grid gap-5 sm:grid-cols-2">
              {[advance.primaryDetails, advance.balanceDetails].map((details, groupIndex) => (
                <div key={groupIndex} className={groupIndex ? "border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0" : ""}>
                  <div className="space-y-2">
                    {details.map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[minmax(0,1fr)_minmax(105px,1.15fr)] gap-3 text-[10px]">
                        <span className="font-medium text-muted-foreground">{label}</span>
                        <span className="font-semibold text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/70 px-3 py-2 text-[10px] text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300">
              {loading ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <Info className="h-3.5 w-3.5 shrink-0" />}
              {error ? (
                <span className="flex flex-wrap items-center gap-2">
                  {getErrorMessage(error, "Unable to load office advance details")}
                  <button type="button" className="font-semibold underline" onClick={onRetry}>Try again</button>
                </span>
              ) : "Office advance balance and utilization details update as expense records are reviewed."}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-border shadow-sm">
          <div className="min-h-11 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Advance Utilization Progress</h2>
          </div>
          <div className="p-4">
            <div className="grid items-center gap-5 sm:grid-cols-[165px_minmax(0,1fr)]">
              <div
                className="expense-advance-progress mx-auto"
                style={{
                  "--advance-adjusted-angle": `${adjustedAngle}deg`,
                  "--advance-pending-angle": `${pendingAngle}deg`,
                }}
              >
                <div>
                  <strong>{Math.round(advance.adjustedPercentage)}%</strong>
                  <span>Adjusted</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 text-[10px]">
                  <AdvanceLegend colorClass="bg-emerald-500" label="Approved & Adjusted" value={advance.approvedAdjusted} />
                  <AdvanceLegend colorClass="bg-orange-400" label="Pending Review" value={advance.pendingReview} />
                  <AdvanceLegend colorClass="bg-muted-foreground/25" label="Estimated Available" value={advance.estimatedAvailable} />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <AdvanceFact icon={Info} label="Claims Adjusted" value={`${advance.adjustedCount} ${advance.adjustedCount === 1 ? "Claim" : "Claims"}`} />
                  <AdvanceFact icon={CalendarDays} label="Last Adjustment" value={formatDate(advance.lastAdjustment)} />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-[9px] font-medium">
                <span className="text-emerald-600 dark:text-emerald-400">Adjusted {formatCurrency(advance.approvedAdjusted)}</span>
                <span className="text-muted-foreground">Available {formatCurrency(advance.estimatedAvailable)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${advance.adjustedPercentage}%` }} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden border-border shadow-sm">
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            Office Advance Statement
          </h2>
          <Button
            type="button"
            variant="outline"
            className="h-8 gap-1.5 px-3 text-[10px]"
            disabled={!advance.statement.length}
            onClick={() => downloadOfficeAdvanceCsv(advance, monthPeriod)}
          >
            <Download className="h-3.5 w-3.5" />
            Download Office Advance Statement
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow className="bg-muted/45 hover:bg-muted/45">
                {["Date", "Particulars", "Credit (₹)", "Debit (₹)", "Balance (₹)", "Type / Status"].map((heading) => (
                  <TableHead key={heading} className="h-8 whitespace-nowrap px-4 text-[9px]">{heading}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !advance.statement.length ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading statement...</TableCell></TableRow>
              ) : advance.statement.length ? advance.statement.map((entry) => (
                <TableRow key={entry.key} className="hover:bg-muted/25">
                  <TableCell className="whitespace-nowrap px-4 py-2 text-[10px] font-medium">{formatDate(entry.date)}</TableCell>
                  <TableCell className="px-4 py-2 text-[10px] font-medium">{entry.particulars}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-2 text-[10px] font-semibold">{entry.credit ? formatCurrency(entry.credit) : "-"}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-2 text-[10px] font-semibold">{entry.debit ? formatCurrency(entry.debit) : "-"}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-2 text-[10px] font-semibold">{formatCurrency(entry.balance)}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-2 text-[10px]"><OfficeAdvanceBadge value={entry.status} /></TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">No office advance activity found for this month.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <p className="flex items-center justify-center gap-2 text-[9px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3" />
        All expense and advance data is confidential and visible only to you.
      </p>
    </div>
  );
}

function AdvanceLegend({ colorClass, label, value }) {
  return (
    <>
      <span className="flex items-center gap-2 font-medium text-muted-foreground"><i className={`h-2 w-2 rounded-full ${colorClass}`} />{label}</span>
      <strong className="text-foreground">{formatCurrency(value)}</strong>
    </>
  );
}

function AdvanceFact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-2.5 text-[10px]">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <div><p className="text-muted-foreground">{label}</p><p className="mt-1 font-semibold text-foreground">{value}</p></div>
    </div>
  );
}

function OfficeAdvanceBadge({ value }) {
  const normalized = String(value || "").toLowerCase();
  const className = normalized.includes("adjust")
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : normalized.includes("pending")
      ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
      : normalized.includes("received")
        ? "bg-primary/10 text-primary"
        : "bg-muted text-muted-foreground";
  return <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-medium ${className}`}>{displayText(value)}</span>;
}


function buildOfficeAdvanceModels(expenses = [], analytics = EMPTY_ANALYTICS) {
  const groupedExpenses = new Map();

  expenses.forEach((expense) => {
    const record = expense.advanceExpense && typeof expense.advanceExpense === "object"
      ? expense.advanceExpense
      : {};
    const id = String(firstPresent(
      record.advanceId,
      record.advanceExpenseId,
      record.expenseId,
      typeof expense.advanceExpense === "string" ? expense.advanceExpense : undefined,
      "Current Advance",
    ));
    const group = groupedExpenses.get(id) || { record, expenses: [] };
    if (Object.keys(record).length) group.record = record;
    group.expenses.push(expense);
    groupedExpenses.set(id, group);
  });

  if (!groupedExpenses.size) groupedExpenses.set("Current Advance", { record: {}, expenses: [] });

  return Array.from(groupedExpenses, ([id, group]) => {
    const record = group.record;
    const advanceExpenses = group.expenses;
    const received = numberOrZero(firstPresent(
      record.advanceReceived,
      record.receivedAmount,
      record.advanceAmount,
      record.amount,
      analytics.officeAdvanceReceived?.amount,
    ));
    const pendingExpenses = advanceExpenses.filter((expense) => isPendingAdvanceExpense(expense));
    const adjustedExpenses = advanceExpenses.filter((expense) => !isPendingAdvanceExpense(expense));
    const pendingReview = pendingExpenses.reduce((total, expense) => total + numberOrZero(expense.expenseAmount), 0);
    const approvedAdjusted = adjustedExpenses.reduce(
      (total, expense) => total + numberOrZero(firstPresent(expense.amountCover || undefined, expense.expenseAmount)),
      0,
    );
    const returnedToOffice = numberOrZero(firstPresent(record.returnedToOffice, record.returnedAmount));
    const calculatedBalance = Math.max(received - approvedAdjusted - returnedToOffice, 0);
    const ledgerBalance = numberOrZero(firstPresent(
      record.currentLedgerBalance,
      record.balanceAmount,
      analytics.officeAdvanceBalanced?.amount,
      calculatedBalance,
    ));
    const estimatedAvailable = Math.max(ledgerBalance - pendingReview, 0);
    const adjustedPercentage = received
      ? Math.min(Math.max((approvedAdjusted / received) * 100, 0), 100)
      : 0;
    const lastAdjustment = adjustedExpenses
      .map((expense) => expense.reviewedAt || expense.updatedAt || expense.expenseDate)
      .filter(Boolean)
      .sort((left, right) => new Date(right) - new Date(left))[0];
    const receivedOn = firstPresent(record.receivedOn, record.receivedAt, record.createdAt);
    const returnedOn = firstPresent(record.returnedOn, record.returnedAt, record.updatedAt);
    const statementEvents = [];

    if (received) {
      statementEvents.push({
        key: `${id}-received`,
        date: receivedOn,
        particulars: `Office Advance Received - ${id}`,
        credit: received,
        debit: 0,
        delta: received,
        status: "Advance Received",
      });
    }
    advanceExpenses.forEach((expense, index) => {
      const pending = isPendingAdvanceExpense(expense);
      const amount = numberOrZero(firstPresent(expense.amountCover || undefined, expense.expenseAmount));
      statementEvents.push({
        key: expense._id || expense.expenseId || `${id}-expense-${index}`,
        date: expense.expenseDate || expense.createdAt,
        particulars: `${displayText(expense.expenseName)} - ${displayText(expense.expenseId)}`,
        credit: 0,
        debit: pending ? 0 : amount,
        delta: pending ? 0 : -amount,
        status: pending ? "Pending Review" : "Adjusted",
      });
    });
    if (returnedToOffice) {
      statementEvents.push({
        key: `${id}-returned`,
        date: returnedOn,
        particulars: "Amount Returned to Office",
        credit: returnedToOffice,
        debit: 0,
        delta: -returnedToOffice,
        status: "Returned",
      });
    }

    statementEvents.sort((left, right) => {
      if (!left.date) return -1;
      if (!right.date) return 1;
      return new Date(left.date) - new Date(right.date);
    });
    let runningBalance = 0;
    const statement = statementEvents.map((entry) => {
      runningBalance = Math.max(runningBalance + entry.delta, 0);
      return { ...entry, balance: runningBalance };
    });
    const firstExpense = advanceExpenses[0] || {};
    const status = firstPresent(record.status, ledgerBalance > 0 ? "Open" : "Closed");

    return {
      id,
      received,
      approvedAdjusted,
      pendingReview,
      returnedToOffice,
      ledgerBalance,
      estimatedAvailable,
      adjustedPercentage,
      adjustedCount: adjustedExpenses.length,
      lastAdjustment,
      statement,
      primaryDetails: [
        ["Advance For", firstPresent(record.advanceFor, record.title, record.purpose, firstExpense.expenseFor, "-")],
        ["Advance ID", id],
        ["Linked To", firstPresent(record.linkedTo, firstExpense.linkedTo, "-")],
        ["Received On", formatDate(receivedOn)],
        ["Issued By", displayPerson(firstPresent(record.issuedBy, record.createdBy, "Finance Team"))],
      ],
      balanceDetails: [
        ["Advance Received", formatCurrency(received)],
        ["Approved & Adjusted", formatCurrency(approvedAdjusted)],
        ["Pending Review", formatCurrency(pendingReview)],
        ["Returned to Office", formatCurrency(returnedToOffice)],
        ["Current Ledger Balance", formatCurrency(ledgerBalance)],
        ["Estimated Available", formatCurrency(estimatedAvailable)],
        ["Status", <OfficeAdvanceBadge key={`${id}-status`} value={status} />],
      ],
    };
  });
}

function isPendingAdvanceExpense(expense) {
  const status = String(expense.status || "").toLowerCase();
  return status.includes("pending")
    || status.includes("review")
    || status.includes("submitted")
    || status.includes("draft");
}


function downloadOfficeAdvanceCsv(advance, monthPeriod) {
  const headers = ["Date", "Particulars", "Credit (INR)", "Debit (INR)", "Balance (INR)", "Type / Status"];
  const rows = advance.statement.map((entry) => [
    formatDate(entry.date),
    entry.particulars,
    entry.credit || "",
    entry.debit || "",
    entry.balance,
    entry.status,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(toCsvCell).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `office-advance-statement-${advance.id}-${monthPeriod}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toCsvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

