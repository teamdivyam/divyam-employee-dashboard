/* eslint-disable react/prop-types */
import { useRef } from "react";
import {
  AlertCircle, Building2, CalendarDays, CheckCircle2, Eye, FileText, Info,
  Loader2, Pencil, Plus, ReceiptIndianRupee, Tag, Trash2, UploadCloud, WalletCards,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@components/components/ui/avatar";
import { Button } from "@components/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@components/components/ui/dialog";
import { Input } from "@components/components/ui/input";
import { Textarea } from "@components/components/ui/textarea";
import { CATEGORY_OPTIONS, EXPENSE_FOR_OPTIONS, PAYMENT_SOURCE_OPTIONS } from "./expense.constants";
import { ALLOWED_ATTACHMENT_TYPES } from "./expense.schemas";
import {
  formatFileSize, getAttachmentKey, getAttachmentName, getAttachmentSize,
  getAttachmentUrl, getInitials, numberOrZero,
} from "./expense.utils";
import CompactField from "./expense-form/CompactField";
import ExpenseDatePicker from "./expense-form/ExpenseDatePicker";
import ExpenseSummaryPill from "./expense-form/ExpenseSummaryPill";
import FieldError from "./expense-form/FieldError";
import FormSectionHeader from "./expense-form/FormSectionHeader";
import FormSelectField from "./expense-form/FormSelectField";
import ReadOnlyAmount from "./expense-form/ReadOnlyAmount";

export default function AddExpenseDialog({
  open,
  onOpenChange,
  employee,
  form,
  errors,
  formError,
  availableAdvance,
  onFieldChange,
  onFieldBlur,
  onAddFiles,
  onRemoveFile,
  onSubmit,
  submitting,
  mode = "add",
  existingAttachments = [],
}) {
  const fileInputRef = useRef(null);
  const employeeName = employee?.fullName || employee?.name || "Employee";
  const employeeRole = employee?.designation || employee?.jobTitle || employee?.role || "Employee";
  const expenseAmount = Math.max(numberOrZero(form.expenseAmount), 0);
  const advanceBalance = Math.max(numberOrZero(availableAdvance), 0);
  const advanceUsed = form.paymentSource === "Office Expense Advance"
    ? Math.min(expenseAmount, advanceBalance)
    : 0;
  const personallyPaid = form.paymentSource === "Office Expense Advance"
    ? Math.max(expenseAmount - advanceBalance, 0)
    : 0;
  const isEditMode = mode === "edit";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl gap-0 overflow-hidden border-border bg-card p-0 text-card-foreground">
        <form
          className="flex max-h-[92vh] flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(isEditMode ? "Pending Finance Review" : undefined);
          }}
          noValidate
        >
          <DialogHeader className="border-b border-border px-4 py-3 text-left">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[hsl(var(--chart-2)/0.12)] text-[hsl(var(--chart-2))]">
                <ReceiptIndianRupee className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-[17px] font-semibold">{isEditMode ? "Edit Expense" : "Add Expense"}</DialogTitle>
                <DialogDescription className="mt-0.5 text-[11px]">
                  {isEditMode
                    ? "Update this draft expense or submit it for review."
                    : "Submit a work-related expense for review and approval."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2.5 overflow-y-auto px-3 py-3">
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/20 p-2">
              <div className="flex min-w-[190px] flex-1 items-center gap-2.5">
                <Avatar className="h-10 w-10 border border-[hsl(var(--chart-2)/0.25)]">
                  <AvatarFallback className="bg-[hsl(var(--chart-2))] text-[13px] font-medium text-white">
                    {getInitials(employeeName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium">{employeeName}</p>
                  {/* <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{employeeCode}</p> */}
                  <p className="truncate text-[10px] text-muted-foreground">{String(employeeRole)}</p>
                </div>
              </div>
              <ExpenseSummaryPill icon={CalendarDays} label="Expense For" value={form.expenseFor || "Not selected"} tone="blue" />
              <ExpenseSummaryPill icon={WalletCards} label="Payment Source" value={form.paymentSource || "Not selected"} tone="green" />
              <ExpenseSummaryPill icon={Tag} label="Category" value={form.category || "Not selected"} tone="violet" />
            </div>

            {formError ? (
              <div className="flex items-center gap-1.5 rounded-md border border-destructive/25 bg-destructive/5 px-2.5 py-2 text-[11px] text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {formError}
              </div>
            ) : null}

            <FormSectionHeader number="1" title="Expense Details" tone="blue" icon={ReceiptIndianRupee} />
            <div className="grid gap-x-3 gap-y-2 rounded-b-md border border-t-0 border-border p-3 sm:grid-cols-2">
              <CompactField label="Expense Name" required error={errors.expenseName}>
                <Input
                  value={form.expenseName}
                  onChange={(event) => onFieldChange("expenseName", event.target.value)}
                  onBlur={() => onFieldBlur("expenseName")}
                  placeholder="e.g. Fuel for venue transport"
                  className={formControlClass(errors.expenseName)}
                />
              </CompactField>
              <CompactField label="Expense Date" required error={errors.expenseDate}>
                <ExpenseDatePicker
                  value={form.expenseDate}
                  error={errors.expenseDate}
                  onChange={(value) => onFieldChange("expenseDate", value)}
                />
              </CompactField>
              <FormSelectField
                label="Expense For"
                required
                value={form.expenseFor}
                placeholder="Select expense for"
                options={EXPENSE_FOR_OPTIONS.slice(1)}
                error={errors.expenseFor}
                onValueChange={(value) => onFieldChange("expenseFor", value)}
              />
              <CompactField label="Linked To" error={errors.linkedTo}>
                <Input
                  value={form.linkedTo}
                  onChange={(event) => onFieldChange("linkedTo", event.target.value)}
                  onBlur={() => onFieldBlur("linkedTo")}
                  placeholder="Event, client or office work"
                  className={formControlClass(errors.linkedTo)}
                />
              </CompactField>
              <FormSelectField
                label="Category"
                value={form.category}
                placeholder="Select category"
                options={CATEGORY_OPTIONS.slice(1)}
                error={errors.category}
                onValueChange={(value) => onFieldChange("category", value)}
              />
              <FormSelectField
                label="Payment Source"
                required
                value={form.paymentSource}
                placeholder="Select payment source"
                options={PAYMENT_SOURCE_OPTIONS.slice(1)}
                error={errors.paymentSource}
                onValueChange={(value) => onFieldChange("paymentSource", value)}
              />
              <CompactField label="Expense Amount" required error={errors.expenseAmount}>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] leading-none text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.expenseAmount}
                    onChange={(event) => onFieldChange("expenseAmount", event.target.value)}
                    onBlur={() => onFieldBlur("expenseAmount")}
                    placeholder="0.00"
                    className={`${formControlClass(errors.expenseAmount)} pl-6`}
                  />
                </div>
              </CompactField>
              <CompactField label="Paid To / Vendor" error={errors.paidTo}>
                <Input
                  value={form.paidTo}
                  onChange={(event) => onFieldChange("paidTo", event.target.value)}
                  onBlur={() => onFieldBlur("paidTo")}
                  placeholder="Vendor or recipient name"
                  className={formControlClass(errors.paidTo)}
                />
              </CompactField>
            </div>

            {form.paymentSource === "Office Expense Advance" ? (
              <div>
                <div className="flex items-center gap-1.5 rounded-t-md border border-border bg-primary/5 px-2.5 py-1.5 text-[11px] font-medium text-primary">
                  <Building2 className="h-3.5 w-3.5" />
                  Office Expense Advance Details
                </div>
                <div className="grid gap-2 rounded-b-md border border-t-0 border-border bg-primary/[0.02] p-3 sm:grid-cols-3">
                  <ReadOnlyAmount label="Available Balance" value={advanceBalance} />
                  <ReadOnlyAmount label="Amount Used from Advance" value={advanceUsed} />
                  <ReadOnlyAmount label="Personally Paid Amount" value={personallyPaid} />
                  <div className="flex items-start gap-1.5 text-[10px] leading-4 text-muted-foreground sm:col-span-3">
                    <Info className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    The approved amount will be adjusted against the office expense advance ledger.
                  </div>
                </div>
              </div>
            ) : null}

            <FormSectionHeader number="2" title="Purpose & Note" tone="green" icon={FileText} />
            <div className="space-y-2 rounded-b-md border border-t-0 border-border p-3">
              <CompactField label="Business Purpose" error={errors.businessPurpose}>
                <Textarea
                  value={form.businessPurpose}
                  onChange={(event) => onFieldChange("businessPurpose", event.target.value)}
                  onBlur={() => onFieldBlur("businessPurpose")}
                  placeholder="Explain the work-related purpose of this expense"
                  className="min-h-14 resize-none text-[11px] placeholder:text-[11px]"
                />
              </CompactField>
              <CompactField label="Supporting Note" error={errors.supportingNote}>
                <Textarea
                  value={form.supportingNote}
                  onChange={(event) => onFieldChange("supportingNote", event.target.value)}
                  onBlur={() => onFieldBlur("supportingNote")}
                  placeholder="Add any additional context for the reviewer"
                  className="min-h-14 resize-none text-[11px] placeholder:text-[11px]"
                />
              </CompactField>
              <div className="grid gap-1 rounded-md border border-[hsl(var(--chart-2)/0.20)] bg-[hsl(var(--chart-2)/0.05)] px-2.5 py-2 text-[10px] text-muted-foreground">
                <p className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[hsl(var(--chart-2))]" />
                  Only the approved amount of a personally paid expense is eligible for reimbursement.
                </p>
                <p className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[hsl(var(--chart-2))]" />
                  Office advance and company-paid expenses are recorded without generating employee reimbursement.
                </p>
              </div>
            </div>

            <FormSectionHeader number="3" title="Attachments" tone="violet" icon={UploadCloud} />
            <div className="space-y-2 rounded-b-md border border-t-0 border-border p-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALLOWED_ATTACHMENT_TYPES.join(",")}
                className="hidden"
                onChange={(event) => {
                  onAddFiles(Array.from(event.target.files || []));
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md border border-dashed border-input bg-muted/20 px-3 py-2 text-left transition-colors hover:bg-muted/40"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="block text-[11px] font-medium">Upload receipt, invoice or payment proof</span>
                  <span className="block text-[10px] text-muted-foreground">PNG, JPG, JPEG, HEIF or HEIC· Up to 10 files · 5 MB each</span>
                </span>
              </button>
              {errors.attachments ? <FieldError message={errors.attachments} /> : null}
              {existingAttachments.map((attachment, index) => {
                const attachmentUrl = getAttachmentUrl(attachment);
                return (
                  <div key={getAttachmentKey(attachment, index)} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2">
                    <FileText className="h-4 w-4 shrink-0 text-[hsl(var(--chart-4))]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium">{getAttachmentName(attachment)}</p>
                      <p className="text-[10px] text-muted-foreground">{getAttachmentSize(attachment)} · Existing attachment</p>
                    </div>
                    {attachmentUrl ? (
                      <Button asChild type="button" variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-[10px] text-primary">
                        <a href={attachmentUrl} target="_blank" rel="noreferrer">
                          <Eye className="h-3 w-3" />
                          View
                        </a>
                      </Button>
                    ) : null}
                  </div>
                );
              })}
              {form.attachments.map((file, index) => (
                <div key={`${file.name}-${file.lastModified}`} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2">
                  <FileText className="h-4 w-4 shrink-0 text-[hsl(var(--chart-4))]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-1.5 text-[10px] text-destructive hover:text-destructive"
                    onClick={() => onRemoveFile(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-2 border-t border-border px-3 py-2.5 sm:justify-between sm:space-x-0">
            <Button type="button" variant="outline" className="h-8 min-w-24 text-[11px]" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 min-w-28 text-[11px]"
                disabled={submitting}
                onClick={() => onSubmit("Draft")}
              >
                Save as Draft
              </Button>
              <Button type="submit" className="h-8 min-w-32 gap-1.5 text-[11px]" disabled={submitting}>
                {submitting
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : isEditMode ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                Submit Expense
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formControlClass(error) {
  return `h-8 text-[11px] placeholder:text-[11px] ${error ? "border-destructive" : ""}`;
}
