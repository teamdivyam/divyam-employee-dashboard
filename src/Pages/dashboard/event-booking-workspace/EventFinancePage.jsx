/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  ChevronDown,
  ChevronUp,
  FileArchive,
  FileText,
  Eye,
  IndianRupee,
  Loader2,
  Minus,
  NotebookText,
  Pencil,
  Plus,
  ReceiptText,
  UploadCloud,
  WalletCards,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import AdminService from "../../../services/event-booking-workspace.service";
import TabComp from "@components/components/tab-comp";
import { Badge } from "@components/components/ui/badge";
import { Button } from "@components/components/ui/button";
import { Card, CardContent } from "@components/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/EventTable";
import { Textarea } from "@components/components/ui/textarea";
import {
  EditBookingDialog,
  getBookingDetail,
  getEmployees,
} from "./components/EventBookingComponents";
import EventClientPaymentsPanel from "./components/EventClientPaymentsPanel";
import EventCostSettlementsPanel from "./components/EventCostSettlementsPanel";
import EventDocumentsPanel from "./components/EventDocumentsPanel";
import EventInvoicesReceiptsPanel from "./components/EventInvoicesReceiptsPanel";
import EventDetailTabs from "./components/EventDetailTabs";
import EventFunctionsHeader from "./components/EventFunctionsHeader";
import { getFinalPreferenceCount } from "./eventBookingDashboard.utils";
import { currency, idOf, numberOf, shortDate } from "./eventFinance.utils";
import useDebouncedValue from "../../../hooks/useDebouncedValue";
import useCurrentEmployee from "../../../hooks/useCurrentEmployee";

const financeTabs = [
  { key: "commercial", label: "Commercial", icon: IndianRupee },
  { key: "payments", label: "Client Payments", icon: WalletCards },
  { key: "costs", label: "Cost & Settlements", icon: Banknote },
  { key: "invoices", label: "Quotation & Invoices", icon: ReceiptText },
  { key: "documents", label: "Documents", icon: FileArchive },
];
function FinanceNav({ active, eventId, searchParams }) {
  const navigate = useNavigate();
  const selectTab = (key) => {
    const next = new URLSearchParams(searchParams);
    if (key === "commercial") next.delete("tab");
    else next.set("tab", key);
    if (key !== "costs") next.delete("costTab");
    if (key !== "invoices") next.delete("invoiceTab");
    const query = next.toString();
    navigate(
      `/dashboard/assigned-events/${eventId}/finance${query ? `?${query}` : ""}`,
    );
  };
  return (
    <TabComp
      tabs={financeTabs.map(({ key, ...tab }) => ({ ...tab, value: key }))}
      value={active}
      onValueChange={selectTab}
      variant="detail"
      distribution="content"
      density="compact"
      ariaLabel="Finance and files sections"
    />
  );
}

const emptyChange = {
  changeDate: "",
  title: "",
  description: "",
  functionId: "all",
  type: "Addition",
  amount: "",
  status: "Pending",
  reference: "",
};
function CommercialChangeDialog({
  open,
  onOpenChange,
  change,
  functions,
  saving,
  onSave,
  readOnly = false,
}) {
  const [form, setForm] = useState(emptyChange);
  useEffect(() => {
    if (open)
      setForm(
        change
          ? {
              changeDate: change.changeDate
                ? new Date(change.changeDate).toISOString().slice(0, 10)
                : "",
              title: change.title || "",
              description: change.description || "",
              functionId: idOf(change.function) || "all",
              type: change.type || "Addition",
              amount: numberOf(change.amount) || "",
              status: change.status || "Pending",
              reference: change.reference || "",
            }
          : {
              ...emptyChange,
              changeDate: new Date().toISOString().slice(0, 10),
            },
      );
  }, [change, open]);
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    if (readOnly) return;
    const eventFunction = functions.find(
      (item) => idOf(item) === form.functionId,
    );
    onSave({
      changeDate: form.changeDate,
      title: form.title.trim(),
      description: form.description.trim(),
      function: eventFunction?._id || null,
      functionName: eventFunction?.name || "All Functions",
      type: form.type,
      amount: numberOf(form.amount),
      status: form.status,
      reference: form.reference.trim(),
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? "Commercial Change Details"
              : change
                ? "Commercial Change"
                : "Add Commercial Change"}
          </DialogTitle>
        </DialogHeader>
        <form
          id="commercial-change-form"
          onSubmit={submit}
          className="grid gap-4 py-2 sm:grid-cols-2"
        >
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={form.changeDate}
              onChange={(event) => update("changeDate", event.target.value)}
              disabled={readOnly}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Function</Label>
            <Select
              value={form.functionId}
              onValueChange={(value) => update("functionId", value)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Functions</SelectItem>
                {functions.map((item) => (
                  <SelectItem key={idOf(item)} value={idOf(item)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              disabled={readOnly}
              placeholder="Additional lighting for main stage"
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              disabled={readOnly}
              className="min-h-20"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(value) => update("type", value)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Addition">Addition</SelectItem>
                <SelectItem value="Reduction">Reduction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input
              type="number"
              min="0"
              value={form.amount}
              onChange={(event) => update("amount", event.target.value)}
              disabled={readOnly}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => update("status", value)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Draft", "Pending", "Approved", "Rejected"].map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Reference</Label>
            <Input
              value={form.reference}
              onChange={(event) => update("reference", event.target.value)}
              disabled={readOnly}
              placeholder="Client discussion / email"
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly && (
            <Button
              variant="custom"
              type="submit"
              form="commercial-change-form"
              disabled={saving || !form.title.trim() || !numberOf(form.amount)}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {change ? "Save Changes" : "Add Change"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CommercialNoteDialog({ open, onOpenChange, saving, onSave }) {
  const [note, setNote] = useState("");
  useEffect(() => {
    if (open) setNote("");
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Commercial Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label>Note</Label>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="min-h-28"
            placeholder="Special commercial terms or internal remarks"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="custom"
            disabled={saving || !note.trim()}
            onClick={() =>
              onSave({
                note: note.trim(),
                createdByName: "Admin",
                noteDate: new Date(),
              })
            }
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add
            Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AcceptedProposalDialog({
  open,
  onOpenChange,
  saving,
  defaultAcceptedBy,
  taxRate,
  onSave,
}) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    acceptedOn: "",
    acceptedByName: "",
    taxRate: "18",
    note: "",
    file: null,
  });
  const [fileError, setFileError] = useState("");
  useEffect(() => {
    if (!open) return;
    setForm({
      title: "",
      amount: "",
      acceptedOn: new Date().toISOString().slice(0, 10),
      acceptedByName: defaultAcceptedBy || "",
      taxRate: String(taxRate ?? 18),
      note: "",
      file: null,
    });
    setFileError("");
  }, [defaultAcceptedBy, open, taxRate]);
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const chooseFile = (file) => {
    if (!file) return;
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    )
      return setFileError("Please select a PDF proposal.");
    if (file.size > 10 * 1024 * 1024)
      return setFileError("Proposal PDF must be 10 MB or smaller.");
    setFileError("");
    update("file", file);
  };
  const submit = (event) => {
    event.preventDefault();
    if (!form.file) return setFileError("Proposal PDF is required.");
    onSave({
      ...form,
      title: form.title.trim(),
      amount: numberOf(form.amount),
      acceptedByName: form.acceptedByName.trim(),
      note: form.note.trim(),
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Attach Accepted Proposal</DialogTitle>
        </DialogHeader>
        <form
          id="accepted-proposal-form"
          onSubmit={submit}
          className="grid gap-4 py-2 sm:grid-cols-2"
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Proposal Title</Label>
            <Input
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Wedding Proposal - Client Name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Proposal Amount</Label>
            <Input
              type="number"
              min="0"
              value={form.amount}
              onChange={(event) => update("amount", event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>GST Rate (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={form.taxRate}
              onChange={(event) => update("taxRate", event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Accepted On</Label>
            <Input
              type="date"
              value={form.acceptedOn}
              onChange={(event) => update("acceptedOn", event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Accepted By</Label>
            <Input
              value={form.acceptedByName}
              onChange={(event) => update("acceptedByName", event.target.value)}
              placeholder="Client name"
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Proposal PDF</Label>
            <label className="flex min-h-24 cursor-pointer items-center justify-center gap-3 rounded-md border border-dashed border-blue-300 bg-blue-50/40 px-4 text-center text-xs text-blue-700 hover:bg-blue-50">
              <UploadCloud className="h-5 w-5" />
              <span>
                {form.file?.name || "Choose proposal PDF (max 10 MB)"}
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
            </label>
            {fileError && (
              <p className="text-[11px] text-red-600">{fileError}</p>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Internal Note</Label>
            <Textarea
              value={form.note}
              onChange={(event) => update("note", event.target.value)}
              className="min-h-20"
              placeholder="Optional proposal note"
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="custom"
            type="submit"
            form="accepted-proposal-form"
            disabled={
              saving ||
              !form.title.trim() ||
              form.amount === "" ||
              !form.acceptedByName.trim()
            }
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Attach
            & Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContractTermsDialog({
  open,
  onOpenChange,
  breakdown,
  saving,
  onSave,
}) {
  const [form, setForm] = useState({ baseProposalValue: "", taxRate: "18" });
  useEffect(() => {
    if (open)
      setForm({
        baseProposalValue: String(numberOf(breakdown?.baseProposalValue) || ""),
        taxRate: String(breakdown?.taxRate ?? 18),
      });
  }, [breakdown, open]);
  const submit = (event) => {
    event.preventDefault();
    onSave({
      baseProposalValue: numberOf(form.baseProposalValue),
      taxRate: numberOf(form.taxRate),
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Contract Value</DialogTitle>
        </DialogHeader>
        <form
          id="contract-terms-form"
          onSubmit={submit}
          className="space-y-4 py-2"
        >
          <div className="space-y-1.5">
            <Label>Base Proposal Value (Before Tax)</Label>
            <Input
              type="number"
              min="0"
              value={form.baseProposalValue}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  baseProposalValue: event.target.value,
                }))
              }
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>GST Rate (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={form.taxRate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  taxRate: event.target.value,
                }))
              }
              required
            />
          </div>
          <p className="text-[11px] leading-5 text-muted-foreground">
            Approved commercial additions and reductions are automatically
            applied to this base value.
          </p>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="custom"
            type="submit"
            form="contract-terms-form"
            disabled={saving || form.baseProposalValue === ""}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
            Breakdown
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const statusTone = (status) =>
  status === "Approved" || status === "Received" || status === "Paid"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "Rejected" || status === "Overdue"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

function CommercialPanel({
  finance,
  onAttachProposal,
  onEditTerms,
  onAddChange,
  onViewChange,
  onAddNote,
  readOnly = false,
}) {
  const proposal = finance.acceptedProposal;
  const breakdown = finance.breakdown || {};
  const [notesOpen, setNotesOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold">Accepted Proposal</h2>
              <div className="flex items-center gap-2">
                {proposal && (
                  <Badge className="border-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                    {proposal.status}
                  </Badge>
                )}
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAttachProposal}
                    className="gap-1.5"
                  >
                    <UploadCloud className="h-4 w-4" />
                    {proposal ? "Replace" : "Attach Proposal"}
                  </Button>
                )}
              </div>
            </div>
            {proposal ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-[90px_1fr]">
                <div className="grid h-32 place-items-center rounded-md bg-slate-900 text-center text-[10px] font-semibold text-amber-300">
                  <span>
                    DIVYAM
                    <br />
                    WEDDING
                    <br />
                    PROPOSAL
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <p>
                    <span className="inline-block w-28 text-muted-foreground">
                      Proposal Title
                    </span>
                    <strong>{proposal.title}</strong>
                  </p>
                  <p>
                    <span className="inline-block w-28 text-muted-foreground">
                      Version
                    </span>
                    v{proposal.version} (Final)
                  </p>
                  <p>
                    <span className="inline-block w-28 text-muted-foreground">
                      Accepted On
                    </span>
                    {shortDate(proposal.acceptedOn)}
                  </p>
                  <p>
                    <span className="inline-block w-28 text-muted-foreground">
                      Accepted By
                    </span>
                    {proposal.acceptedBy || "-"}
                  </p>
                  {proposal.fileUrl && (
                    <div className="flex items-center">
                      <span className="inline-block w-28 shrink-0 text-muted-foreground">
                        File
                      </span>
                      <a
                        href={proposal.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-w-0 items-center gap-2 font-semibold text-blue-700"
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {proposal.fileName || "Uploaded proposal"}
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-32 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                <span>No proposal is attached to this booking.</span>
                {!readOnly && (
                  <Button
                    size="sm"
                    onClick={onAttachProposal}
                    className="gap-2"
                    variant="custom"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Attach Accepted Proposal
                  </Button>
                )}
              </div>
            )}
            {proposal?.fileUrl && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="mt-3 gap-2"
              >
                <a href={proposal.fileUrl} target="_blank" rel="noreferrer">
                  <Eye className="h-4 w-4" />
                  View Proposal
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold">Contract Value Breakdown</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline">GST {breakdown.taxRate || 0}%</Badge>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEditTerms}
                    className="gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-4 divide-y rounded-md border text-xs">
              <div className="flex justify-between p-2.5">
                <span>Base Proposal Value (Before Tax)</span>
                <strong>{currency(breakdown.baseProposalValue)}</strong>
              </div>
              <div className="flex justify-between p-2.5 text-emerald-700">
                <span className="flex items-center gap-2">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300">
                    <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                  </span>
                  Approved Additions
                </span>
                <strong>{currency(breakdown.additions)}</strong>
              </div>
              <div className="flex justify-between p-2.5 text-red-600">
                <span className="flex items-center gap-2">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-100 text-red-700 dark:bg-red-400/20 dark:text-red-300">
                    <Minus aria-hidden="true" className="h-3.5 w-3.5" />
                  </span>
                  Approved Reductions / Discount
                </span>
                <strong>- {currency(breakdown.reductions)}</strong>
              </div>
              <div className="flex justify-between bg-blue-50/60 p-2.5">
                <strong>Total Value (Before Tax)</strong>
                <strong>{currency(breakdown.beforeTax)}</strong>
              </div>
              <div className="flex justify-between p-2.5">
                <span className="flex items-center gap-2">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-300">
                    <ReceiptText aria-hidden="true" className="h-3.5 w-3.5" />
                  </span>
                  GST ({breakdown.taxRate || 0}%)
                </span>
                <strong>{currency(breakdown.gstAmount)}</strong>
              </div>
              <div className="flex justify-between bg-blue-50 p-3 text-base text-blue-950 dark:bg-blue-400/10 dark:text-blue-100">
                <strong className="flex items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-300">
                    <IndianRupee aria-hidden="true" className="h-4 w-4" />
                  </span>
                  Final Contract Value (Incl. GST)
                </strong>
                <strong>{currency(breakdown.finalContractValue)}</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="flex items-center gap-2 font-bold">
                <NotebookText className="h-5 w-5 text-blue-800" />
                Commercial Changes
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Approved additions, reductions, and adjustments to the proposal.
              </p>
            </div>
            {!readOnly && (
              <Button
                size="sm"
                onClick={onAddChange}
                className="gap-1.5"
                variant="custom"
              >
                <Plus className="h-4 w-4" />
                Add Change
              </Button>
            )}
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-muted/25">
                  <TableHead>#</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Title / Description</TableHead>
                  <TableHead>Function</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finance.commercialChanges?.length ? (
                  finance.commercialChanges.map((change) => (
                    <TableRow key={change._id}>
                      <TableCell className="text-xs">
                        {change.changeCode}
                      </TableCell>
                      <TableCell className="text-xs">
                        {shortDate(change.changeDate)}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{change.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {change.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700"
                        >
                          {change.functionDetail?.name ||
                            change.functionName ||
                            "All Functions"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            change.type === "Addition"
                              ? "border-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                              : "border-0 bg-pink-50 text-pink-700 hover:bg-pink-50"
                          }
                        >
                          {change.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {currency(change.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusTone(change.status)}
                        >
                          {change.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {change.reference || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewChange(change)}
                          className="gap-1 text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-28 text-center text-muted-foreground"
                    >
                      No commercial changes added.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <button
            type="button"
            onClick={() => setNotesOpen((value) => !value)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
          >
            <NotebookText className="h-5 w-5 text-blue-800" />
            <div>
              <h2 className="font-bold">Commercial Notes</h2>
              <p className="text-[11px] text-muted-foreground">
                Internal notes, special terms, or important remarks.
              </p>
            </div>
            <Badge variant="outline" className="ml-auto">
              {finance.commercialNotes?.length || 0} Notes
            </Badge>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  onAddNote();
                }}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Note
              </Button>
            )}
            {notesOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {notesOpen && (
            <div className="space-y-2 border-t p-4">
              {finance.commercialNotes?.length ? (
                finance.commercialNotes.map((note) => (
                  <div
                    key={note._id}
                    className="rounded-md border bg-muted/20 p-3 text-xs"
                  >
                    <p>{note.note}</p>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      {note.createdByName || "Admin"} ·{" "}
                      {shortDate(note.noteDate)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No commercial notes added.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function EventFinancePage() {
  const { eventId, section: routeSection } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: currentEmployee } = useCurrentEmployee();
  const canManageFinance = ["Super Admin", "Admin"].includes(currentEmployee?.accessRole);
  const [searchParams] = useSearchParams();
  const requestedSection = searchParams.get("tab") || routeSection;
  const section = financeTabs.some((item) => item.key === requestedSection)
    ? requestedSection
    : "commercial";
  const requestedCostView = searchParams.get("costTab");
  const costView = ["vendors", "expenses"].includes(requestedCostView)
    ? requestedCostView
    : "vendors";
  const requestedInvoiceView = searchParams.get("invoiceTab");
  const invoiceView =
    requestedInvoiceView === "invoices" ? "invoices" : "quotations";
  const [changeOpen, setChangeOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [editBookingOpen, setEditBookingOpen] = useState(false);
  const [paymentFilters, setPaymentFilters] = useState({
    search: "",
    status: "all",
    milestone: "all",
    page: 1,
    limit: 10,
  });
  const [vendorFilters, setVendorFilters] = useState({
    search: "",
    service: "all",
    status: "all",
    page: 1,
    limit: 10,
  });
  const [expenseFilters, setExpenseFilters] = useState({
    search: "",
    category: "all",
    approvalStatus: "all",
    fundingSource: "all",
    settlementStatus: "all",
    proofStatus: "all",
    sortBy: "date",
    sortOrder: "desc",
    page: 1,
    limit: 10,
  });
  const [invoiceFilters, setInvoiceFilters] = useState({
    search: "",
    paymentStatus: "all",
    dateRange: "all",
    page: 1,
    limit: 10,
  });
  const [documentFilters, setDocumentFilters] = useState({
    search: "",
    category: "all",
    visibility: "all",
    linkedModule: "all",
    page: 1,
    limit: 10,
  });
  const debouncedPaymentSearch = useDebouncedValue(paymentFilters.search, 350);
  const debouncedVendorSearch = useDebouncedValue(vendorFilters.search, 350);
  const debouncedExpenseSearch = useDebouncedValue(expenseFilters.search, 350);
  const debouncedInvoiceSearch = useDebouncedValue(invoiceFilters.search, 350);
  const debouncedDocumentSearch = useDebouncedValue(
    documentFilters.search,
    350,
  );
  const bookingQuery = useQuery({
    queryKey: ["event-booking-detail", eventId],
    queryFn: async () =>
      (await AdminService.getEventBookingDetail({ eventId })).data,
    enabled: Boolean(eventId),
  });
  const financeQuery = useQuery({
    queryKey: ["event-booking-finance", eventId],
    queryFn: async () => (await AdminService.getEventFinance({ eventId })).data,
    enabled: Boolean(eventId),
  });
  const clientPaymentsQuery = useQuery({
    queryKey: [
      "event-client-payments",
      eventId,
      debouncedPaymentSearch,
      paymentFilters.status,
      paymentFilters.milestone,
      paymentFilters.page,
      paymentFilters.limit,
    ],
    queryFn: async () =>
      (
        await AdminService.getEventClientPayments({
          eventId,
          search: debouncedPaymentSearch || undefined,
          status:
            paymentFilters.status === "all" ? undefined : paymentFilters.status,
          milestone:
            paymentFilters.milestone === "all"
              ? undefined
              : paymentFilters.milestone,
          page: paymentFilters.page,
          limit: paymentFilters.limit,
        })
      ).data?.clientPayments,
    enabled: Boolean(eventId) && section === "payments",
  });
  const vendorSettlementsQuery = useQuery({
    queryKey: [
      "event-vendor-settlements",
      eventId,
      debouncedVendorSearch,
      vendorFilters.service,
      vendorFilters.status,
      vendorFilters.page,
      vendorFilters.limit,
    ],
    queryFn: async () =>
      (
        await AdminService.getEventVendorSettlements({
          eventId,
          search: debouncedVendorSearch || undefined,
          service:
            vendorFilters.service === "all" ? undefined : vendorFilters.service,
          status:
            vendorFilters.status === "all" ? undefined : vendorFilters.status,
          page: vendorFilters.page,
          limit: vendorFilters.limit,
        })
      ).data?.vendorSettlements,
    enabled: Boolean(eventId) && section === "costs" && costView === "vendors",
  });
  const eventExpensesQuery = useQuery({
    queryKey: [
      "event-expenses",
      eventId,
      debouncedExpenseSearch,
      expenseFilters.category,
      expenseFilters.approvalStatus,
      expenseFilters.fundingSource,
      expenseFilters.settlementStatus,
      expenseFilters.proofStatus,
      expenseFilters.sortBy,
      expenseFilters.sortOrder,
      expenseFilters.page,
      expenseFilters.limit,
    ],
    queryFn: async () =>
      (
        await AdminService.getEventExpenses({
          eventId,
          search: debouncedExpenseSearch || undefined,
          category:
            expenseFilters.category === "all"
              ? undefined
              : expenseFilters.category,
          approvalStatus:
            expenseFilters.approvalStatus === "all"
              ? undefined
              : expenseFilters.approvalStatus,
          fundingSource:
            expenseFilters.fundingSource === "all"
              ? undefined
              : expenseFilters.fundingSource,
          settlementStatus:
            expenseFilters.settlementStatus === "all"
              ? undefined
              : expenseFilters.settlementStatus,
          proofStatus:
            expenseFilters.proofStatus === "all"
              ? undefined
              : expenseFilters.proofStatus,
          sortBy: expenseFilters.sortBy,
          sortOrder: expenseFilters.sortOrder,
          page: expenseFilters.page,
          limit: expenseFilters.limit,
        })
      ).data?.eventExpenses,
    enabled: Boolean(eventId) && section === "costs" && costView === "expenses",
  });
  const invoicesReceiptsQuery = useQuery({
    queryKey: [
      "event-invoices-receipts",
      eventId,
      invoiceView,
      debouncedInvoiceSearch,
      invoiceFilters.paymentStatus,
      invoiceFilters.dateRange,
      invoiceFilters.page,
      invoiceFilters.limit,
    ],
    queryFn: async () =>
      (
        await AdminService.getEventInvoicesReceipts({
          eventId,
          view: "invoices",
          search: debouncedInvoiceSearch || undefined,
          paymentStatus:
            invoiceView === "invoices" && invoiceFilters.paymentStatus !== "all"
              ? invoiceFilters.paymentStatus
              : undefined,
          dateRange:
            invoiceFilters.dateRange === "all"
              ? undefined
              : invoiceFilters.dateRange,
          page: invoiceFilters.page,
          limit: invoiceFilters.limit,
        })
      ).data?.invoicesReceipts,
    enabled: Boolean(eventId) && section === "invoices",
  });
  const eventDocumentsQuery = useQuery({
    queryKey: [
      "event-documents",
      eventId,
      debouncedDocumentSearch,
      documentFilters.category,
      documentFilters.visibility,
      documentFilters.linkedModule,
      documentFilters.page,
      documentFilters.limit,
    ],
    queryFn: async () =>
      (
        await AdminService.getEventDocuments({
          eventId,
          search: debouncedDocumentSearch || undefined,
          category:
            documentFilters.category === "all"
              ? undefined
              : documentFilters.category,
          visibility:
            documentFilters.visibility === "all"
              ? undefined
              : documentFilters.visibility,
          linkedModule:
            documentFilters.linkedModule === "all"
              ? undefined
              : documentFilters.linkedModule,
          page: documentFilters.page,
          limit: documentFilters.limit,
        })
      ).data?.eventDocuments,
    enabled: Boolean(eventId) && section === "documents",
  });
  const managersQuery = useQuery({
    queryKey: ["event-booking-managers"],
    queryFn: async () =>
      (await AdminService.getEventBookingManagers({ limit: 100 })).data,
  });
  const booking = getBookingDetail(bookingQuery.data);
  const finance = financeQuery.data?.finance || {};
  const employees = getEmployees(managersQuery.data);
  const functions = useMemo(() => booking?.functions || [], [booking]);
  const services = useMemo(
    () =>
      Array.from(
        new Set([
          ...(booking?.servicesRequired || []),
          ...(booking?.servicesSelected || [])
            .map((item) => item.name || item.service)
            .filter(Boolean),
        ]),
      ),
    [booking],
  );
  const metrics = useMemo(
    () => ({
      functions: functions.length,
      services: services.length,
      peakGuests: Math.max(
        Number(booking?.guestCount || 0),
        ...functions.map((item) => Number(item.guestCount || 0)),
      ),
      preferences: getFinalPreferenceCount(booking),
      approvals: (booking?.approvals || []).filter(
        (item) => item.status === "Pending",
      ).length,
    }),
    [booking, functions, services],
  );
  const changeMutation = useMutation({
    mutationFn: (payload) =>
      selectedChange?._id
        ? AdminService.updateEventCommercialChange({
            eventId,
            changeId: selectedChange._id,
            ...payload,
          })
        : AdminService.addEventCommercialChange({ eventId, ...payload }),
    onSuccess: () => {
      toast.success(
        selectedChange
          ? "Commercial change updated"
          : "Commercial change added",
      );
      setChangeOpen(false);
      setSelectedChange(null);
      financeQuery.refetch();
    },
    onError: (error) =>
      toast.error(
        error.response?.data?.message || "Unable to save commercial change",
      ),
  });
  const noteMutation = useMutation({
    mutationFn: (payload) =>
      AdminService.addEventCommercialNote({ eventId, ...payload }),
    onSuccess: () => {
      toast.success("Commercial note added");
      setNoteOpen(false);
      financeQuery.refetch();
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Unable to add note"),
  });
  const proposalMutation = useMutation({
    mutationFn: (payload) =>
      AdminService.attachEventAcceptedProposal({ eventId, ...payload }),
    onSuccess: () => {
      toast.success("Accepted proposal attached");
      setProposalOpen(false);
      bookingQuery.refetch();
      financeQuery.refetch();
    },
    onError: (error) =>
      toast.error(
        error.response?.data?.message || "Unable to attach accepted proposal",
      ),
  });
  const termsMutation = useMutation({
    mutationFn: (payload) =>
      AdminService.updateEventCommercialTerms({ eventId, ...payload }),
    onSuccess: () => {
      toast.success("Contract value updated");
      setTermsOpen(false);
      financeQuery.refetch();
    },
    onError: (error) =>
      toast.error(
        error.response?.data?.message || "Unable to update contract value",
      ),
  });
  const updateBookingMutation = useMutation({
    mutationFn: (payload) =>
      AdminService.updateEventBooking({ eventId, ...payload }),
    onSuccess: () => {
      toast.success("Booking updated");
      setEditBookingOpen(false);
      bookingQuery.refetch();
      financeQuery.refetch();
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Unable to update booking"),
  });
  const readyMutation = useMutation({
    mutationFn: () => AdminService.markEventExecutionReady({ eventId }),
    onSuccess: () => {
      toast.success("Event marked execution ready");
      bookingQuery.refetch();
    },
    onError: (error) =>
      toast.error(
        error.response?.data?.message || "Unable to mark event ready",
      ),
  });
  const refreshClientPayments = () => {
    clientPaymentsQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ["event-activities", eventId] });
    queryClient.invalidateQueries({
      queryKey: ["event-invoices-receipts", eventId],
    });
    financeQuery.refetch();
    bookingQuery.refetch();
  };
  const addMilestoneMutation = useMutation({
    mutationFn: (payload) =>
      AdminService.addEventPaymentMilestone({ eventId, ...payload }),
    onSuccess: () => {
      toast.success("Payment milestone added");
      refreshClientPayments();
    },
    onError: (error) =>
      toast.error(
        error.response?.data?.message || "Unable to add payment milestone",
      ),
  });
  const updateMilestoneMutation = useMutation({
    mutationFn: ({ milestoneId, payload }) =>
      AdminService.updateEventPaymentMilestone({
        eventId,
        milestoneId,
        ...payload,
      }),
    onSuccess: () => {
      toast.success("Payment milestone updated");
      refreshClientPayments();
    },
    onError: (error) =>
      toast.error(
        error.response?.data?.message || "Unable to update payment milestone",
      ),
  });
  const deleteMilestoneMutation = useMutation({
    mutationFn: (milestoneId) =>
      AdminService.deleteEventPaymentMilestone({ eventId, milestoneId }),
    onSuccess: () => {
      toast.success("Payment milestone deleted");
      refreshClientPayments();
    },
    onError: (error) =>
      toast.error(
        error.response?.data?.message || "Unable to delete payment milestone",
      ),
  });
  const recordPaymentMutation = useMutation({
    mutationFn: (payload) =>
      AdminService.recordEventClientPayment({ eventId, ...payload }),
    onSuccess: () => {
      toast.success("Client payment recorded");
      refreshClientPayments();
    },
    onError: (error) =>
      toast.error(
        error.response?.data?.message || "Unable to record client payment",
      ),
  });
  const refreshVendorSettlements = () => {
    vendorSettlementsQuery.refetch();
    financeQuery.refetch();
    bookingQuery.refetch();
  };
  const updateSettlementMutation = useMutation({
    mutationFn: ({ settlement, payload }) =>
      AdminService.updateEventVendorSettlement({
        eventId,
        assignmentId: settlement._id,
        ...payload,
      }),
    onSuccess: () => {
      toast.success("Vendor settlement updated");
      refreshVendorSettlements();
    },
    onError: (error) =>
      toast.error(
        error.response?.data?.message || "Unable to update vendor settlement",
      ),
  });
  const recordSettlementMutation = useMutation({
    mutationFn: (payload) =>
      AdminService.recordEventVendorSettlement({ eventId, ...payload }),
    onSuccess: () => {
      toast.success("Vendor settlement recorded");
      refreshVendorSettlements();
    },
    onError: (error) =>
      toast.error(
        error.response?.data?.message || "Unable to record vendor settlement",
      ),
  });
  const addExpenseMutation = useMutation({
    mutationFn: (payload) =>
      AdminService.addEventExpense({ eventId, ...payload }),
    onSuccess: () => {
      toast.success("Event expense added");
      eventExpensesQuery.refetch();
      financeQuery.refetch();
    },
    onError: (error) =>
      toast.error(
        error.response?.data?.message || "Unable to add event expense",
      ),
  });
  const createInvoiceMutation = useMutation({
    mutationFn: (payload) =>
      AdminService.createEventInvoice({ eventId, ...payload }),
    onSuccess: () => {
      toast.success("Event invoice created");
      invoicesReceiptsQuery.refetch();
      financeQuery.refetch();
      bookingQuery.refetch();
    },
    onError: (error) =>
      toast.error(
        error.response?.data?.message || "Unable to create event invoice",
      ),
  });
  const uploadDocumentMutation = useMutation({
    mutationFn: (payload) =>
      AdminService.uploadEventDocument({ eventId, ...payload }),
    onSuccess: () => {
      toast.success("Event document uploaded");
      eventDocumentsQuery.refetch();
      financeQuery.refetch();
      bookingQuery.refetch();
    },
    onError: (error) =>
      toast.error(
        error.response?.data?.message || "Unable to upload event document",
      ),
  });
  const downloadReportMutation = useMutation({
    mutationFn: () =>
      AdminService.downloadEventClientPaymentReport({
        eventId,
        search: debouncedPaymentSearch || undefined,
        status:
          paymentFilters.status === "all" ? undefined : paymentFilters.status,
        milestone:
          paymentFilters.milestone === "all"
            ? undefined
            : paymentFilters.milestone,
      }),
    onSuccess: (response) => {
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        `${booking?.eventCode || booking?.eventName || "event"}-client-payments.csv`.replace(
          /[^a-z0-9._-]+/gi,
          "-",
        );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) =>
      toast.error(
        error.response?.data?.message || "Unable to download payment report",
      ),
  });
  if (bookingQuery.isLoading || financeQuery.isLoading)
    return (
      <div className="crm-page grid min-h-[70vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (!booking)
    return (
      <div className="crm-page p-5">
        <Card>
          <CardContent className="p-8 text-center">
            Event booking not found.
          </CardContent>
        </Card>
      </div>
    );
  const selectTab = (key) => {
    if (key === "overview") navigate(`/dashboard/assigned-events/${eventId}`);
    else if (key === "plan")
      navigate(`/dashboard/assigned-events/${eventId}/plan/functions`);
    else if (key === "operations")
      navigate(`/dashboard/assigned-events/${eventId}/operations`);
    else if (key === "activity")
      toast.info("Event activity will be available here.");
  };
  const selectCostView = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "costs");
    if (value === "vendors") next.delete("costTab");
    else next.set("costTab", value);
    navigate(
      `/dashboard/assigned-events/${eventId}/finance?${next.toString()}`,
    );
  };
  const selectInvoiceView = (value) => {
    setInvoiceFilters((current) => ({ ...current, page: 1 }));
    const next = new URLSearchParams(searchParams);
    next.set("tab", "invoices");
    if (value === "quotations") next.delete("invoiceTab");
    else next.set("invoiceTab", value);
    navigate(
      `/dashboard/assigned-events/${eventId}/finance?${next.toString()}`,
    );
  };
  const financeContent =
    section === "commercial" ? (
      <CommercialPanel
        finance={finance}
        readOnly={!canManageFinance}
        onAttachProposal={() => setProposalOpen(true)}
        onEditTerms={() => setTermsOpen(true)}
        onAddChange={() => {
          setSelectedChange(null);
          setChangeOpen(true);
        }}
        onViewChange={(change) => {
          setSelectedChange(change);
          setChangeOpen(true);
        }}
        onAddNote={() => setNoteOpen(true)}
      />
    ) : section === "payments" ? (
      <EventClientPaymentsPanel
        readOnly={!canManageFinance}
        data={clientPaymentsQuery.data}
        filters={paymentFilters}
        onFiltersChange={setPaymentFilters}
        loading={
          clientPaymentsQuery.isLoading || clientPaymentsQuery.isFetching
        }
        error={clientPaymentsQuery.error}
        onRetry={() => clientPaymentsQuery.refetch()}
        onAddMilestone={(payload) => addMilestoneMutation.mutateAsync(payload)}
        onUpdateMilestone={(milestone, payload) =>
          updateMilestoneMutation.mutateAsync({
            milestoneId: milestone._id,
            payload,
          })
        }
        onDeleteMilestone={(milestone) =>
          deleteMilestoneMutation.mutateAsync(milestone._id)
        }
        onRecordPayment={(payload) =>
          recordPaymentMutation.mutateAsync(payload)
        }
        onDownloadReport={() => downloadReportMutation.mutate()}
        savingMilestone={
          addMilestoneMutation.isPending || updateMilestoneMutation.isPending
        }
        deletingMilestone={deleteMilestoneMutation.isPending}
        recordingPayment={recordPaymentMutation.isPending}
        downloadingReport={downloadReportMutation.isPending}
      />
    ) : section === "costs" ? (
      <EventCostSettlementsPanel
        booking={booking}
        readOnly={!canManageFinance}
        view={costView}
        onViewChange={selectCostView}
        vendorData={vendorSettlementsQuery.data}
        vendorFilters={vendorFilters}
        onVendorFiltersChange={setVendorFilters}
        vendorLoading={
          vendorSettlementsQuery.isLoading || vendorSettlementsQuery.isFetching
        }
        vendorError={vendorSettlementsQuery.error}
        onRetryVendors={() => vendorSettlementsQuery.refetch()}
        expenseData={eventExpensesQuery.data}
        expenseFilters={expenseFilters}
        onExpenseFiltersChange={setExpenseFilters}
        expenseLoading={
          eventExpensesQuery.isLoading || eventExpensesQuery.isFetching
        }
        expenseError={eventExpensesQuery.error}
        onRetryExpenses={() => eventExpensesQuery.refetch()}
        onUpdateSettlement={(settlement, payload) =>
          updateSettlementMutation.mutateAsync({ settlement, payload })
        }
        onRecordSettlement={(payload) =>
          recordSettlementMutation.mutateAsync(payload)
        }
        onAddExpense={(payload) => addExpenseMutation.mutateAsync(payload)}
        updatingSettlement={updateSettlementMutation.isPending}
        recordingSettlement={recordSettlementMutation.isPending}
        addingExpense={addExpenseMutation.isPending}
      />
    ) : section === "invoices" ? (
      <EventInvoicesReceiptsPanel
        booking={booking}
        readOnly={!canManageFinance}
        view={invoiceView}
        onViewChange={selectInvoiceView}
        data={invoicesReceiptsQuery.data}
        filters={invoiceFilters}
        onFiltersChange={setInvoiceFilters}
        loading={
          invoicesReceiptsQuery.isLoading || invoicesReceiptsQuery.isFetching
        }
        error={invoicesReceiptsQuery.error}
        onRetry={() => invoicesReceiptsQuery.refetch()}
        onCreateInvoice={(payload) =>
          createInvoiceMutation.mutateAsync(payload)
        }
        creatingInvoice={createInvoiceMutation.isPending}
      />
    ) : (
      <EventDocumentsPanel
        data={eventDocumentsQuery.data}
        filters={documentFilters}
        onFiltersChange={setDocumentFilters}
        loading={
          eventDocumentsQuery.isLoading || eventDocumentsQuery.isFetching
        }
        error={eventDocumentsQuery.error}
        onRetry={() => eventDocumentsQuery.refetch()}
        onUpload={(payload) => uploadDocumentMutation.mutateAsync(payload)}
        uploading={uploadDocumentMutation.isPending}
      />
    );

  return (
    <div className="min-w-0 space-y-3">
      <EventFunctionsHeader
        booking={booking}
        metrics={metrics}
        onBack={() => navigate("/dashboard/assigned-events")}
        onEdit={() => setEditBookingOpen(true)}
        onMarkReady={() => readyMutation.mutate()}
        onOpenPlanning={() =>
          document
            .getElementById("event-finance")
            ?.scrollIntoView({ behavior: "smooth" })
        }
        primaryActionLabel="Open Finance Plan"
      />
      <EventDetailTabs activePrimary="finance" onSelect={selectTab} />
      <div id="event-finance" className="space-y-3">
        <FinanceNav
          active={section}
          eventId={eventId}
          searchParams={searchParams}
        />
        {financeContent}
      </div>
      {canManageFinance && (
        <>
          <AcceptedProposalDialog
            open={proposalOpen}
            onOpenChange={setProposalOpen}
            saving={proposalMutation.isPending}
            defaultAcceptedBy={
              booking.customer?.name || finance.acceptedProposal?.acceptedBy
            }
            taxRate={finance.breakdown?.taxRate}
            onSave={(payload) => proposalMutation.mutate(payload)}
          />
          <ContractTermsDialog
            open={termsOpen}
            onOpenChange={setTermsOpen}
            breakdown={finance.breakdown}
            saving={termsMutation.isPending}
            onSave={(payload) => termsMutation.mutate(payload)}
          />
          <CommercialNoteDialog
            open={noteOpen}
            onOpenChange={setNoteOpen}
            saving={noteMutation.isPending}
            onSave={(payload) => noteMutation.mutate(payload)}
          />
        </>
      )}
      <CommercialChangeDialog
        open={changeOpen}
        onOpenChange={(open) => {
          setChangeOpen(open);
          if (!open) setSelectedChange(null);
        }}
        change={selectedChange}
        functions={functions}
        saving={changeMutation.isPending}
        onSave={(payload) => changeMutation.mutate(payload)}
        readOnly={!canManageFinance}
      />
      <EditBookingDialog
        open={editBookingOpen}
        onOpenChange={setEditBookingOpen}
        booking={booking}
        employees={employees}
        saving={updateBookingMutation.isPending}
        onSave={(payload) => updateBookingMutation.mutate(payload)}
      />
    </div>
  );
}
