import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Landmark,
  Receipt,
  ShieldCheck,
  UserRound,
  Wallet,
} from 'lucide-react';
import PageLocked from '@components/components/PageLocked';
import EmployeeService from '../../../services/employee.service';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const titleCase = (value) => String(value || '-').replace(/_/g, ' ');
const initials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || 'A') + (parts[1]?.[0] || '');
};
const fmtDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const getImageUrl = (image) => {
  if (!image) return '';
  if (typeof image === 'string') return image;
  return image.url || image.path || image.secureUrl || image.filename || '';
};

const statusTone = {
  Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300',
  Paid: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300',
  Generated: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300',
  Verified: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300',
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300',
  Pending: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300',
  Partial: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300',
  'Not Generated': 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-400/30 dark:bg-slate-400/10 dark:text-slate-300',
  Default: 'border-border bg-muted/50 text-muted-foreground',
};

function StatusBadge({ value }) {
  const label = titleCase(value);
  const tone = statusTone[label] || statusTone.Default;
  return <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{label}</span>;
}

function MetricCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border ${tone}`}>
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-lg font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DetailPayrollSalaryPage() {
  const navigate = useNavigate();
  const { employeeId: employeePayrollId } = useParams();

  const detailQuery = useQuery({
    queryKey: ['employee-payroll-detail', employeePayrollId],
    enabled: Boolean(employeePayrollId),
    queryFn: async () => {
      const response = await EmployeeService.getEmployeePayrollDetail({ employeePayrollId });
      return response.data;
    },
  });

  const data = detailQuery.data || {};
  const employee = data.employee || {};
  const payroll = data.payroll || {};
  const salarySnapshot = data.salarySnapshot || {};
  const earnings = salarySnapshot.earnings || {};
  const deductions = salarySnapshot.deductions || {};
  const salaryStructure = salarySnapshot.salaryStructure || {};
  const attendance = data.attendanceSync || payroll.attendance || {};
  const payment = data.paymentInformation || {};
  const latestPayslip = data.latestPayslip || {};
  const notes = data.adminNotes || [];
  const pendingActions = data.pendingActions || [];

  const grossSalary = earnings.grossEarnings ?? payroll.grossSalary ?? Number(earnings.basicSalary || 0) + Number(earnings.hra || 0) + Number(earnings.otherAllowances || 0) + Number(earnings.reimbursementsIncluded || 0);
  const totalDeductions = deductions.totalDeductions ?? payroll.deductions ?? Number(deductions.pf || 0) + Number(deductions.professionalTax || 0) + Number(deductions.esi || 0) + Number(deductions.attendanceDeduction || 0) + Number(deductions.advanceDeduction || 0) + Number(deductions.loanDeduction || 0) + Number(deductions.otherDeductions || 0);
  const advanceLoan = Number(deductions.advanceDeduction || 0) + Number(deductions.loanDeduction || 0);
  const netSalary = salarySnapshot.netPayable ?? payroll.netSalary ?? 0;
  const reimbursements = earnings.reimbursementsIncluded ?? payroll.reimbursements ?? 0;

  const image = getImageUrl(employee.image || employee.profileImage);
  const infoCards = [
    ['Payroll Month', payroll.payrollMonth || formatMonthFromData(payroll), CalendarDays],
    ['Payroll Status', payroll.payrollStatus || 'Pending', Wallet],
    ['Payment Status', payroll.paymentStatus || 'Pending', CheckCircle2],
    ['Payslip Status', payroll.payslipStatus || 'Not Generated', FileText],
    ['Net Salary', money(netSalary), ShieldCheck],
    ['Attendance Status', attendance.status || (attendance.verified ? 'Verified' : 'Pending'), CheckCircle2],
    ['Payment Date', fmtDate(payment.paymentDate), CalendarDays],
    ['Payment Mode', payment.paymentMode || salaryStructure.paymentMode || '-', Landmark],
  ];

  if (detailQuery.isLoading) {
    return (
      <div className="relative min-h-screen">
        <div className="min-h-screen bg-background p-6 text-muted-foreground">Loading payroll detail...</div>
        <PageLocked className="z-[100]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="min-h-screen bg-background p-4 text-foreground md:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <button type="button" onClick={() => navigate('/dashboard/payroll-&-salary')} className="hover:text-primary">Payroll &amp; Salary</button>
            <span>/</span>
            <span>Employee Payroll Detail</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{employee.name || 'Employee'} - Payroll Detail</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage payroll information, salary breakdown, deductions, advances, loans and payment status.</p>
        </div>
      </header>

      <section className="mt-5 rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(460px,0.95fr)]">
          <div className="flex flex-col gap-5 md:flex-row">
            {image ? (
              <img src={image} alt={employee.name || 'Employee'} className="h-28 w-28 rounded-full object-cover" />
            ) : (
              <span className="grid h-28 w-28 shrink-0 place-items-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">{initials(employee.name).toUpperCase()}</span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-foreground">{employee.name || '-'}</h2>
                <StatusBadge value={employee.status || salaryStructure.status || 'Active'} />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Info label="Employee ID" value={employee.employeeId} />
                <Info label="Designation" value={employee.designation} />
                <Info label="Department" value={employee.department} />
                <Info label="Role / Panel" value={employee.role?.name || employee.role} />
                <Info label="Date of Joining" value={fmtDate(employee.dateOfJoining || employee.joiningDate)} />
                <Info label="Bank Details" value={payment.bankName || salaryStructure.bankDetails?.bankName ? `${payment.bankName || salaryStructure.bankDetails?.bankName} - ${payment.accountNumberMasked || salaryStructure.bankDetails?.accountNumberMasked || '-'}` : '-'} />
              </div>
              <button type="button" onClick={() => employee._id && navigate(`/dashboard/employee/${employee._id}`)} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline">
                View Full Profile <ArrowLeft size={12} className="rotate-180" />
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {infoCards.map(([label, value, Icon]) => (
              <div key={label} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-muted-foreground">{label}</p>
                    <p className="mt-1 truncate text-sm font-bold text-foreground">{label.includes('Status') ? <StatusText value={value} /> : value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Gross Salary" value={money(grossSalary)} icon={Wallet} tone="border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300" />
        <MetricCard label="Reimbursements (Included)" value={money(reimbursements)} icon={Receipt} tone="border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300" />
        <MetricCard label="Total Deductions" value={money(totalDeductions)} icon={Clock3} tone="border-red-100 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300" />
        <MetricCard label="Advance / Loan Deduction" value={money(advanceLoan)} icon={Banknote} tone="border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300" />
        <MetricCard label="Net Salary" value={money(netSalary)} icon={Wallet} tone="border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300" />
        <MetricCard label="Payment Status" value={payroll.paymentStatus || 'Pending'} icon={CheckCircle2} tone="border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300" />
      </section>

      <section className="mt-4 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex gap-1 overflow-x-auto border-b border-border px-3 pt-3">
          {['Overview', 'Salary Breakdown', 'Attendance Sync', 'Reimbursements', 'Advance & Loans', 'Deductions', 'Payslips', 'Assigned Assets', 'Salary Queries', 'Activity Log'].map((tab, index) => (
            <button key={tab} type="button" className={`shrink-0 border-b-2 px-3 py-3 text-xs font-semibold ${index === 0 ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{tab}</button>
          ))}
        </div>

        <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.7fr)_minmax(320px,0.7fr)]">
          <SalarySnapshot earnings={earnings} deductions={deductions} grossSalary={grossSalary} totalDeductions={totalDeductions} netSalary={netSalary} />
          <AttendanceSnapshot attendance={attendance} deductions={deductions} />
          <PaymentInformation payment={payment} salaryStructure={salaryStructure} />
        </div>

        <div className="grid gap-4 px-4 pb-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
          <LatestPayslip payslip={latestPayslip} netSalary={netSalary} payroll={payroll} />
          <PendingActions actions={pendingActions} payroll={payroll} />
          <AdminNotes notes={notes} />
        </div>

        <div className="mx-4 mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300">
          This is an admin view. Changes made here will be reflected in employee's payroll data.
        </div>
      </section>

      </div>
      <PageLocked className="z-[100]" />
    </div>
  );
}

function formatMonthFromData(payroll) {
  if (payroll.payrollMonth) return payroll.payrollMonth;
  if (payroll.month && payroll.year) {
    const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${names[Number(payroll.month) - 1]} ${payroll.year}`;
  }
  return '-';
}

function StatusText({ value }) {
  const label = titleCase(value);
  const isGood = ['Approved', 'Paid', 'Generated', 'Verified'].includes(label);
  return <span className={isGood ? 'text-emerald-600 dark:text-emerald-300' : 'text-orange-600 dark:text-orange-300'}>{label}</span>;
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">{value || '-'}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, badge, children }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? <Icon size={16} className="text-primary" /> : null}
          <h3 className="truncate text-sm font-bold text-foreground">{title}</h3>
        </div>
        {badge ? <StatusBadge value={badge} /> : null}
      </div>
      {children}
    </section>
  );
}

function SalarySnapshot({ earnings, deductions, grossSalary, totalDeductions, netSalary }) {
  const earningRows = [
    ['Basic Salary', earnings.basicSalary],
    ['House Rent Allowance (HRA)', earnings.hra],
    ['Other Allowances', earnings.otherAllowances],
    ['Reimbursements (Included)', earnings.reimbursementsIncluded],
  ];
  const deductionRows = [
    ['Provident Fund (PF)', deductions.pf],
    ['Professional Tax', deductions.professionalTax],
    ['ESI', deductions.esi],
    ['Attendance Deduction', deductions.attendanceDeduction],
    ['Advance Deduction', deductions.advanceDeduction],
    ['Loan Deduction', deductions.loanDeduction],
    ['Other Deductions', deductions.otherDeductions],
  ];
  return (
    <Panel title="Current Month Salary Snapshot" icon={Wallet}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-300">Earnings</p>
          <Rows rows={earningRows} />
          <div className="mt-3 flex justify-between rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
            <span>Gross Earnings</span><span>{money(grossSalary)}</span>
          </div>
        </div>
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase text-red-600 dark:text-red-300">Deductions</p>
          <Rows rows={deductionRows} />
          <div className="mt-3 flex justify-between rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-400/10 dark:text-red-300">
            <span>Total Deductions</span><span>{money(totalDeductions)}</span>
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-center gap-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-base font-bold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">
        <span>Net Payable (In-Hand Salary)</span>
        <span>{money(netSalary)}</span>
      </div>
    </Panel>
  );
}

function Rows({ rows }) {
  return (
    <div className="space-y-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 text-xs">
          <span className="text-foreground">{label}</span>
          <span className="font-semibold text-foreground">{money(value)}</span>
        </div>
      ))}
    </div>
  );
}

function AttendanceSnapshot({ attendance, deductions }) {
  const items = [
    ['Working Days', attendance.workingDays ?? 0, 'text-foreground'],
    ['Present Days', attendance.presentDays ?? 0, 'text-emerald-600 dark:text-emerald-300'],
    ['Late Days', attendance.lateDays ?? 0, 'text-orange-600 dark:text-orange-300'],
    ['Absent Days', attendance.absentDays ?? 0, 'text-red-600 dark:text-red-300'],
    ['Paid Leaves', attendance.paidLeaves ?? 0, 'text-violet-600 dark:text-violet-300'],
    ['Unpaid Leaves', attendance.unpaidLeaves ?? 0, 'text-foreground'],
  ];
  return (
    <Panel title="Attendance Sync Snapshot" icon={ShieldCheck} badge={attendance.status || (attendance.verified ? 'Verified' : 'Pending')}>
      <div className="grid grid-cols-3 divide-x divide-y divide-border overflow-hidden rounded-lg border border-border">
        {items.map(([label, value, cls]) => (
          <div key={label} className="p-4 text-center">
            <p className={`text-xl font-bold ${cls}`}>{value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300">
        <span>Attendance Deduction</span>
        <span>{money(deductions.attendanceDeduction)}</span>
      </div>
      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <Info label="Attendance Verified By" value={attendance.verifiedBy?.fullName || attendance.verifiedBy?.name || attendance.verifiedBy || '-'} />
        <Info label="Verified On" value={fmtDate(attendance.verifiedOn || attendance.updatedAt)} />
      </div>
    </Panel>
  );
}

function PaymentInformation({ payment, salaryStructure }) {
  const bank = salaryStructure.bankDetails || {};
  const rows = [
    ['Payment Status', payment.paymentStatus || payment.status || '-'],
    ['Payment Date', fmtDate(payment.paymentDate)],
    ['Payment Mode', payment.paymentMode || salaryStructure.paymentMode || '-'],
    ['Transaction Reference', payment.transactionReference],
    ['Bank Name', payment.bankName || bank.bankName],
    ['Account Number', payment.accountNumberMasked || bank.accountNumberMasked],
    ['IFSC Code', payment.ifscCode || bank.ifscCode],
  ];
  return (
    <Panel title="Payment Information" icon={Landmark}>
      <div className="space-y-4">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className="max-w-[55%] break-words text-right font-semibold text-foreground">{value || '-'}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function LatestPayslip({ payslip, netSalary, payroll }) {
  const pdfUrl = payslip.pdfUrl || payslip.url;
  return (
    <Panel title="Latest Payslip" icon={FileText}>
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="flex items-center gap-2">
          <p className="font-bold text-foreground">{payroll.payrollMonth || payslip.month || 'Current Month'}</p>
          <StatusBadge value={payroll.payslipStatus || payslip.status || 'Not Generated'} />
        </div>
        <Info label="Generated On" value={fmtDateTime(payslip.generatedAt || payslip.createdAt)} />
        <div className="mt-3 flex justify-between text-xs">
          <span className="text-muted-foreground">Net Salary</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-300">{money(payslip.netSalary || netSalary)}</span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" disabled={!pdfUrl} onClick={() => pdfUrl && window.open(pdfUrl, '_blank')} className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-primary text-xs font-semibold text-primary hover:bg-accent disabled:opacity-50">
            <ShieldCheck size={14} /> View Payslip
          </button>
          <button type="button" disabled={!pdfUrl} onClick={() => pdfUrl && window.open(pdfUrl, '_blank')} className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-primary text-xs font-semibold text-primary hover:bg-accent disabled:opacity-50">
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>
    </Panel>
  );
}

function PendingActions({ actions, payroll }) {
  const rows = actions.length ? actions : [
    'No pending actions. All items are completed.',
    payroll.payrollStatus === 'Approved' ? 'Salary is approved.' : 'Salary approval is pending.',
    payroll.paymentStatus === 'Paid' ? 'Salary is approved and paid.' : 'Payment is pending.',
    payroll.payslipStatus === 'Generated' ? 'Payslip has been generated.' : 'Payslip generation is pending.',
  ];
  return (
    <Panel title="Pending Actions / Items" icon={CheckCircle2}>
      <div className="space-y-3">
        {rows.map((item, index) => {
          const text = typeof item === 'string' ? item : item.title || item.message || item.label;
          return (
            <div key={`${text}-${index}`} className="flex items-start gap-2 border-b border-border pb-3 text-xs last:border-0 last:pb-0">
              <CheckCircle2 size={15} className="mt-0.5 text-emerald-600 dark:text-emerald-300" />
              <span className="text-foreground">{text}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function AdminNotes({ notes }) {
  const latest = notes[0];
  return (
    <Panel title="Admin Notes" icon={FileText}>
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-100">
        <p>{latest?.note || 'No admin note added yet.'}</p>
        <div className="mt-8 grid gap-3 border-t border-orange-200 pt-3 text-xs dark:border-orange-400/30 sm:grid-cols-2">
          <Info label="Note Added By" value={latest?.createdBy?.fullName || latest?.createdBy?.name || latest?.createdBy || '-'} />
          <Info label="Note Date" value={fmtDateTime(latest?.createdAt)} />
        </div>
      </div>
    </Panel>
  );
}

export default DetailPayrollSalaryPage;
