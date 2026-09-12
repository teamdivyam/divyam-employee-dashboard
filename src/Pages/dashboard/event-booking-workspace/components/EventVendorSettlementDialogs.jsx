/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { Eye, IndianRupee, Loader2 } from "lucide-react";

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
import { currency, idOf, numberOf, shortDate } from "../eventFinance.utils";

export function SettlementTermsDialog({
  settlement,
  onOpenChange,
  saving,
  onSave,
}) {
  const [form, setForm] = useState({
    finalCost: "",
    dueDate: "",
    notes: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!settlement) return;

    setForm({
      finalCost: numberOf(settlement.finalCost) || "",
      dueDate: settlement.dueDate
        ? new Date(settlement.dueDate).toISOString().slice(0, 10)
        : "",
      notes: settlement.notes || "",
    });
    setError("");
  }, [settlement]);

  const submit = async (event) => {
    event.preventDefault();
    const finalCost = numberOf(form.finalCost);

    if (finalCost <= 0) {
      setError("Final cost must be greater than zero.");
      return;
    }
    if (finalCost < numberOf(settlement?.paidAmount)) {
      setError("Final cost cannot be lower than the amount already paid.");
      return;
    }

    try {
      await onSave(settlement, {
        finalCost,
        dueDate: form.dueDate || null,
        notes: form.notes.trim(),
      });
      onOpenChange(null);
    } catch {
      // Page mutation displays the error toast.
    }
  };

  return (
    <Dialog
      open={Boolean(settlement)}
      onOpenChange={(open) => !open && onOpenChange(null)}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Vendor Settlement</DialogTitle>
          <DialogDescription>
            Update the agreed final cost and next settlement date for{" "}
            {settlement?.vendorName}.
          </DialogDescription>
        </DialogHeader>

        <form
          id="vendor-settlement-terms"
          onSubmit={submit}
          className="space-y-4 py-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="vendor-final-cost">Final Cost (INR)</Label>
            <Input
              id="vendor-final-cost"
              type="number"
              min={Math.max(1, numberOf(settlement?.paidAmount))}
              step="0.01"
              value={form.finalCost}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  finalCost: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vendor-due-date">Due Date</Label>
            <Input
              id="vendor-due-date"
              type="date"
              value={form.dueDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vendor-settlement-notes">Notes</Label>
            <Textarea
              id="vendor-settlement-notes"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(null)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="custom"
            type="submit"
            form="vendor-settlement-terms"
            disabled={saving}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RecordSettlementDialog({
  open,
  onOpenChange,
  settlements,
  selected,
  paymentModes,
  saving,
  onSave,
}) {
  const payable = useMemo(
    () =>
      settlements.filter(
        (item) =>
          item.settlementStatus !== "Settled" &&
          numberOf(item.outstandingAmount) > 0,
      ),
    [settlements],
  );
  const [form, setForm] = useState({
    assignmentId: "",
    amount: "",
    transactionDate: "",
    paymentMode: "Bank Transfer",
    reference: "",
    notes: "",
    receipts: [],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const initial =
      payable.find((item) => idOf(item) === idOf(selected)) || payable[0];
    setForm({
      assignmentId: idOf(initial),
      amount: "",
      transactionDate: new Date().toISOString().slice(0, 10),
      paymentMode: "Bank Transfer",
      reference: "",
      notes: "",
      receipts: [],
    });
    setError("");
  }, [open, payable, selected]);

  const current = payable.find((item) => idOf(item) === form.assignmentId);
  const update = (key, value) =>
    setForm((state) => ({ ...state, [key]: value }));

  const chooseFiles = (files) => {
    const receipts = Array.from(files || []);

    if (receipts.length > 5) {
      setError("You can attach up to 5 files.");
      return;
    }
    if (receipts.some((file) => file.size > 10 * 1024 * 1024)) {
      setError("Each file must be 10 MB or smaller.");
      return;
    }

    setError("");
    update("receipts", receipts);
  };

  const submit = async (event) => {
    event.preventDefault();
    const amount = numberOf(form.amount);

    if (!current || amount <= 0 || amount > numberOf(current.outstandingAmount)) {
      setError(`Enter an amount up to ${currency(current?.outstandingAmount)}.`);
      return;
    }

    try {
      await onSave({
        assignmentId: form.assignmentId,
        amount,
        transactionDate: form.transactionDate,
        paymentMode: form.paymentMode,
        utrNumber: form.reference.trim(),
        notes: form.notes.trim(),
        receipts: form.receipts,
      });
      onOpenChange(false);
    } catch {
      // Page mutation displays the error toast.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Vendor Settlement</DialogTitle>
          <DialogDescription>
            Record an outgoing payment against an assigned event vendor.
          </DialogDescription>
        </DialogHeader>

        {payable.length ? (
          <form
            id="record-vendor-settlement"
            onSubmit={submit}
            className="grid gap-4 py-2 sm:grid-cols-2"
          >
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Vendor</Label>
              <Select
                value={form.assignmentId}
                onValueChange={(value) => update("assignmentId", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {payable.map((item) => (
                    <SelectItem key={idOf(item)} value={idOf(item)}>
                      {item.vendorName} · {currency(item.outstandingAmount)}{" "}
                      outstanding
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="settlement-amount">Amount (INR)</Label>
              <Input
                id="settlement-amount"
                type="number"
                min="1"
                max={numberOf(current?.outstandingAmount)}
                step="0.01"
                value={form.amount}
                onChange={(event) => update("amount", event.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Outstanding: {currency(current?.outstandingAmount)}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="settlement-date">Payment Date</Label>
              <Input
                id="settlement-date"
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
              <Label htmlFor="settlement-reference">
                Transaction Reference
              </Label>
              <Input
                id="settlement-reference"
                value={form.reference}
                onChange={(event) => update("reference", event.target.value)}
                placeholder="UTR / bank reference"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="settlement-receipts">Payment Proof</Label>
              <Input
                id="settlement-receipts"
                type="file"
                multiple
                accept="image/*,.pdf,application/pdf"
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
              <Label htmlFor="settlement-notes">Notes</Label>
              <Textarea
                id="settlement-notes"
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive sm:col-span-2">{error}</p>
            ) : null}
          </form>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            All vendors are settled or no final costs have been configured.
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          {payable.length ? (
            <Button
              variant="custom"
              type="submit"
              form="record-vendor-settlement"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <IndianRupee className="mr-2 h-4 w-4" />
              )}
              Record Settlement
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SettlementDetailDialog({ settlement, onOpenChange }) {
  return (
    <Dialog
      open={Boolean(settlement)}
      onOpenChange={(open) => !open && onOpenChange(null)}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{settlement?.vendorName}</DialogTitle>
          <DialogDescription>
            {settlement?.service} settlement details
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Final Cost</p>
            <p className="font-semibold">{currency(settlement?.finalCost)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="font-semibold">{currency(settlement?.paidAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className="font-semibold">
              {currency(settlement?.outstandingAmount)}
            </p>
          </div>
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {settlement?.payments?.length ? (
            settlement.payments.map((payment) => (
              <div key={idOf(payment)} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">
                    {currency(payment.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {shortDate(payment.transactionDate)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {payment.paymentMode} ·{" "}
                  {payment.receiptNumber || payment.transactionId}
                </p>
                {payment.receiptDocuments?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {payment.receiptDocuments.map((document) => (
                      <Button
                        key={idOf(document) || document.fileUrl}
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {document.fileName || "View proof"}
                        </a>
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No settlement payments recorded.
            </p>
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
