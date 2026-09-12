import { useEffect, useState } from 'react';
import {
  Loader2,
  Save,
  UserRound,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/components/ui/dialog';
import AddBookingDialog from './AddBookingDialog';

export const bookingStatuses = [
  'Planning',
  'Proposal Pending',
  'Proposal Sent',
  'Confirmed',
  'Completed',
  'On Hold',
  'Cancelled',
];

export const paymentStatuses = [
  'No Payment',
  'Proposal Sent',
  'Advance Received',
  'Partially Received',
  '30% Received',
  '50% Received',
  '75% Received',
  'Full Paid',
];

export const eventTypes = ['Wedding', 'Reception', 'Engagement', 'Birthday', 'Corporate Event'];

export const formatDate = (date) => {
  if (!date) return '-';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

export const money = (value) => `INR ${Number(value || 0).toLocaleString('en-IN')}`;

export const getCustomers = (data) =>
  data?.customer || data?.customers || data?.client || data?.clients || [];

export const getEmployees = (data) => {
  const employees = data?.data?.employees
    || data?.data?.employee
    || data?.employees
    || data?.employee
    || [];

  return employees
    .map((employee) => ({
      ...employee,
      _id: String(employee._id || employee.id || ''),
      name: employee.name || employee.employeeName || employee.fullName || 'Unnamed employee',
    }))
    .filter((employee) => employee._id);
};

export const getBookings = (data) => data?.events || data?.bookings || data?.eventBookings || [];

export const getBookingDetail = (data) => data?.event || data?.booking || data?.eventBooking || data?.data;

export const getTotalRows = (data) =>
  data?.totalEvents || data?.totalBookings || data?.total || data?.pagination?.total || 0;

export const getTotalPages = (data) => data?.totalPages || data?.pagination?.totalPages || 1;

export const statusClass = (status) => {
  switch (status) {
    case 'Confirmed':
    case 'Completed':
      return 'crm-status-completed';
    case 'Planning':
      return 'crm-status-in-progress';
    case 'Proposal Sent':
      return 'crm-status-proposal-sent';
    case 'Proposal Pending':
    case 'On Hold':
      return 'crm-status-pending';
    case 'Cancelled':
      return 'crm-status-lost';
    default:
      return 'crm-status-default';
  }
};

export const paymentClass = (status) => {
  switch (status) {
    case 'Full Paid':
    case 'Advance Received':
      return 'crm-status-completed';
    case 'No Payment':
      return 'crm-status-lost';
    case 'Proposal Sent':
      return 'crm-status-proposal-sent';
    default:
      return 'crm-status-pending';
  }
};

export function MetricCard({ icon: Icon, label, value, caption, tone }) {
  const toneClass = {
    purple: 'bg-violet-500/10 text-violet-500',
    blue: 'bg-blue-500/10 text-blue-500',
    amber: 'bg-amber-500/10 text-amber-500',
    green: 'bg-emerald-500/10 text-emerald-500',
    red: 'bg-red-500/10 text-red-500',
    cyan: 'bg-cyan-500/10 text-cyan-500',
  }[tone] || 'bg-primary/10 text-primary';

  return (
    <Card className="crm-card">
      <CardContent className="flex min-h-[86px] items-center gap-4 p-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold leading-none text-foreground">
            {String(value ?? 0).padStart(2, '0')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function WidgetCard({ title, action, children }) {
  return (
    <Card className="crm-card">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function Field({ label, required, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

export function Section({ icon: Icon, title, action, children }) {
  return (
    <Card className="crm-card">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="crm-icon-soft flex h-9 w-9 items-center justify-center rounded-full">
              <Icon className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
          </div>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function FieldItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-foreground">{value || '-'}</p>
      </div>
    </div>
  );
}

export function SummaryCard({ icon: Icon, label, value }) {
  return (
    <Card className="crm-card">
      <CardContent className="flex min-h-[78px] items-center gap-3 p-4">
        <span className="crm-icon-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-base font-bold text-foreground">{value || '-'}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function EditBookingDialog({ open, onOpenChange, booking, employees, saving, onSave, mode }) {
  const [form, setForm] = useState(buildInitialEditForm(booking));
  const assignmentOnly = mode === 'assign-manager';

  const currentManager = booking?.assignedManager;
  const currentManagerId = currentManager?._id || currentManager?.id;
  const availableEmployees = currentManagerId
    && !employees.some((employee) => String(employee._id || employee.id) === String(currentManagerId))
    ? [{
      ...currentManager,
      _id: String(currentManagerId),
      name: currentManager.name || currentManager.employeeName || 'Assigned employee',
    }, ...employees]
    : employees;

  useEffect(() => {
    if (booking && open) setForm(buildInitialEditForm(booking));
  }, [booking, open]);

  const submit = (event) => {
    event.preventDefault();
    onSave(buildEditBookingPayload(form));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`flex max-h-[92vh] w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:rounded-xl ${assignmentOnly ? 'max-w-lg' : 'max-w-5xl'}`}>
        <DialogHeader className="border-b border-border bg-blue-50/40 px-4 py-3 pr-12 text-left dark:bg-blue-400/5">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-foreground">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300"><CalendarDays className="h-4 w-4" /></span>
            {assignmentOnly ? 'Assign Event Manager' : 'Edit Booking'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {assignmentOnly
              ? 'Select the employee responsible for managing this event.'
              : 'Update event details and assignment. Use Update Stage and Finance for workflow and payment changes.'}
          </DialogDescription>
        </DialogHeader>

        <EditBookingForm
          formId="edit-event-booking-form"
          showSubmitButton={false}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
          customers={booking?.customer ? [booking.customer] : []}
          employees={availableEmployees}
          value={form}
          setValue={setForm}
          saving={saving}
          onSubmit={submit}
          submitLabel="Save Changes"
          assignmentOnly={assignmentOnly}
        />

        <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-4 py-2.5 sm:space-x-0">
          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="edit-event-booking-form" size="sm" disabled={saving || !form.customer || !form.eventName?.trim() || !form.eventDate || (assignmentOnly && !form.assignedManager)} className="min-w-32 gap-2 bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : assignmentOnly ? 'Assign Manager' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StatusBadge({ status }) {
  return (
    <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-[11px] ${statusClass(status)}`}>
      {status || '-'}
    </Badge>
  );
}

export function PaymentBadge({ status }) {
  return (
    <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-[11px] ${paymentClass(status)}`}>
      {status || '-'}
    </Badge>
  );
}

export function StatusOverviewChart({ data }) {
  const overviewTotal = data.reduce((sum, item) => sum + (item.count || item.value || 0), 0);
  const pieData = data.map((item) => ({
    name: item._id || item.name,
    value: item.count || item.value || 0,
  }));
  const pieColors = ['#22c55e', '#3b82f6', '#a855f7', '#14b8a6', '#ef4444'];

  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} dataKey="value" innerRadius={34} outerRadius={52} paddingAngle={2}>
              {pieData.map((entry, index) => <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5 text-xs">
        {pieData.map((item) => (
          <div key={item.name} className="flex justify-between gap-2">
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-semibold text-foreground">
              {item.value} ({overviewTotal ? Math.round((item.value / overviewTotal) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
