/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CircleAlert,
  Eye,
  FileCheck2,
  FileText,
  Loader2,
  Plus,
  ReceiptText,
  Search,
} from "lucide-react";

import TabComp from "@components/components/tab-comp";
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
import FinancePaginationFooter from "./FinancePaginationFooter";

const statusClasses = {
  Paid: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  Partial:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  Unpaid:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  Overdue:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
};

const linkClasses = {
  Milestone:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  "Change Order":
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  "Additional Service":
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  Other: "border-border bg-muted text-muted-foreground",
};

function InvoiceSummary({ summary = {} }) {
  const cards = [
    {
      label: "Issued Invoice Value",
      value: currency(summary.issuedInvoiceValue),
      icon: FileText,
      tone: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    },
    {
      label: "Total Received",
      value: currency(summary.totalReceived),
      icon: Banknote,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    },
    {
      label: "Outstanding",
      value: currency(summary.outstanding),
      icon: ReceiptText,
      tone: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
    },
    {
      label: "Overdue",
      value: currency(summary.overdue),
      icon: CircleAlert,
      tone: "bg-red-500/10 text-red-600 dark:text-red-300",
    },
  ];
  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, icon: Icon, tone }, index) => (
            <div
              key={label}
              className={`flex min-h-24 items-center gap-4 p-4 ${index ? "border-t border-border sm:border-l sm:border-t-0" : ""}`}
            >
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${tone}`}
              >
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p
                  className={`mt-1 text-xl font-bold ${label === "Overdue" ? "text-destructive" : label === "Total Received" ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"}`}
                >
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t bg-blue-50/70 px-4 py-2 text-xs text-blue-950 dark:bg-blue-950/25 dark:text-blue-200">
          <span className="inline-flex items-center gap-2">
            <CircleAlert className="h-4 w-4" />
            Contract Value <strong>{currency(summary.contractValue)}</strong>
          </span>
          <span>•</span>
          <span>
            Invoiced <strong>{currency(summary.issuedInvoiceValue)}</strong>
          </span>
          <span>•</span>
          <span>
            Uninvoiced <strong>{currency(summary.uninvoiced)}</strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ReceiptSummary({ summary = {} }) {
  const cards = [
    {
      label: "Total Receipts",
      value: currency(summary.totalReceipts),
      icon: Banknote,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
      valueClass: "text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Receipts Issued",
      value: numberOf(summary.receiptsIssued),
      icon: FileCheck2,
      tone: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
      valueClass: "text-foreground",
    },
    {
      label: "Unallocated",
      value: currency(summary.unallocated),
      icon: ReceiptText,
      tone: "bg-orange-500/10 text-orange-600 dark:text-orange-300",
      valueClass: "text-orange-600 dark:text-orange-300",
    },
    {
      label: "Cancelled",
      value: numberOf(summary.cancelled),
      icon: CircleAlert,
      tone: "bg-red-500/10 text-red-600 dark:text-red-300",
      valueClass: "text-destructive",
    },
  ];

  return (
    <Card>
      <CardContent className="grid p-0 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone, valueClass }, index) => (
          <div
            key={label}
            className={`flex min-h-24 items-center gap-4 p-4 ${index ? "border-t border-border sm:border-l sm:border-t-0" : ""}`}
          >
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${tone}`}>
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`mt-1 text-xl font-bold ${valueClass}`}>{value}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CreateInvoiceDialog({ open, onOpenChange, options, saving, onSave }) {
  const [form, setForm] = useState({
    title: "",
    linkedToLabel: "",
    linkedToType: "Milestone",
    invoiceNo: "",
    invoiceDate: "",
    dueDate: "",
    taxableAmount: "",
    gstRate: "18",
    invoiceType: "Tax Invoice",
    placeOfSupply: "",
    notes: "",
    invoiceDocument: null,
  });
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + 7);
    setForm({
      title: "",
      linkedToLabel: "",
      linkedToType: "Milestone",
      invoiceNo: "",
      invoiceDate: today.toISOString().slice(0, 10),
      dueDate: due.toISOString().slice(0, 10),
      taxableAmount: "",
      gstRate: "18",
      invoiceType: options.invoiceTypes?.[0] || "Tax Invoice",
      placeOfSupply: "",
      notes: "",
      invoiceDocument: null,
    });
    setError("");
  }, [open, options.invoiceTypes]);
  const update = (key, value) =>
    setForm((state) => ({ ...state, [key]: value }));
  const total =
    numberOf(form.taxableAmount) * (1 + numberOf(form.gstRate) / 100);
  const submit = async (event) => {
    event.preventDefault();
    if (
      !form.title.trim() ||
      !form.linkedToLabel.trim() ||
      numberOf(form.taxableAmount) <= 0
    )
      return setError(
        "Title, linked milestone/service, and taxable amount are required.",
      );
    if (form.dueDate && form.invoiceDate && form.dueDate < form.invoiceDate)
      return setError("Due date cannot be before the issue date.");
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        linkedToLabel: form.linkedToLabel.trim(),
        taxableAmount: numberOf(form.taxableAmount),
        gstRate: numberOf(form.gstRate),
        placeOfSupply: form.placeOfSupply.trim(),
        notes: form.notes.trim(),
      });
      onOpenChange(false);
    } catch {
      /* Page mutation displays the error toast. */
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Event Invoice</DialogTitle>
          <DialogDescription>
            Create an invoice linked to a payment milestone, change order, or
            additional service.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-event-invoice"
          onSubmit={submit}
          className="grid gap-4 py-2 sm:grid-cols-2"
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="invoice-title">Invoice Title</Label>
            <Input
              id="invoice-title"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Booking Advance Invoice"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Linked To Type</Label>
            <Select
              value={form.linkedToType}
              onValueChange={(value) => update("linkedToType", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(options.linkedToTypes || []).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice-linked-label">Milestone / Service</Label>
            <Input
              id="invoice-linked-label"
              value={form.linkedToLabel}
              onChange={(event) => update("linkedToLabel", event.target.value)}
              placeholder="Booking Advance"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice-number">Invoice Number</Label>
            <Input
              id="invoice-number"
              value={form.invoiceNo}
              onChange={(event) => update("invoiceNo", event.target.value)}
              placeholder="Auto-generated if blank"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Invoice Type</Label>
            <Select
              value={form.invoiceType}
              onValueChange={(value) => update("invoiceType", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(options.invoiceTypes || []).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice-date">Issued On</Label>
            <Input
              id="invoice-date"
              type="date"
              value={form.invoiceDate}
              onChange={(event) => update("invoiceDate", event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice-due-date">Due Date</Label>
            <Input
              id="invoice-due-date"
              type="date"
              value={form.dueDate}
              onChange={(event) => update("dueDate", event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice-taxable">Taxable Amount</Label>
            <Input
              id="invoice-taxable"
              type="number"
              min="1"
              step="0.01"
              value={form.taxableAmount}
              onChange={(event) => update("taxableAmount", event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice-gst">GST Rate (%)</Label>
            <Input
              id="invoice-gst"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.gstRate}
              onChange={(event) => update("gstRate", event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice-place">Place of Supply</Label>
            <Input
              id="invoice-place"
              value={form.placeOfSupply}
              onChange={(event) => update("placeOfSupply", event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice-document">Invoice PDF</Label>
            <Input
              id="invoice-document"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) =>
                update("invoiceDocument", event.target.files?.[0] || null)
              }
            />
          </div>
          <div className="rounded-md border bg-muted/30 p-3 text-sm sm:col-span-2">
            <span className="text-muted-foreground">
              Invoice total including GST:
            </span>{" "}
            <strong>{currency(total)}</strong>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="invoice-notes">Notes</Label>
            <Textarea
              id="invoice-notes"
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive sm:col-span-2">{error}</p>
          ) : null}
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button variant="custom" type="submit" form="create-event-invoice" disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <Card>
      <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
        <CircleAlert className="h-8 w-8 text-destructive" />
        <div>
          <p className="font-semibold">Unable to load invoices and receipts</p>
          <p className="text-sm text-muted-foreground">
            {error?.response?.data?.message ||
              "Please check the connection and try again."}
          </p>
        </div>
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}

export default function EventInvoicesReceiptsPanel({
  view,
  onViewChange,
  data,
  filters,
  onFiltersChange,
  loading,
  error,
  onRetry,
  onCreateInvoice,
  creatingInvoice,
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const tabs = useMemo(
    () => [
      {
        value: "invoices",
        label: `Invoices (${numberOf(data?.counts?.invoices)})`,
        icon: FileText,
      },
      {
        value: "receipts",
        label: `Receipts (${numberOf(data?.counts?.receipts)})`,
        icon: ReceiptText,
      },
    ],
    [data?.counts?.invoices, data?.counts?.receipts],
  );
  const setFilter = (key, value) =>
    onFiltersChange({ ...filters, [key]: value, page: 1 });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <TabComp
          tabs={tabs}
          value={view}
          onValueChange={onViewChange}
          variant="detail"
          distribution="content"
          density="compact"
          display="inline-block"
          flush
          className="shrink-0"
          listClassName="[&_.tab-comp-trigger[data-state=active]]:!bg-blue-50 dark:[&_.tab-comp-trigger[data-state=active]]:!bg-blue-400/10"
          ariaLabel="Invoices and receipts views"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row xl:justify-end">
          <div className="relative min-w-0 flex-1 xl:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(event) => setFilter("search", event.target.value)}
              className="pl-9"
              placeholder="Search invoice or receipt..."
              aria-label="Search invoices or receipts"
            />
          </div>
          {view === "invoices" ? (
            <Select
              value={filters.paymentStatus}
              onValueChange={(value) => setFilter("paymentStatus", value)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Payment Status</SelectItem>
                {(data?.options?.paymentStatuses || []).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Select
            value={filters.dateRange}
            onValueChange={(value) => setFilter("dateRange", value)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Date Range</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="this-year">This year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="custom" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : (
        <>
          {view === "receipts" ? (
            <ReceiptSummary summary={data?.receiptSummary} />
          ) : (
            <InvoiceSummary summary={data?.summary} />
          )}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {view === "receipts" ? (
                  <Table className="min-w-[1200px] table-fixed">
                    <colgroup>
                      <col className="w-[11%]" />
                      <col className="w-[10%]" />
                      <col className="w-[9%]" />
                      <col className="w-[11%]" />
                      <col className="w-[16%]" />
                      <col className="w-[14%]" />
                      <col className="w-[10%]" />
                      <col className="w-[8%]" />
                      <col className="w-[11%]" />
                    </colgroup>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Receipt No.</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Payment Mode</TableHead>
                        <TableHead>Linked To</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Issued On</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="sticky right-0 z-10 bg-muted/40 text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.receipts?.length ? (
                        data.receipts.map((receipt) => (
                          <TableRow key={idOf(receipt)}>
                            <TableCell className="font-medium text-blue-950 dark:text-blue-200">
                              {receipt.receiptNumber || "—"}
                            </TableCell>
                            <TableCell>
                              {shortDate(
                                receipt.paymentDate || receipt.receiptDate,
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {currency(receipt.amount)}
                            </TableCell>
                            <TableCell>{receipt.paymentMode || "—"}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={linkClasses.Milestone}
                              >
                                {receipt.linkedToLabel ||
                                  receipt.linkedInvoiceNumber ||
                                  "Event Payment"}
                              </Badge>
                            </TableCell>
                            <TableCell>{receipt.reference || "—"}</TableCell>
                            <TableCell>
                              {shortDate(
                                receipt.issuedOn || receipt.receiptDate,
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  receipt.receiptStatus === "Cancelled"
                                    ? statusClasses.Overdue
                                    : statusClasses.Paid
                                }
                              >
                                {receipt.receiptStatus || "Issued"}
                              </Badge>
                            </TableCell>
                            <TableCell className="sticky right-0 bg-card text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-blue-700"
                                onClick={() => setSelectedReceipt(receipt)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Receipt
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="h-40 text-center text-muted-foreground"
                          >
                            No receipts match the current filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                ) : (
                  <Table className="min-w-[1120px] table-fixed">
                    <colgroup>
                      <col className="w-[16%]" />
                      <col className="w-[11%]" />
                      <col className="w-[10%]" />
                      <col className="w-[10%]" />
                      <col className="w-[10%]" />
                      <col className="w-[9%]" />
                      <col className="w-[11%]" />
                      <col className="w-[11%]" />
                      <col className="w-[12%]" />
                    </colgroup>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Invoice / Title</TableHead>
                        <TableHead>Linked To</TableHead>
                        <TableHead>Issued On</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">
                          Outstanding
                        </TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead className="sticky right-0 z-10 bg-muted/40 text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.invoices?.length ? (
                        data.invoices.map((invoice) => (
                          <TableRow key={idOf(invoice)}>
                            <TableCell>
                              <p className="text-xs text-muted-foreground">
                                {invoice.invoiceNo}
                              </p>
                              <p className="font-semibold text-blue-950 dark:text-blue-200">
                                {invoice.title}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  linkClasses[invoice.linkedToType] ||
                                  linkClasses.Other
                                }
                              >
                                {invoice.linkedToLabel}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {shortDate(invoice.invoiceDate)}
                            </TableCell>
                            <TableCell>{shortDate(invoice.dueDate)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {currency(invoice.totalInvoiceValue)}
                            </TableCell>
                            <TableCell className="text-right">
                              {currency(invoice.receivedAmount)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {currency(invoice.outstandingAmount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  statusClasses[invoice.paymentStatus] ||
                                  statusClasses.Unpaid
                                }
                              >
                                {invoice.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="sticky right-0 bg-card text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-blue-700"
                                onClick={() => setSelectedInvoice(invoice)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Invoice
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="h-40 text-center text-muted-foreground"
                          >
                            No invoices match the current filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
              <FinancePaginationFooter
                pagination={data?.pagination}
                onChange={(values) =>
                  onFiltersChange({ ...filters, ...values })
                }
              />
            </CardContent>
          </Card>
        </>
      )}
      <CreateInvoiceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        options={data?.options || {}}
        saving={creatingInvoice}
        onSave={onCreateInvoice}
      />
      <Dialog
        open={Boolean(selectedInvoice)}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedInvoice?.title}</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoiceNo} · {selectedInvoice?.linkedToLabel}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Invoice Value</p>
              <p className="font-semibold">
                {currency(selectedInvoice?.totalInvoiceValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment Status</p>
              <p className="font-semibold">{selectedInvoice?.paymentStatus}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Received</p>
              <p className="font-semibold">
                {currency(selectedInvoice?.receivedAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="font-semibold">
                {currency(selectedInvoice?.outstandingAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Issued On</p>
              <p className="font-semibold">
                {shortDate(selectedInvoice?.invoiceDate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Due Date</p>
              <p className="font-semibold">
                {shortDate(selectedInvoice?.dueDate)}
              </p>
            </div>
          </div>
          {selectedInvoice?.invoiceDocument?.fileUrl ? (
            <Button variant="outline" asChild>
              <a
                href={selectedInvoice.invoiceDocument.fileUrl}
                target="_blank"
                rel="noreferrer"
              >
                <FileCheck2 className="mr-2 h-4 w-4" />
                Open Invoice PDF
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              No invoice PDF is attached.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(selectedReceipt)}
        onOpenChange={(open) => !open && setSelectedReceipt(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedReceipt?.receiptTitle}</DialogTitle>
            <DialogDescription>
              {selectedReceipt?.receiptNumber} ·{" "}
              {shortDate(selectedReceipt?.receiptDate)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-semibold">
                {currency(selectedReceipt?.amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment Mode</p>
              <p className="font-semibold">{selectedReceipt?.paymentMode}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Linked Invoice</p>
              <p className="font-semibold">
                {selectedReceipt?.linkedInvoiceNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Transaction</p>
              <p className="font-semibold">{selectedReceipt?.transactionId}</p>
            </div>
          </div>
          {selectedReceipt?.receiptDocuments?.length ? (
            <div className="flex flex-wrap gap-2">
              {selectedReceipt.receiptDocuments.map((document) => (
                <Button
                  key={idOf(document) || document.fileUrl}
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={document.fileUrl} target="_blank" rel="noreferrer">
                    <Eye className="mr-2 h-4 w-4" />
                    {document.fileName || "View proof"}
                  </a>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This receipt was generated without an uploaded proof.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReceipt(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
