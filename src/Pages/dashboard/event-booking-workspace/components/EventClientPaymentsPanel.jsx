/* eslint-disable react/prop-types */
import EventMetricCards from "./EventMetricCards";
import EventReceiptPreviewDialog from "./EventReceiptPreviewDialog";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  Eye,
  FileText,
  Info,
  IndianRupee,
  List,
  Loader2,
  MapPin,
  MoreVertical,
  Pencil,
  PieChart,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  UploadCloud,
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/components/ui/avatar";
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
import {
  avatarUrl,
  bookingCode,
  eventDateLabel,
  initials,
} from "../eventBookingDashboard.utils";

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

export function ClientPaymentSummary({ summary = {} }) {
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

  return <EventMetricCards items={metrics} />;
}

const emptyMilestone = {
  name: "",
  description: "",
  dueDate: "",
  amount: "",
  status: "Scheduled",
  notes: "",
};

function MilestoneDialog({
  open,
  onOpenChange,
  milestone,
  saving,
  onSave,
  readOnly = false,
  booking,
  summary,
  plannedAmount,
}) {
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
    if (readOnly) return;
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

  const contract = numberOf(summary?.contractValue);
  const amount = numberOf(form.amount);
  const percentage = contract > 0 ? (amount / contract) * 100 : 0;
  const alreadyPlanned =
    plannedAmount == null
      ? null
      : plannedAmount -
        (milestone && milestone.status !== "Cancelled"
          ? numberOf(milestone.amount)
          : 0);
  const remaining =
    alreadyPlanned == null
      ? null
      : contract -
        alreadyPlanned -
        (form.status === "Cancelled" ? 0 : amount);
  const money = (value) => (value == null ? "—" : currency(value));
  const percent = (value) =>
    value == null || !contract
      ? "—"
      : `${((value / contract) * 100).toFixed(2)}%`;
  const clientName =
    booking?.customer?.name ||
    booking?.clientName ||
    booking?.eventName ||
    "Client";
  const stat = (label, value, caption, Icon, green = false) => (
    <div
      key={label}
      className="flex min-w-0 items-center gap-3 rounded border border-border/50 bg-card/80 p-3"
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
          green
            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10"
            : "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-bold">{money(value)}</p>
        <p className="text-[10px] text-muted-foreground">{caption}</p>
      </div>
    </div>
  );
  const sectionHeading = (number, title, description) => (
    <div className="flex items-center gap-3 bg-blue-50/70 px-3 py-2 dark:bg-blue-400/10">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">
        {number}
      </span>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-lg p-0">
        <DialogHeader className="px-4 pb-3 pt-4 pr-12">
          <DialogTitle className="text-xl font-bold">
            {readOnly
              ? "View Milestone"
              : milestone
                ? "Edit Milestone"
                : "Add Milestone"}
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            Create a payment milestone for this booking. Client payments can be
            recorded against these milestones.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-3 overflow-y-auto px-4 pb-3">
          <div className="grid gap-3 rounded-md border border-border bg-blue-50/50 p-2.5 dark:bg-blue-400/5 lg:grid-cols-[1.2fr_1.5fr]">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-11 w-11 rounded-md">
                <AvatarImage src={avatarUrl(booking?.customer)} alt={clientName} />
                <AvatarFallback className="rounded-md bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-400/15 dark:text-violet-300">
                  {initials(clientName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{clientName}</p>
                  {booking?.bookingStatus ? (
                    <Badge
                      variant="outline"
                      className="border-0 bg-emerald-50 px-2 text-[10px] text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                    >
                      {booking.bookingStatus}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {booking
                    ? `${bookingCode(booking)} · ${booking.eventType || "Event"} · ${eventDateLabel(booking)}`
                    : ""}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {[booking?.venue, booking?.city].filter(Boolean).join(", ") ||
                    "Venue not set"}
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {stat("Contract Value", contract, "Incl. GST", FileText)}
              {stat(
                "Milestones Planned",
                plannedAmount,
                `${percent(plannedAmount)} of contract`,
                List,
              )}
              {stat(
                "Unallocated Amount",
                plannedAmount == null ? null : contract - plannedAmount,
                `${percent(
                  plannedAmount == null ? null : contract - plannedAmount,
                )} remaining`,
                PieChart,
              )}
            </div>
          </div>
          <form
            id="payment-milestone-form"
            onSubmit={submit}
            className="space-y-3 [&_input]:h-8 [&_input]:text-xs [&_label]:text-[11px] [&_label]:font-semibold [&_textarea]:text-xs"
          >
            <fieldset disabled={readOnly || saving} className="space-y-3">
              <section className="overflow-hidden rounded-md border border-border">
                {sectionHeading(
                  1,
                  "Milestone Details",
                  "Enter the milestone information and payment schedule.",
                )}
                <div className="space-y-3 p-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <Label htmlFor="milestone-name">
                        Milestone Type <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="milestone-name"
                        value={form.name}
                        maxLength={150}
                        onChange={(event) => update("name", event.target.value)}
                        placeholder="Booking Advance"
                        required
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Enter the milestone category.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="milestone-percentage">
                        Milestone Percentage
                      </Label>
                      <Input
                        id="milestone-percentage"
                        readOnly
                        value={`${percentage.toFixed(2)}%`}
                        className="bg-muted/40"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Percentage of total contract value.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="milestone-amount">
                        Amount (INR) <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex overflow-hidden rounded-md border border-input">
                        <span className="grid w-9 shrink-0 place-items-center border-r border-input bg-muted/50">
                          <IndianRupee className="h-3.5 w-3.5" />
                        </span>
                        <Input
                          id="milestone-amount"
                          type="number"
                          min="1"
                          step="0.01"
                          value={form.amount}
                          onChange={(event) =>
                            update("amount", event.target.value)
                          }
                          className="rounded-none border-0"
                          required
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {percentage.toFixed(2)}% of {currency(contract)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="milestone-due-date">
                        Due Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="milestone-due-date"
                        type="date"
                        value={form.dueDate}
                        onChange={(event) =>
                          update("dueDate", event.target.value)
                        }
                        required
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Select the expected payment date.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="milestone-description">
                      Description / Payment Condition{" "}
                      <span className="font-normal text-muted-foreground">
                        (Optional)
                      </span>
                    </Label>
                    <Textarea
                      id="milestone-description"
                      value={form.description}
                      maxLength={500}
                      onChange={(event) =>
                        update("description", event.target.value)
                      }
                      placeholder="Payable at the time of booking confirmation."
                      className="min-h-14"
                      rows={2}
                    />
                    <p className="text-right text-[10px] text-muted-foreground">
                      {form.description.length}/500
                    </p>
                  </div>
                  {milestone ? (
                    <div className="space-y-1">
                      <Label>Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(value) => update("status", value)}
                        disabled={readOnly || saving}
                      >
                        <SelectTrigger className="h-8 text-xs">
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
                  <div className="flex items-start gap-2 rounded border border-blue-100 bg-blue-50/70 px-3 py-2 text-[10px] text-muted-foreground dark:border-blue-400/20 dark:bg-blue-400/10">
                    <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                    <p>
                      {milestone ? (
                        "Client payments can be recorded against active milestones from the Record Payment section."
                      ) : (
                        <>
                          This milestone will be created as{" "}
                          <strong className="text-blue-600 dark:text-blue-300">
                            Scheduled
                          </strong>
                          . Client payments can be recorded against this milestone
                          from the Record Payment section.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-md border border-border">
                {sectionHeading(
                  2,
                  "Schedule Summary",
                  `This summary shows the updated milestone plan after ${
                    milestone ? "saving" : "adding"
                  } this milestone.`,
                )}
                <div className="space-y-3 p-3">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {stat("Contract Value", contract, "100%", FileText)}
                    {stat(
                      "Already Planned",
                      alreadyPlanned,
                      percent(alreadyPlanned),
                      List,
                    )}
                    {stat(
                      "This Milestone",
                      form.status === "Cancelled" ? 0 : amount,
                      form.status === "Cancelled"
                        ? "Cancelled"
                        : `${percentage.toFixed(2)}%`,
                      Plus,
                      true,
                    )}
                    {stat(
                      "Remaining Unallocated",
                      remaining,
                      percent(remaining),
                      PieChart,
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="milestone-notes">
                      Internal Note{" "}
                      <span className="font-normal text-muted-foreground">
                        (Optional)
                      </span>
                    </Label>
                    <Textarea
                      id="milestone-notes"
                      value={form.notes}
                      maxLength={1000}
                      onChange={(event) => update("notes", event.target.value)}
                      placeholder="Add any internal notes for your team..."
                      className="min-h-14"
                      rows={2}
                    />
                    <p className="text-right text-[10px] text-muted-foreground">
                      {form.notes.length}/1000
                    </p>
                  </div>
                </div>
              </section>
            </fieldset>
            {error ? (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        </div>
        <DialogFooter className="flex-row justify-between px-4 pb-4 pt-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="h-9 px-5 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly ? (
            <Button
              type="submit"
              form="payment-milestone-form"
              className="h-9 gap-2 bg-blue-600 px-5 text-xs text-white hover:bg-blue-700"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {milestone ? "Save Changes" : "Add Milestone"}
            </Button>
          ) : null}
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
  booking,
  summary = {},
  readOnly = false,
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
    const selected = payableMilestones.find(
      (item) => idOf(item) === idOf(initialMilestone),
    );
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
  const maximumAmount = form.milestoneId
    ? numberOf(selectedMilestone?.balance)
    : numberOf(summary.pendingAmount);
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
    if (readOnly) return;
    const amount = numberOf(form.amount);
    if (
      (form.milestoneId && !selectedMilestone) ||
      amount <= 0 ||
      amount > maximumAmount
    ) {
      setError(`Enter an amount up to ${currency(maximumAmount)}.`);
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

  const contract = numberOf(summary.contractValue);
  const received = numberOf(summary.totalReceived);
  const pending = numberOf(summary.pendingAmount);
  const amount = Math.max(0, numberOf(form.amount));
  const updatedReceived = received + amount;
  const updatedPending = Math.max(0, pending - amount);
  const percentage = (value) =>
    contract > 0 ? `${((value / contract) * 100).toFixed(1)}%` : "0%";
  const clientName = booking?.customer?.name || booking?.clientName || "Client";
  const heading = (number, title, description) => (
    <div className="flex items-center gap-3 bg-primary/[0.04] px-3 py-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {number}
      </span>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !saving && onOpenChange(next)}
    >
      <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-lg p-0">
        <DialogHeader className="px-4 pb-3 pt-4 pr-12 text-left">
          <DialogTitle className="text-xl font-bold">Record Payment</DialogTitle>
          <DialogDescription className="text-xs">
            Record the payment received from the client against this booking.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-3 overflow-y-auto px-4 pb-3">
          <div className="grid gap-3 rounded-md border border-primary/10 bg-primary/[0.04] p-2.5 lg:grid-cols-2">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-12 w-12 shrink-0 rounded-md">
                <AvatarImage src={avatarUrl(booking?.customer)} alt={clientName} />
                <AvatarFallback className="rounded-md bg-primary/10 font-semibold text-primary">
                  {initials(clientName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{clientName}</p>
                  {booking?.bookingStatus ? (
                    <Badge variant="outline" className="text-[10px]">
                      {booking.bookingStatus}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {bookingCode(booking || {})} &middot; {booking?.eventType || "Event"} &middot; {eventDateLabel(booking || {}, { includeWeekday: true })}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {[booking?.venue, booking?.city].filter(Boolean).join(", ") || "Venue not set"}
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ["Contract Value", contract, "Incl. GST", FileText, "bg-primary/10 text-primary"],
                ["Total Received", received, percentage(received), ArrowDown, "bg-emerald-500/10 text-emerald-600"],
                ["Pending Amount", pending, percentage(pending), Clock3, "bg-rose-500/10 text-rose-600"],
              ].map(([label, value, caption, Icon, tone]) => (
                <div key={label} className="flex min-w-0 items-center gap-2 rounded border border-border/60 bg-card/70 p-2">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-sm font-bold">{currency(value)}</p>
                    <p className="text-[10px] text-muted-foreground">{caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        {payableMilestones.length ? (
          <form
            id="record-client-payment-form"
            onSubmit={submit}
            className="grid overflow-hidden rounded-md border border-border sm:grid-cols-2 lg:grid-cols-3 [&_input]:h-8 [&_input]:text-xs [&_label]:text-[11px] [&_label]:font-semibold [&_textarea]:text-xs"
          >
            <div className="sm:col-span-2 lg:col-span-3">
              {heading(1, "Payment Details", "Enter the payment information received from the client.")}
            </div>
            <div className="space-y-1.5 p-3">
              <Label>Payment Against</Label>
              <Select
                value={form.milestoneId || "general"}
                onValueChange={(value) =>
                  update("milestoneId", value === "general" ? "" : value)
                }
                disabled={readOnly || saving}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select milestone" />
                </SelectTrigger>
                <SelectContent>
                  {payableMilestones.map((item) => (
                    <SelectItem key={idOf(item)} value={idOf(item)}>
                      {item.name} · {currency(item.balance)} due
                    </SelectItem>
                  ))}
                  <SelectItem value="general">
                    Booking Advance / General Payment
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Use this if payment is not linked to a specific milestone.
              </p>
            </div>
            <div className="space-y-1.5 p-3">
              <Label htmlFor="payment-amount">Amount Received</Label>
              <div className="flex overflow-hidden rounded-md border border-input">
                <span className="grid w-9 shrink-0 place-items-center border-r border-input bg-muted/40">
                  <IndianRupee className="h-3.5 w-3.5" />
                </span>
                <Input
                  id="payment-amount"
                  type="number"
                  min="1"
                  max={maximumAmount}
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => update("amount", event.target.value)}
                  disabled={readOnly || saving}
                  required
                  className="rounded-none border-0"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Max allowed: {currency(maximumAmount)}
              </p>
            </div>
            <div className="space-y-1.5 p-3">
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={form.transactionDate}
                onChange={(event) =>
                  update("transactionDate", event.target.value)
                }
                disabled={readOnly || saving}
                required
              />
              <p className="text-[10px] text-muted-foreground">
                Select the date the payment was received.
              </p>
            </div>
            <div className="space-y-1.5 p-3">
              <Label>Payment Mode</Label>
              <Select
                value={form.paymentMode}
                onValueChange={(value) => update("paymentMode", value)}
                disabled={readOnly || saving}
              >
                <SelectTrigger className="h-8 text-xs">
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
            <div className="space-y-1.5 p-3">
              <Label htmlFor="payment-reference">
                Transaction / UTR / Reference No.
              </Label>
              <Input
                id="payment-reference"
                value={form.transactionReference}
                onChange={(event) =>
                  update("transactionReference", event.target.value)
                }
                placeholder="UTR / bank reference"
                disabled={readOnly || saving}
              />
              <p className="text-[10px] text-muted-foreground">
                Enter UTR / Transaction ID from bank statement.
              </p>
            </div>
            <div className="space-y-1.5 p-3">
              <Label>Received In</Label>
              <Select disabled>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Account selection unavailable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unavailable" disabled>
                    No receiving accounts available
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Receiving accounts are not supported yet.
              </p>
            </div>
            <div className="mx-3 mb-3 grid gap-3 rounded-md border border-primary/10 bg-primary/[0.04] p-3 sm:col-span-2 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-[2fr_1fr_1.2fr_1.2fr]">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-semibold">Current Status After This Payment</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    These amounts will be updated after recording this payment.
                  </p>
                </div>
              </div>
              {[
                ["Contract Value", contract, "", "text-foreground"],
                ["Total Received (Updated)", updatedReceived, percentage(updatedReceived), "text-emerald-700"],
                ["Pending Amount (Updated)", updatedPending, percentage(updatedPending), "text-primary"],
              ].map(([label, value, percent, tone]) => (
                <div key={label} className="border-border sm:border-l sm:pl-4">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className={`mt-1 text-sm font-bold ${tone}`}>
                    {currency(value)}{" "}
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">{percent}</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              {heading(2, "Receipt & Notes", "Upload payment proof and add any additional notes (optional).")}
            </div>
            <div className="space-y-1.5 p-3 sm:col-span-1 lg:col-span-2">
              <Label htmlFor="payment-receipts">Payment Proof</Label>
              <div className="relative flex min-h-16 items-center justify-center gap-3 rounded-md border border-dashed border-input bg-muted/20 p-3">
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="text-xs font-semibold">Upload File</p>
                  <p className="text-[10px] text-muted-foreground">
                    Images, PDF (up to 5 files, max 10 MB each)
                  </p>
                </div>
                <Input
                  id="payment-receipts"
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  multiple
                  disabled={readOnly || saving}
                  className="absolute inset-0 !h-full w-full cursor-pointer opacity-0"
                  onChange={(event) => chooseFiles(event.target.files)}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Up to 5 files, 10 MB each
                {form.receipts.length
                  ? ` · ${form.receipts.length} selected`
                  : ""}
              </p>
            </div>
            <div className="space-y-1.5 p-3 sm:col-span-1 lg:col-span-1">
              <Label htmlFor="payment-notes">Internal Note</Label>
              <Textarea
                id="payment-notes"
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Add an internal payment note"
                disabled={readOnly || saving}
                className="min-h-16"
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
        </div>
        <DialogFooter className="shrink-0 flex-row justify-between gap-3 px-4 pb-4 pt-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {payableMilestones.length && !readOnly ? (
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

function ReceiptsDialog({ milestone, payments, onOpenChange, onView }) {
  return (
    <Dialog
      open={Boolean(milestone)}
      onOpenChange={(open) => !open && onOpenChange(null)}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{milestone?.name || "Payment"} Receipts</DialogTitle>
          <DialogDescription>
            Select a payment to preview its receipt.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[55vh] space-y-3 overflow-y-auto py-2">
          {payments.length ? (
            payments.map((payment) => (
              <div
                key={idOf(payment)}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div>
                  <p className="font-semibold">
                    {payment.receiptNumber || payment.transactionId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shortDate(payment.transactionDate)} · {currency(payment.amount)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(payment)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
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
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}

export default function EventClientPaymentsPanel({
  readOnly = false,
  booking,
  summary = {},
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
  const [milestoneViewOnly, setMilestoneViewOnly] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentMilestone, setPaymentMilestone] = useState(null);
  const [receiptMilestone, setReceiptMilestone] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [deleteMilestone, setDeleteMilestone] = useState(null);

  const milestonePayments = (milestone) => {
    const linkedIds = new Set(
      (milestone?.paymentTransactions || []).map(idOf),
    );
    const candidates = [
      ...(milestone?.paymentTransactions || []).filter(
        (item) => item && typeof item === "object",
      ),
      ...(booking?.payments || []).filter(
        (item) =>
          linkedIds.has(idOf(item)) ||
          idOf(item.eventFinance?.milestoneId) === idOf(milestone),
      ),
    ];
    return [
      ...new Map(
        candidates
          .filter((item) => !item.isDeleted && item.amount != null)
          .map((item) => [idOf(item), item]),
      ).values(),
    ];
  };
  const viewReceipt = (payment) => {
    setReceiptMilestone(null);
    setSelectedReceipt({
      ...payment,
      paymentDate: payment.paymentDate || payment.transactionDate,
      issuedOn: payment.issuedOn || payment.createdAt || payment.transactionDate,
      paymentStatus: payment.paymentStatus || payment.status,
    });
  };
  const openReceipts = (milestone) => {
    const payments = milestonePayments(milestone);
    if (payments.length === 1) viewReceipt(payments[0]);
    else setReceiptMilestone(milestone);
  };

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
  const hasUnfilteredMilestones =
    !filters.search?.trim() &&
    (!filters.status || filters.status === "all") &&
    (!filters.milestone || filters.milestone === "all");
  const plannedAmount =
    hasUnfilteredMilestones &&
    allMilestoneOptions.length >= pagination.totalMilestones &&
    allMilestoneOptions.every((item) => item.amount != null)
      ? allMilestoneOptions
          .filter((item) => item.status !== "Cancelled")
          .reduce((sum, item) => sum + numberOf(item.amount), 0)
      : hasUnfilteredMilestones && milestones.length >= pagination.totalMilestones
        ? milestones
            .filter(
              (item) =>
                !item.isStandalonePayment && item.status !== "Cancelled",
            )
            .reduce((sum, item) => sum + numberOf(item.amount), 0)
        : null;
  const setFilter = (key, value) =>
    onFiltersChange({
      ...filters,
      [key]: value,
      page: key === "page" ? value : 1,
    });
  const openMilestone = (milestone = null, viewOnly = false) => {
    setSelectedMilestone(milestone);
    setMilestoneViewOnly(viewOnly);
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
            {!readOnly && (
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
            )}
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
                        {milestonePayments(milestone).length ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openReceipts(milestone)}
                            className="h-8 gap-1.5 px-2 text-primary"
                          >
                            <ReceiptText className="h-4 w-4" />
                            {milestonePayments(milestone).length} receipt
                            {milestonePayments(milestone).length === 1 ? "" : "s"}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={milestone.isStandalonePayment}
                            onClick={() => openMilestone(milestone, true)}
                            className="gap-1.5 border-blue-300 bg-transparent text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          {!readOnly && milestone.status !== "Paid" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={
                                milestone.isStandalonePayment ||
                                milestone.status === "Cancelled" ||
                                numberOf(milestone.balance) <= 0
                              }
                              onClick={() => openPayment(milestone)}
                              className="gap-1.5 border-blue-300 bg-transparent text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                            >
                              <IndianRupee className="h-4 w-4" />
                              Record
                            </Button>
                          ) : null}
                          {!readOnly && (
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
                          )}
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
                            {readOnly
                              ? "Adjust the current filters to view milestones."
                              : "Add a milestone or adjust the current filters."}
                          </p>
                        </div>
                        {!readOnly && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMilestone()}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Milestone
                          </Button>
                        )}
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
        booking={booking}
        summary={summary}
        plannedAmount={plannedAmount}
        saving={savingMilestone}
        readOnly={readOnly || milestoneViewOnly}
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
        booking={booking}
        summary={summary}
        readOnly={readOnly}
      />
      <ReceiptsDialog
        milestone={receiptMilestone}
        payments={receiptMilestone ? milestonePayments(receiptMilestone) : []}
        onView={viewReceipt}
        onOpenChange={setReceiptMilestone}
      />
      <EventReceiptPreviewDialog
        receipt={selectedReceipt}
        booking={booking}
        onClose={() => setSelectedReceipt(null)}
      />
      {!readOnly && <AlertDialog
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
      </AlertDialog>}
    </div>
  );
}
