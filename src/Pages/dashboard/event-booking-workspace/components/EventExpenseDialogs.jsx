/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@components/components/ui/button";
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
import { Textarea } from "@components/components/ui/textarea";
import { numberOf } from "../eventFinance.utils";

const settlementForFundingSource = (fundingSource) => {
  if (fundingSource === "Personal Funds") return "Reimbursement Due";
  if (fundingSource === "Company Advance") return "Advance Adjusted";
  if (fundingSource === "Company Payment") return "Company Paid";
  return "Not Applicable";
};

export function AddExpenseDialog({
  open,
  onOpenChange,
  options,
  saving,
  onSave,
}) {
  const [form, setForm] = useState({
    expenseTitle: "",
    category: "",
    paidByName: "",
    fundingSource: "Company Payment",
    amount: "",
    date: "",
    paymentMode: "UPI",
    approvalStatus: "Approved",
    settlementStatus: "Company Paid",
    billNumber: "",
    notes: "",
    billReceipt: null,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm({
      expenseTitle: "",
      category: options.categories?.[0] || "",
      paidByName: "",
      fundingSource: "Company Payment",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      paymentMode: options.paymentModes?.[0] || "UPI",
      approvalStatus: "Approved",
      settlementStatus: "Company Paid",
      billNumber: "",
      notes: "",
      billReceipt: null,
    });
    setError("");
  }, [open, options.categories, options.paymentModes]);

  const update = (key, value) =>
    setForm((state) => ({ ...state, [key]: value }));

  const updateFundingSource = (fundingSource) =>
    setForm((state) => ({
      ...state,
      fundingSource,
      settlementStatus:
        state.approvalStatus === "Approved"
          ? settlementForFundingSource(fundingSource)
          : "Not Applicable",
    }));

  const updateApprovalStatus = (approvalStatus) =>
    setForm((state) => ({
      ...state,
      approvalStatus,
      settlementStatus:
        approvalStatus === "Approved"
          ? settlementForFundingSource(state.fundingSource)
          : "Not Applicable",
    }));

  const submit = async (event) => {
    event.preventDefault();

    if (
      !form.expenseTitle.trim() ||
      !form.paidByName.trim() ||
      !form.category ||
      numberOf(form.amount) <= 0
    ) {
      setError("Title, category, paid by, and amount are required.");
      return;
    }

    try {
      await onSave({
        ...form,
        expenseTitle: form.expenseTitle.trim(),
        paidByName: form.paidByName.trim(),
        paidTo: form.paidByName.trim(),
        amount: numberOf(form.amount),
        billNumber: form.billNumber.trim(),
        notes: form.notes.trim(),
      });
      onOpenChange(false);
    } catch {
      // Page mutation displays the error toast.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Event Expense</DialogTitle>
          <DialogDescription>
            Record the expense, funding source, approval, settlement, and
            supporting proof.
          </DialogDescription>
        </DialogHeader>

        <form
          id="add-event-expense"
          onSubmit={submit}
          className="grid gap-4 py-2 sm:grid-cols-2"
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="expense-title">Expense Title</Label>
            <Input
              id="expense-title"
              value={form.expenseTitle}
              onChange={(event) => update("expenseTitle", event.target.value)}
              placeholder="Fuel for material dispatch"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(value) => update("category", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(options.categories || []).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expense-date">Expense Date</Label>
            <Input
              id="expense-date"
              type="date"
              value={form.date}
              onChange={(event) => update("date", event.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expense-amount">Amount (INR)</Label>
            <Input
              id="expense-amount"
              type="number"
              min="1"
              step="0.01"
              value={form.amount}
              onChange={(event) => update("amount", event.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expense-paid-by">Paid By</Label>
            <Input
              id="expense-paid-by"
              value={form.paidByName}
              onChange={(event) => update("paidByName", event.target.value)}
              placeholder="Employee or company name"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Funding Source</Label>
            <Select
              value={form.fundingSource}
              onValueChange={updateFundingSource}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(options.fundingSources || []).map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {(options.paymentModes || []).map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Approval Status</Label>
            <Select
              value={form.approvalStatus}
              onValueChange={updateApprovalStatus}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  options.approvalStatuses || [
                    "Approved",
                    "Pending",
                    "Rejected",
                  ]
                ).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Settlement</Label>
            <Select
              value={form.settlementStatus}
              onValueChange={(value) => update("settlementStatus", value)}
              disabled={form.approvalStatus !== "Approved"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(options.settlementStatuses || []).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expense-bill-number">Bill Number</Label>
            <Input
              id="expense-bill-number"
              value={form.billNumber}
              onChange={(event) => update("billNumber", event.target.value)}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="expense-bill">Bill / Receipt</Label>
            <Input
              id="expense-bill"
              type="file"
              accept="image/*,.pdf,application/pdf"
              onChange={(event) =>
                update("billReceipt", event.target.files?.[0] || null)
              }
            />
            <p className="text-[11px] text-muted-foreground">
              PDF or image, up to the server upload limit.
            </p>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="expense-notes">Notes</Label>
            <Textarea
              id="expense-notes"
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
          <Button type="submit" form="add-event-expense" disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MoreExpenseFiltersDialog({
  open,
  onOpenChange,
  filters,
  options,
  onApply,
}) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [filters, open]);

  const update = (key, value) =>
    setDraft((state) => ({ ...state, [key]: value }));
  const clear = () =>
    setDraft((state) => ({
      ...state,
      fundingSource: "all",
      settlementStatus: "all",
      proofStatus: "all",
    }));

  const apply = () => {
    onApply({
      fundingSource: draft.fundingSource,
      settlementStatus: draft.settlementStatus,
      proofStatus: draft.proofStatus,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>More Expense Filters</DialogTitle>
          <DialogDescription>
            Narrow expenses by how they were funded, settled, or documented.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Funding Source</Label>
            <Select
              value={draft.fundingSource}
              onValueChange={(value) => update("fundingSource", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funding Sources</SelectItem>
                {(options.fundingSources || []).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Settlement</Label>
            <Select
              value={draft.settlementStatus}
              onValueChange={(value) => update("settlementStatus", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Settlements</SelectItem>
                {(options.settlementStatuses || [])
                  .filter((value) => value !== "Not Applicable")
                  .map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Proof</Label>
            <Select
              value={draft.proofStatus}
              onValueChange={(value) => update("proofStatus", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Proof Status</SelectItem>
                {(options.proofStatuses || []).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={clear}>
            Clear
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={apply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
