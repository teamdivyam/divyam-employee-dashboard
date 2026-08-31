/* eslint-disable react/prop-types */
import {
  AlertCircle, BadgeIndianRupee, CalendarDays, CheckCircle2, Clock3, Eye, FileText, Info,
  Loader2, LockKeyhole, Paperclip, ReceiptIndianRupee, ShieldCheck, Tag, UserRound, WalletCards,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@components/components/ui/avatar";
import { Button } from "@components/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@components/components/ui/dialog";
import { StatusBadge } from "./ExpenseTable";
import {
  displayPerson, displayText, firstPresent, formatCurrency, formatDate, formatDateTime,
  formatMonthPeriod, formatOptionalCurrency, getAdjustment, getAttachmentKey,
  getAttachmentName, getAttachmentSize, getAttachmentUrl, getErrorMessage, getInitials,
  hasApprovedAmount, numberOrZero,
} from "./expense.utils";

export default function ExpenseDetailDialog({ expense, employee, loading = false, error, onOpenChange }) {
  if (!expense) return <Dialog open={false} onOpenChange={onOpenChange} />;

  const employeeInfo = getExpenseEmployeeInfo(expense, employee);
  const financeReview = expense.financeReview || expense.financeApproval || {};
  const adminDecision = expense.adminDecision || expense.adminApproval || {};
  const recommendedAmount = firstPresent(
    financeReview.recommendedAmount,
    financeReview.approvedAmount,
    expense.financeRecommendedAmount,
    expense.recommendedAmount,
    hasApprovedAmount(expense) ? expense.amountCover : undefined,
  );
  const finalApprovedAmount = firstPresent(
    adminDecision.finalApprovedAmount,
    adminDecision.approvedAmount,
    expense.approvedAmount,
    expense.finalApprovedAmount,
    hasApprovedAmount(expense) ? expense.amountCover : undefined,
  );
  const difference = recommendedAmount === undefined
    ? undefined
    : Math.max(numberOrZero(expense.expenseAmount) - numberOrZero(recommendedAmount), 0);
  const adjustment = firstPresent(
    financeReview.proposedAdjustment,
    financeReview.adjustmentType,
    adminDecision.finalAdjustment,
    expense.adjustmentType,
    getAdjustment(expense),
  );
  const payrollMonth = firstPresent(
    financeReview.proposedPayrollMonth,
    adminDecision.payrollMonth,
    expense.payrollMonth,
    formatMonthPeriod(expense.monthPeriod),
  );
  const attachments = Array.isArray(expense.attachments) ? expense.attachments : [];
  const financeStatus = firstPresent(
    financeReview.status,
    expense.financeRecommendation,
    expense.financeReviewStatus,
    hasApprovedAmount(expense) ? "Reviewed" : "Awaiting Review",
  );
  const decisionStatus = firstPresent(
    adminDecision.status,
    expense.adminDecisionStatus,
    hasApprovedAmount(expense) ? "Approved" : "Awaiting Decision",
  );

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden border-border bg-card p-0 text-card-foreground">
        <DialogHeader className="border-b border-border px-4 py-3 text-left">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[hsl(var(--chart-4)/0.12)] text-[hsl(var(--chart-4))]">
              <ReceiptIndianRupee className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="pr-7 text-lg font-semibold">Expense Claim Detail</DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">
                Review the submitted expense, approval details and adjustment summary.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2.5 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-2 text-[11px] text-primary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading latest expense details...
            </div>
          ) : null}
          {error ? (
            <div className="flex items-center gap-1.5 rounded-md border border-destructive/25 bg-destructive/5 px-2.5 py-2 text-[11px] text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {getErrorMessage(error, "Unable to load expense details")}
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2">
            <p className="text-xs font-medium">
              Claim ID: <span className="text-foreground">{displayText(expense.expenseId)}</span>
            </p>
            <StatusBadge status={expense.status} large />
          </div>

          <div className="grid gap-2 rounded-md border border-border bg-muted/20 p-2 md:grid-cols-[1.25fr_1fr_0.8fr_1fr]">
            <div className="flex min-w-0 items-center gap-2.5 md:border-r md:border-border md:pr-2">
              <Avatar className="h-10 w-10 border border-[hsl(var(--chart-2)/0.30)]">
                {employeeInfo.profileImageUrl ? <AvatarImage src={employeeInfo.profileImageUrl} alt={employeeInfo.name} /> : null}
                <AvatarFallback className="bg-[hsl(var(--chart-2))] text-[13px] font-medium text-white">
                  {getInitials(employeeInfo.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{employeeInfo.name}</p>
                {/* <p className="truncate text-[11px] text-muted-foreground">{employeeInfo.code}</p> */}
                <p className="truncate text-[11px] text-muted-foreground">{employeeInfo.role}</p>
              </div>
            </div>
            <ClaimSummaryItem icon={WalletCards} label="Payment Source" value={displayText(expense.paymentSource)} tone="blue" />
            <ClaimSummaryItem icon={BadgeIndianRupee} label="Claimed Amount" value={formatCurrency(expense.expenseAmount)} tone="violet" />
            <ClaimSummaryItem icon={ReceiptIndianRupee} label="Adjustment Type" value={adjustment} tone="orange" />
          </div>

          <ClaimDetailSection title="Employee Submitted Expense" icon={FileText} tone="blue" badge="Read Only" badgeIcon={LockKeyhole}>
            <div className="grid gap-y-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
              <ClaimDetailField icon={ReceiptIndianRupee} label="Expense Name" value={displayText(expense.expenseName)} />
              <ClaimDetailField icon={FileText} label="Linked To" value={displayText(expense.linkedTo)} />
              <ClaimDetailField icon={Tag} label="Category" value={displayText(expense.category)} />
              <ClaimDetailField icon={CalendarDays} label="Expense Date" value={formatDate(expense.expenseDate)} />
              <ClaimDetailField icon={UserRound} label="Paid To / Vendor" value={displayText(expense.paidTo)} />
              <ClaimDetailField icon={Clock3} label="Submitted On" value={formatDateTime(expense.createdAt)} />
            </div>
            <div className="space-y-2 border-t border-border p-3">
              <ClaimDetailNote icon={FileText} label="Business Purpose" value={displayText(expense.businessPurpose)} tone="blue" />
              <ClaimDetailNote icon={FileText} label="Supporting Note" value={displayText(expense.supportingNote)} tone="violet" />
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Paperclip className="h-3 w-3 text-primary" />
                  Attachments
                </p>
                {attachments.length ? (
                  <div className="space-y-1.5">
                    {attachments.map((attachment, index) => (
                      <ClaimAttachment key={getAttachmentKey(attachment, index)} attachment={attachment} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-border bg-muted/15 px-3 py-2 text-[11px] text-muted-foreground">
                    No attachments added.
                  </div>
                )}
              </div>
            </div>
          </ClaimDetailSection>

          <ClaimDetailSection title="Finance Review" icon={CheckCircle2} tone="green" badge={financeStatus} badgeIcon={CheckCircle2}>
            <div className="grid gap-y-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
              <ClaimDetailField icon={BadgeIndianRupee} label="Employee Claimed" value={formatCurrency(expense.expenseAmount)} />
              <ClaimDetailField icon={BadgeIndianRupee} label="Recommended Amount" value={formatOptionalCurrency(recommendedAmount)} />
              <ClaimDetailField icon={BadgeIndianRupee} label="Difference" value={formatOptionalCurrency(difference)} />
              <ClaimDetailField icon={ReceiptIndianRupee} label="Proposed Adjustment" value={adjustment} />
              <ClaimDetailField icon={CalendarDays} label="Proposed Payroll Month" value={payrollMonth} className="lg:col-span-2" />
            </div>
            <div className="space-y-2 border-t border-border p-3">
              <ClaimDetailNote
                icon={FileText}
                label="Proposed Payroll Note"
                value={displayText(firstPresent(financeReview.payrollNote, financeReview.note, expense.financeReviewNote))}
                tone="green"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <ClaimDetailField icon={UserRound} label="Reviewed By" value={displayPerson(firstPresent(financeReview.reviewedBy, expense.reviewedBy))} />
                <ClaimDetailField icon={CalendarDays} label="Reviewed On" value={formatDateTime(firstPresent(financeReview.reviewedAt, expense.reviewedAt))} />
              </div>
            </div>
          </ClaimDetailSection>

          <ClaimDetailSection title="Admin Decision" icon={ShieldCheck} tone="violet" badge={decisionStatus} badgeIcon={ShieldCheck}>
            <div className="grid gap-y-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
              <ClaimDetailField icon={BadgeIndianRupee} label="Final Approved Amount" value={formatOptionalCurrency(finalApprovedAmount)} />
              <ClaimDetailField icon={ReceiptIndianRupee} label="Final Adjustment" value={adjustment} />
              <ClaimDetailField icon={CalendarDays} label="Payroll Month" value={payrollMonth} />
              <ClaimDetailField icon={UserRound} label="Settlement Status" value={displayText(firstPresent(adminDecision.settlementStatus, expense.settlementStatus, expense.status))} />
            </div>
            <div className="space-y-2 border-t border-border p-3">
              <ClaimDetailNote
                icon={FileText}
                label="Admin Decision Note"
                value={displayText(firstPresent(adminDecision.decisionNote, adminDecision.note, expense.adminNote, expense.adminDecisionNote))}
                tone="violet"
              />
              <div className="flex items-start gap-1.5 rounded-md border border-primary/15 bg-primary/5 px-2.5 py-2 text-[11px] leading-4 text-primary">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                Only the approved amount is included in salary. Any unsupported amount is excluded.
              </div>
            </div>
          </ClaimDetailSection>
        </div>

        <DialogFooter className="flex-row justify-end border-t border-border px-3 py-2.5 sm:justify-end">
          <Button type="button" variant="outline" className="h-8 min-w-32 text-xs" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClaimSummaryItem({ icon: Icon, label, value, tone }) {
  const toneClass = {
    blue: "bg-primary/10 text-primary",
    violet: "bg-[hsl(var(--chart-4)/0.12)] text-[hsl(var(--chart-4))]",
    orange: "bg-[hsl(var(--chart-3)/0.12)] text-[hsl(var(--chart-3))]",
  }[tone];

  return (
    <div className="flex min-w-0 items-center gap-2 md:border-r md:border-border md:pr-2 md:last:border-r-0">
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${toneClass}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-[11px] font-medium">{value}</p>
      </div>
    </div>
  );
}

function ClaimDetailSection({ title, icon: Icon, tone, badge, badgeIcon: BadgeIcon, children }) {
  const toneClass = {
    blue: "border-primary/15 bg-primary/5 text-primary",
    green: "border-[hsl(var(--chart-2)/0.18)] bg-[hsl(var(--chart-2)/0.06)] text-[hsl(var(--chart-2))]",
    violet: "border-[hsl(var(--chart-4)/0.18)] bg-[hsl(var(--chart-4)/0.06)] text-[hsl(var(--chart-4))]",
  }[tone];

  return (
    <section className="overflow-hidden rounded-md border border-border bg-background">
      <div className={`flex items-center justify-between gap-2 border-b px-2.5 py-2 ${toneClass}`}>
        <div className="flex items-center gap-2 text-xs font-medium">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        {badge ? (
          <span className="inline-flex items-center gap-1 rounded border border-current/20 bg-background/70 px-1.5 py-0.5 text-[10px] font-medium">
            {BadgeIcon ? <BadgeIcon className="h-2.5 w-2.5" /> : null}
            {badge}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ClaimDetailField({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`min-w-0 px-2 sm:border-r sm:border-border sm:last:border-r-0 ${className}`}>
      <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Icon className="h-3 w-3 shrink-0 text-primary" />
        {label}
      </p>
      <p className="mt-1 break-words pl-[18px] text-[11px] font-medium leading-4">{value}</p>
    </div>
  );
}

function ClaimDetailNote({ icon: Icon, label, value, tone }) {
  const toneClass = {
    blue: "bg-primary/5",
    green: "bg-[hsl(var(--chart-2)/0.06)]",
    violet: "bg-[hsl(var(--chart-4)/0.06)]",
  }[tone];

  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Icon className="h-3 w-3 text-primary" />
        {label}
      </p>
      <p className={`rounded-md border border-border px-2.5 py-1.5 text-[11px] leading-4 ${toneClass}`}>{value}</p>
    </div>
  );
}

function ClaimAttachment({ attachment }) {
  const name = getAttachmentName(attachment);
  const url = getAttachmentUrl(attachment);
  const size = getAttachmentSize(attachment);

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-destructive/10 text-destructive">
        <FileText className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium">{name}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{size}</p>
      </div>
      {url ? (
        <Button asChild type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[10px] text-primary">
          <a href={url} target="_blank" rel="noreferrer">
            <Eye className="h-3 w-3" />
            View File
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function getExpenseEmployeeInfo(expense, fallbackEmployee) {
  const expenseEmployee = expense.employee && typeof expense.employee === "object"
    ? expense.employee
    : {};
  const fallback = fallbackEmployee && typeof fallbackEmployee === "object"
    ? fallbackEmployee
    : {};

  return {
    profileImageUrl: firstPresent(
      expenseEmployee.profileImage?.smallUrl,
      expenseEmployee.profileImage?.url,
      typeof expenseEmployee.profileImage === "string" ? expenseEmployee.profileImage : undefined,
      fallback.profileImage?.smallUrl,
      fallback.profileImage?.url,
      typeof fallback.profileImage === "string" ? fallback.profileImage : undefined,
    ),
    name: displayText(firstPresent(
      expenseEmployee.fullName,
      expenseEmployee.name,
      expense.employeeName,
      fallback.fullName,
      fallback.name,
    )),
    code: displayText(firstPresent(
      expenseEmployee.employeeId,
      expenseEmployee.employeeCode,
      expense.employeeCode,
      fallback.employeeId,
      fallback.employeeCode,
    )),
    role: displayText(firstPresent(
      expenseEmployee.designation,
      expenseEmployee.jobTitle,
      expenseEmployee.role,
      expense.employeeDesignation,
      fallback.designation,
      fallback.jobTitle,
      fallback.role,
    )),
  };
}


