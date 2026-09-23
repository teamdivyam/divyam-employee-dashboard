/* eslint-disable react/prop-types */
import EventQuotationsPanel from './EventQuotationsPanel';
import EventMetricCards from './EventMetricCards';
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

import EventReceiptPreviewDialog from "./EventReceiptPreviewDialog";
import EventDeleteMenu from "./EventDeleteMenu";

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

export function InvoiceSummary({ summary = {} }) {
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
  return <EventMetricCards items={cards} />;
}

export function ReceiptSummary({ summary = {} }) {
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

  return <EventMetricCards items={cards} />;
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
          <p className="font-semibold">Unable to load invoices</p>
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
  readOnly = false,
  booking,
  view,
  onViewChange,
  data,
  filters,
  onFiltersChange,
  loading,
  error,
  onRetry,
  onCreateInvoice,
  onDeleteInvoice,
  onDeleteReceipt,
  creatingInvoice,
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const tabs = useMemo(() => [
    { value: "quotations", label: "Quotation", icon: FileText },
    { value: "invoices", label: `Invoices (${numberOf(data?.counts?.invoices)})`, icon: ReceiptText },
  ], [data?.counts?.invoices]);
  const tabNavigation = (
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
          listClassName="[&.tab-comp-detail-list.tab-comp-compact-list]:!h-9 [&_.tab-comp-trigger.tab-comp-detail-trigger.tab-comp-compact-trigger]:!h-9 [&_.tab-comp-trigger[data-state=active]]:!bg-blue-50 dark:[&_.tab-comp-trigger[data-state=active]]:!bg-blue-400/10"
          ariaLabel="Quotation and invoices views"
        />
  );
  if (view === "quotations") return <Card className="min-w-0 overflow-hidden"><CardContent className="p-0"><EventQuotationsPanel tabs={tabNavigation} readOnly={readOnly} /></CardContent></Card>;
  const setFilter = (key, value) =>
    onFiltersChange({ ...filters, [key]: value, page: 1 });

  return (
    <div className="space-y-4">
      <Card className="min-w-0 overflow-hidden">
        <CardContent className="p-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        {tabNavigation}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-44 flex-1 basis-44">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(event) => setFilter("search", event.target.value)}
              className="h-9 pl-9 text-xs"
              placeholder="Search invoice number or title..."
              aria-label="Search invoices"
            />
          </div>
          {view === "invoices" ? (
            <Select
              value={filters.paymentStatus}
              onValueChange={(value) => setFilter("paymentStatus", value)}
            >
              <SelectTrigger className="h-9 w-full text-xs sm:w-44">
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
            <SelectTrigger className="h-9 w-full text-xs sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Date Range</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="this-year">This year</SelectItem>
            </SelectContent>
          </Select>
          {!readOnly && <Button variant="custom" size="sm" onClick={() => setCreateOpen(true)} className="h-9 gap-2">
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>}
        </div>
      </div>
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : (
        <>

          <div className="min-w-0">
              <div className="overflow-x-auto">
                {view === "receipts" ? (
                  <Table headerVariant="section" className="min-w-[1200px] table-fixed text-xs [&_tbody_.inline-flex]:text-[10px]">
                    <colgroup><col className="w-[15%]" /><col className="w-[12%]" /><col className="w-[12%]" /><col className="w-[13%]" /><col className="w-[16%]" /><col className="w-[12%]" /><col className="w-[10%]" /><col className="w-[10%]" /></colgroup>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Receipt No.</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Payment Mode</TableHead>
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
                            <TableCell className="sticky right-0 bg-card text-right"><div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-blue-700"
                                onClick={() => setSelectedReceipt(receipt)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                              {!readOnly && <EventDeleteMenu label={receipt.receiptNumber || 'receipt'} onDelete={onDeleteReceipt ? () => { if (window.confirm('Void this receipt and its client payment?')) onDeleteReceipt(receipt); } : undefined} />}
                            </div></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="h-40 text-center text-muted-foreground"
                          >
                            No receipts match the current filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                ) : (
                  <Table headerVariant="section" className="min-w-[1120px] table-fixed text-xs [&_tbody_.inline-flex]:text-[10px]">
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
                            <TableCell className="sticky right-0 bg-card text-right"><div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-blue-700"
                                onClick={() => setSelectedInvoice(invoice)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Invoice
                              </Button>
                              {!readOnly && <EventDeleteMenu label={invoice.invoiceNo || 'invoice'} onDelete={onDeleteInvoice ? () => { if (window.confirm(`Delete invoice ${invoice.invoiceNo}?`)) onDeleteInvoice(invoice); } : undefined} />}
                            </div></TableCell>
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
          </div>
        </>
      )}
        </CardContent>
      </Card>
      {!readOnly && <CreateInvoiceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        options={data?.options || {}}
        saving={creatingInvoice}
        onSave={onCreateInvoice}
      />}
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

      <EventReceiptPreviewDialog receipt={selectedReceipt} booking={booking} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
}
