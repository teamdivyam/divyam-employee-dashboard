/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { useEffect, useState } from 'react';
import {
  Loader2,
  Save,
  UserRound,
} from 'lucide-react';
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

const idOf = (value) => String(value?._id || value || '');
const clientRequirementStatus = (status) => (
  ['Confirmed', 'Completed'].includes(status) ? 'Client Confirmed'
    : ['Client Confirmed', 'Under Discussion', 'Tentative'].includes(status) ? status
      : 'Under Discussion'
);

export const getBookingRequirementsCustomer = (booking) => {
  if (!booking) return null;
  const customer = booking.customer && typeof booking.customer === 'object' ? booking.customer : {};
  const customerFunctions = new Map((customer.functionDetails || []).map((item) => [
    String(item.name || '').trim().toLowerCase(),
    item,
  ]));
  const functionDetails = (booking.functions || []).map((item) => {
    const customerFunction = customerFunctions.get(String(item.name || '').trim().toLowerCase()) || {};
    return {
      ...customerFunction,
      _id: item._id || customerFunction._id,
      name: item.name || customerFunction.name || '',
      date: item.date || customerFunction.date || booking.eventDate,
      time: item.startTime || customerFunction.time || '',
      venue: item.venue || customerFunction.venue || booking.venue || '',
      guests: String(item.guestCount ?? customerFunction.guests ?? booking.guestCount ?? ''),
      services: item.linkedServices?.length ? item.linkedServices : customerFunction.services || [],
      status: customerFunction.status || clientRequirementStatus(item.status),
    };
  });
  const functionNamesById = new Map(functionDetails.map((item) => [idOf(item), item.name]));
  const customerServices = new Map((customer.serviceDetails || []).map((item) => [
    String(item.name || '').trim().toLowerCase(),
    item,
  ]));
  const selectedServices = booking.servicesSelected?.length
    ? booking.servicesSelected
    : (booking.servicesRequired || []).map((service) => ({ service }));
  const serviceDetails = selectedServices.map((item) => {
    const name = item.service || item.name || '';
    const customerService = customerServices.get(String(name).trim().toLowerCase()) || {};
    return {
      ...customerService,
      _id: item._id || customerService._id,
      name,
      summary: item.details ?? customerService.summary ?? '',
      appliesTo: customerService.appliesTo?.length
        ? customerService.appliesTo
        : (item.linkedFunctions || []).map((functionId) => functionNamesById.get(idOf(functionId))).filter(Boolean),
      status: customerService.status || clientRequirementStatus(item.status),
      level: item.category || customerService.level || 'Standard',
      note: item.notes ?? customerService.note ?? '',
    };
  });

  return {
    ...customer,
    _id: customer._id || booking.crmCustomerId,
    eventType: booking.eventType || customer.eventType || '',
    eventDate: booking.eventDate || customer.eventDate,
    eventEndDate: booking.eventEndDate || customer.eventEndDate || booking.eventDate,
    eventCity: booking.city || customer.eventCity || customer.clientCity || '',
    venue: booking.venue || customer.venue || '',
    guestRange: customer.guestRange || String(booking.guestCount || ''),
    ceremonies: functionDetails.map((item) => item.name).filter(Boolean),
    functionDetails,
    servicesInterested: serviceDetails.map((item) => item.name).filter(Boolean),
    serviceDetails,
    requirementSummary: booking.requirementSummary || customer.requirementSummary || '',
    assignedEmployee: booking.assignedManager || customer.assignedEmployee,
    leadStatus: customer.leadStatus || booking.bookingStatus,
  };
};

export const buildBookingRequirementsUpdate = (booking, requirements) => {
  const customer = booking?.customer && typeof booking.customer === 'object' ? booking.customer : {};
  const guestMatch = String(requirements.guestRange || booking?.guestCount || '').match(/[\d,]+/);
  const estimatedGuests = guestMatch ? Number(guestMatch[0].replace(/,/g, '')) : 0;
  const selectedServices = requirements.servicesInterested || [];
  const functions = (requirements.functionDetails || []).map((item) => ({
    name: item.name,
    date: item.date || requirements.eventDate || null,
    time: item.time || null,
    venue: item.venue || requirements.venue || null,
    guests: Number.parseInt(item.guests, 10) || estimatedGuests,
    services: item.services || [],
    status: item.status || 'Under Discussion',
  }));
  const formData = new FormData();
  const values = {
    customerId: booking?.crmCustomerId || customer._id,
    clientName: customer.name || booking?.clientName || '',
    primaryMobile: String(customer.phone || booking?.primaryMobile || '').replace(/\D/g, '').slice(-10),
    alternateMobile: String(customer.alternatePhone || '').replace(/\D/g, '').slice(-10),
    emailAddress: customer.email || '',
    clientCity: customer.clientCity || '',
    preferredContactMethod: customer.preferredContactMethod || 'WhatsApp',
    eventName: booking?.eventName,
    eventType: requirements.eventType,
    eventStartDate: requirements.eventDate,
    eventEndDate: requirements.eventEndDate || requirements.eventDate,
    eventCity: requirements.eventCity,
    venue: requirements.venue,
    estimatedGuests,
    guestRange: requirements.guestRange,
    selectedServices: JSON.stringify(selectedServices),
    ceremonies: JSON.stringify(requirements.ceremonies || []),
    functions: JSON.stringify(functions),
    serviceDetails: JSON.stringify(requirements.serviceDetails || []),
    requirementSummary: requirements.requirementSummary,
    budgetRange: requirements.budgetRange,
    preferredStyle: requirements.preferredStyle,
    decorPreference: requirements.decorPreference,
    cateringPreference: requirements.cateringPreference,
    preferenceNotes: JSON.stringify(requirements.preferenceNotes || []),
    requirementsStatus: requirements.requirementsStatus,
    bookingStatus: booking?.bookingStatus,
    totalAgreedValue: booking?.paymentSummary?.totalAmount ?? booking?.commercialTerms?.baseProposalValue ?? 0,
    advanceReceived: booking?.paymentSummary?.advanceAmount ?? 0,
    assignedEventManager: idOf(booking?.assignedManager),
    internalBookingNotes: booking?.internalBookingNotes || customer.internalNotes || '',
    bookingAction: 'requirements',
  };
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  return { formData };
};

export const getTotalRows = (data) =>
  data?.totalEvents || data?.totalBookings || data?.total || data?.pagination?.total || 0;

export const getTotalPages = (data) => data?.totalPages || data?.pagination?.totalPages || 1;

const statusClass = (status) => {
  switch (status) {
    case 'Confirmed':
    case 'Execution Ready':
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

const paymentClass = (status) => {
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

export function EditBookingDialog({ open, onOpenChange, booking, employees = [], saving, onSave }) {
  return (
    <AddBookingDialog
      open={open}
      onOpenChange={onOpenChange}
      booking={booking}
      customers={booking?.customer ? [booking.customer] : []}
      employees={employees}
      mode="edit"
      saving={saving}
      onSubmit={(formData) => onSave({ formData })}
    />
  );
}

export function AssignManagerDialog({ open, onOpenChange, booking, employees = [], saving, onSave }) {
  const [assignedManager, setAssignedManager] = useState('');
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
    if (open) setAssignedManager(String(currentManagerId || ''));
  }, [currentManagerId, open]);

  const submit = (event) => {
    event.preventDefault();
    onSave({ assignedManager });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-border bg-blue-50/40 px-4 py-3 pr-12 text-left dark:bg-blue-400/5">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-foreground">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300"><UserRound className="h-4 w-4" /></span>
            Assign Event Manager
          </DialogTitle>
          <DialogDescription className="text-xs">
            Select the employee responsible for managing this event.
          </DialogDescription>
        </DialogHeader>

        <form id="assign-event-manager-form" onSubmit={submit} className="space-y-2 px-4 py-4">
          <label className="text-xs font-semibold text-foreground" htmlFor="assigned-event-manager">Assigned Event Manager</label>
          <Select value={assignedManager} onValueChange={setAssignedManager}>
            <SelectTrigger id="assigned-event-manager"><SelectValue placeholder="Select event manager" /></SelectTrigger>
            <SelectContent>{availableEmployees.map((employee) => <SelectItem key={employee._id || employee.id} value={String(employee._id || employee.id)}>{employee.name || employee.employeeName || 'Unnamed employee'}</SelectItem>)}</SelectContent>
          </Select>
        </form>

        <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-4 py-2.5 sm:space-x-0">
          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="assign-event-manager-form" size="sm" disabled={saving || !assignedManager} className="min-w-32 gap-2 bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Assign Manager'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const bookingStatusLabel = (status) => status === 'Confirmed'
  ? 'Booking Confirmed'
  : status || 'Not set';

export function StatusBadge({ status }) {
  return (
    <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-[11px] ${statusClass(status)}`}>
      {bookingStatusLabel(status)}
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
