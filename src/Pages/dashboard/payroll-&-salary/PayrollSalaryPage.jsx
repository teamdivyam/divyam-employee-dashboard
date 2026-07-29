/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeIndianRupee,
  Banknote,
  Calculator,
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
  Landmark,
  MessageSquareMore,
  Minus,
  Paperclip,
  Plus,
  ReceiptIndianRupee,
  Send,
  ShieldCheck,
  Headphones,
  Trash2,
  UserRound,
  UserCheck,
  WalletCards,
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

const currency = (amount) => (
  amount === null || amount === undefined ? '—' : currencyFormatter.format(Number(amount))
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
const allowanceRows = [];
const advanceDeductionRows = [];
const loanStatementRows = [];
const reimbursementRows = [];
const salaryQueryRows = [
  {
    id: 'SQ-2026-0012',
    relatedTo: 'Attendance Deduction',
    subject: 'Incorrect attendance deduction',
    payrollMonth: 'July 2026',
    raisedOn: '28 Jul 2026',
    lastUpdated: '29 Jul 2026',
    status: 'Under Review',
    Icon: UserCheck,
    tone: 'blue',
  },
  {
    id: 'SQ-2026-0011',
    relatedTo: 'Allowance',
    subject: 'Mobile allowance not included',
    payrollMonth: 'July 2026',
    raisedOn: '27 Jul 2026',
    lastUpdated: '28 Jul 2026',
    status: 'Resolved',
    Icon: BadgeIndianRupee,
    tone: 'emerald',
  },
  {
    id: 'SQ-2026-0010',
    relatedTo: 'Salary Calculation',
    subject: 'Basic salary mismatch',
    payrollMonth: 'July 2026',
    raisedOn: '25 Jul 2026',
    lastUpdated: '27 Jul 2026',
    status: 'Resolved',
    Icon: Calculator,
    tone: 'violet',
  },
  {
    id: 'SQ-2026-0009',
    relatedTo: 'Payment',
    subject: 'Salary not credited to bank',
    payrollMonth: 'June 2026',
    raisedOn: '10 Jul 2026',
    lastUpdated: '12 Jul 2026',
    status: 'Closed',
    Icon: WalletCards,
    tone: 'orange',
  },
  {
    id: 'SQ-2026-0008',
    relatedTo: 'Deduction',
    subject: 'Professional tax deducted twice',
    payrollMonth: 'June 2026',
    raisedOn: '06 Jul 2026',
    lastUpdated: '08 Jul 2026',
    status: 'Resolved',
    Icon: Minus,
    tone: 'rose',
  },
];

function StatusBadge({ value }) {
  const success = ['Paid', 'Active', 'Approved', 'Completed', 'Resolved', 'Applied', 'Closed', 'Assigned', 'Verified'].includes(value);
  const warning = ['Pending', 'Under Review', 'Open', 'High', 'Not Generated'].includes(value);
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
  payrollSalary,
  requestType,
}) {
  const [form, setForm] = useState({
    amount: '',
    reason: '',
    supportingNote: '',
    attachment: null,
  });
  const summary = payrollSalary?.metricsSummary;
  const requestKey = requestType.toLowerCase();
  const isAdvanceRequest = requestType === 'Advance';
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
      attachment: null,
    });
  };

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100vh-1rem)] w-[calc(100%-1rem)] gap-0 overflow-y-auto p-0 sm:max-w-[720px] [&>button]:right-4 [&>button]:top-4 [&>button]:opacity-100">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-border px-5 py-4 pr-12">
            <DialogTitle className="text-lg font-semibold">Request {requestType}</DialogTitle>
            <DialogDescription className="text-[11px]">
              Submit your {requestKey} request for Finance review and Admin approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 px-5 py-4">
            <div className="rounded-lg border border-border bg-muted/15 p-3.5">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: 'Salary Basis',
                    value: salaryBasisLabels[summary?.salaryBasis] || summary?.salaryBasis || '—',
                    Icon: BadgeIndianRupee,
                    tone: 'emerald',
                  },
                  {
                    label: 'Net Salary',
                    value: currency(summary?.netSalary),
                    Icon: WalletCards,
                    tone: 'blue',
                  },
                  {
                    label: currentRequestLabel,
                    value: currency(currentRequestAmount),
                    Icon: ReceiptIndianRupee,
                    tone: 'orange',
                  },
                ].map(({ label, value, Icon, tone }, index) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2.5 ${index ? 'sm:border-l sm:border-border sm:pl-3' : ''}`}
                  >
                    <span className={`payroll-request-icon payroll-request-icon-${tone}`}>
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className={`mt-0.5 truncate text-xs font-semibold payroll-request-value-${tone}`}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-foreground sm:gap-4">
                {[
                  ['1', 'Finance Review', 'blue'],
                  ['2', 'Admin Approval', 'blue'],
                  ['3', 'Added in Payroll', 'emerald'],
                ].map(([step, label, tone], index) => (
                  <div key={step} className="contents">
                    <span className="flex items-center gap-2">
                      <i className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white payroll-request-step-${tone}`}>
                        {step}
                      </i>
                      <span className="font-medium">{label}</span>
                    </span>
                    {index < 2 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold">Request Month</Label>
                <div className="flex h-9 items-center gap-3 rounded-md border border-input bg-background px-3 text-[11px] shadow-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="flex-1 font-medium text-foreground">{monthLabel}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`${requestKey}-request-amount`} className="text-[11px] font-semibold">
                  Requested Amount
                </Label>
                <div className="flex h-9 overflow-hidden rounded-md border border-input bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring">
                  <span className="grid w-10 shrink-0 place-items-center bg-muted text-sm font-semibold">₹</span>
                  <Input
                    id={`${requestKey}-request-amount`}
                    type="number"
                    min="1"
                    step="0.01"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(event) => updateField('amount', event.target.value)}
                    placeholder="Enter amount"
                    className="h-full border-0 shadow-none focus-visible:ring-0"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`${requestKey}-request-reason`} className="text-[11px] font-semibold">
                Reason for {requestType}
              </Label>
              <div className="relative">
                <Textarea
                  id={`${requestKey}-request-reason`}
                  value={form.reason}
                  onChange={(event) => updateField('reason', event.target.value)}
                  maxLength={300}
                  placeholder={`Enter reason for requesting ${requestKey}...`}
                  className="min-h-[76px] resize-none pb-6 text-[11px]"
                  required
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
                  {form.reason.length}/300
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`${requestKey}-supporting-note`} className="text-[11px] font-semibold">
                Supporting Note <span className="font-normal text-muted-foreground">(Optional)</span>
              </Label>
              <div className="relative">
                <Textarea
                  id={`${requestKey}-supporting-note`}
                  value={form.supportingNote}
                  onChange={(event) => updateField('supportingNote', event.target.value)}
                  maxLength={300}
                  placeholder="Additional information (optional)..."
                  className="min-h-[68px] resize-none pb-6 text-[11px]"
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
                  {form.supportingNote.length}/300
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`${requestKey}-attachment`} className="text-[11px] font-semibold">
                Attachment <span className="font-normal text-muted-foreground">(Optional)</span>
              </Label>
              <label
                htmlFor={`${requestKey}-attachment`}
                className="flex min-h-[78px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-primary/45 bg-primary/[0.02] px-4 py-3 text-center hover:bg-primary/5"
              >
                <span className="flex items-center gap-2 text-xs">
                  <CloudUpload className="h-5 w-5 text-primary" aria-hidden="true" />
                  <strong className="font-semibold text-primary">Click to upload</strong>
                  <span className="text-foreground">or drag and drop</span>
                </span>
                <span className="mt-1 text-[10px] text-muted-foreground">
                  {form.attachment?.name || 'JPG, PNG, PDF up to 5MB'}
                </span>
                <Input
                  id={`${requestKey}-attachment`}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="sr-only"
                  onChange={(event) => updateField('attachment', event.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/70 px-3 py-2.5 text-[10px] text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300">
              <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
              {requestType} request is subject to Finance review and Admin approval.
            </div>
          </div>

          <DialogFooter className="flex-row justify-between border-t border-border px-5 py-3 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="h-8 px-4 text-[11px]">
              Cancel
            </Button>
            <Button type="submit" className="payroll-request-submit h-8 px-4 text-[11px] font-semibold">
              Submit {requestType} Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AllowanceTab({ filters, onFilterChange, payrollSalary }) {
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const monthLabel = new Date(filters.year, filters.month - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

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
          <MonthFilterControl filters={filters} onFilterChange={onFilterChange} />
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
              {!allowanceRows.length && <EmptyTableRow colSpan={7} />}
              {allowanceRows.map(([name, frequency, amount, effectiveFrom, status]) => (
                <TableRow key={name} className="hover:bg-muted/25">
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs font-semibold">{name}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">{frequency}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs font-semibold">{amount}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">{effectiveFrom}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">{monthLabel}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">
                    <StatusBadge value={status || '—'} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">
                    <button type="button" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3 flex items-center justify-center gap-16 rounded-md border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300">
          <span>Total Allowance Included</span>
          <strong className="text-lg font-semibold">—</strong>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/70 px-3 py-2.5 text-[11px] text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Allowance information will appear here when available.
        </div>
      </CardContent>
      <PayrollRequestDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        monthLabel={monthLabel}
        payrollSalary={payrollSalary}
        requestType="Allowance"
      />
    </Card>
  );
}

function AdvanceDeductionTab({ filters, onFilterChange, payrollSalary }) {
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const monthLabel = new Date(filters.year, filters.month - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

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
          <MonthFilterControl filters={filters} onFilterChange={onFilterChange} />
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
              {!advanceDeductionRows.length && <EmptyTableRow colSpan={8} />}
              {advanceDeductionRows.map(([category, name, type, amount, effectiveFrom, status]) => (
                <TableRow key={name} className="hover:bg-muted/25">
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">
                    <Badge
                      variant="outline"
                      className={category === 'Advance'
                        ? 'border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300'
                        : 'border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[9px] font-medium text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300'}
                    >
                      {category}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs font-semibold">{name}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">{type}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs font-semibold">{amount}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">{effectiveFrom}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">{monthLabel}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">
                    {status === 'Applied' ? (
                      <Badge variant="outline" className="border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300">
                        Applied
                      </Badge>
                    ) : <StatusBadge value={status} />}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">
                    <button type="button" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3 flex items-center justify-center gap-16 rounded-md border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300">
          <span>Total Advance &amp; Deduction Included</span>
          <strong className="text-lg font-semibold">—</strong>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/70 px-3 py-2.5 text-[11px] text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Advance and deduction information will appear here when available.
        </div>
      </CardContent>
      <PayrollRequestDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        monthLabel={monthLabel}
        payrollSalary={payrollSalary}
        requestType="Advance"
      />
    </Card>
  );
}

function LoanTab() {
  const primaryDetails = [
    ['Loan For', '—'],
    ['Loan ID', '—'],
    ['Approved Amount', '—'],
    ['Issued Month', '—'],
    ['Recovery Start Month', '—'],
    ['Monthly Deduction', '—'],
  ];
  const recoveryDetails = [
    ['Total Installments', '—'],
    ['Installments Paid', '—'],
    ['Total Recovered', '—'],
    ['Outstanding Balance', '—'],
    ['Next Recovery Month', '—'],
    ['Approved By', '—'],
    ['Status', <StatusBadge key="status" value="—" />],
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="payroll-panel">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b border-border px-4 py-3">
            <CardTitle className="text-sm font-semibold">Loan &amp; Recovery</CardTitle>
            <StatusBadge value="—" />
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
              Loan and recovery information will appear here when available.
            </div>
          </CardContent>
        </Card>

        <Card className="payroll-panel">
          <CardHeader className="border-b border-border px-4 py-3">
            <CardTitle className="text-sm font-semibold">Recovery Progress</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid items-center gap-5 sm:grid-cols-[150px_minmax(0,1fr)]">
              <div className="payroll-loan-progress mx-auto">
                <div>
                  <strong>—</strong>
                  <span>Recovered</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 text-[10px]">
                  <span className="flex items-center gap-2 font-medium text-muted-foreground">
                    <i className="h-2 w-2 rounded-full bg-emerald-500" />
                    Recovered
                  </span>
                  <strong className="text-foreground">—</strong>
                  <span className="flex items-center gap-2 font-medium text-muted-foreground">
                    <i className="h-2 w-2 rounded-full bg-orange-400" />
                    Outstanding
                  </span>
                  <strong className="text-foreground">—</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-md border border-border bg-muted/30 text-[10px]">
              <div className="flex items-start gap-2 p-3">
                <Info className="mt-0.5 h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-muted-foreground">Installments Paid</p>
                  <p className="mt-1 font-semibold text-foreground">—</p>
                </div>
              </div>
              <div className="border-l border-border p-3">
                <p className="text-muted-foreground">Next Recovery</p>
                <p className="mt-1 font-semibold text-foreground">—</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-[9px] font-medium">
                <span className="text-emerald-600 dark:text-emerald-400">Recovered —</span>
                <span className="text-orange-600 dark:text-orange-400">Outstanding —</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-orange-200 dark:bg-orange-400/25">
                <div className="h-full w-0 rounded-full bg-emerald-500" />
              </div>
              <p className="mt-1 text-center text-[9px] font-semibold text-foreground">—</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="payroll-panel">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
            Loan Statement
          </CardTitle>
          <Button variant="outline" size="sm" className="h-8 gap-2 px-3 text-[10px] font-medium">
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download Loan Statement
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/45 hover:bg-muted/45">
                {['Date', 'Particulars', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)', 'Type / Status'].map((heading) => (
                  <TableHead key={heading} className="h-8 whitespace-nowrap px-4 text-[9px]">{heading}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loanStatementRows.length && <EmptyTableRow colSpan={6} />}
              {loanStatementRows.map(([date, particulars, debit, credit, balance, status]) => (
                <TableRow key={`${date}-${particulars}`} className="hover:bg-muted/25">
                  <TableCell className="whitespace-nowrap px-4 py-1.5 text-[10px] font-medium">{date}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-1.5 text-[10px] font-medium">{particulars}</TableCell>
                  <TableCell className={`whitespace-nowrap px-4 py-1.5 text-[10px] ${debit !== '-' ? 'font-semibold text-red-600 dark:text-red-400' : ''}`}>{debit}</TableCell>
                  <TableCell className={`whitespace-nowrap px-4 py-1.5 text-[10px] ${credit !== '-' ? 'font-semibold text-emerald-600 dark:text-emerald-400' : ''}`}>{credit}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-1.5 text-[10px] font-semibold">{balance}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-1.5 text-[10px]">
                    <Badge
                      variant="outline"
                      className={status.startsWith('Credit')
                        ? 'border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[8px] font-medium text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300'
                        : status.startsWith('Debit')
                          ? 'border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[8px] font-medium text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300'
                          : 'border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[8px] font-medium text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300'}
                    >
                      {status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
  const [reply, setReply] = useState('');
  const isResolved = ['Resolved', 'Closed'].includes(query?.status);
  const relatedRecord = query?.relatedTo === 'Attendance Deduction'
    ? 'Attendance Deduction • ₹850'
    : query?.relatedTo || '—';

  const handleOpenChange = (open) => {
    if (!open) setReply('');
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
                    {query.id}
                  </SheetDescription>
                </div>
                <StatusBadge value={query.status} />
              </div>
            </SheetHeader>

            <div className="space-y-3 p-4">
              <div className="grid grid-cols-4">
                {[
                  ['Submitted', 'done'],
                  ['Finance Review', isResolved ? 'done' : 'current'],
                  ['Admin Review\nIf Required', isResolved ? 'done' : 'idle'],
                  ['Resolved', isResolved ? 'done' : 'idle'],
                ].map(([label, state], index) => (
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
                    ['Query Related To', query.relatedTo],
                    ['Payroll Month', query.payrollMonth],
                    ['Related Record', relatedRecord],
                    ['Subject', query.subject],
                    ['Raised On', `${query.raisedOn} • 03:45 PM`],
                    ['Assigned To', 'Finance Team'],
                    ['Last Updated', `${query.lastUpdated} • 11:20 AM`],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[98px_8px_minmax(0,1fr)] gap-1 text-[10px]">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-muted-foreground">:</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                  <button type="button" className="ml-auto block text-[9px] font-medium text-primary hover:underline">
                    View Record
                  </button>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50/35 shadow-none dark:border-blue-400/25 dark:bg-blue-400/5">
                <CardHeader className="border-b border-blue-200 px-3 py-2.5 dark:border-blue-400/20">
                  <CardTitle className="text-[11px] font-semibold">Your Query</CardTitle>
                </CardHeader>
                <CardContent className="px-3 py-3">
                  <p className="text-[10px] leading-4 text-foreground">
                    {query.subject}. Please review the payroll entry and share an update on the required correction.
                  </p>
                  <div className="mt-3 flex items-center justify-between rounded-md border border-blue-200 bg-background px-3 py-2 dark:border-blue-400/25">
                    <span className="flex min-w-0 items-center gap-2">
                      <i className="grid h-7 w-7 shrink-0 place-items-center rounded bg-red-500/10 text-red-600">
                        <FileText className="h-3.5 w-3.5" />
                      </i>
                      <span className="min-w-0">
                        <span className="block truncate text-[9px] font-medium">Payroll_Query_Attachment.pdf</span>
                        <span className="block text-[8px] text-muted-foreground">128 KB</span>
                      </span>
                    </span>
                    <button type="button" className="text-primary" aria-label="Download attachment">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-2 text-[8px] text-muted-foreground">Submitted on {query.raisedOn} • 03:45 PM</p>
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="border-b border-border px-3 py-2.5">
                  <CardTitle className="text-[11px] font-semibold">Conversation &amp; Updates</CardTitle>
                </CardHeader>
                <CardContent className="px-3 py-3">
                  <div className="space-y-3">
                    {[
                      {
                        name: 'Employee',
                        date: '28 Jul 2026 • 03:45 PM',
                        message: 'Query submitted regarding the payroll concern.',
                        tone: 'blue',
                      },
                      {
                        name: 'Finance Team',
                        date: '29 Jul 2026 • 10:15 AM',
                        message: 'We are reviewing the attendance and payroll records.',
                        tone: 'orange',
                      },
                      {
                        name: 'Finance Team',
                        date: '29 Jul 2026 • 11:20 AM',
                        message: 'The request has been forwarded to Admin for verification.',
                        tone: 'orange',
                      },
                      {
                        name: 'Admin',
                        date: '30 Jul 2026 • 09:30 AM',
                        message: 'Attendance correction verified. Payroll recalculation has been initiated.',
                        tone: 'violet',
                      },
                    ].map((item, index) => (
                      <div key={`${item.name}-${item.date}`} className="relative flex gap-2.5">
                        {index < 3 && <span className="absolute left-3 top-6 h-[calc(100%+12px)] border-l border-border" />}
                        <span className={`payroll-query-update payroll-query-update-${item.tone}`}>
                          {item.name === 'Employee' ? <UserRound className="h-3 w-3" /> : <Headphones className="h-3 w-3" />}
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <p className="text-[9px] font-semibold text-foreground">
                            {item.name} <span className="ml-2 font-normal text-muted-foreground">{item.date}</span>
                          </p>
                          <p className="mt-0.5 text-[9px] leading-4 text-muted-foreground">{item.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50/40 p-2.5 dark:border-emerald-400/25 dark:bg-emerald-400/5">
                    <Label htmlFor="salary-query-reply" className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                      Add Reply
                    </Label>
                    <Textarea
                      id="salary-query-reply"
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder="Type your reply or additional information..."
                      className="mt-2 min-h-[64px] resize-none bg-background text-[10px]"
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-[9px] text-primary">
                          <Paperclip className="h-3 w-3" />
                          Attach File
                        </Button>
                        <span className="text-[8px] text-muted-foreground">PDF, JPG, PNG (Max. 5MB)</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-[9px] text-red-600">
                          <Trash2 className="h-3 w-3" />
                          Cancel Query
                        </Button>
                        <Button size="sm" className="h-7 gap-1 bg-emerald-600 px-2 text-[9px] text-white hover:bg-emerald-700">
                          <Send className="h-3 w-3" />
                          Send Reply
                        </Button>
                      </span>
                    </div>
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

function RaiseSalaryQueryDialog({ open, onOpenChange, monthLabel, payrollSalary }) {
  const [form, setForm] = useState({
    relatedTo: 'Salary Calculation',
    relatedRecord: '',
    subject: '',
    details: '',
    attachment: null,
  });
  const summary = payrollSalary?.metricsSummary;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      relatedTo: 'Salary Calculation',
      relatedRecord: '',
      subject: '',
      details: '',
      attachment: null,
    });
  };

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100vh-1rem)] w-[calc(100%-1rem)] gap-0 overflow-y-auto p-0 sm:max-w-[680px] [&>button]:right-4 [&>button]:top-4 [&>button]:opacity-100">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-border px-5 py-4 pr-12">
            <DialogTitle className="text-lg font-semibold">Raise Salary Query</DialogTitle>
            <DialogDescription className="text-[11px]">
              Submit your payroll-related concern for Finance review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 px-5 py-4">
            <div className="grid gap-3 rounded-lg border border-blue-200 bg-blue-50/20 p-3 dark:border-blue-400/25 dark:bg-blue-400/5 sm:grid-cols-3">
              {[
                {
                  label: 'Payroll Month',
                  value: monthLabel,
                  Icon: CalendarDays,
                  tone: 'blue',
                },
                {
                  label: 'Net Salary',
                  value: currency(summary?.netSalary),
                  Icon: BadgeIndianRupee,
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
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] text-muted-foreground">{label}</p>
                    <p className={`mt-0.5 truncate text-xs font-semibold payroll-request-value-${tone}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-foreground sm:gap-3">
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold">
                  Query Related To <span className="text-red-500">*</span>
                </Label>
                <Select value={form.relatedTo} onValueChange={(value) => updateField('relatedTo', value)}>
                  <SelectTrigger className="h-9 text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      'Salary Calculation',
                      'Attendance Deduction',
                      'Allowance',
                      'Deduction',
                      'Payment',
                      'Payslip',
                      'Reimbursement',
                      'Loan',
                    ].map((option) => (
                      <SelectItem key={option} value={option} className="text-xs">{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold">
                  Payroll Month <span className="text-red-500">*</span>
                </Label>
                <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-[11px] shadow-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="flex-1 font-medium text-foreground">{monthLabel}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold">
                  Related Record <span className="font-normal text-muted-foreground">— Optional</span>
                </Label>
                <Select value={form.relatedRecord} onValueChange={(value) => updateField('relatedRecord', value)}>
                  <SelectTrigger className="h-9 text-[11px]">
                    <SelectValue placeholder="Select related record" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payroll-summary" className="text-xs">Payroll summary</SelectItem>
                    <SelectItem value="attendance-record" className="text-xs">Attendance record</SelectItem>
                    <SelectItem value="salary-breakdown" className="text-xs">Salary breakdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="salary-query-subject" className="text-[11px] font-semibold">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="salary-query-subject"
                  value={form.subject}
                  onChange={(event) => updateField('subject', event.target.value)}
                  placeholder="Enter a short subject for your query"
                  className="h-9 text-[11px]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="salary-query-details" className="text-[11px] font-semibold">
                Query Details <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="salary-query-details"
                value={form.details}
                onChange={(event) => updateField('details', event.target.value)}
                placeholder="Explain the issue clearly, including the amount or payroll entry concerned."
                className="min-h-[78px] resize-none text-[11px]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="salary-query-attachment" className="text-[11px] font-semibold">
                Attachment <span className="font-normal text-muted-foreground">— Optional</span>
              </Label>
              <label
                htmlFor="salary-query-attachment"
                className="flex min-h-[76px] cursor-pointer items-center justify-center gap-3 rounded-md border border-dashed border-primary/45 bg-primary/[0.02] px-4 py-3 hover:bg-primary/5"
              >
                <CloudUpload className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="text-[11px]">
                  <span>
                    <strong className="font-semibold text-foreground">Click to upload</strong>
                    <span className="text-muted-foreground"> or drag and drop</span>
                  </span>
                  <span className="mt-1 block text-[9px] text-muted-foreground">
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

            <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50/70 px-3 py-2.5 text-[10px] leading-4 text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Your query will first be reviewed by Finance. It will be forwarded to Admin only when approval,
              correction or payroll recalculation is required.
            </div>
          </div>

          <DialogFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-3 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="h-8 px-4 text-[11px]">
              Cancel
            </Button>
            <Button type="submit" className="payroll-query-submit h-8 px-4 text-[11px] font-semibold">
              Submit Salary Query
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SalaryQueriesTab({ filters, onFilterChange, payrollSalary }) {
  const [isRaiseQueryOpen, setIsRaiseQueryOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
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
          <MonthFilterControl filters={filters} onFilterChange={onFilterChange} />
        </CardHeader>

        <CardContent className="p-3">
          <div className="overflow-x-auto rounded-md border border-border">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow className="bg-muted/45 hover:bg-muted/45">
                  {['Query ID', 'Related To', 'Subject', 'Payroll Month', 'Raised On', 'Last Updated', 'Status', 'Action'].map((heading) => (
                    <TableHead key={heading} className="h-8 whitespace-nowrap px-3 text-[10px] font-medium">
                      {heading}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryQueryRows.map((query) => {
                  const QueryIcon = query.Icon;
                  return (
                    <TableRow key={query.id} className="hover:bg-muted/25">
                      <TableCell className="whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold">{query.id}</TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2.5">
                        <span className="flex items-center gap-2 text-[10px] font-medium">
                          <i className={`payroll-query-category payroll-query-category-${query.tone}`}>
                            <QueryIcon className="h-3 w-3" aria-hidden="true" />
                          </i>
                          {query.relatedTo}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2.5 text-[10px] font-medium">{query.subject}</TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2.5 text-[10px] text-muted-foreground">{query.payrollMonth}</TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2.5 text-[10px] font-medium">{query.raisedOn}</TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2.5 text-[10px] font-medium">{query.lastUpdated}</TableCell>
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
                  );
                })}
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Showing 1 to 5 of 10 queries</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" aria-label="Previous page">
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button size="icon" className="h-7 w-7 text-[10px]">1</Button>
                <Button variant="outline" size="icon" className="h-7 w-7 text-[10px]">2</Button>
                <Button variant="outline" size="icon" className="h-7 w-7" aria-label="Next page">
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
        monthLabel={new Date(filters.year, filters.month - 1, 1).toLocaleDateString('en-IN', {
          month: 'long',
          year: 'numeric',
        })}
        payrollSalary={payrollSalary}
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
