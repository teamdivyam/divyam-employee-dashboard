import { useEffect, useState } from 'react';
import {
  CalendarDays,
  ClipboardList,
  Loader2,
  Save,
  UserRound,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { Checkbox } from '@components/components/ui/checkbox';
import { Input } from '@components/components/ui/input';
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
import { Textarea } from '@components/components/ui/textarea';

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

export const servicesRequiredOptions = [
  'Catering',
  'Decor',
  'Hospitality',
  'Planning',
  'Furniture',
  'Tent / Lighting',
];

export const eventTypes = ['Wedding', 'Reception', 'Engagement', 'Birthday', 'Corporate Event'];
export const cities = ['Lucknow', 'Prayagraj', 'Varanasi', 'Kanpur', 'Bhadohi', 'Mirzapur', 'Delhi'];
export const functionOptions = [1, 2, 3, 4, 5];

export const initialBookingForm = {
  customer: '',
  eventName: '',
  eventType: '',
  eventDate: '',
  city: '',
  venue: '',
  guestCount: '',
  noOfFunctions: '',
  servicesRequired: [],
  assignedManager: '',
  notes: '',
};

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

export const toInputDate = (date) => {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
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

export const buildBookingPayload = (form) => ({
  customer: form.customer || undefined,
  eventName: form.eventName,
  eventType: form.eventType || undefined,
  eventDate: form.eventDate,
  city: form.city || undefined,
  venue: form.venue || undefined,
  guestCount: form.guestCount === '' ? undefined : Number(form.guestCount),
  noOfFunctions: form.noOfFunctions === '' ? undefined : Number(form.noOfFunctions),
  servicesRequired: form.servicesRequired || [],
  assignedManager: form.assignedManager || undefined,
  notes: form.notes || undefined,
});

export const buildInitialForm = (booking) => ({
  customer: booking?.customer?._id || booking?.customer || '',
  eventName: booking?.eventName || '',
  eventType: booking?.eventType || '',
  eventDate: toInputDate(booking?.eventDate),
  city: booking?.city || '',
  venue: booking?.venue || '',
  guestCount: booking?.guestCount ?? '',
  noOfFunctions: booking?.noOfFunctions ?? '',
  servicesRequired: booking?.servicesRequired || [],
  assignedManager: String(
    booking?.assignedManager?._id
      || booking?.assignedManager?.id
      || (typeof booking?.assignedManager === 'string' ? booking.assignedManager : ''),
  ),
  notes: booking?.notes || '',
});

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

const bookingSectionTones = {
  blue: 'border-blue-200 bg-blue-50/40 text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/5 dark:text-blue-300',
  violet: 'border-violet-200 bg-violet-50/40 text-violet-700 dark:border-violet-400/25 dark:bg-violet-400/5 dark:text-violet-300',
  emerald: 'border-emerald-200 bg-emerald-50/40 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/5 dark:text-emerald-300',
  amber: 'border-amber-200 bg-amber-50/40 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/5 dark:text-amber-300',
};

function BookingFormSection({ icon: Icon, title, tone, className = '', children }) {
  return (
    <section className={`rounded-lg border p-3 ${bookingSectionTones[tone]} ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-background/80 shadow-sm">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
      </div>
      <div className="text-foreground">{children}</div>
    </section>
  );
}

export function BookingForm({
  customers,
  employees,
  value,
  setValue,
  saving,
  onSubmit,
  submitLabel = 'Save Booking',
  formId,
  showSubmitButton = true,
  className = '',
}) {
  const update = (key, nextValue) => setValue((prev) => ({ ...prev, [key]: nextValue }));
  const selectCustomer = (customerId) => {
    const customer = customers.find((item) => String(item._id) === String(customerId));
    setValue((prev) => ({
      ...prev,
      customer: customerId,
      eventName: prev.eventName || customer?.eventTitle || customer?.eventType || '',
      eventType: prev.eventType || customer?.eventType || '',
      eventDate: prev.eventDate || toInputDate(customer?.eventDate),
      city: prev.city || customer?.eventCity || customer?.city || customer?.clientCity || '',
      venue: prev.venue || customer?.venue || '',
      guestCount: prev.guestCount || customer?.guests || '',
      noOfFunctions: prev.noOfFunctions || customer?.functions || customer?.functionDetails?.length || '',
      servicesRequired: prev.servicesRequired?.length
        ? prev.servicesRequired
        : customer?.servicesInterested || [],
      assignedManager: prev.assignedManager
        || customer?.assignedEmployee?._id
        || customer?.assignedEmployee
        || '',
    }));
  };
  const toggleService = (service) => {
    setValue((prev) => ({
      ...prev,
      servicesRequired: prev.servicesRequired.includes(service)
        ? prev.servicesRequired.filter((item) => item !== service)
        : [...prev.servicesRequired, service],
    }));
  };

  return (
    <form id={formId} className={`grid gap-3 lg:grid-cols-2 ${className}`} onSubmit={onSubmit}>
      <BookingFormSection icon={CalendarDays} title="Client & Event Details" tone="blue" className="lg:col-span-2">
        <div className="grid gap-2.5 md:grid-cols-3">
          <SelectField
            label="Select Client / Lead"
            required
            value={value.customer}
            onChange={selectCustomer}
            options={customers.map((customer) => ({
              label: `${customer.name}${customer.phone ? ` (${customer.phone})` : ''}`,
              value: customer._id,
            }))}
          />
          <FormInput label="Event Name" required value={value.eventName} onChange={(next) => update('eventName', next)} placeholder="Enter event name" />
          <SelectField label="Event Type" value={value.eventType} onChange={(next) => update('eventType', next)} options={eventTypes} />
          <FormInput label="Event Date" required type="date" value={value.eventDate} onChange={(next) => update('eventDate', next)} />
          <SelectField label="City" value={value.city} onChange={(next) => update('city', next)} options={cities} />
          <FormInput label="Venue" value={value.venue} onChange={(next) => update('venue', next)} placeholder="Enter venue name" />
        </div>
      </BookingFormSection>

      <BookingFormSection icon={ClipboardList} title="Planning Requirements" tone="violet">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <FormInput label="Guest Count" type="number" value={value.guestCount} onChange={(next) => update('guestCount', next)} placeholder="Enter guests" />
          <SelectField label="No. of Functions" value={String(value.noOfFunctions || '')} onChange={(next) => update('noOfFunctions', next)} options={functionOptions.map(String)} />
        </div>
        <div className="mt-3 border-t border-violet-200/70 pt-3 dark:border-violet-400/20">
          <ServiceSelector value={value.servicesRequired} onToggle={toggleService} />
        </div>
      </BookingFormSection>

      <BookingFormSection icon={UserRound} title="Event Assignment" tone="emerald">
        <div className="grid gap-2.5">
          <SelectField
            label="Assigned Event Manager"
            value={value.assignedManager}
            onChange={(next) => update('assignedManager', next)}
            options={employees.map((employee) => ({
              label: employee.name || employee.employeeName || 'Unnamed employee',
              value: String(employee._id || employee.id),
            }))}
          />
        </div>
      </BookingFormSection>

      <section className="rounded-lg border border-border bg-muted/20 p-3">
        <Field label="Notes">
          <Textarea className="crm-input min-h-[68px] resize-none text-xs" value={value.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Enter notes" />
        </Field>
      </section>

      {showSubmitButton ? (
        <Button
          type="submit"
          disabled={saving || !value.customer || !value.eventName?.trim() || !value.eventDate}
          className="crm-primary-button h-9 w-full text-xs font-semibold lg:col-span-2"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {submitLabel}
        </Button>
      ) : null}
    </form>
  );
}

export function FormInput({ label, value, onChange, type = 'text', required, placeholder, readOnly = false }) {
  return (
    <Field label={label} required={required}>
      <Input
        className={`crm-input h-8 text-xs ${readOnly ? 'cursor-not-allowed bg-muted/60 text-muted-foreground' : ''}`}
        type={type}
        required={required}
        value={value ?? ''}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );
}

export function SelectField({ label, value, onChange, options, required }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className="crm-input h-8 text-xs">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            const item = typeof option === 'string' ? { label: option, value: option } : option;
            return <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>;
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ServiceSelector({ value, onToggle }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold text-foreground">Services Required</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3">
        {servicesRequiredOptions.map((service) => (
          <label key={service} className="flex items-center gap-2 text-[11px] text-foreground">
            <Checkbox checked={value.includes(service)} onCheckedChange={() => onToggle(service)} />
            {service}
          </label>
        ))}
      </div>
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

export function EditBookingDialog({ open, onOpenChange, booking, employees, saving, onSave }) {
  const [form, setForm] = useState(buildInitialForm(booking));

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
    if (booking && open) setForm(buildInitialForm(booking));
  }, [booking, open]);

  const submit = (event) => {
    event.preventDefault();
    onSave(buildBookingPayload(form));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-border bg-blue-50/40 px-4 py-3 pr-12 text-left dark:bg-blue-400/5">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-foreground">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300"><CalendarDays className="h-4 w-4" /></span>
            Edit Booking
          </DialogTitle>
          <DialogDescription className="text-xs">Update event details and assignment. Use Update Stage and Finance for workflow and payment changes.</DialogDescription>
        </DialogHeader>

        <BookingForm
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
        />

        <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-4 py-2.5 sm:space-x-0">
          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="edit-event-booking-form" size="sm" disabled={saving || !form.customer || !form.eventName?.trim() || !form.eventDate} className="min-w-32 gap-2 bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
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
