/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowRight,
  BadgeIndianRupee,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Circle,
  CircleDollarSign,
  CloudUpload,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileClock,
  FileQuestion,
  FileText,
  Info,
  IndianRupee,
  Landmark,
  Loader2,
  MessageSquareMore,
  Paperclip,
  Plus,
  ReceiptIndianRupee,
  Send,
  ShieldCheck,
  Headphones,
  Trash2,
  UserRound,
  WalletCards,
  MoveRight,
} from 'lucide-react';
import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@components/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/components/ui/tabs';
import { Textarea } from '@components/components/ui/textarea';
import { MonthFilterControl } from '../attendence-leave/AttendenceLeavePage';
import EmployeeV2Service from '@/services/employee-v2.service';
import {
  ADVANCE_REQUEST_STATUS,
  advanceRequestFiltersSchema,
  advanceRequestSchema,
  canDeleteAdvanceRequest,
  clarificationResponseSchema,
  getApiErrorMessage,
  getOpenClarification,
} from './advance-request';
import {
  ALLOWANCE_REQUEST_STATUS,
  allowanceClarificationResponseSchema,
  allowanceRequestFiltersSchema,
  allowanceRequestIdSchema,
  canDeleteAllowanceRequest,
  createAllowanceRequestSchema,
  getAllowanceApiErrorMessage,
  getOpenAllowanceClarification,
} from './allowance-request';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/components/ui/table';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const payrollFormCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const currency = (amount) => (
  amount === null || amount === undefined ? '—' : currencyFormatter.format(Number(amount))
);

const payrollFormCurrency = (amount) => (
  amount === null || amount === undefined ? '—' : payrollFormCurrencyFormatter.format(Number(amount))
);

const salaryBasisLabels = {
  'Monthly Fixed': 'Monthly Fixed',
  'Per Day': 'Daily',
  'Per Event': 'Event Wise',
  Hourly: 'Hourly',
};

const rateSuffixes = {
  'Monthly Fixed': '/ month',
  'Per Day': '/ day',
  'Per Event': '/ event',
  Hourly: '/ hour',
};

const payrollQueryTypes = [
  'Wrong Deduction',
  'Reimbursement Missing',
  'Payslip Issue',
  'Salary Not Received',
  'Other',
];

const objectIdPattern = /^[a-f\d]{24}$/i;

const getEmployeePayrollId = (payrollSalary) => {
  const candidates = [
    payrollSalary?.employeePayrollId,
    payrollSalary?.employeePayroll?._id,
    payrollSalary?.payroll?._id,
    payrollSalary?._id,
  ];
  return candidates.find((value) => objectIdPattern.test(value || '')) || '';
};

const formatRate = (amount, salaryBasis) => {
  if (amount === null || amount === undefined) return '—';
  const suffix = rateSuffixes[salaryBasis];
  return `${currency(amount)}${suffix ? ` ${suffix}` : ''}`;
};

const formatMonth = (month) => {
  if (!/^\d{4}-\d{2}$/.test(month || '')) return '—';
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getPayrollRequestReference = (request, requestType = 'Advance') => {
  const id = request?._id || '';
  const prefix = requestType === 'Allowance' ? 'ALL' : 'ADV';
  return id ? `${prefix}-${id.slice(-8).toUpperCase()}` : '—';
};

const tabs = [
  ['summary', 'Salary Summary', BadgeIndianRupee],
  ['allowance', 'Allowance', WalletCards],
  ['advance', 'Advance & Deduction', ReceiptIndianRupee],
  ['reimbursements', 'Reimbursements', FileCheck2],
  ['loan', 'Loan', Landmark],
  ['queries', 'Salary Queries', FileQuestion],
];

const progress = [
  ['Attendance Verified', '—', 'idle'],
  ['Salary Calculated', '—', 'idle'],
  ['Admin Approval', '—', 'idle'],
  ['Payment Processing', '—', 'idle'],
  ['Paid', '—', 'idle'],
  ['Payslip Generated', '—', 'idle'],
];

const history = [];
const reimbursementRows = [];

const formatQueryDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date).replaceAll('/', '-');
};

function StatusBadge({ value }) {
  const success = ['Paid', 'Active', 'Approved', 'Completed', 'Resolved', 'Applied', 'Closed', 'Assigned', 'Verified'].includes(value);
  const warning = [
    'Pending',
    'Under Review',
    'In Review',
    'Open',
    'High',
    'Not Generated',
    ADVANCE_REQUEST_STATUS.PENDING_FINANCE_REVIEW,
    ADVANCE_REQUEST_STATUS.CLARIFICATION_REQUESTED,
    ADVANCE_REQUEST_STATUS.PENDING_ADMIN_APPROVAL,
  ].includes(value);
  return (
    <Badge
      variant="outline"
      className={success ? 'payroll-badge-success' : warning ? 'payroll-badge-warning' : 'payroll-badge-neutral'}
    >
      {value}
    </Badge>
  );
}

function PanelHeader({ icon: Icon, title, action }) {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border px-4 py-3">
      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
        <Icon size={16} className="text-primary" />
        {title}
      </CardTitle>
      {action}
    </CardHeader>
  );
}

function EmptyTableRow({ colSpan }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-20 text-center text-xs text-muted-foreground">
        No data available
      </TableCell>
    </TableRow>
  );
}

function StatCard({ data }) {
  const [label, value, note, Icon, tone] = data;
  return (
    <Card className="payroll-stat-card">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`payroll-stat-icon payroll-stat-icon-${tone}`}>
          <Icon size={19} strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p>
          <p className={`mt-1 text-[10px] font-medium ${tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
            {note}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SalaryList({ title, rows, totalLabel, total, deduction = false }) {
  return (
    <div className={`flex min-h-52 flex-col p-4 ${deduction ? 'border-t border-border md:border-l md:border-t-0' : ''}`}>
      <p className={`text-sm font-semibold ${deduction ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
        {title}
      </p>
      <div className="mt-2 flex-1 space-y-2">
        {rows.map(([label, amount]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-[11px]">
            <span className="font-medium text-foreground">{label}</span>
            <span className="font-semibold text-foreground">{currency(amount)}</span>
          </div>
        ))}
      </div>
      <div className={deduction ? 'payroll-total payroll-total-red' : 'payroll-total payroll-total-green'}>
        <span>{totalLabel}</span>
        <strong>{currency(total)}</strong>
      </div>
    </div>
  );
}

function SalaryBreakdown({ payrollSalary }) {
  const breakdown = payrollSalary?.salaryBreakdown;
  const breakdownEarnings = breakdown?.earnings;
  const breakdownDeductions = breakdown?.deductions;
  const earnings = [
    ['Basic Salary', breakdownEarnings?.basicSalary],
    ['Allowance', breakdownEarnings?.allowance],
    ['Approved Reimbursements', breakdownEarnings?.approvedReimbursements],
  ];
  const deductions = [
    ['Attendance Deduction', breakdownDeductions?.attendanceDeduction],
    ['Provident Fund (PF)', breakdownDeductions?.providentFund],
    ['ESI', breakdownDeductions?.esi],
    ['Professional Tax', breakdownDeductions?.professionalTax],
    ['Advance Deduction', breakdownDeductions?.advanceDeduction],
    ['Loan Deduction', breakdownDeductions?.loanDeduction],
  ];

  return (
    <Card className="payroll-panel">
      <PanelHeader icon={FileCheck2} title={`Salary Breakdown – ${formatMonth(payrollSalary?.month)}`} />
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ['Salary Basis', salaryBasisLabels[breakdown?.salaryBasis] || breakdown?.salaryBasis || '—'],
            ['Rate Amount', formatRate(breakdown?.rateAmount, breakdown?.salaryBasis)],
            ['Payable Days', breakdown?.payableDays === undefined ? '—' : `${breakdown.payableDays} Days`],
            ['Payroll Status', <StatusBadge key="status" value={breakdown?.payrollStatus || '—'} />],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
              <div className="mt-1 text-xs font-semibold text-foreground">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid overflow-hidden rounded-md border border-border md:grid-cols-2">
          <SalaryList title="Earnings" rows={earnings} totalLabel="Gross Earnings" total={breakdownEarnings?.grossEarnings} />
          <SalaryList title="Deductions" rows={deductions} totalLabel="Total Deductions" total={breakdownDeductions?.totalDeductions} deduction />
        </div>

        <div className="payroll-net-salary">
          <span>Net Payable Salary</span>
          <strong>{currency(breakdown?.netPayableSalary)}</strong>
        </div>
        <button type="button" className="ml-auto mt-3 flex items-center gap-1 text-[10px] font-medium text-primary hover:underline">
          View Full Breakdown <ArrowRight size={12} />
        </button>
      </CardContent>
    </Card>
  );
}

function AttendanceSnapshot({ payrollSalary }) {
  const snapshot = payrollSalary?.attendanceAndLeaveSnapshot;
  const attendanceStatus = payrollSalary?.metricsSummary?.attendanceStatus || '—';
  const attendance = [
    ['Working Days', snapshot?.workingDays ?? '—'],
    ['Present Days', snapshot?.presentDays ?? '—'],
    ['Paid Leaves', snapshot?.paidLeaves ?? '—'],
    ['Unpaid Leaves', snapshot?.unpaidLeaves ?? '—'],
    ['Half Days', snapshot?.halfDays ?? '—'],
    ['Absent Days', snapshot?.absentDays ?? '—'],
    ['Late Days', snapshot?.lateDays ?? '—'],
    ['Total Working Hours', snapshot?.totalWorkingHoursFormatted || '—'],
    ['Payable Days', snapshot?.payableDays === undefined ? '—' : `${snapshot.payableDays} Days`],
    ['Attendance Deduction', currency(snapshot?.attendanceDeduction)],
  ];

  return (
    <Card className="payroll-panel">
      <PanelHeader
        icon={FileText}
        title="Attendance & Leave Snapshot"
        action={<StatusBadge value={attendanceStatus} />}
      />
      <CardContent className="p-4">
        <div className="overflow-hidden rounded-md border border-border">
          {attendance.map(([label, value], index) => (
            <div
              key={label}
              className={`grid grid-cols-2 text-[10px] ${index < attendance.length - 1 ? 'border-b border-border' : ''} ${index >= 7 ? 'bg-muted/45' : ''}`}
            >
              <span className="px-3 py-1.5 font-medium text-muted-foreground">{label}</span>
              <span className="border-l border-border px-3 py-1.5 text-right font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-md border border-border bg-muted/25 text-[10px]">
          <div className="p-3">
            <p className="text-muted-foreground">Verified By</p>
            <p className="mt-1 font-semibold text-foreground">—</p>
          </div>
          <div className="border-l border-border p-3">
            <p className="text-muted-foreground">Verified On</p>
            <p className="mt-1 font-semibold text-foreground">—</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PayrollProgress() {
  return (
    <Card className="payroll-panel">
      <PanelHeader icon={FileClock} title="Payroll Progress" />
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-y-5 sm:grid-cols-6">
          {progress.map(([label, date, state], index) => (
            <div key={label} className="relative flex flex-col items-center px-1 text-center">
              {index < progress.length - 1 && (
                <span className="absolute left-1/2 top-3 hidden h-px w-full bg-border sm:block" />
              )}
              <span className={`relative z-10 grid h-7 w-7 place-items-center rounded-full border ${
                state === 'done'
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : state === 'current'
                    ? 'border-border bg-background text-muted-foreground ring-4 ring-muted'
                    : 'border-border bg-muted text-muted-foreground'
              }`}>
                {state === 'done' ? <Check size={13} /> : state === 'current' ? <Clock3 size={12} /> : <Circle size={8} fill="currentColor" />}
              </span>
              <p className="mt-2 text-[9px] font-medium leading-3 text-foreground">{label}</p>
              <p className="mt-1 text-[8px] text-muted-foreground">{date}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/70 px-3 py-2 text-[10px] text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300">
          <Info size={13} />
          Payroll progress information will appear here when available.
        </div>
      </CardContent>
    </Card>
  );
}

function SalaryHistory() {
  return (
    <Card className="payroll-panel">
      <PanelHeader icon={FileText} title="Previous Salary & Payslip History" />
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/45 hover:bg-muted/45">
              {['Month', 'Gross Earnings', 'Deductions', 'Net Salary', 'Payment Status', 'Paid On', 'Payslip'].map((heading) => (
                <TableHead key={heading} className="h-8 whitespace-nowrap px-3 text-[9px]">{heading}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!history.length && <EmptyTableRow colSpan={7} />}
            {history.map((row) => (
              <TableRow key={row[0]} className="hover:bg-muted/25">
                {row.map((value, index) => (
                  <TableCell key={`${row[0]}-${index}`} className="whitespace-nowrap px-3 py-2 text-[10px] font-medium">
                    {index === 4 ? (
                      <StatusBadge value={value} />
                    ) : index === 6 ? (
                      value === 'View'
                        ? <button type="button" className="inline-flex items-center gap-1 text-primary"><Eye size={12} /> View</button>
                        : <StatusBadge value={value} />
                    ) : value}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PayrollRequestDialog({
  open,
  onOpenChange,
  monthLabel,
  requestMonth,
  payrollSalary,
  requestType,
  onSubmit,
  validationSchema,
  isSubmitting = false,
}) {
  const [form, setForm] = useState({
    amount: '',
    reason: '',
    supportingNote: '',
    attachments: [],
  });
  const summary = payrollSalary?.metricsSummary;
  const requestKey = requestType.toLowerCase();
  const isAdvanceRequest = requestType === 'Advance';
  const isApiRequest = Boolean(onSubmit && validationSchema);
  const dialogWidthClassName = isAdvanceRequest ? 'sm:max-w-[600px]' : 'sm:max-w-[560px]';
  const currentRequestAmount = isAdvanceRequest
    ? payrollSalary?.salaryBreakdown?.deductions?.advanceDeduction
    : payrollSalary?.salaryBreakdown?.earnings?.allowance;
  const currentRequestLabel = isAdvanceRequest
    ? 'Current Advance Recovery'
    : 'Current Allowance Included';

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      amount: '',
      reason: '',
      supportingNote: '',
      attachments: [],
    });
  };

  const handleOpenChange = (nextOpen) => {
    if (isSubmitting) return;
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isApiRequest) {
      handleOpenChange(false);
      return;
    }

    try {
      const values = await validationSchema.validate({
        requestMonth,
        requestedAmount: form.amount,
        reason: form.reason,
        supportingNote: form.supportingNote || null,
        attachments: form.attachments,
      }, { abortEarly: false, stripUnknown: true });
      await onSubmit(values);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      if (error?.name === 'ValidationError') {
        toast.error(error.errors?.[0] || error.message);
      }
      // API errors are surfaced by the mutation's onError handler.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={`payroll-form-dialog max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] gap-0 overflow-y-auto p-0 ${dialogWidthClassName} [&>button]:right-4 [&>button]:top-4 [&>button]:opacity-100 [&>button>svg]:h-5 [&>button>svg]:w-5`}>
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-5 pb-2 pt-4 pr-12">
            <DialogTitle className="payroll-form-title">Request {requestType}</DialogTitle>
            <DialogDescription className="payroll-form-description">
              Submit your {requestKey} request for Finance review and Admin approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 px-5 pb-3 pt-2">
            <div className={`payroll-request-summary rounded-lg border border-border p-3 ${isAdvanceRequest ? '' : 'payroll-allowance-summary'}`}>
              <div className="payroll-request-metrics grid gap-3">
                {[
                  {
                    label: 'Salary Basis',
                    value: salaryBasisLabels[summary?.salaryBasis] || summary?.salaryBasis || '—',
                    Icon: BadgeIndianRupee,
                    iconClassName: 'payroll-request-icon-emerald',
                    valueClassName: 'payroll-request-value-emerald',
                  },
                  {
                    label: 'Net Salary',
                    value: payrollFormCurrency(summary?.netSalary),
                    Icon: WalletCards,
                    iconClassName: 'payroll-request-icon-blue',
                    valueClassName: 'payroll-request-value-blue',
                  },
                  {
                    label: currentRequestLabel,
                    value: payrollFormCurrency(currentRequestAmount),
                    Icon: BadgeIndianRupee,
                    iconClassName: 'payroll-request-icon-orange',
                    valueClassName: 'payroll-request-value-orange',
                  },
                ].map(({ label, value, Icon, iconClassName, valueClassName }, index) => (
                  <div
                    key={label}
                    className={`flex min-w-0 items-center gap-2.5 ${index ? 'payroll-form-metric-divider' : ''}`}
                  >
                    <span className={`payroll-request-icon ${iconClassName}`}>
                      <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="payroll-form-metric-label truncate">{label}</p>
                      <p className={`payroll-form-metric-value mt-0.5 truncate ${valueClassName}`}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="payroll-request-flow mt-6 flex items-center justify-center gap-2 text-foreground min-[520px]:gap-3"
                aria-label={`${requestType} approval flow`}
              >
                {[
                  ['1', 'Finance Review', 'blue'],
                  ['2', 'Admin Approval', 'blue'],
                  ['3', 'Added in Payroll', 'emerald'],
                ].map(([step, label], index) => (
                  <div key={step} className="flex min-w-0 items-center gap-2">
                    <span className="flex min-w-0 items-center gap-1.5 min-[520px]:gap-2">
                      <i className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-semibold bg- text-white bg-blue-500`}>
                        {step}
                      </i>
                      <span className="leading-tight">{label}</span>
                    </span>
                    {index < 2 && (
                      <MoveRight  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"  aria-hidden="true"/>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2.5 min-[520px]:grid-cols-2">
              <div className="space-y-1">
                <Label className="payroll-form-label">Request Month</Label>
                <div className="payroll-form-control flex h-9 items-center gap-3 rounded-md border border-input bg-background px-3 shadow-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="flex-1 font-medium text-foreground">{monthLabel}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`${requestKey}-request-amount`} className="payroll-form-label">
                  Requested Amount
                </Label>
                <div className="flex h-9 overflow-hidden rounded-md border border-input bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring">
                  <span className="grid w-10 shrink-0 place-items-center bg-muted/70">
                    <IndianRupee className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <Input
                    id={`${requestKey}-request-amount`}
                    type="number"
                    min="1"
                    max={isApiRequest ? 100000000 : undefined}
                    step="0.01"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(event) => updateField('amount', event.target.value)}
                    placeholder="Enter amount"
                    className="payroll-form-control h-full border-0 shadow-none focus-visible:ring-0"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor={`${requestKey}-request-reason`} className="payroll-form-label">
                Reason for {requestType}
              </Label>
              <div className="relative">
                <Textarea
                  id={`${requestKey}-request-reason`}
                  value={form.reason}
                  onChange={(event) => updateField('reason', event.target.value)}
                  maxLength={isApiRequest ? 2000 : 300}
                  placeholder={`Enter reason for requesting ${requestKey}...`}
                  className="payroll-form-control min-h-[62px] resize-none pb-6"
                  required
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
                  {form.reason.length}/{isApiRequest ? 2000 : 300}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor={`${requestKey}-supporting-note`} className="payroll-form-label">
                Supporting Note <span className="font-normal text-muted-foreground">(Optional)</span>
              </Label>
              <div className="relative">
                <Textarea
                  id={`${requestKey}-supporting-note`}
                  value={form.supportingNote}
                  onChange={(event) => updateField('supportingNote', event.target.value)}
                  maxLength={isApiRequest ? 2000 : 300}
                  placeholder="Additional information (optional)..."
                  className="payroll-form-control min-h-[58px] resize-none pb-6"
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
                  {form.supportingNote.length}/{isApiRequest ? 2000 : 300}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor={`${requestKey}-attachment`} className="payroll-form-label">
                Attachment <span className="font-normal text-muted-foreground">(Optional)</span>
              </Label>
              <label
                htmlFor={`${requestKey}-attachment`}
                className="payroll-form-upload flex min-h-[66px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-2 text-center"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const droppedFiles = Array.from(event.dataTransfer.files || []);
                  updateField('attachments', isApiRequest ? droppedFiles : droppedFiles.slice(0, 1));
                }}
              >
                <span className="flex items-center gap-2 text-[11px]">
                  <CloudUpload className="h-5 w-5 text-primary" aria-hidden="true" />
                  <strong className="font-semibold text-primary">Click to upload</strong>
                  <span className="text-foreground">or drag and drop</span>
                </span>
                <span className="mt-0.5 text-[10px] text-muted-foreground">
                  {form.attachments.length === 1
                    ? form.attachments[0].name
                    : form.attachments.length > 1
                      ? `${form.attachments.length} files selected`
                      : `JPG, PNG, PDF up to 5MB${isApiRequest ? ' (max. 5 files)' : ''}`}
                </span>
                <Input
                  id={`${requestKey}-attachment`}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  multiple={isApiRequest}
                  className="sr-only"
                  onChange={(event) => updateField(
                    'attachments',
                    Array.from(event.target.files || []),
                  )}
                  disabled={isSubmitting}
                />
              </label>
            </div>

            <div className="payroll-form-notice payroll-request-notice flex items-center gap-2 rounded-md border px-3 py-2.5">
              <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
              {requestType} request is subject to Finance review and Admin approval.
            </div>
          </div>

          <DialogFooter className="flex-row justify-between px-5 pb-4 pt-1 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="h-9 px-4 text-[11px]" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="payroll-request-submit h-9 gap-2 px-4 text-[11px] font-semibold" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Submitting...' : `Submit ${requestType} Request`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PayrollRequestDeleteDialog({ request, requestType, onOpenChange, onConfirm, isPending }) {
  return (
    <Dialog
      open={Boolean(request)}
      onOpenChange={(open) => {
        if (!open && !isPending) onOpenChange(false);
      }}
    >
      <DialogContent className="p-0 sm:max-w-[440px]">
        <DialogHeader className="border-b border-border px-5 py-4 text-left">
          <div className="flex items-start gap-3 pr-8">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold">Cancel {requestType} Request</DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-5">
                This audited action cancels the pending request.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="px-5 py-4">
          <p className="text-xs leading-5 text-foreground">
            Cancel <span className="font-medium">{getPayrollRequestReference(request, requestType)}</span> for{' '}
            <span className="font-medium">{currency(request?.requestedAmount)}</span>?
          </p>
        </div>
        <DialogFooter className="gap-2 border-t border-border px-5 py-4 sm:space-x-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Keep Request
          </Button>
          <Button type="button" variant="destructive" className="gap-2" onClick={onConfirm} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {isPending ? 'Cancelling...' : 'Cancel Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PayrollAttachmentList({ attachments }) {
  if (!Array.isArray(attachments) || !attachments.length) return null;

  return (
    <div className="space-y-1.5">
      {attachments.map((attachment, index) => {
        const fileName = attachment.fileName || attachment.name || `Attachment ${index + 1}`;
        const content = (
          <>
            <span className="flex min-w-0 items-center gap-2">
              <FileText className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block truncate text-[9px] font-medium text-foreground">{fileName}</span>
                <span className="block text-[8px] text-muted-foreground">{attachment.fileType || 'Document'}</span>
              </span>
            </span>
            {attachment.fileUrl && <Eye className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />}
          </>
        );

        return attachment.fileUrl ? (
          <a
            key={attachment._id || `${fileName}-${index}`}
            href={attachment.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2.5 py-2 hover:bg-muted/40"
          >
            {content}
          </a>
        ) : (
          <div key={attachment._id || `${fileName}-${index}`} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2.5 py-2">
            {content}
          </div>
        );
      })}
    </div>
  );
}

function AllowanceTab({ filters, onFilterChange, payrollSalary }) {
  const queryClient = useQueryClient();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [page, setPage] = useState(1);
  const selectedMonth = `${filters.year}-${String(filters.month).padStart(2, '0')}`;
  const monthLabel = formatMonth(selectedMonth);

  const allowanceRequestsQuery = useQuery({
    queryKey: ['employee-allowance-requests', selectedMonth, page],
    queryFn: async () => {
      const queryFilters = await allowanceRequestFiltersSchema.validate({
        requestMonth: selectedMonth,
        page,
        limit: 20,
      }, { abortEarly: false, stripUnknown: true });
      const response = await EmployeeV2Service.getMyAllowanceRequests(queryFilters);
      return response.data?.data || {};
    },
  });

  const invalidateAllowanceRequests = () => queryClient.invalidateQueries({
    queryKey: ['employee-allowance-requests'],
  });

  const createAllowanceMutation = useMutation({
    mutationFn: (values) => EmployeeV2Service.createAllowanceRequest(values),
    onSuccess: (response) => {
      toast.success(response.data?.message || 'Allowance request submitted successfully');
      invalidateAllowanceRequests();
    },
    onError: (error) => toast.error(getAllowanceApiErrorMessage(error)),
  });

  const allowanceClarificationMutation = useMutation({
    mutationFn: (values) => EmployeeV2Service.respondToAllowanceClarification(values),
    onSuccess: (response) => {
      const updatedRequest = response.data?.data?.allowanceRequest;
      if (updatedRequest) setSelectedRequest(updatedRequest);
      toast.success(response.data?.message || 'Clarification response submitted successfully');
      invalidateAllowanceRequests();
    },
    onError: (error) => toast.error(getAllowanceApiErrorMessage(error, 'Unable to submit clarification response')),
  });

  const deleteAllowanceMutation = useMutation({
    mutationFn: async (requestId) => {
      const validated = await allowanceRequestIdSchema.validate({ requestId }, { abortEarly: false });
      return EmployeeV2Service.deleteAllowanceRequest(validated.requestId);
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || 'Allowance request cancelled successfully');
      setRequestToDelete(null);
      setSelectedRequest(null);
      invalidateAllowanceRequests();
    },
    onError: (error) => toast.error(getAllowanceApiErrorMessage(error, 'Unable to cancel allowance request')),
  });

  const allowanceRequests = Array.isArray(allowanceRequestsQuery.data?.allowanceRequests)
    ? allowanceRequestsQuery.data.allowanceRequests
    : [];
  const pagination = allowanceRequestsQuery.data?.pagination || {};
  const totalPages = Math.max(Number(pagination.totalPages) || 0, 1);
  const total = Number(pagination.total) || allowanceRequests.length;
  const limit = Number(pagination.limit) || 20;
  const currentPage = Number(pagination.page) || page;
  const firstResult = total ? ((currentPage - 1) * limit) + 1 : 0;
  const lastResult = total ? Math.min(currentPage * limit, total) : 0;

  const handleFilterChange = (updater) => {
    setPage(1);
    onFilterChange(updater);
  };

  return (
    <Card className="payroll-panel">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-border px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
            <BadgeIndianRupee className="h-4 w-4" aria-hidden="true" />
          </span>
          Allowance
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <MonthFilterControl filters={filters} onFilterChange={handleFilterChange} />
          <Button variant="outline" size="sm" className="h-8 gap-2 px-3 text-xs font-medium">
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download
          </Button>
          <Button
            type="button"
            size="sm"
            className="payroll-request-button h-8 gap-2 px-3 text-xs font-medium"
            onClick={() => setIsRequestDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Request Allowance
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/45 hover:bg-muted/45">
                {['Allowance Name', 'Frequency', 'Amount', 'Effective From', 'Included in Salary', 'Status', 'Action'].map((heading) => (
                  <TableHead key={heading} className="h-9 whitespace-nowrap px-3 text-[10px]">
                    {heading}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allowanceRequestsQuery.isPending && (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading allowance requests...
                    </span>
                  </TableCell>
                </TableRow>
              )}
              {allowanceRequestsQuery.isError && (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-xs text-red-600 dark:text-red-300">
                    {getAllowanceApiErrorMessage(allowanceRequestsQuery.error, 'Unable to load allowance requests')}
                  </TableCell>
                </TableRow>
              )}
              {!allowanceRequestsQuery.isPending && !allowanceRequestsQuery.isError && !allowanceRequests.length && (
                <EmptyTableRow colSpan={7} />
              )}
              {allowanceRequests.map((request) => (
                <TableRow key={request._id} className="hover:bg-muted/25">
                  <TableCell className="max-w-[240px] px-3 py-3 text-xs font-semibold" title={request.reason || undefined}>
                    <span className="block truncate">{request.reason || getPayrollRequestReference(request, 'Allowance')}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">—</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs font-semibold">{currency(request.requestedAmount)}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">{formatMonth(request.requestMonth)}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">
                    {request.status === ALLOWANCE_REQUEST_STATUS.APPLIED ? formatMonth(request.requestMonth) : '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">
                    <StatusBadge value={request.status || '—'} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {Number(pagination.totalPages) > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2">
              <p className="text-[10px] text-muted-foreground">
                Showing {firstResult} to {lastResult} of {total} requests
              </p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Previous page"
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={page <= 1 || allowanceRequestsQuery.isFetching}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button type="button" size="icon" className="h-7 w-7 text-[10px]" disabled>
                  {currentPage}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Next page"
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                  disabled={page >= totalPages || allowanceRequestsQuery.isFetching}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-center gap-16 rounded-md border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300">
          <span>Total Allowance Included</span>
          <strong className="text-lg font-semibold">{currency(payrollSalary?.salaryBreakdown?.earnings?.allowance)}</strong>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/70 px-3 py-2.5 text-[11px] text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Approved requests are added to payroll only after their status changes to Applied.
        </div>
      </CardContent>
      <PayrollRequestDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        monthLabel={monthLabel}
        requestMonth={selectedMonth}
        payrollSalary={payrollSalary}
        requestType="Allowance"
        onSubmit={(values) => createAllowanceMutation.mutateAsync(values)}
        validationSchema={createAllowanceRequestSchema}
        isSubmitting={createAllowanceMutation.isPending}
      />
      <PayrollRequestDetailSheet
        request={selectedRequest}
        requestType="Allowance"
        requestStatus={ALLOWANCE_REQUEST_STATUS}
        responseSchema={allowanceClarificationResponseSchema}
        canDeleteRequest={canDeleteAllowanceRequest}
        getOpenClarificationForRequest={getOpenAllowanceClarification}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
        onDelete={setRequestToDelete}
        onRespond={(values) => allowanceClarificationMutation.mutateAsync(values)}
        isDeleting={deleteAllowanceMutation.isPending}
        isResponding={allowanceClarificationMutation.isPending}
      />
      <PayrollRequestDeleteDialog
        request={requestToDelete}
        requestType="Allowance"
        onOpenChange={(open) => !open && setRequestToDelete(null)}
        onConfirm={() => deleteAllowanceMutation.mutate(requestToDelete?._id)}
        isPending={deleteAllowanceMutation.isPending}
      />
    </Card>
  );
}

function PayrollRequestDetailSheet({
  request,
  requestType = 'Advance',
  requestStatus = ADVANCE_REQUEST_STATUS,
  responseSchema = clarificationResponseSchema,
  canDeleteRequest = canDeleteAdvanceRequest,
  getOpenClarificationForRequest = getOpenClarification,
  onOpenChange,
  onDelete,
  onRespond,
  isDeleting,
  isResponding,
}) {
  const [response, setResponse] = useState('');
  const [attachments, setAttachments] = useState([]);
  const requestKey = requestType.toLowerCase();
  const openClarification = getOpenClarificationForRequest(request);
  const clarificationHistory = Array.isArray(request?.clarificationHistory)
    ? request.clarificationHistory
    : [];

  const resetResponse = () => {
    setResponse('');
    setAttachments([]);
  };

  const handleOpenChange = (open) => {
    if (!open && (isDeleting || isResponding)) return;
    if (!open) resetResponse();
    onOpenChange(open);
  };

  const handleRespond = async (event) => {
    event.preventDefault();
    try {
      const values = await responseSchema.validate({
        requestId: request?._id,
        clarificationId: openClarification?._id,
        response,
        attachments,
      }, { abortEarly: false, stripUnknown: true });
      await onRespond(values);
      resetResponse();
    } catch (error) {
      if (error?.name === 'ValidationError') {
        toast.error(error.errors?.[0] || error.message);
      }
      // API errors are surfaced by the mutation's onError handler.
    }
  };

  return (
    <Sheet open={Boolean(request)} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-[440px]">
        {request && (
          <>
            <SheetHeader className="border-b border-border px-4 py-4 text-left">
              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <SheetTitle className="text-base font-semibold">{requestType} Request Detail</SheetTitle>
                  <SheetDescription className="mt-1 text-[11px] font-semibold text-foreground">
                    {getPayrollRequestReference(request, requestType)}
                  </SheetDescription>
                </div>
                <StatusBadge value={request.status || '—'} />
              </div>
            </SheetHeader>

            <div className="space-y-3 p-4">
              <Card className="shadow-none">
                <CardHeader className="border-b border-border px-3 py-2.5">
                  <CardTitle className="text-[11px] font-semibold">Request Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-3 py-3">
                  {[
                    ['Request Month', formatMonth(request.requestMonth)],
                    ['Requested Amount', currency(request.requestedAmount)],
                    ['Submitted On', formatDateTime(request.createdAt)],
                    ['Last Updated', formatDateTime(request.updatedAt)],
                    ['Attachments', `${request.attachments?.length || 0}`],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[104px_8px_minmax(0,1fr)] gap-1 text-[10px]">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-muted-foreground">:</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 text-[10px]">
                    <p className="text-muted-foreground">Reason</p>
                    <p className="mt-1 whitespace-pre-wrap leading-4 text-foreground">{request.reason || '—'}</p>
                  </div>
                  {request.supportingNote && (
                    <div className="text-[10px]">
                      <p className="text-muted-foreground">Supporting Note</p>
                      <p className="mt-1 whitespace-pre-wrap leading-4 text-foreground">{request.supportingNote}</p>
                    </div>
                  )}
                  {request.attachments?.length > 0 && (
                    <div className="border-t border-border pt-2 text-[10px]">
                      <p className="mb-1.5 text-muted-foreground">Attachments</p>
                      <PayrollAttachmentList attachments={request.attachments} />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="border-b border-border px-3 py-2.5">
                  <CardTitle className="text-[11px] font-semibold">Review &amp; Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-3 py-3">
                  {[
                    ['Finance Recommendation', request.financeReview?.recommendation || 'Pending'],
                    ['Recommended Amount', currency(request.financeReview?.recommendedAmount)],
                    ['Finance Note', request.financeReview?.note || '—'],
                    ['Admin Decision', request.adminDecision?.decision || 'Pending'],
                    ['Approved Amount', currency(request.adminDecision?.approvedAmount)],
                    ['Admin Note', request.adminDecision?.note || '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[122px_8px_minmax(0,1fr)] gap-1 text-[10px]">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-muted-foreground">:</span>
                      <span className="break-words font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {clarificationHistory.length > 0 && (
                <Card className="shadow-none">
                  <CardHeader className="border-b border-border px-3 py-2.5">
                    <CardTitle className="text-[11px] font-semibold">Finance Clarifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-3 py-3">
                    {clarificationHistory.map((clarification) => (
                      <div key={clarification._id} className="rounded-md border border-border bg-muted/20 p-2.5 text-[10px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground">Finance Question</span>
                          <StatusBadge value={clarification.status || '—'} />
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap leading-4 text-foreground">{clarification.question || '—'}</p>
                        <p className="mt-1 text-[9px] text-muted-foreground">Requested {formatDateTime(clarification.requestedAt)}</p>
                        {clarification.response && (
                          <div className="mt-2 border-t border-border pt-2">
                            <p className="font-semibold text-foreground">Your Response</p>
                            <p className="mt-1 whitespace-pre-wrap leading-4 text-muted-foreground">{clarification.response}</p>
                            {clarification.attachments?.length > 0 && (
                              <div className="mt-2">
                                <PayrollAttachmentList attachments={clarification.attachments} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {request.status === requestStatus.CLARIFICATION_REQUESTED && openClarification && (
                <form onSubmit={handleRespond} className="rounded-md border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-400/25 dark:bg-emerald-400/5">
                  <Label htmlFor={`${requestKey}-clarification-response`} className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Respond to Finance
                  </Label>
                  <Textarea
                    id={`${requestKey}-clarification-response`}
                    value={response}
                    onChange={(event) => setResponse(event.target.value)}
                    maxLength={2000}
                    placeholder="Provide the requested clarification..."
                    className="mt-2 min-h-[72px] resize-none bg-background text-[10px]"
                    disabled={isResponding}
                    required
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor={`${requestKey}-clarification-attachments`} className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-border bg-background px-2 text-[9px] font-medium text-primary">
                      <Paperclip className="h-3 w-3" aria-hidden="true" />
                      {attachments.length ? `${attachments.length} selected` : 'Attach Files'}
                      <Input
                        id={`${requestKey}-clarification-attachments`}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        multiple
                        className="sr-only"
                        onChange={(event) => setAttachments(Array.from(event.target.files || []))}
                        disabled={isResponding}
                      />
                    </label>
                    <Button type="submit" size="sm" className="h-7 gap-1 bg-emerald-600 px-2 text-[9px] text-white hover:bg-emerald-700" disabled={isResponding}>
                      {isResponding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      {isResponding ? 'Sending...' : 'Send Response'}
                    </Button>
                  </div>
                  <p className="mt-2 text-[8px] text-muted-foreground">JPG, PNG, or PDF; up to 5 files and 5MB each.</p>
                </form>
              )}

              {request.status === requestStatus.CLARIFICATION_REQUESTED && !openClarification && (
                <div className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50/60 px-3 py-2 text-[10px] text-orange-700 dark:border-orange-400/25 dark:bg-orange-400/10 dark:text-orange-300">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  This request is waiting for clarification, but no open clarification was returned by the API.
                </div>
              )}

              {request.status === requestStatus.APPROVED && (
                <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50/60 px-3 py-2 text-[10px] text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {requestType === 'Advance'
                    ? 'Approval does not indicate that the advance has been disbursed or scheduled for salary recovery.'
                    : 'Approval does not indicate that the allowance has been added to payroll.'}
                </div>
              )}

              {canDeleteRequest(request) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-full gap-2 border-red-200 text-[10px] text-red-600 hover:bg-red-50 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-400/10"
                  onClick={() => onDelete(request)}
                  disabled={isDeleting || isResponding}
                >
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Cancel {requestType} Request
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AdvanceDeductionTab({ filters, onFilterChange, payrollSalary }) {
  const queryClient = useQueryClient();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [page, setPage] = useState(1);
  const selectedMonth = `${filters.year}-${String(filters.month).padStart(2, '0')}`;
  const monthLabel = formatMonth(selectedMonth);

  const advanceRequestsQuery = useQuery({
    queryKey: ['employee-advance-requests', selectedMonth, page],
    queryFn: async () => {
      const queryFilters = await advanceRequestFiltersSchema.validate({
        requestMonth: selectedMonth,
        page,
        limit: 20,
      }, { stripUnknown: true });
      const response = await EmployeeV2Service.getMyAdvanceRequests(queryFilters);
      return response.data?.data || {};
    },
  });

  const invalidateAdvanceRequests = () => queryClient.invalidateQueries({
    queryKey: ['employee-advance-requests'],
  });

  const createAdvanceMutation = useMutation({
    mutationFn: (values) => EmployeeV2Service.createAdvanceRequest(values),
    onSuccess: (response) => {
      toast.success(response.data?.message || 'Advance request submitted successfully');
      invalidateAdvanceRequests();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to submit advance request')),
  });

  const clarificationMutation = useMutation({
    mutationFn: (values) => EmployeeV2Service.respondToAdvanceClarification(values),
    onSuccess: (response) => {
      const updatedRequest = response.data?.data?.advanceRequest;
      if (updatedRequest) setSelectedRequest(updatedRequest);
      toast.success(response.data?.message || 'Clarification response submitted successfully');
      invalidateAdvanceRequests();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to submit clarification response')),
  });

  const deleteAdvanceMutation = useMutation({
    mutationFn: (requestId) => EmployeeV2Service.deleteAdvanceRequest(requestId),
    onSuccess: (response) => {
      toast.success(response.data?.message || 'Advance request cancelled successfully');
      setRequestToDelete(null);
      setSelectedRequest(null);
      invalidateAdvanceRequests();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to cancel advance request')),
  });

  const advanceRequests = Array.isArray(advanceRequestsQuery.data?.advanceRequests)
    ? advanceRequestsQuery.data.advanceRequests
    : [];
  const pagination = advanceRequestsQuery.data?.pagination || {};
  const totalPages = Math.max(Number(pagination.totalPages) || 0, 1);
  const total = Number(pagination.total) || advanceRequests.length;
  const limit = Number(pagination.limit) || 20;
  const currentPage = Number(pagination.page) || page;
  const firstResult = total ? ((currentPage - 1) * limit) + 1 : 0;
  const lastResult = total ? Math.min(currentPage * limit, total) : 0;

  const handleFilterChange = (updater) => {
    setPage(1);
    onFilterChange(updater);
  };

  return (
    <Card className="payroll-panel">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-border px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
            <BadgeIndianRupee className="h-4 w-4" aria-hidden="true" />
          </span>
          Advance &amp; Deduction
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <MonthFilterControl filters={filters} onFilterChange={handleFilterChange} />
          <Button variant="outline" size="sm" className="h-8 gap-2 px-3 text-xs font-medium">
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download
          </Button>
          <Button
            type="button"
            size="sm"
            className="payroll-request-button h-8 gap-2 px-3 text-xs font-medium"
            onClick={() => setIsRequestDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Request Advance
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/45 hover:bg-muted/45">
                {['Category', 'Name', 'Type', 'Amount', 'Effective From', 'Included in Salary', 'Status', 'Action'].map((heading) => (
                  <TableHead key={heading} className="h-9 whitespace-nowrap px-3 text-[10px]">
                    {heading}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {advanceRequestsQuery.isPending && (
                <TableRow>
                  <TableCell colSpan={8} className="h-20 text-center text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading advance requests...
                    </span>
                  </TableCell>
                </TableRow>
              )}
              {advanceRequestsQuery.isError && (
                <TableRow>
                  <TableCell colSpan={8} className="h-20 text-center text-xs text-red-600 dark:text-red-300">
                    {getApiErrorMessage(advanceRequestsQuery.error, 'Unable to load advance requests')}
                  </TableCell>
                </TableRow>
              )}
              {!advanceRequestsQuery.isPending && !advanceRequestsQuery.isError && !advanceRequests.length && (
                <EmptyTableRow colSpan={8} />
              )}
              {advanceRequests.map((request) => (
                <TableRow key={request._id} className="hover:bg-muted/25">
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300">
                      Advance
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[220px] px-3 py-3 text-xs font-semibold" title={request.reason || undefined}>
                    <span className="block truncate">{request.reason || getPayrollRequestReference(request)}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">Employee Request</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs font-semibold">{currency(request.requestedAmount)}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">{formatMonth(request.requestMonth)}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">—</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">
                    <StatusBadge value={request.status || '—'} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {Number(pagination.totalPages) > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2">
              <p className="text-[10px] text-muted-foreground">
                Showing {firstResult} to {lastResult} of {total} requests
              </p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Previous page"
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={page <= 1 || advanceRequestsQuery.isFetching}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button type="button" size="icon" className="h-7 w-7 text-[10px]" disabled>
                  {currentPage}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Next page"
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                  disabled={page >= totalPages || advanceRequestsQuery.isFetching}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-center gap-16 rounded-md border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300">
          <span>Total Advance &amp; Deduction Included</span>
          <strong className="text-lg font-semibold">{currency(payrollSalary?.salaryBreakdown?.deductions?.advanceDeduction)}</strong>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/70 px-3 py-2.5 text-[11px] text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Approved requests are shown as approved only; payment and salary recovery are tracked separately when available.
        </div>
      </CardContent>
      <PayrollRequestDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        monthLabel={monthLabel}
        requestMonth={selectedMonth}
        payrollSalary={payrollSalary}
        requestType="Advance"
        onSubmit={(values) => createAdvanceMutation.mutateAsync(values)}
        validationSchema={advanceRequestSchema}
        isSubmitting={createAdvanceMutation.isPending}
      />
      <PayrollRequestDetailSheet
        request={selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
        onDelete={setRequestToDelete}
        onRespond={(values) => clarificationMutation.mutateAsync(values)}
        isDeleting={deleteAdvanceMutation.isPending}
        isResponding={clarificationMutation.isPending}
      />
      <PayrollRequestDeleteDialog
        request={requestToDelete}
        requestType="Advance"
        onOpenChange={(open) => !open && setRequestToDelete(null)}
        onConfirm={() => deleteAdvanceMutation.mutate(requestToDelete?._id)}
        isPending={deleteAdvanceMutation.isPending}
      />
    </Card>
  );
}

function LoanDetailDialog({ loanId, onOpenChange }) {
  const loanDetailQuery = useQuery({
    queryKey: ['employee-payroll-loan', loanId],
    queryFn: async () => {
      const response = await EmployeeV2Service.getMyLoan(loanId);
      return response.data?.data || {};
    },
    enabled: Boolean(loanId),
  });
  const loan = loanDetailQuery.data?.loan;
  const transactions = Array.isArray(loanDetailQuery.data?.transactions)
    ? loanDetailQuery.data.transactions
    : [];
  const percentage = Math.min(Math.max(Number(loan?.recoveryPercentage) || 0, 0), 100);
  const monthlyInstallment = Number(loan?.monthlyInstallment) || 0;
  const installmentsPaid = monthlyInstallment
    ? Math.floor((Number(loan?.recoveredAmount) || 0) / monthlyInstallment)
    : 0;
  const nextRecoveryMonth = useMemo(() => {
    if (!(Number(loan?.outstandingBalance) > 0)) return '—';
    const nextMonth = new Date();
    nextMonth.setDate(1);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
  }, [loan?.outstandingBalance]);
  const summaryDetails = [
    ['Loan Reference', loan?.recoveryId || '—'],
    ['Employee', loan?.employee?.name || '—'],
    ['Loan For', loan?.title || '—'],
    ['Issued Month', loan?.issuedPeriod || '—'],
    ['Approved By', loan?.createdBy?.name || '—'],
  ];
  const amountDetails = [
    ['Approved Amount', currency(loan?.principalAmount)],
    ['Total Recovered', currency(loan?.recoveredAmount)],
    ['Outstanding Balance', currency(loan?.outstandingBalance)],
  ];
  const recoveryDetails = [
    ['Monthly Deduction', currency(loan?.monthlyInstallment)],
    ['Recovery Start Month', loan?.recoveryStartPeriod || '—'],
    ['Next Recovery Month', nextRecoveryMonth],
    ['Installments Paid', loan ? `${installmentsPaid} of ${loan.installmentCount ?? '—'}` : '—'],
    ['Total Installments', loan?.installmentCount ?? '—'],
    ['Current Status', <StatusBadge key="loan-detail-status" value={loan?.status || '—'} />],
  ];

  return (
    <Dialog open={Boolean(loanId)} onOpenChange={onOpenChange}>
      <DialogContent className="payroll-form-dialog max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] gap-0 overflow-y-auto p-0 sm:max-w-[780px] [&>button]:right-4 [&>button]:top-4">
        <DialogHeader className="border-b border-border px-5 pb-3 pt-4 pr-12">
          <div className="flex items-start justify-between gap-3 pr-5">
            <div>
              <DialogTitle className="payroll-form-title">Loan Recovery Details</DialogTitle>
              <DialogDescription className="payroll-form-description mt-1">
                {loan?.recoveryId || 'View loan and payroll recovery information.'}
              </DialogDescription>
            </div>
            {loan && <StatusBadge value={loan.status || '—'} />}
          </div>
        </DialogHeader>

        {loanDetailQuery.isPending && (
          <div className="grid min-h-60 place-items-center text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading loan details...</span>
          </div>
        )}
        {loanDetailQuery.isError && (
          <div className="grid min-h-60 place-items-center px-5 text-center text-xs text-red-600 dark:text-red-300">
            {getApiErrorMessage(loanDetailQuery.error, 'Unable to load loan details')}
          </div>
        )}
        {loan && (
          <div className="space-y-3 p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.9fr)]">
              <Card className="shadow-none">
                <CardHeader className="border-b border-border px-4 py-2.5">
                  <CardTitle className="text-xs font-semibold">Loan Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-x-5 gap-y-2 px-4 py-3 sm:grid-cols-2">
                  {[...summaryDetails, ...amountDetails].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[105px_minmax(0,1fr)] gap-2 text-[10px]">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="border-b border-border px-4 py-2.5">
                  <CardTitle className="text-xs font-semibold">Recovery Progress</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4 px-4 py-3">
                  <div className="payroll-loan-progress h-24 w-24" style={{ '--loan-progress-angle': `${percentage * 3.6}deg` }}>
                    <div className="h-[4.5rem] w-[4.5rem]">
                      <strong className="text-base">{percentage.toFixed(2)}%</strong>
                      <span>Recovered</span>
                    </div>
                  </div>
                  <div className="min-w-0 text-[10px]">
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{currency(loan.recoveredAmount)} recovered</p>
                    <p className="mt-1 text-muted-foreground">from {currency(loan.principalAmount)}</p>
                    <p className="mt-2 font-medium text-foreground">{currency(loan.outstandingBalance)} outstanding</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-none">
              <CardHeader className="border-b border-border px-4 py-2.5">
                <CardTitle className="text-xs font-semibold">Recovery Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-x-6 gap-y-2 px-4 py-3 sm:grid-cols-2 lg:grid-cols-3">
                {recoveryDetails.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[110px_minmax(0,1fr)] gap-2 text-[10px]">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-none">
              <CardHeader className="border-b border-border px-4 py-2.5">
                <CardTitle className="text-xs font-semibold">Recovery History</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow className="bg-muted/45 hover:bg-muted/45">
                      {['Payroll Month', 'Deducted Amount', 'Balance', 'Status'].map((heading) => (
                        <TableHead key={heading} className="h-8 whitespace-nowrap px-4 text-[9px]">{heading}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!transactions.length && <EmptyTableRow colSpan={4} />}
                    {transactions.map((transaction) => (
                      <TableRow key={transaction._id} className="hover:bg-muted/25">
                        <TableCell className="whitespace-nowrap px-4 py-2 text-[10px] font-medium">{transaction.employeePayroll?.period || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap px-4 py-2 text-[10px] font-semibold">{currency(transaction.employeePayroll?.totalDeductions)}</TableCell>
                        <TableCell className="whitespace-nowrap px-4 py-2 text-[10px] font-semibold">{currency(transaction.amount)}</TableCell>
                        <TableCell className="whitespace-nowrap px-4 py-2 text-[10px]"><StatusBadge value={transaction.employeePayroll?.status || '—'} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LoanTab() {
  const [page, setPage] = useState(1);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const loansQuery = useQuery({
    queryKey: ['employee-payroll-loans', page],
    queryFn: async () => {
      const response = await EmployeeV2Service.getMyLoans({ page, limit: 20 });
      return response.data?.data || {};
    },
  });
  const activeLoanQuery = useQuery({
    queryKey: ['employee-payroll-loans', 'active'],
    queryFn: async () => {
      const response = await EmployeeV2Service.getMyLoans({ page: 1, limit: 1, status: 'Active' });
      return response.data?.data?.loans?.[0] || null;
    },
  });
  const loans = Array.isArray(loansQuery.data?.loans) ? loansQuery.data.loans : [];
  const activeLoan = activeLoanQuery.data;
  const percentage = Math.min(Math.max(Number(activeLoan?.recoveryPercentage) || 0, 0), 100);
  const monthlyInstallment = Number(activeLoan?.monthlyInstallment) || 0;
  const installmentsPaid = monthlyInstallment
    ? Math.floor((Number(activeLoan?.recoveredAmount) || 0) / monthlyInstallment)
    : 0;
  const installmentCount = activeLoan?.installmentCount ?? '—';
  const pagination = loansQuery.data?.pagination || {};
  const currentPage = Number(pagination.page) || page;
  const limit = Number(pagination.limit) || 20;
  const total = Number(pagination.total) || 0;
  const totalPages = Math.max(Number(pagination.totalPages) || 0, 1);
  const firstResult = total ? ((currentPage - 1) * limit) + 1 : 0;
  const lastResult = total ? Math.min(currentPage * limit, total) : 0;
  const primaryDetails = [
    ['Loan For', activeLoan?.title || '—'],
    ['Approved Amount', currency(activeLoan?.principalAmount)],
    ['Issued Month', activeLoan?.issuedPeriod || '—'],
    ['Recovery Start Month', activeLoan?.recoveryStartPeriod || '—'],
    ['Monthly Deduction', currency(activeLoan?.monthlyInstallment)],
  ];
  const recoveryDetails = [
    ['Total Installments', installmentCount],
    ['Installments Paid', activeLoan ? installmentsPaid : '—'],
    ['Total Recovered', currency(activeLoan?.recoveredAmount)],
    ['Outstanding Balance', currency(activeLoan?.outstandingBalance)],
    ['Approved By', activeLoan?.createdBy?.name || '—'],
    ['Status', <StatusBadge key="status" value={activeLoan?.status || '—'} />],
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="payroll-panel">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b border-border px-4 py-3">
            <CardTitle className="text-sm font-semibold">Loan &amp; Recovery</CardTitle>
            <StatusBadge value={activeLoan?.status || '—'} />
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid gap-5 sm:grid-cols-2">
              {[primaryDetails, recoveryDetails].map((details, groupIndex) => (
                <div key={groupIndex} className={groupIndex ? 'border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0' : ''}>
                  <div className="space-y-2">
                    {details.map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[minmax(0,1fr)_minmax(105px,1.2fr)] gap-3 text-[10px]">
                        <span className="font-medium text-muted-foreground">{label}</span>
                        <span className="font-semibold text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/70 px-3 py-2 text-[10px] text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300">
              <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {activeLoanQuery.isPending
                ? 'Loading current loan recovery...'
                : activeLoanQuery.isError
                  ? getApiErrorMessage(activeLoanQuery.error, 'Unable to load loan recovery')
                  : activeLoan
                    ? 'This summary shows your current active loan recovery.'
                    : 'No active loan recovery is currently available.'}
            </div>
          </CardContent>
        </Card>

        <Card className="payroll-panel">
          <CardHeader className="border-b border-border px-4 py-3">
            <CardTitle className="text-sm font-semibold">Recovery Progress</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid items-center gap-5 sm:grid-cols-[150px_minmax(0,1fr)]">
              <div
                className="payroll-loan-progress mx-auto"
                style={{ '--loan-progress-angle': `${percentage * 3.6}deg` }}
              >
                <div>
                  <strong>{percentage.toFixed(2)}%</strong>
                  <span>Recovered</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 text-[10px]">
                  <span className="flex items-center gap-2 font-medium text-muted-foreground">
                    <i className="h-2 w-2 rounded-full bg-emerald-500" />
                    Recovered
                  </span>
                  <strong className="text-foreground">{currency(activeLoan?.recoveredAmount)}</strong>
                  <span className="flex items-center gap-2 font-medium text-muted-foreground">
                    <i className="h-2 w-2 rounded-full bg-orange-400" />
                    Outstanding
                  </span>
                  <strong className="text-foreground">{currency(activeLoan?.outstandingBalance)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-md border border-border bg-muted/30 text-[10px]">
              <div className="flex items-start gap-2 p-3">
                <Info className="mt-0.5 h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-muted-foreground">Installments Paid</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {activeLoan ? `${installmentsPaid} of ${installmentCount}` : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-[9px] font-medium">
                <span className="text-emerald-600 dark:text-emerald-400">Recovered {currency(activeLoan?.recoveredAmount)}</span>
                <span className="text-orange-600 dark:text-orange-400">Outstanding {currency(activeLoan?.outstandingBalance)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-orange-200 dark:bg-orange-400/25">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percentage}%` }} />
              </div>
              <p className="mt-1 text-center text-[9px] font-semibold text-foreground">{percentage.toFixed(2)}% recovered</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="payroll-panel">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
            Loan Recovery History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table className="min-w-[1020px]">
            <TableHeader>
              <TableRow className="bg-muted/45 hover:bg-muted/45">
                {['Recovery ID', 'Title', 'Principal Amount', 'Issue Period', 'Status', 'Outstanding Balance', 'Recovery Percentage', 'Created By', 'Action'].map((heading) => (
                  <TableHead key={heading} className="h-8 whitespace-nowrap px-4 text-[9px]">{heading}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loansQuery.isPending && (
                <TableRow><TableCell colSpan={9} className="h-20 text-center text-xs text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading loans...</TableCell></TableRow>
              )}
              {loansQuery.isError && (
                <TableRow><TableCell colSpan={9} className="h-20 text-center text-xs text-red-600 dark:text-red-300">{getApiErrorMessage(loansQuery.error, 'Unable to load loans')}</TableCell></TableRow>
              )}
              {!loansQuery.isPending && !loansQuery.isError && !loans.length && <EmptyTableRow colSpan={9} />}
              {loans.map((loan) => (
                <TableRow key={loan._id} className="hover:bg-muted/25">
                  <TableCell className="whitespace-nowrap px-4 py-2 text-[10px] font-semibold">{loan.recoveryId || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-2 text-[10px] font-medium">{loan.title || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-2 text-[10px] font-semibold">{currency(loan.principalAmount)}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-2 text-[10px] font-medium">{loan.issuedPeriod || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-2 text-[10px]"><StatusBadge value={loan.status || '—'} /></TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-2 text-[10px] font-semibold">{currency(loan.outstandingBalance)}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-2 text-[10px] font-medium">{Number(loan.recoveryPercentage || 0).toFixed(2)}%</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-2 text-[10px] font-medium">{loan.createdBy?.name || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-2 text-[10px]">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      onClick={() => setSelectedLoanId(loan.recoveryId || loan._id)}
                    >
                      <Eye className="h-3 w-3" aria-hidden="true" />
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2">
            <p className="text-[10px] text-muted-foreground">Showing {firstResult} to {lastResult} of {total} loans</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" aria-label="Previous page" disabled={currentPage <= 1 || loansQuery.isFetching} onClick={() => setPage((value) => Math.max(value - 1, 1))}>
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button size="icon" className="h-7 w-7 text-[10px]" disabled>{currentPage}</Button>
              <Button variant="outline" size="icon" className="h-7 w-7" aria-label="Next page" disabled={currentPage >= totalPages || loansQuery.isFetching} onClick={() => setPage((value) => Math.min(value + 1, totalPages))}>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <LoanDetailDialog
        loanId={selectedLoanId}
        onOpenChange={(open) => !open && setSelectedLoanId(null)}
      />

      <p className="flex items-center justify-center gap-2 text-[9px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
        All payroll data is confidential and visible only to you.
      </p>
    </div>
  );
}

function ReimbursementsTab() {
  const blueBadge = 'border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300';
  const greenBadge = 'border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300';

  return (
    <Card className="payroll-panel">
      <CardHeader className="border-b border-border px-4 py-3">
        <CardTitle className="text-base font-semibold">Reimbursements</CardTitle>
        <p className="text-[11px] text-muted-foreground">View approved expense claims and their payment details.</p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/45 hover:bg-muted/45">
                {['Expense / Claim', 'Category', 'Expense For', 'Event / Client', 'Expense Date', 'Expense Amount', 'Approved Amount', 'Settlement Mode', 'Payment Month', 'Status', 'Action'].map((heading) => (
                  <TableHead key={heading} className="h-9 whitespace-nowrap px-3 text-[9px]">
                    {heading}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!reimbursementRows.length && <EmptyTableRow colSpan={11} />}
              {reimbursementRows.map((row) => {
                const settlementIncluded = row[7] === 'Included in Salary';
                const statusIncluded = row[9] === 'Included';
                return (
                  <TableRow key={row[0]} className="hover:bg-muted/25">
                    {row.slice(0, 7).map((cell, index) => (
                      <TableCell
                        key={`${row[0]}-${index}`}
                        className={`whitespace-nowrap px-3 py-2.5 text-[10px] ${index === 0 || index === 5 || index === 6 ? 'font-semibold' : 'font-medium'}`}
                      >
                        {cell}
                      </TableCell>
                    ))}
                    <TableCell className="whitespace-nowrap px-3 py-2.5">
                      <Badge variant="outline" className={settlementIncluded ? greenBadge : blueBadge}>
                        {row[7]}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-3 py-2.5 text-[10px] font-medium">{row[8]}</TableCell>
                    <TableCell className="whitespace-nowrap px-3 py-2.5">
                      <Badge variant="outline" className={statusIncluded ? greenBadge : blueBadge}>
                        {row[9]}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-3 py-2.5 text-[10px]">
                      <button type="button" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 grid overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50/35 dark:border-emerald-400/25 dark:bg-emerald-400/5 sm:grid-cols-3">
          <div className="flex items-center gap-4 px-6 py-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <WalletCards className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium text-foreground">Total Approved Reimbursement</p>
              <p className="mt-1 text-xl font-semibold text-foreground">—</p>
            </div>
          </div>
          <div className="border-t border-border px-6 py-4 sm:border-l sm:border-t-0">
            <p className="text-xs font-medium text-foreground">Included in Salary</p>
            <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400">—</p>
          </div>
          <div className="border-t border-border px-6 py-4 sm:border-l sm:border-t-0">
            <p className="text-xs font-medium text-foreground">Paid Separately</p>
            <p className="mt-1 text-xl font-semibold text-blue-600 dark:text-blue-400">—</p>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50/70 px-4 py-3 text-[11px] leading-5 text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300">
          <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p>Expense claims are submitted from <span className="font-semibold">My Expenses</span> and appear here after Finance approval.</p>
            <p>Event or client-related expenses are shown under ‘Expense For’ and ‘Event / Client’.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SalaryQueryDetailSheet({ query, onOpenChange }) {
  const isResolved = ['Resolved', 'Closed'].includes(query?.status);
  const isInReview = query?.status === 'In Review';
  const messages = Array.isArray(query?.messages) ? query.messages : [];
  const firstMessage = messages[0];
  const firstMessageAttachments = Array.isArray(firstMessage?.attachments)
    ? firstMessage.attachments
    : firstMessage?.attachment ? [firstMessage.attachment] : [];
  const queryAttachments = Array.isArray(query?.attachments)
    ? query.attachments
    : query?.attachment ? [query.attachment] : [];
  const attachments = [...queryAttachments, ...firstMessageAttachments];
  const payroll = query?.employeePayroll;
  const assignedTo = query?.assignedTo?.name
    || query?.assignedTo?.employeeId
    || query?.assignedTo
    || '—';
  const relatedRecord = payroll?._id
    ? `${payroll.period || 'Payroll'}${payroll.status ? ` • ${payroll.status}` : ''}`
    : '—';
  const reviewSteps = [
    ['Submitted', 'done'],
    ['Finance Review', isResolved || isInReview ? 'done' : 'current'],
    ['Admin Review', isResolved ? 'done' : isInReview ? 'current' : 'idle'],
    ['Resolved', isResolved ? 'done' : 'idle'],
  ];

  const handleOpenChange = (open) => {
    onOpenChange(open);
  };

  return (
    <Sheet open={Boolean(query)} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-[440px]">
        {query && (
          <>
            <SheetHeader className="border-b border-border px-4 py-4 text-left">
              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <SheetTitle className="text-base font-semibold">Salary Query Detail</SheetTitle>
                  <SheetDescription className="mt-1 text-[11px] font-semibold text-foreground">
                    {query.queryType || 'Payroll Query'}
                  </SheetDescription>
                </div>
                <StatusBadge value={query.status} />
              </div>
            </SheetHeader>

            <div className="space-y-3 p-4">
              <div className="grid grid-cols-4">
                {reviewSteps.map(([label, state], index) => (
                  <div key={label} className="relative flex flex-col items-center px-1 text-center">
                    {index < 3 && (
                      <span className={`absolute left-1/2 top-3 h-px w-full ${
                        state === 'done' ? 'bg-emerald-400' : 'bg-border'
                      }`} />
                    )}
                    <span className={`relative z-10 grid h-6 w-6 place-items-center rounded-full border text-[9px] font-semibold ${
                      state === 'done'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : state === 'current'
                          ? 'border-orange-400 bg-orange-50 text-orange-600 dark:bg-orange-400/10'
                          : 'border-border bg-muted text-muted-foreground'
                    }`}>
                      {state === 'done' ? <Check className="h-3 w-3" /> : index + 1}
                    </span>
                    <span className="mt-1.5 whitespace-pre-line text-[9px] font-medium leading-3 text-foreground">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <Card className="shadow-none">
                <CardHeader className="border-b border-border px-3 py-2.5">
                  <CardTitle className="text-[11px] font-semibold">Query Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-3 py-3">
                  {[
                    ['Query Related To', query.queryType || '—'],
                    ['Payroll Month', payroll?.period || '—'],
                    ['Related Record', relatedRecord],
                    ['Subject', query.subject || '—'],
                    ['Raised On', formatDateTime(query.createdAt)],
                    ['Assigned To', assignedTo],
                    ['Last Updated', formatDateTime(query.updatedAt)],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[98px_8px_minmax(0,1fr)] gap-1 text-[10px]">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-muted-foreground">:</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50/35 shadow-none dark:border-blue-400/25 dark:bg-blue-400/5">
                <CardHeader className="border-b border-blue-200 px-3 py-2.5 dark:border-blue-400/20">
                  <CardTitle className="text-[11px] font-semibold">Your Query</CardTitle>
                </CardHeader>
                <CardContent className="px-3 py-3">
                  <p className="text-[10px] leading-4 text-foreground">
                    {firstMessage?.message || '—'}
                  </p>
                  {attachments.length > 0 && (
                    <div className="mt-3">
                      <PayrollAttachmentList attachments={attachments} />
                    </div>
                  )}
                  <p className="mt-2 text-[8px] text-muted-foreground">
                    Submitted on {formatDateTime(firstMessage?.addedAt || query.createdAt)}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="border-b border-border px-3 py-2.5">
                  <CardTitle className="text-[11px] font-semibold">Conversation &amp; Updates</CardTitle>
                </CardHeader>
                <CardContent className="px-3 py-3">
                  {!messages.length && (
                    <p className="py-3 text-center text-[10px] text-muted-foreground">No messages available.</p>
                  )}
                  <div className="space-y-3">
                    {messages.map((item, index) => {
                      const isEmployee = item.addedBy?._id === query.employee?._id
                        || item.addedBy?.accessRole === 'Employee';
                      const name = item.addedBy?.name || item.addedBy?.employeeId || 'Team member';
                      const messageAttachments = Array.isArray(item.attachments) ? item.attachments : [];
                      return (
                      <div key={item._id || `${name}-${item.addedAt}-${index}`} className="relative flex gap-2.5">
                        {index < messages.length - 1 && <span className="absolute left-3 top-6 h-[calc(100%+12px)] border-l border-border" />}
                        <span className={`payroll-query-update payroll-query-update-${isEmployee ? 'blue' : 'orange'}`}>
                          {isEmployee ? <UserRound className="h-3 w-3" /> : <Headphones className="h-3 w-3" />}
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <p className="text-[9px] font-semibold text-foreground">
                            {name} <span className="ml-2 font-normal text-muted-foreground">{formatDateTime(item.addedAt)}</span>
                          </p>
                          <p className="mt-0.5 text-[9px] leading-4 text-muted-foreground">{item.message}</p>
                          {messageAttachments.length > 0 && (
                            <div className="mt-2">
                              <PayrollAttachmentList attachments={messageAttachments} />
                            </div>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between gap-3 rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2.5 dark:border-blue-400/25 dark:bg-blue-400/5">
                <span className="flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  <span>
                    <span className="block text-[9px] font-semibold">Need Help?</span>
                    <span className="block text-[8px] text-muted-foreground">Still need help? Contact HR or Finance team.</span>
                  </span>
                </span>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-[9px] text-primary">
                  <Headphones className="h-3 w-3" />
                  Contact Support
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function RaiseSalaryQueryDialog({
  open,
  onOpenChange,
  payrollMonth,
  onPayrollMonthChange,
  payrollSalary,
  onSubmit,
  isSubmitting,
}) {
  const [form, setForm] = useState({
    queryType: 'Other',
    payrollMonth,
    relatedRecord: '',
    subject: '',
    message: '',
    attachment: null,
  });
  const summary = payrollSalary?.metricsSummary;
  const employeePayrollId = payrollSalary?.month === form.payrollMonth
    ? getEmployeePayrollId(payrollSalary)
    : '';

  useEffect(() => {
    setForm((current) => ({
      ...current,
      payrollMonth,
      relatedRecord: current.payrollMonth === payrollMonth ? current.relatedRecord : '',
    }));
  }, [payrollMonth]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      queryType: 'Other',
      payrollMonth,
      relatedRecord: '',
      subject: '',
      message: '',
      attachment: null,
    });
  };

  const handleOpenChange = (nextOpen) => {
    if (isSubmitting) return;
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handlePayrollMonthChange = (event) => {
    const value = event.target.value;
    updateField('payrollMonth', value);
    updateField('relatedRecord', '');
    if (/^\d{4}-\d{2}$/.test(value)) onPayrollMonthChange(value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const subject = form.subject.trim();
    const message = form.message.trim();

    if (!payrollQueryTypes.includes(form.queryType)) {
      toast.error('Select a valid payroll query type');
      return;
    }
    if (!/^\d{4}-\d{2}$/.test(form.payrollMonth)) {
      toast.error('Select a valid payroll month');
      return;
    }
    if (!subject || subject.length > 200) {
      toast.error('Subject must be between 1 and 200 characters');
      return;
    }
    if (!message || message.length > 5000) {
      toast.error('Query details must be between 1 and 5000 characters');
      return;
    }
    if (form.attachment && form.attachment.size > 5 * 1024 * 1024) {
      toast.error('Attachment must be 5MB or smaller');
      return;
    }

    try {
      await onSubmit({
        ...(form.relatedRecord ? { employeePayrollId: form.relatedRecord } : {}),
        queryType: form.queryType,
        subject,
        message,
        attachment: form.attachment,
      });
      resetForm();
      onOpenChange(false);
    } catch {
      // API errors are displayed by the mutation's onError handler.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="payroll-form-dialog max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] gap-0 overflow-y-auto p-0 sm:max-w-[590px] [&>button]:right-4 [&>button]:top-4 [&>button]:opacity-100 [&>button>svg]:h-5 [&>button>svg]:w-5">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-5 pb-2 pt-4 pr-12">
            <DialogTitle className="payroll-form-title">Raise Salary Query</DialogTitle>
            <DialogDescription className="payroll-form-description">
              Submit your payroll-related concern for Finance review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 px-5 pb-3 pt-2">
            <div className="payroll-query-summary grid gap-3 rounded-lg border p-3 min-[520px]:grid-cols-3">
              {[
                {
                  label: 'Payroll Month',
                  value: formatMonth(form.payrollMonth),
                  Icon: CalendarDays,
                  tone: 'blue',
                },
                {
                  label: 'Net Salary',
                  value: payrollFormCurrency(summary?.netSalary),
                  Icon: IndianRupee,
                  tone: 'emerald',
                },
                {
                  label: 'Payment Status',
                  value: summary?.paymentStatus || '—',
                  Icon: Clock3,
                  tone: 'orange',
                },
              ].map(({ label, value, Icon, tone }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span className={`payroll-query-summary-icon payroll-query-summary-icon-${tone}`}>
                    <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="payroll-form-metric-label truncate">{label}</p>
                    <p className={`payroll-form-metric-value mt-0.5 truncate payroll-request-value-${tone}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="payroll-query-flow flex flex-wrap items-center justify-center gap-2 text-foreground min-[520px]:gap-3">
              {[
                ['1', 'Finance Review', 'active'],
                ['2', 'Admin Review, if required', 'idle'],
                ['3', 'Resolved', 'idle'],
              ].map(([step, label, state], index) => (
                <div key={step} className="contents">
                  <span className="flex items-center gap-2">
                    <i className={state === 'active'
                      ? 'grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-[10px] font-semibold text-white shadow-sm'
                      : 'grid h-6 w-6 place-items-center rounded-full border border-border bg-background text-[10px] font-semibold text-muted-foreground'}
                    >
                      {step}
                    </i>
                    <span className="font-medium">{label}</span>
                  </span>
                  {index < 2 && <span className="w-8 border-t border-dashed border-border" />}
                </div>
              ))}
            </div>

            <div className="grid gap-2.5 min-[520px]:grid-cols-2">
              <div className="space-y-1">
                <Label className="payroll-form-label">
                  Query Related To <span className="text-red-500">*</span>
                </Label>
                <Select value={form.queryType} onValueChange={(value) => updateField('queryType', value)}>
                  <SelectTrigger className="payroll-form-control h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {payrollQueryTypes.map((option) => (
                      <SelectItem key={option} value={option} className="text-xs">{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="payroll-form-label">
                  Payroll Month <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    type="month"
                    value={form.payrollMonth}
                    onChange={handlePayrollMonthChange}
                    className="payroll-form-control h-9 pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="payroll-form-label">
                  Related Record <span className="font-normal text-muted-foreground">— Optional</span>
                </Label>
                <Select
                  value={form.relatedRecord || 'none'}
                  onValueChange={(value) => updateField('relatedRecord', value === 'none' ? '' : value)}
                >
                  <SelectTrigger className="payroll-form-control h-9">
                    <SelectValue placeholder="Select related record" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">No related record</SelectItem>
                    {employeePayrollId && (
                      <SelectItem value={employeePayrollId} className="text-xs">
                        {formatMonth(form.payrollMonth)} payroll
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="salary-query-subject" className="payroll-form-label">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="salary-query-subject"
                  value={form.subject}
                  onChange={(event) => updateField('subject', event.target.value)}
                  placeholder="Enter a short subject for your query"
                  className="payroll-form-control h-9"
                  maxLength={200}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="salary-query-details" className="payroll-form-label">
                Query Details <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="salary-query-details"
                value={form.message}
                onChange={(event) => updateField('message', event.target.value)}
                placeholder="Explain the issue clearly, including the amount or payroll entry concerned."
                className="payroll-form-control min-h-[64px] resize-none"
                maxLength={5000}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="salary-query-attachment" className="payroll-form-label">
                Attachment <span className="font-normal text-muted-foreground">— Optional</span>
              </Label>
              <label
                htmlFor="salary-query-attachment"
                className="payroll-form-upload flex min-h-[66px] cursor-pointer items-center justify-center gap-3 rounded-md border border-dashed px-4 py-2"
              >
                <CloudUpload className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="text-[11px] leading-4">
                  <span>
                    <strong className="font-semibold text-foreground">Click to upload</strong>
                    <span className="text-muted-foreground"> or drag and drop</span>
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    {form.attachment?.name || 'PDF, JPG, PNG up to 5MB'}
                  </span>
                </span>
                <Input
                  id="salary-query-attachment"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="sr-only"
                  onChange={(event) => updateField('attachment', event.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div className="payroll-form-notice flex items-start gap-2 rounded-md border px-3 py-2.5 leading-4">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Your query will first be reviewed by Finance. It will be forwarded to Admin only when approval,
              correction or payroll recalculation is required.
            </div>
          </div>

          <DialogFooter className="flex-row justify-end gap-2 px-5 pb-4 pt-1 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting} className="h-9 px-4 text-[11px]">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="payroll-query-submit h-9 px-4 text-[11px] font-semibold">
              {isSubmitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Submitting...' : 'Submit Salary Query'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SalaryQueriesTab({ filters, onFilterChange, payrollSalary }) {
  const queryClient = useQueryClient();
  const [isRaiseQueryOpen, setIsRaiseQueryOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [page, setPage] = useState(1);
  const selectedMonth = `${filters.year}-${String(filters.month).padStart(2, '0')}`;
  const payrollQueriesQuery = useQuery({
    queryKey: ['employee-payroll-queries', selectedMonth, page],
    queryFn: async () => {
      const response = await EmployeeV2Service.getMyPayrollQueries({
        page,
        limit: 20,
        period: selectedMonth,
      });
      return response.data?.data || {};
    },
  });
  const createPayrollQueryMutation = useMutation({
    mutationFn: (values) => EmployeeV2Service.createMyPayrollQuery(values),
    onSuccess: (response) => {
      toast.success(response.data?.message || 'Payroll query created successfully');
      queryClient.invalidateQueries({ queryKey: ['employee-payroll-queries'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to submit payroll query')),
  });
  const queries = Array.isArray(payrollQueriesQuery.data?.queries)
    ? payrollQueriesQuery.data.queries
    : [];
  const pagination = payrollQueriesQuery.data?.pagination || {};
  const currentPage = Number(pagination.page) || page;
  const limit = Number(pagination.limit) || 20;
  const total = Number(pagination.total) || 0;
  const totalPages = Math.max(Number(pagination.totalPages) || 0, 1);
  const firstResult = total ? ((currentPage - 1) * limit) + 1 : 0;
  const lastResult = total ? Math.min(currentPage * limit, total) : 0;

  const handlePayrollMonthChange = (month) => {
    const [year, monthNumber] = month.split('-').map(Number);
    setPage(1);
    onFilterChange({ year, month: monthNumber });
  };

  const handleFilterChange = (updater) => {
    setPage(1);
    onFilterChange(updater);
  };

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
      <Card className="payroll-panel">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-border px-4 py-3">
          <div className="flex items-start gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
              <CircleHelp className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-sm font-semibold">Salary Queries</CardTitle>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Raise and track queries related to your salary and payroll.
              </p>
            </div>
          </div>
          <MonthFilterControl filters={filters} onFilterChange={handleFilterChange} />
        </CardHeader>

        <CardContent className="p-3">
          <div className="overflow-x-auto rounded-md border border-border">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow className="bg-muted/45 hover:bg-muted/45">
                  {['Query Type', 'Subject', 'Payroll Month', 'Raised On', 'Last Updated', 'Status', 'Action'].map((heading) => (
                    <TableHead key={heading} className="h-8 whitespace-nowrap px-3 text-[10px] font-medium">
                      {heading}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollQueriesQuery.isPending && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-20 text-center text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading salary queries...
                      </span>
                    </TableCell>
                  </TableRow>
                )}
                {payrollQueriesQuery.isError && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-20 text-center text-xs text-red-600 dark:text-red-300">
                      {getApiErrorMessage(payrollQueriesQuery.error, 'Unable to load salary queries')}
                    </TableCell>
                  </TableRow>
                )}
                {!payrollQueriesQuery.isPending && !payrollQueriesQuery.isError && !queries.length && (
                  <EmptyTableRow colSpan={7} />
                )}
                {queries.map((query) => (
                    <TableRow key={query._id} className="hover:bg-muted/25">
                      <TableCell className="whitespace-nowrap px-3 py-2.5">
                        <span className="flex items-center gap-2 text-[10px] font-medium">
                          <i className="payroll-query-category payroll-query-category-blue">
                            <FileQuestion className="h-3 w-3" aria-hidden="true" />
                          </i>
                          {query.queryType || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2.5 text-[10px] font-medium">{query.subject || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2.5 text-[10px] text-muted-foreground">{query.employeePayroll?.period || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2.5 text-[10px] font-medium">{formatQueryDate(query.createdAt)}</TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2.5 text-[10px] font-medium">{formatQueryDate(query.updatedAt)}</TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2.5">
                        <StatusBadge value={query.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2.5">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                          onClick={() => setSelectedQuery(query)}
                        >
                          <Eye className="h-3 w-3" aria-hidden="true" />
                          View
                        </button>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2">
              <p className="text-[10px] text-muted-foreground">
                Showing {firstResult} to {lastResult} of {total} queries
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Previous page"
                  disabled={currentPage <= 1 || payrollQueriesQuery.isFetching}
                  onClick={() => setPage((value) => Math.max(value - 1, 1))}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button size="icon" className="h-7 w-7 text-[10px]" disabled>{currentPage}</Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Next page"
                  disabled={currentPage >= totalPages || payrollQueriesQuery.isFetching}
                  onClick={() => setPage((value) => Math.min(value + 1, totalPages))}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/70 px-3 py-2.5 text-[10px] text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300">
            <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Queries related to salary, allowance, deduction, reimbursement, loan, payment or payslip can be raised from here.
          </div>
        </CardContent>
      </Card>

      <aside className="space-y-3">
        <Card className="payroll-panel">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Raise New Query</p>
                <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                  Facing an issue with your salary or payroll?
                </p>
                <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                  Raise a query and our team will review and resolve it.
                </p>
              </div>
              <span className="relative grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-blue-500/5 text-blue-600 dark:text-blue-300">
                <MessageSquareMore className="absolute left-1 top-1 h-8 w-8 fill-blue-500 text-blue-500" aria-hidden="true" />
                <FileText className="ml-4 mt-3 h-9 w-9" aria-hidden="true" />
              </span>
            </div>
            <Button
              type="button"
              className="payroll-request-button mt-3 h-8 w-full gap-2 text-[10px] font-medium"
              onClick={() => setIsRaiseQueryOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Raise Salary Query
            </Button>
          </CardContent>
        </Card>

        <Card className="payroll-panel">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b border-border px-4 py-3">
            <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-300" aria-hidden="true" />
            <CardTitle className="text-xs font-semibold">Important Information</CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-3">
            <ul className="space-y-1.5 pl-4 text-[10px] leading-4 text-muted-foreground">
              <li className="list-disc marker:text-blue-500">Queries will first be reviewed by Finance.</li>
              <li className="list-disc marker:text-blue-500">Admin may be involved if final approval or payroll correction is required.</li>
              <li className="list-disc marker:text-blue-500">You will be notified on every update.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="payroll-panel">
          <CardContent className="p-4">
            <div className="flex items-start gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <Headphones className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold text-foreground">Quick Help</p>
                <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                  Need help with your salary or payroll? Contact HR or Finance team.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-3 h-8 gap-2 px-3 text-[10px] font-medium text-primary">
              <Headphones className="h-3.5 w-3.5" aria-hidden="true" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </aside>
      <RaiseSalaryQueryDialog
        open={isRaiseQueryOpen}
        onOpenChange={setIsRaiseQueryOpen}
        payrollMonth={selectedMonth}
        onPayrollMonthChange={handlePayrollMonthChange}
        payrollSalary={payrollSalary}
        onSubmit={(values) => createPayrollQueryMutation.mutateAsync(values)}
        isSubmitting={createPayrollQueryMutation.isPending}
      />
      <SalaryQueryDetailSheet query={selectedQuery} onOpenChange={(open) => !open && setSelectedQuery(null)} />
    </div>
  );
}

export default function PayrollSalaryPage() {
  const [activeTab, setActiveTab] = useState('summary');
  const [monthFilters, setMonthFilters] = useState(() => {
    const dateParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'numeric',
    }).formatToParts(new Date());

    return {
      year: Number(dateParts.find(({ type }) => type === 'year')?.value),
      month: Number(dateParts.find(({ type }) => type === 'month')?.value),
    };
  });
  const selectedMonth = `${monthFilters.year}-${String(monthFilters.month).padStart(2, '0')}`;
  const payrollSalaryQuery = useQuery({
    queryKey: ['employee-payroll-salary', selectedMonth],
    queryFn: async () => {
      const response = await EmployeeV2Service.getMyPayrollSalary({ month: selectedMonth });
      return response.data?.data?.payrollSalary || null;
    },
  });
  const payrollSalary = payrollSalaryQuery.data;
  const stats = useMemo(() => {
    const summary = payrollSalary?.metricsSummary;
    const salaryBasis = summary?.salaryBasis;

    return [
      [
        'Salary Basis',
        salaryBasisLabels[salaryBasis] || salaryBasis || '—',
        formatRate(summary?.rateAmount, salaryBasis),
        WalletCards,
        'blue',
      ],
      ['Attendance Status', summary?.attendanceStatus || '—', 'Attendance', ShieldCheck, 'emerald'],
      ['Gross Earnings', currency(summary?.grossEarnings), 'This Month', BadgeIndianRupee, 'blue'],
      ['Total Deductions', currency(summary?.totalDeductions), 'This Month', ReceiptIndianRupee, 'orange'],
      ['Net Salary', currency(summary?.netSalary), 'This Month', Banknote, 'emerald'],
      ['Payment Status', summary?.paymentStatus || '—', 'Payment', CircleDollarSign, 'violet'],
    ];
  }, [payrollSalary]);

  return (
    <main className="payroll-page">
      <div className="mx-auto w-full max-w-[1600px] p-4 lg:p-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">My Payroll &amp; Salary</h1>
            <p className="mt-1 text-[11px] text-muted-foreground">
              View your monthly salary, attendance impact, deductions, allowances, reimbursements and payment details.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MonthFilterControl filters={monthFilters} onFilterChange={setMonthFilters} />
            <Button size="sm" className="h-9 gap-2 px-4 text-xs font-medium shadow-sm">
              <Download size={14} />
              Download Payslip
            </Button>
          </div>
        </header>

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {stats.map((stat) => <StatCard key={stat[0]} data={stat} />)}
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 w-full">
          <TabsList className="h-auto w-full justify-start gap-4 overflow-x-auto rounded-lg border border-border bg-card px-3 py-0 text-card-foreground shadow-sm">
            {tabs.map(([value, label, Icon]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="profile-tab-trigger shrink-0 gap-2 rounded-none border-b-2 border-transparent bg-transparent px-3 py-3 shadow-none transition data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="summary" className="mt-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
              <SalaryBreakdown payrollSalary={payrollSalary} />
              <AttendanceSnapshot payrollSalary={payrollSalary} />
            </div>
            <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.15fr)]">
              <PayrollProgress />
              <SalaryHistory />
            </div>
            <p className="mt-5 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
              <ShieldCheck size={12} />
              All payroll data is confidential and visible only to you.
            </p>
          </TabsContent>

          <TabsContent value="allowance" className="mt-4">
            <AllowanceTab
              filters={monthFilters}
              onFilterChange={setMonthFilters}
              payrollSalary={payrollSalary}
            />
          </TabsContent>

          <TabsContent value="advance" className="mt-4">
            <AdvanceDeductionTab
              filters={monthFilters}
              onFilterChange={setMonthFilters}
              payrollSalary={payrollSalary}
            />
          </TabsContent>

          <TabsContent value="loan" className="mt-4">
            <LoanTab />
          </TabsContent>

          <TabsContent value="reimbursements" className="mt-4">
            <ReimbursementsTab />
          </TabsContent>

          <TabsContent value="queries" className="mt-4">
            <SalaryQueriesTab
              filters={monthFilters}
              onFilterChange={setMonthFilters}
              payrollSalary={payrollSalary}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
