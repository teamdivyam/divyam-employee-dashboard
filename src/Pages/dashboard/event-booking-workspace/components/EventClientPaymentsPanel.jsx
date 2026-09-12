/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  Eye,
  FileText,
  IndianRupee,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@components/components/ui/alert-dialog";
import { Badge } from "@components/components/ui/badge";
import { Button } from "@components/components/ui/button";
import { Card, CardContent } from "@components/components/ui/card";
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
import { Input } from "@components/components/ui/input";
import { Label } from "@components/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import { Skeleton } from "@components/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./EventTable";
import { Textarea } from "@components/components/ui/textarea";
import { currency, idOf, numberOf, shortDate } from "../eventFinance.utils";

const statusClasses = {
  Paid: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  Partial:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  Scheduled:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  Overdue:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
  Cancelled: "border-border bg-muted text-muted-foreground",
};

function PaymentStatusBadge({ status }) {
  return (
    <Badge
      variant="outline"
      className={statusClasses[status] || statusClasses.Scheduled}
    >
      {status || "Scheduled"}
    </Badge>
  );
}

function SummaryCards({ summary = {} }) {
  const metrics = [
    {
      label: "Contract Value",
      value: currency(summary.contractValue),
      caption: "Incl. GST",
      icon: FileText,
      tone: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
      cardTone: "bg-blue-50/40 dark:bg-blue-400/5",
    },
    {
      label: "Total Received",
      value: currency(summary.totalReceived),
      caption: `${numberOf(summary.receivedPercentage)}% of total`,
      icon: CheckCircle2,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
      cardTone: "bg-emerald-50/40 dark:bg-emerald-400/5",
    },
    {
      label: "Pending Amount",
      value: currency(summary.pendingAmount),
      caption: `${Math.max(0, 100 - numberOf(summary.receivedPercentage)).toFixed(0)}% of total`,
      icon: Clock3,
      tone: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
      cardTone: "bg-rose-50/40 dark:bg-rose-400/5",
    },
    {
      label: "Overdue Amount",
      value: currency(summary.overdueAmount),
      caption: numberOf(summary.overdueAmount)
        ? "Needs attention"
        : "No overdue",
      icon: CircleAlert,
      tone: "bg-orange-500/10 text-orange-600 dark:text-orange-300",
      cardTone: "bg-orange-50/40 dark:bg-orange-400/5",
    },
    {
      label: "Next Due Date",
      value: shortDate(summary.nextDueDate),
      caption: summary.nextDueMilestone || "No payment due",
      icon: CalendarClock,
      tone: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
      cardTone: "bg-violet-50/40 dark:bg-violet-400/5",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map(
        ({ label, value, caption, icon: Icon, tone, cardTone }) => (
          <Card key={label} className={`crm-card ${cardTone}`}>
            <CardContent className="flex min-h-24 items-center gap-3 p-4">
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${tone}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-foreground">
                  {value}
                </p>
                <p className="text-xs font-semibold text-foreground">
                  {label}
                </p>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                  {caption}
                </p>
              </div>
            </CardContent>
          </Card>
        ),
      )}
    </div>
  );
}

const emptyMilestone = {
  name: "",
  description: "",
  dueDate: "",
  amount: "",
  status: "Scheduled",
  notes: "",
};

function MilestoneDialog({ open, onOpenChange, milestone, saving, onSave }) {
  const [form, setForm] = useState(emptyMilestone);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(
      milestone
        ? {
            name: milestone.name || "",
            description: milestone.description || "",
            dueDate: milestone.dueDate
              ? new Date(milestone.dueDate).toISOString().slice(0, 10)
              : "",
            amount: numberOf(milestone.amount) || "",
            status:
              milestone.status === "Cancelled" ? "Cancelled" : "Scheduled",
            notes: milestone.notes || "",
          }
        : emptyMilestone,
    );
    setError("");
  }, [milestone, open]);

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    const amount = numberOf(form.amount);
    if (!form.name.trim() || !form.dueDate || amount <= 0) {
      setError("Name, due date, and an amount greater than zero are required.");
      return;
    }
    if (milestone && amount < numberOf(milestone.receivedAmount)) {
      setError("Amount cannot be lower than the payment already received.");
      return;
    }
    try {
      await onSave({
        name: form.name.trim(),
        description: form.description.trim(),
        dueDate: form.dueDate,
        amount,
        notes: form.notes.trim(),
        ...(milestone ? { status: form.status } : {}),
      });
      onOpenChange(false);
    } catch {
      // Mutation feedback is shown by the page-level toast handler.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {milestone ? "Edit Payment Milestone" : "Add Payment Milestone"}
          </DialogTitle>
          <DialogDescription>
            Set the agreed amount and due date for this client payment stage.
          </DialogDescription>
        </DialogHeader>
        <form
          id="payment-milestone-form"
          onSubmit={submit}
          className="grid gap-4 py-2 sm:grid-cols-2"
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="milestone-name">Milestone</Label>
            <Input
              id="milestone-name"
              value={form.name}
              maxLength={150}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Planning Milestone"
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="milestone-description">Description</Label>
            <Textarea
              id="milestone-description"
              value={form.description}
              maxLength={500}
              onChange={(event) => update("description", event.target.value)}
              placeholder="After design finalisation and initial planning"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="milestone-due-date">Due Date</Label>
            <Input
              id="milestone-due-date"
              type="date"
              value={form.dueDate}
              onChange={(event) => update("dueDate", event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="milestone-amount">Amount (INR)</Label>
            <Input
              id="milestone-amount"
              type="number"
              min="1"
              step="0.01"
              value={form.amount}
              onChange={(event) => update("amount", event.target.value)}
              required
            />
          </div>
          {milestone ? (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => update("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">
                    Active (calculated automatically)
                  </SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="milestone-notes">Internal Notes</Label>
            <Textarea
              id="milestone-notes"
              value={form.notes}
              maxLength={1000}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Optional internal note"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {error}
            </p>
          ) : null}
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button variant="custom" type="submit" form="payment-milestone-form" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {milestone ? "Save Changes" : "Add Milestone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const emptyPayment = {
  milestoneId: "",
  amount: "",
  transactionDate: "",
  paymentMode: "UPI",
  transactionReference: "",
  notes: "",
  receipts: [],
};

function RecordPaymentDialog({
  open,
  onOpenChange,
  milestones,
  initialMilestone,
  saving,
  onSave,
  paymentModes,
}) {
  const [form, setForm] = useState(emptyPayment);
  const [error, setError] = useState("");
  const payableMilestones = useMemo(
    () =>
      milestones.filter(
        (item) => item.status !== "Cancelled" && numberOf(item.balance) > 0,
      ),
    [milestones],
  );

  useEffect(() => {
    if (!open) return;
    const selected =
      payableMilestones.find((item) => idOf(item) === idOf(initialMilestone)) ||
      payableMilestones[0];
    setForm({
      ...emptyPayment,
      milestoneId: idOf(selected),
      transactionDate: new Date().toISOString().slice(0, 10),
    });
    setError("");
  }, [initialMilestone, open, payableMilestones]);

  const selectedMilestone = payableMilestones.find(
    (item) => idOf(item) === form.milestoneId,
  );
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const chooseFiles = (files) => {
    const selected = Array.from(files || []);
    if (selected.length > 5)
      return setError("You can attach up to 5 receipt files.");
    if (selected.some((file) => file.size > 10 * 1024 * 1024))
      return setError("Each receipt must be 10 MB or smaller.");
    setError("");
    update("receipts", selected);
  };
  const submit = async (event) => {
    event.preventDefault();
    const amount = numberOf(form.amount);
    if (
      !selectedMilestone ||
      amount <= 0 ||
      amount > numberOf(selectedMilestone.balance)
    ) {
      setError(
        `Enter an amount up to ${currency(selectedMilestone?.balance)}.`,
      );
      return;
    }
    try {
      await onSave({
        milestoneId: form.milestoneId,
        amount,
        transactionDate: form.transactionDate,
        paymentMode: form.paymentMode,
        utrNumber: form.transactionReference.trim(),
        notes: form.notes.trim(),
        receipts: form.receipts,
      });
      onOpenChange(false);
    } catch {
      // Mutation feedback is shown by the page-level toast handler.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Client Payment</DialogTitle>
          <DialogDescription>
            Apply a received payment to one of the outstanding milestones.
          </DialogDescription>
        </DialogHeader>
        {payableMilestones.length ? (
          <form
            id="record-client-payment-form"
            onSubmit={submit}
            className="grid gap-4 py-2 sm:grid-cols-2"
          >
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Milestone</Label>
              <Select
                value={form.milestoneId}
                onValueChange={(value) => update("milestoneId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select milestone" />
                </SelectTrigger>
                <SelectContent>
                  {payableMilestones.map((item) => (
                    <SelectItem key={idOf(item)} value={idOf(item)}>
                      {item.name} · {currency(item.balance)} due
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-amount">Amount (INR)</Label>
              <Input
                id="payment-amount"
                type="number"
                min="1"
                max={numberOf(selectedMilestone?.balance)}
                step="0.01"
                value={form.amount}
                onChange={(event) => update("amount", event.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Balance: {currency(selectedMilestone?.balance)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={form.transactionDate}
                onChange={(event) =>
                  update("transactionDate", event.target.value)
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Mode</Label>
              <Select
                value={form.paymentMode}
                onValueChange={(value) => update("paymentMode", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-reference">Transaction Reference</Label>
              <Input
                id="payment-reference"
                value={form.transactionReference}
                onChange={(event) =>
                  update("transactionReference", event.target.value)
                }
                placeholder="UTR / bank reference"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="payment-receipts">Receipt / Payment Proof</Label>
              <Input
                id="payment-receipts"
                type="file"
                accept="image/*,.pdf,application/pdf"
                multiple
                onChange={(event) => chooseFiles(event.target.files)}
              />
              <p className="text-[11px] text-muted-foreground">
                Up to 5 files, 10 MB each
                {form.receipts.length
                  ? ` · ${form.receipts.length} selected`
                  : ""}
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="payment-notes">Notes</Label>
              <Textarea
                id="payment-notes"
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Optional payment note"
              />
            </div>
            {error ? (
              <p
                className="text-sm text-destructive sm:col-span-2"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </form>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            There are no outstanding milestones available for payment.
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          {payableMilestones.length ? (
            <Button
              variant="custom"
              type="submit"
              form="record-client-payment-form"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <IndianRupee className="mr-2 h-4 w-4" />
              )}
              Record Payment
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReceiptsDialog({ milestone, onOpenChange }) {
  const payments = (milestone?.paymentTransactions || []).filter(
    (item) => item && !item.isDeleted,
  );
  return (
    <Dialog
      open={Boolean(milestone)}
      onOpenChange={(open) => !open && onOpenChange(null)}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{milestone?.name || "Payment"} Receipts</DialogTitle>
          <DialogDescription>
            Recorded payments and uploaded proof for this milestone.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[55vh] space-y-3 overflow-y-auto py-2">
          {payments.length ? (
            payments.map((payment) => (
              <div
                key={idOf(payment)}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {currency(payment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {shortDate(payment.transactionDate)} ·{" "}
                      {payment.paymentMode || "-"}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {payment.receiptNumber || payment.transactionId}
                  </Badge>
                </div>
                {payment.receiptDocuments?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {payment.receiptDocuments.map((document) => (
                      <Button
                        key={idOf(document) || document.fileUrl}
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-2"
                      >
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Eye className="h-4 w-4" />
                          {document.fileName || "View receipt"}
                        </a>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    No proof file was attached.
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No payment receipt is available.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(null)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}

export default function EventClientPaymentsPanel({
  data,
  filters,
  onFiltersChange,
  loading,
  error,
  onRetry,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onRecordPayment,
  onDownloadReport,
  savingMilestone,
  deletingMilestone,
  recordingPayment,
  downloadingReport,
}) {
  const [milestoneDialog, setMilestoneDialog] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentMilestone, setPaymentMilestone] = useState(null);
  const [receiptMilestone, setReceiptMilestone] = useState(null);
  const [deleteMilestone, setDeleteMilestone] = useState(null);

  if (loading && !data) return <LoadingState />;
  if (error && !data)
    return (
      <Card>
        <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
          <CircleAlert className="h-8 w-8 text-destructive" />
          <div>
            <p className="font-semibold">Unable to load client payments</p>
            <p className="text-sm text-muted-foreground">
              {error.response?.data?.message ||
                "Please check the connection and try again."}
            </p>
          </div>
          <Button variant="outline" onClick={onRetry}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );

  const summary = data?.summary || {};
  const milestones = data?.milestones || [];
  const options = data?.options || {};
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    totalMilestones: 0,
    totalPages: 0,
  };
  const allMilestoneOptions = options.milestones || [];
  const paymentMilestones = allMilestoneOptions.some(
    (item) => item.balance !== undefined,
  )
    ? allMilestoneOptions
    : milestones;
  const hasOutstanding = paymentMilestones.some(
    (item) => item.status !== "Cancelled" && numberOf(item.balance) > 0,
  );
  const setFilter = (key, value) =>
    onFiltersChange({
      ...filters,
      [key]: value,
      page: key === "page" ? value : 1,
    });
  const openMilestone = (milestone = null) => {
    setSelectedMilestone(milestone);
    setMilestoneDialog(true);
  };
  const openPayment = (milestone = null) => {
    setPaymentMilestone(milestone);
    setPaymentDialog(true);
  };
  const deleteSelectedMilestone = async () => {
    try {
      await onDeleteMilestone(deleteMilestone);
      setDeleteMilestone(null);
    } catch {
      // Mutation feedback is shown by the page-level toast handler.
    }
  };

  return (
    <div className="space-y-4">
      <SummaryCards summary={summary} />
      {!summary.milestonesMatchContract && allMilestoneOptions.length ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Milestones differ from the contract value by{" "}
            {currency(Math.abs(numberOf(summary.milestoneVariance)))}.
          </span>
        </div>
      ) : null}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Payment Milestones
              </h2>
              <p className="text-xs text-muted-foreground">
                Track client payments against the agreed contract schedule.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => openMilestone()}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Milestone
              </Button>
              <Button
                variant="custom"
                onClick={() => openPayment()}
                disabled={!hasOutstanding}
                className="gap-2"
              >
                <IndianRupee className="h-4 w-4" />
                Record Payment
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-b border-border p-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(event) => setFilter("search", event.target.value)}
                placeholder="Search milestone..."
                className="pl-9"
                aria-label="Search payment milestones"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilter("status", value)}
            >
              <SelectTrigger
                className="w-full lg:w-44"
                aria-label="Filter by status"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {(
                  options.statuses || [
                    "Scheduled",
                    "Partial",
                    "Paid",
                    "Overdue",
                    "Cancelled",
                  ]
                ).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.milestone}
              onValueChange={(value) => setFilter("milestone", value)}
            >
              <SelectTrigger
                className="w-full lg:w-52"
                aria-label="Filter by milestone"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Milestones</SelectItem>
                {allMilestoneOptions.map((item) => (
                  <SelectItem key={idOf(item)} value={idOf(item)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={onDownloadReport}
              disabled={downloadingReport}
              className="gap-2 lg:ml-auto"
            >
              {downloadingReport ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download Report
            </Button>
          </div>
          <div className="max-w-full overflow-x-auto">
            <Table className="min-w-[1050px]">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestones.length ? (
                  milestones.map((milestone, index) => (
                    <TableRow key={idOf(milestone)}>
                      <TableCell className="text-xs">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </TableCell>
                      <TableCell className="max-w-44 font-semibold text-foreground">
                        {milestone.name}
                      </TableCell>
                      <TableCell className="max-w-56 whitespace-normal text-xs text-muted-foreground">
                        {milestone.description || "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {shortDate(milestone.dueDate)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {currency(milestone.amount)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {currency(milestone.receivedAmount)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {currency(milestone.balance)}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={milestone.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {shortDate(milestone.lastPaymentDate)}
                      </TableCell>
                      <TableCell>
                        {milestone.receiptCount ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReceiptMilestone(milestone)}
                            className="h-8 gap-1.5 px-2 text-primary"
                          >
                            <ReceiptText className="h-4 w-4" />
                            {milestone.receiptCount} file
                            {milestone.receiptCount === 1 ? "" : "s"}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {milestone.status === "Paid" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReceiptMilestone(milestone)}
                              className="gap-1.5 border-blue-300 bg-transparent text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={
                                milestone.status === "Cancelled" ||
                                numberOf(milestone.balance) <= 0
                              }
                              onClick={() => openPayment(milestone)}
                              className="gap-1.5 border-blue-300 bg-transparent text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                            >
                              <IndianRupee className="h-4 w-4" />
                              Record
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Actions for ${milestone.name}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => openMilestone(milestone)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit milestone
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={
                                  numberOf(milestone.receivedAmount) > 0
                                }
                                onSelect={() => setDeleteMilestone(milestone)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete milestone
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <ReceiptText className="h-8 w-8" />
                        <div>
                          <p className="font-medium text-foreground">
                            No payment milestones found
                          </p>
                          <p className="text-xs">
                            Add a milestone or adjust the current filters.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMilestone()}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Milestone
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Rows per page</span>
              <Select
                value={String(pagination.limit)}
                onValueChange={(value) => setFilter("limit", Number(value))}
              >
                <SelectTrigger className="h-9 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-muted-foreground">
              {pagination.totalMilestones
                ? `${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.totalMilestones)} of ${pagination.totalMilestones}`
                : "0 of 0"}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                aria-label="Previous page"
                disabled={pagination.page <= 1}
                onClick={() => setFilter("page", pagination.page - 1)}
              >
                ‹
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                aria-label="Next page"
                disabled={
                  !pagination.totalPages ||
                  pagination.page >= pagination.totalPages
                }
                onClick={() => setFilter("page", pagination.page + 1)}
              >
                ›
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <MilestoneDialog
        open={milestoneDialog}
        onOpenChange={setMilestoneDialog}
        milestone={selectedMilestone}
        saving={savingMilestone}
        onSave={(payload) =>
          selectedMilestone
            ? onUpdateMilestone(selectedMilestone, payload)
            : onAddMilestone(payload)
        }
      />
      <RecordPaymentDialog
        open={paymentDialog}
        onOpenChange={setPaymentDialog}
        milestones={paymentMilestones}
        initialMilestone={paymentMilestone}
        saving={recordingPayment}
        onSave={onRecordPayment}
        paymentModes={
          options.paymentModes || [
            "Bank Transfer",
            "UPI",
            "NEFT",
            "RTGS",
            "IMPS",
            "Card",
            "Cash",
            "Cheque",
            "Wallet",
            "Other",
          ]
        }
      />
      <ReceiptsDialog
        milestone={receiptMilestone}
        onOpenChange={setReceiptMilestone}
      />
      <AlertDialog
        open={Boolean(deleteMilestone)}
        onOpenChange={(open) => !open && setDeleteMilestone(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete payment milestone?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes “{deleteMilestone?.name}” from the payment schedule.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingMilestone}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteSelectedMilestone}
              disabled={deletingMilestone}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingMilestone ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
