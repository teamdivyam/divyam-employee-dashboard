/* eslint-disable react/prop-types */
import { useState } from 'react';
import {
  ArrowRight,
  BadgeIndianRupee,
  Banknote,
  Box,
  Check,
  Circle,
  CircleDollarSign,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileClock,
  FileQuestion,
  FileText,
  Info,
  Landmark,
  ReceiptIndianRupee,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/components/ui/tabs';
import { MonthFilterControl } from '../attendence-leave/AttendenceLeavePage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/components/ui/table';

const currency = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

const tabs = [
  ['summary', 'Salary Summary', BadgeIndianRupee],
  ['allowance', 'Allowance', WalletCards],
  ['advance', 'Advance & Deduction', ReceiptIndianRupee],
  ['reimbursements', 'Reimbursements', FileCheck2],
  ['loan', 'Loan', Landmark],
  ['assets', 'Assigned Assets', Box],
  ['queries', 'Salary Queries', FileQuestion],
];

const stats = [
  ['Salary Basis', 'Monthly Fixed', '₹25,000 / month', WalletCards, 'blue'],
  ['Attendance Status', 'Verified', 'by Admin', ShieldCheck, 'emerald'],
  ['Gross Earnings', '₹27,000', 'This Month', BadgeIndianRupee, 'blue'],
  ['Total Deductions', '₹2,500', 'This Month', ReceiptIndianRupee, 'orange'],
  ['Net Salary', '₹24,500', 'This Month', Banknote, 'emerald'],
  ['Payment Status', 'Pending', 'Payment', CircleDollarSign, 'violet'],
];

const earnings = [
  ['Basic Salary', 25000],
  ['Allowance', 1000],
  ['Approved Reimbursements', 1000],
];

const deductions = [
  ['Attendance Deduction', 850],
  ['Provident Fund (PF)', 1500],
  ['ESI', 120],
  ['Professional Tax', 200],
  ['Advance Deduction', 0],
  ['Loan Deduction', 0],
];

const attendance = [
  ['Working Days', '26'],
  ['Present Days', '22'],
  ['Paid Leaves', '2'],
  ['Unpaid Leaves', '1'],
  ['Half Days', '1'],
  ['Absent Days', '1'],
  ['Late Days', '2'],
  ['Total Working Hours', '187h 30m'],
  ['Payable Days', '25 Days'],
  ['Attendance Deduction', '₹850'],
];

const progress = [
  ['Attendance Verified', '27 Jul 2026', 'done'],
  ['Salary Calculated', '27 Jul 2026', 'done'],
  ['Admin Approval', 'Pending', 'current'],
  ['Payment Processing', 'Pending', 'idle'],
  ['Paid', 'Pending', 'idle'],
  ['Payslip Generated', 'Pending', 'idle'],
];

const history = [
  ['July 2026', '₹27,000', '₹2,500', '₹24,500', 'Pending', '-', 'Not Generated'],
  ['June 2026', '₹27,000', '₹2,300', '₹24,700', 'Paid', '05 Jul 2026', 'View'],
  ['May 2026', '₹26,000', '₹2,200', '₹23,800', 'Paid', '05 Jun 2026', 'View'],
];

const allowanceRows = [
  ['Mobile Allowance', 'Monthly', '₹500', '01 Jan 2026'],
  ['Travel Allowance', 'Monthly', '₹500', '01 Apr 2026'],
];

const advanceDeductionRows = [
  ['Advance', 'Salary Advance Recovery', 'Monthly', '₹2,000', '01 May 2026', 'Active'],
  ['Deduction', 'Uniform Recovery', 'One Time', '₹500', '01 Jul 2026', 'Applied'],
  ['Deduction', 'Security Deposit Recovery', 'Monthly', '₹1,000', '01 Jul 2026', 'Active'],
];

const loanStatementRows = [
  ['18 Mar 2026', 'Loan Disbursement (LN-2026-0012)', '-', '₹50,000', '₹50,000', 'Credit - Loan Issued'],
  ['30 Apr 2026', 'Monthly Recovery – April 2026', '₹5,000', '-', '₹45,000', 'Debit - Recovery'],
  ['31 May 2026', 'Monthly Recovery – May 2026', '₹5,000', '-', '₹40,000', 'Debit - Recovery'],
  ['30 Jun 2026', 'Monthly Recovery – June 2026', '₹5,000', '-', '₹35,000', 'Debit - Recovery'],
  ['31 Jul 2026', 'Monthly Recovery – July 2026', '₹5,000', '-', '₹30,000', 'Debit - Recovery'],
  ['15 Aug 2026', 'Monthly Recovery – August 2026', '-', '-', '₹30,000', 'Upcoming'],
  ['30 Aug 2026', 'Monthly Recovery – August 2026 (Upcoming)', '₹5,000', '-', '₹25,000', 'Upcoming'],
];

const reimbursementRows = [
  ['Venue Visit Travel', 'Travel', 'Event', 'Sharma Wedding', '15 Jul 2026', '₹1,500', '₹1,250', 'Included in Salary', 'July 2026', 'Included'],
  ['Client Menu Meeting', 'Food', 'Client', 'Nitish Jaiswal', '12 Jul 2026', '₹750', '₹600', 'Paid Separately', '—', 'Paid'],
  ['Office Purchase', 'Essentials', 'Office', 'Corporate Office', '18 Jul 2026', '₹800', '₹800', 'Paid Separately', '—', 'Paid'],
  ['Local Conveyance', 'Travel', 'Event', 'Prayagraj Wedding Setup', '10 Jul 2026', '₹600', '₹500', 'Included in Salary', 'July 2026', 'Included'],
  ['Miscellaneous', 'Others', 'General Work', 'Company Work', '05 Jul 2026', '₹300', '₹250', 'Included in Salary', 'July 2026', 'Included'],
];

const tabPages = {
  assets: {
    title: 'Assigned Assets',
    description: 'Company assets currently assigned to you.',
    columns: ['Asset ID', 'Asset', 'Model', 'Assigned On', 'Condition', 'Status'],
    rows: [
      ['AST-0042', 'Laptop', 'Dell Latitude 5440', '12 Jan 2026', 'Good', 'Assigned'],
      ['AST-0118', 'Access Card', 'RFID Card', '12 Jan 2026', 'Good', 'Assigned'],
    ],
  },
  queries: {
    title: 'Salary Queries',
    description: 'Questions raised about salary, deductions, or payslips.',
    columns: ['Query ID', 'Subject', 'Created On', 'Last Update', 'Priority', 'Status'],
    rows: [
      ['QRY-024', 'PF contribution clarification', '08 Jul 2026', '09 Jul 2026', 'Normal', 'Resolved'],
      ['QRY-031', 'July attendance deduction', '27 Jul 2026', '27 Jul 2026', 'High', 'Open'],
    ],
  },
};

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

function SalaryBreakdown() {
  return (
    <Card className="payroll-panel">
      <PanelHeader icon={FileCheck2} title="Salary Breakdown – July 2026" />
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ['Salary Basis', 'Monthly Fixed'],
            ['Rate Amount', '₹25,000 / month'],
            ['Payable Days', '25 Days'],
            ['Payroll Status', <StatusBadge key="status" value="Calculated" />],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
              <div className="mt-1 text-xs font-semibold text-foreground">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid overflow-hidden rounded-md border border-border md:grid-cols-2">
          <SalaryList title="Earnings" rows={earnings} totalLabel="Gross Earnings" total={27000} />
          <SalaryList title="Deductions" rows={deductions} totalLabel="Total Deductions" total={2500} deduction />
        </div>

        <div className="payroll-net-salary">
          <span>Net Payable Salary</span>
          <strong>₹24,500</strong>
        </div>
        <button type="button" className="ml-auto mt-3 flex items-center gap-1 text-[10px] font-medium text-primary hover:underline">
          View Full Breakdown <ArrowRight size={12} />
        </button>
      </CardContent>
    </Card>
  );
}

function AttendanceSnapshot() {
  return (
    <Card className="payroll-panel">
      <PanelHeader
        icon={FileText}
        title="Attendance & Leave Snapshot"
        action={<StatusBadge value="Verified" />}
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
            <p className="mt-1 font-semibold text-foreground">Admin</p>
          </div>
          <div className="border-l border-border p-3">
            <p className="text-muted-foreground">Verified On</p>
            <p className="mt-1 font-semibold text-foreground">27 Jul 2026</p>
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
          Your salary is calculated and awaiting approval.
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

function AllowanceTab({ filters, onFilterChange }) {
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
              {allowanceRows.map(([name, frequency, amount, effectiveFrom]) => (
                <TableRow key={name} className="hover:bg-muted/25">
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs font-semibold">{name}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">{frequency}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs font-semibold">{amount}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">{effectiveFrom}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">{monthLabel}</TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-xs">
                    <StatusBadge value="Active" />
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
          <strong className="text-lg font-semibold">₹1,000</strong>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/70 px-3 py-2.5 text-[11px] text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Allowances listed above are included in your current month salary.
        </div>
      </CardContent>
    </Card>
  );
}

function AdvanceDeductionTab({ filters, onFilterChange }) {
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
          <strong className="text-lg font-semibold">₹3,500</strong>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/70 px-3 py-2.5 text-[11px] text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          The items listed above are included in your current month salary.
        </div>
      </CardContent>
    </Card>
  );
}

function LoanTab() {
  const primaryDetails = [
    ['Loan For', 'Personal Requirement'],
    ['Loan ID', 'LN-2026-0012'],
    ['Approved Amount', '₹50,000'],
    ['Issued Month', 'March 2026'],
    ['Recovery Start Month', 'April 2026'],
    ['Monthly Deduction', '₹5,000'],
  ];
  const recoveryDetails = [
    ['Total Installments', '10'],
    ['Installments Paid', '4'],
    ['Total Recovered', '₹20,000'],
    ['Outstanding Balance', <span key="balance" className="text-red-600 dark:text-red-400">₹30,000</span>],
    ['Next Recovery Month', 'August 2026'],
    ['Approved By', 'Finance Team'],
    ['Status', <StatusBadge key="status" value="Active" />],
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="payroll-panel">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b border-border px-4 py-3">
            <CardTitle className="text-sm font-semibold">Active Loan &amp; Recovery</CardTitle>
            <StatusBadge value="Active" />
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
              Loan recovery is automatically included in monthly payroll deductions.
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
                  <strong>40%</strong>
                  <span>Recovered</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 text-[10px]">
                  <span className="flex items-center gap-2 font-medium text-muted-foreground">
                    <i className="h-2 w-2 rounded-full bg-emerald-500" />
                    Recovered
                  </span>
                  <strong className="text-foreground">₹20,000</strong>
                  <span className="flex items-center gap-2 font-medium text-muted-foreground">
                    <i className="h-2 w-2 rounded-full bg-orange-400" />
                    Outstanding
                  </span>
                  <strong className="text-foreground">₹30,000</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-md border border-border bg-muted/30 text-[10px]">
              <div className="flex items-start gap-2 p-3">
                <Info className="mt-0.5 h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-muted-foreground">Installments Paid</p>
                  <p className="mt-1 font-semibold text-foreground">4 of 10</p>
                </div>
              </div>
              <div className="border-l border-border p-3">
                <p className="text-muted-foreground">Next Recovery</p>
                <p className="mt-1 font-semibold text-foreground">₹5,000</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-[9px] font-medium">
                <span className="text-emerald-600 dark:text-emerald-400">Recovered ₹20,000</span>
                <span className="text-orange-600 dark:text-orange-400">Outstanding ₹30,000</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-orange-200 dark:bg-orange-400/25">
                <div className="h-full w-2/5 rounded-full bg-emerald-500" />
              </div>
              <p className="mt-1 text-center text-[9px] font-semibold text-foreground">40%</p>
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
              <p className="mt-1 text-xl font-semibold text-foreground">₹3,200</p>
            </div>
          </div>
          <div className="border-t border-border px-6 py-4 sm:border-l sm:border-t-0">
            <p className="text-xs font-medium text-foreground">Included in Salary</p>
            <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400">₹2,000</p>
          </div>
          <div className="border-t border-border px-6 py-4 sm:border-l sm:border-t-0">
            <p className="text-xs font-medium text-foreground">Paid Separately</p>
            <p className="mt-1 text-xl font-semibold text-blue-600 dark:text-blue-400">₹1,200</p>
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

function DetailTab({ data }) {
  return (
    <Card className="payroll-panel">
      <CardHeader className="border-b border-border p-4">
        <CardTitle className="text-base font-semibold">{data.title}</CardTitle>
        <p className="text-xs text-muted-foreground">{data.description}</p>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/45 hover:bg-muted/45">
              {data.columns.map((column) => (
                <TableHead key={column} className="whitespace-nowrap text-[10px]">{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row) => (
              <TableRow key={row[0]}>
                {row.map((cell, index) => (
                  <TableCell key={`${row[0]}-${index}`} className="whitespace-nowrap text-xs">
                    {index === row.length - 1 ? <StatusBadge value={cell} /> : cell}
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

export default function PayrollSalaryPage() {
  const [activeTab, setActiveTab] = useState('summary');
  const [monthFilters, setMonthFilters] = useState({
    year: 2026,
    month: 7,
  });

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
              <SalaryBreakdown />
              <AttendanceSnapshot />
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
            <AllowanceTab filters={monthFilters} onFilterChange={setMonthFilters} />
          </TabsContent>

          <TabsContent value="advance" className="mt-4">
            <AdvanceDeductionTab filters={monthFilters} onFilterChange={setMonthFilters} />
          </TabsContent>

          <TabsContent value="loan" className="mt-4">
            <LoanTab />
          </TabsContent>

          <TabsContent value="reimbursements" className="mt-4">
            <ReimbursementsTab />
          </TabsContent>

          {Object.entries(tabPages).map(([value, data]) => (
            <TabsContent key={value} value={value} className="mt-4">
              <DetailTab data={data} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </main>
  );
}
