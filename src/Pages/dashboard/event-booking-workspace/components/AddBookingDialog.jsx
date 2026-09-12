/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  FileText,
  Flag,
  IndianRupee,
  Loader2,
  Mail,
  MapPin,
  NotebookPen,
  Phone,
  Send,
  Upload,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import useCurrentEmployee from '@/hooks/useCurrentEmployee';
import { Avatar, AvatarFallback, AvatarImage } from '@components/components/ui/avatar';
import { Button } from '@components/components/ui/button';
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
import { Textarea } from '@components/components/ui/textarea';
import BookingRequirementsEditor from './BookingRequirementsEditor';

const eventTypes = ['Wedding', 'Reception', 'Engagement', 'Birthday', 'Corporate Event', 'Anniversary', 'Other'];
const bookingStatuses = ['Planning', 'Proposal Pending', 'Proposal Sent', 'Confirmed'];
const allowedProposal = /\.(pdf|doc|docx)$/i;
const allowedReference = /\.(pdf|doc|docx|png|jpe?g)$/i;
const maxFileSize = 10 * 1024 * 1024;

const initialForm = {
  clientName: '',
  primaryMobile: '',
  alternateMobile: '',
  emailAddress: '',
  clientCity: '',
  preferredContactMethod: 'WhatsApp',
  eventType: '',
  eventStartDate: '',
  eventEndDate: '',
  eventCity: '',
  venue: '',
  estimatedGuests: '',
  selectedServices: [],
  ceremonies: [],
  functionDetails: [],
  serviceDetails: [],
  cateringPreference: '',
  requirementSummary: '',
  bookingStatus: 'Confirmed',
  totalAgreedValue: '',
  advanceReceived: '',
  assignedEventManager: '',
  internalBookingNotes: '',
};

const toneClasses = {
  blue: ['border-blue-200 dark:border-blue-400/30', 'bg-blue-50/70 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300', 'bg-blue-600'],
  violet: ['border-violet-200 dark:border-violet-400/30', 'bg-violet-50/70 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300', 'bg-violet-600'],
  emerald: ['border-emerald-200 dark:border-emerald-400/30', 'bg-emerald-50/70 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300', 'bg-emerald-600'],
  amber: ['border-amber-200 dark:border-amber-400/30', 'bg-amber-50/70 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300', 'bg-amber-500'],
};

const formatCreatedOn = (value) => new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}).format(value);

const avatarUrl = (profileImage) => profileImage?.smallUrl
  || profileImage?.small
  || profileImage?.url
  || (typeof profileImage === 'string' ? profileImage : undefined);

const initials = (name) => String(name || '')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase();

const onlyDigits = (value) => value.replace(/\D/g, '').slice(0, 10);
const idOf = (value) => String(value?._id || value || '');
const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};
const formService = (service) => ({ Decor: 'D\u00e9cor', Planning: 'Wedding Planning' }[service] || service);

const getInitialForm = (booking) => {
  if (!booking) return initialForm;
  const customer = booking.customer && typeof booking.customer === 'object' ? booking.customer : {};
  const bookingFunctions = Array.isArray(booking.functions) && booking.functions.length
    ? booking.functions
    : (customer.functionDetails || customer.ceremonies || []).map((item) => (
      typeof item === 'string' ? { name: item } : item
    ));
  const bookingServices = Array.isArray(booking.servicesRequired) && booking.servicesRequired.length
    ? booking.servicesRequired
    : customer.servicesInterested || (customer.serviceDetails || []).map((item) => item.name);
  const selectedServices = bookingServices.map(formService);
  const requirementStatus = (status) => status === 'Confirmed'
    ? 'Client Confirmed'
    : ['Client Confirmed', 'Under Discussion', 'Tentative'].includes(status) ? status : 'Under Discussion';
  const functionDetails = bookingFunctions.map((item) => ({
    ...item,
    name: item?.name || '',
    date: toDateInput(item?.date || booking.eventDate),
    time: item?.time || item?.startTime || '',
    venue: item?.venue || booking.venue || '',
    guests: String(item?.guests ?? item?.guestCount ?? booking.guestCount ?? ''),
    services: (item?.services?.length ? item.services : item?.linkedServices?.length ? item.linkedServices : selectedServices).map(formService),
    status: requirementStatus(item?.status),
  }));
  const sourceServiceDetails = booking.servicesSelected?.length
    ? booking.servicesSelected
    : customer.serviceDetails || [];
  const serviceDetails = selectedServices.map((name) => {
    const detail = sourceServiceDetails.find((item) => formService(item?.service || item?.name) === name) || {};
    return {
      ...detail,
      name,
      summary: detail.summary || detail.details || '',
      appliesTo: detail.appliesTo || [],
      status: requirementStatus(detail.status),
      level: detail.level || detail.category || 'Standard',
      note: detail.note || detail.notes || '',
    };
  });
  return {
    ...initialForm,
    clientName: customer.name || booking.clientName || '',
    primaryMobile: onlyDigits(String(customer.phone || booking.primaryMobile || '')),
    alternateMobile: onlyDigits(String(customer.alternatePhone || '')),
    emailAddress: customer.email || '',
    clientCity: customer.clientCity || '',
    preferredContactMethod: customer.preferredContactMethod || 'WhatsApp',
    eventType: booking.eventType === 'Event' ? '' : booking.eventType || '',
    eventStartDate: toDateInput(booking.eventDate),
    eventEndDate: toDateInput(booking.eventEndDate || booking.eventDate),
    eventCity: booking.city || '',
    venue: booking.venue || '',
    estimatedGuests: booking.guestCount || '',
    selectedServices,
    ceremonies: functionDetails.map((item) => item.name).filter(Boolean),
    functionDetails,
    serviceDetails,
    cateringPreference: customer.cateringPreference || '',
    requirementSummary: booking.requirementSummary || customer.requirementSummary || '',
    bookingStatus: booking.bookingStatus || 'Confirmed',
    totalAgreedValue: booking.paymentSummary?.totalAmount || booking.commercialTerms?.baseProposalValue || '',
    advanceReceived: booking.paymentSummary?.advanceAmount || '',
    assignedEventManager: idOf(booking.assignedManager),
    internalBookingNotes: booking.internalBookingNotes || booking.notes || customer.internalNotes || '',
  };
};

const today = new Date().toISOString().split('T')[0];

function SectionCard({ number, title, tone, summary, expanded, onToggle, children }) {
  const [border, header, numberTone] = toneClasses[tone];
  return (
    <section className={`overflow-hidden rounded-md border ${border}`}>
      <button type="button" onClick={onToggle} className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left ${header}`}>
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${numberTone}`}>{number}</span>
        <span className="text-xs font-semibold">{title}</span>
        {summary ? <span className="ml-auto hidden max-w-[45%] truncate text-[10px] font-medium sm:block">{summary}</span> : <span className="ml-auto" />}
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>
      {expanded ? <div className="bg-background p-2.5">{children}</div> : null}
    </section>
  );
}

function Field({ label, required, icon: Icon, children, className = '' }) {
  return (
    <div className={`space-y-0.5 ${className}`}>
      <Label className="text-[10px] font-medium text-foreground">
        {label}{required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </Label>
      <div className="relative">
        {Icon ? <Icon className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3 w-3 -translate-y-1/2 text-muted-foreground" /> : null}
        {children}
      </div>
    </div>
  );
}

function UploadField({ label, required, file, accept, helper, onChange, onClear }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-medium text-foreground">
        {label}{required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </Label>
      <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-md border border-dashed border-input bg-muted/20 px-2.5 py-2 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-400/5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
          {file ? <FileText className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10px] font-medium text-foreground">{file?.name || (required ? 'Click to upload final proposal' : 'Click to upload document')}</span>
          <span className="block text-[8px] text-muted-foreground">{helper}</span>
        </span>
        {file ? (
          <button type="button" aria-label={`Remove ${file.name}`} onClick={(event) => { event.preventDefault(); onClear(); }} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <input type="file" accept={accept} className="hidden" onChange={(event) => { onChange(event.target.files?.[0] || null); event.target.value = ''; }} />
      </label>
    </div>
  );
}

const validateFile = (file, pattern, label) => {
  if (!file) return null;
  if (!pattern.test(file.name)) return `${label} has an unsupported file type.`;
  if (file.size > maxFileSize) return `${label} must be 10 MB or smaller.`;
  return null;
};

const buildRequest = ({ form, proposalFile, approvalFile, customerId, action }) => {
  const request = new FormData();
  const functions = form.functionDetails.map((detail) => ({
    name: detail.name,
    date: detail.date || form.eventStartDate || null,
    time: detail.time || null,
    venue: detail.venue || form.venue || null,
    guests: detail.guests || form.estimatedGuests || 0,
    services: detail.services || [],
    status: detail.status || 'Under Discussion',
  }));
  const values = {
    ...form,
    customerId,
    customer: customerId,
    selectedServices: JSON.stringify(form.selectedServices),
    ceremonies: JSON.stringify(form.ceremonies),
    functions: JSON.stringify(functions),
    serviceDetails: JSON.stringify(form.serviceDetails),
    bookingAction: action,
    eventName: `${form.clientName.trim()} ${form.eventType || 'Booking'}`,
  };
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && !Array.isArray(value)) request.append(key, value);
  });
  if (proposalFile) request.append('finalApprovedProposal', proposalFile);
  if (approvalFile) request.append('clientApprovalAttachment', approvalFile);
  return request;
};

export default function AddBookingDialog({ open, onOpenChange, employees = [], customers = [], booking = null, mode = 'create', saving = false, onSubmit }) {
  const { data: currentEmployee } = useCurrentEmployee();
  const isEditing = mode === 'edit';
  const [form, setForm] = useState(initialForm);
  const [proposalFile, setProposalFile] = useState(null);
  const [approvalFile, setApprovalFile] = useState(null);
  const [createdOn, setCreatedOn] = useState(new Date());
  const [expanded, setExpanded] = useState({ client: true, event: true, commercial: true, assignment: true });

  useEffect(() => {
    if (!open) return;
    setForm(getInitialForm(booking));
    setProposalFile(null);
    setApprovalFile(null);
    setCreatedOn(new Date(booking?.createdAt || Date.now()));
    setExpanded({ client: true, event: true, commercial: true, assignment: true });
  }, [booking, open]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const total = Number(form.totalAgreedValue || 0);
  const advance = Number(form.advanceReceived || 0);
  const pending = Math.max(0, total - advance);
  const matchedCustomer = useMemo(() => (
    form.primaryMobile.length === 10
      ? customers.find((customer) => String(customer.phone || '').replace(/\D/g, '').slice(-10) === form.primaryMobile)
      : null
  ), [customers, form.primaryMobile]);
  const selectedManager = employees.find((employee) => String(employee._id) === String(form.assignedEventManager));
  const statusOptions = Array.from(new Set([...bookingStatuses, ...(isEditing && form.bookingStatus ? [form.bookingStatus] : [])]));
  const inputClass = 'h-7 text-[11px] shadow-none';
  const iconInputClass = `${inputClass} pl-8`;
  const selectClass = 'h-7 text-[11px] shadow-none';

  const validate = (action) => {
    const proposalError = validateFile(proposalFile, allowedProposal, 'Final approved proposal');
    const approvalError = validateFile(approvalFile, allowedReference, 'Client approval attachment');
    if (proposalError || approvalError) return proposalError || approvalError;
    if (!form.clientName.trim()) return 'Client name is required.';
    if (form.primaryMobile.length !== 10) return 'Enter a valid 10-digit primary mobile number.';
    if (!(booking?.crmCustomerId || booking?.customer?._id || matchedCustomer?._id)) return 'Enter the mobile number of a client assigned to you.';
    if (form.alternateMobile && form.alternateMobile.length !== 10) return 'Enter a valid 10-digit alternate mobile number.';
    if (action === 'draft') return null;
    if (!form.eventType) return 'Event type is required.';
    if (!form.eventStartDate || !form.eventEndDate) return 'Event start and end dates are required.';
    if (form.eventEndDate < form.eventStartDate) return 'Event end date cannot be before the start date.';
    if (!form.serviceDetails.length) return 'Add at least one service.';
    if (!Number.isFinite(total) || total <= 0) return 'Total agreed value must be greater than zero.';
    if (!Number.isFinite(advance) || advance < 0 || advance > total) return 'Advance received must be between zero and the total agreed value.';
    if (!isEditing && !proposalFile) return 'Final approved proposal is required.';
    return null;
  };

  const submit = (action) => {
    const error = validate(action);
    if (error) {
      toast.error(error);
      return;
    }
    onSubmit(buildRequest({
      form,
      proposalFile,
      approvalFile,
      customerId: booking?.crmCustomerId || booking?.customer?._id || matchedCustomer?._id,
      action,
    }));
  };

  const eventSummary = [form.eventType, form.eventStartDate, form.eventCity].filter(Boolean).join(' â€¢ ');
  const commercialSummary = total > 0 ? `â‚¹${total.toLocaleString('en-IN')} â€¢ â‚¹${pending.toLocaleString('en-IN')} pending` : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95dvh] w-[calc(100vw-20px)] max-w-[800px] flex-col gap-0 overflow-hidden rounded-md border-border bg-background p-0 sm:max-w-[900px]">
        <DialogHeader className="border-b border-border px-4 py-2.5 pr-11 text-left">
          <DialogTitle className="text-lg font-bold text-foreground">{isEditing ? 'Edit Booking Details' : booking ? 'Continue Booking Setup' : 'Add Booking'}</DialogTitle>
          <DialogDescription className="text-[11px]">{isEditing ? 'Update client, event, commercial, attachment and assignment details.' : booking ? 'Complete the pending booking details, commercial confirmation and event assignment.' : 'Create a booking for an assigned client with commercial details, attachments and event assignment.'}</DialogDescription>
        </DialogHeader>

        <form id="add-booking-form" onSubmit={(event) => { event.preventDefault(); submit(isEditing ? 'update' : 'create'); }} className="min-h-0 overflow-y-auto px-4 py-2.5">
          <div className="space-y-2">
            <div className="grid gap-2 rounded-md border border-border bg-card p-2 sm:grid-cols-2">
              <div className="flex items-center gap-2 sm:border-r sm:border-border">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl(currentEmployee?.profileImage)} alt={currentEmployee?.name} />
                  <AvatarFallback className="bg-slate-900 text-[9px] font-semibold text-white">{initials(currentEmployee?.name) || 'ME'}</AvatarFallback>
                </Avatar>
                <div><p className="text-[9px] text-muted-foreground">Created By</p><p className="text-xs font-semibold text-foreground">{currentEmployee?.name || 'Current Employee'}</p><p className="text-[9px] text-muted-foreground">{currentEmployee?.accessRole || 'Employee'}</p></div>
              </div>
              <div className="flex items-center gap-2 sm:pl-2">
                <span className="grid h-7 w-7 place-items-center rounded bg-blue-50 text-blue-600 dark:bg-blue-400/10"><CalendarDays className="h-3.5 w-3.5" /></span>
                <div><p className="text-[9px] text-muted-foreground">Created On</p><p className="text-[11px] font-semibold text-foreground">{formatCreatedOn(createdOn)}</p></div>
              </div>
            </div>

            <SectionCard number="1" title="Client Information" tone="blue" summary={matchedCustomer ? `Existing Client â€¢ ${matchedCustomer.name}` : 'Enter assigned client mobile'} expanded={expanded.client} onToggle={() => setExpanded((current) => ({ ...current, client: !current.client }))}>
              <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2">
                <Field label="Client Name" required icon={UserRound}><Input className={iconInputClass} value={form.clientName} onChange={(event) => update('clientName', event.target.value)} placeholder="Enter client name" /></Field>
                <Field label="Primary Mobile" required><div className="flex"><span className="flex h-7 items-center rounded-l-md border border-r-0 border-input bg-muted/40 px-2.5 text-[11px]">+91</span><Input className="h-7 rounded-l-none pl-2.5 text-[11px] shadow-none" inputMode="numeric" value={form.primaryMobile} onChange={(event) => update('primaryMobile', onlyDigits(event.target.value))} placeholder="98765 43210" /></div></Field>
                <Field label="Alternate Mobile" icon={Phone}><Input className={iconInputClass} inputMode="numeric" value={form.alternateMobile} onChange={(event) => update('alternateMobile', onlyDigits(event.target.value))} placeholder="Enter alternate mobile" /></Field>
                <Field label="Email Address" icon={Mail}><Input className={iconInputClass} type="email" value={form.emailAddress} onChange={(event) => update('emailAddress', event.target.value)} placeholder="client@example.com" /></Field>
                <Field label="Client City" icon={MapPin}><Input className={iconInputClass} value={form.clientCity} onChange={(event) => update('clientCity', event.target.value)} placeholder="Enter client city" /></Field>
                <Field label="Preferred Contact Method" icon={Phone}><Select value={form.preferredContactMethod} onValueChange={(value) => update('preferredContactMethod', value)}><SelectTrigger className={`${selectClass} pl-8`}><SelectValue /></SelectTrigger><SelectContent>{['WhatsApp', 'Phone', 'Email'].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field>
              </div>
            </SectionCard>

            <SectionCard number="2" title="Event & Booking Details" tone="violet" summary={eventSummary} expanded={expanded.event} onToggle={() => setExpanded((current) => ({ ...current, event: !current.event }))}>
              <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Event Type" required icon={Flag} className="sm:col-span-2"><Select value={form.eventType} onValueChange={(value) => update('eventType', value)}><SelectTrigger className={`${selectClass} pl-8`}><SelectValue placeholder="Select event type" /></SelectTrigger><SelectContent>{eventTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Event Start Date" required icon={CalendarDays}><Input min={isEditing ? undefined : today} className={iconInputClass} type="date" value={form.eventStartDate} onChange={(event) => update('eventStartDate', event.target.value)} /></Field>
                <Field label="Event End Date" required icon={CalendarDays}><Input className={iconInputClass} type="date" min={form.eventStartDate || (isEditing ? undefined : today)} value={form.eventEndDate} onChange={(event) => update('eventEndDate', event.target.value)} /></Field>
                <Field label="Event City" icon={MapPin} className="sm:col-span-2"><Input className={iconInputClass} value={form.eventCity} onChange={(event) => update('eventCity', event.target.value)} placeholder="Enter event city" /></Field>
                <Field label="Venue / Location" icon={MapPin} className="sm:col-span-2"><Input className={iconInputClass} value={form.venue} onChange={(event) => update('venue', event.target.value)} placeholder="Enter venue or location" /></Field>
                <Field label="Estimated Guests" icon={Users} className="sm:col-span-2"><Input className={iconInputClass} min="0" step="1" type="number" value={form.estimatedGuests} onChange={(event) => update('estimatedGuests', event.target.value)} placeholder="Enter guest count" /></Field>
                <BookingRequirementsEditor value={form} onChange={setForm} />
                <Field label="Requirement Summary" className="sm:col-span-2 lg:col-span-4"><Textarea className="min-h-12 resize-none pr-14 text-[11px] shadow-none" maxLength={500} value={form.requirementSummary} onChange={(event) => update('requirementSummary', event.target.value)} placeholder="Summarise the booking requirements, special requests, or any other important details..." /><span className="pointer-events-none absolute bottom-1 right-2 text-[9px] text-muted-foreground">{form.requirementSummary.length}/500</span></Field>
              </div>
            </SectionCard>

            <SectionCard number="3" title="Commercial & Attachments" tone="emerald" summary={commercialSummary} expanded={expanded.commercial} onToggle={() => setExpanded((current) => ({ ...current, commercial: !current.commercial }))}>
              <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2">
                <Field label="Booking Status" required icon={Flag}><Select disabled={isEditing} value={form.bookingStatus} onValueChange={(value) => update('bookingStatus', value)}><SelectTrigger className={`${selectClass} pl-8`}><SelectValue /></SelectTrigger><SelectContent>{statusOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Total Agreed Value" required icon={IndianRupee}><Input className={iconInputClass} min="0" step="0.01" type="number" value={form.totalAgreedValue} onChange={(event) => update('totalAgreedValue', event.target.value)} placeholder="Enter total value" /></Field>
                <Field label="Advance Received" icon={IndianRupee}><Input className={iconInputClass} min="0" step="0.01" type="number" value={form.advanceReceived} onChange={(event) => update('advanceReceived', event.target.value)} placeholder="Enter advance amount" /></Field>
                <Field label="Pending Amount" icon={IndianRupee}><Input className={`${iconInputClass} bg-muted/50`} readOnly value={pending.toFixed(2)} /><span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground">Auto-calculated</span></Field>
                <UploadField label="Final Approved Proposal" required={!isEditing} file={proposalFile} accept=".pdf,.doc,.docx" helper={isEditing ? 'Optional replacement: PDF, DOC, DOCX (Max 10 MB)' : 'PDF, DOC, DOCX (Max 10 MB)'} onChange={setProposalFile} onClear={() => setProposalFile(null)} />
                <UploadField label="Client Approval / Reference Attachment" file={approvalFile} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" helper="PDF, DOC, DOCX, JPG, PNG (Max 10 MB)" onChange={setApprovalFile} onClear={() => setApprovalFile(null)} />
              </div>
            </SectionCard>

            <SectionCard number="4" title="Assignment & Notes" tone="amber" summary={selectedManager?.name ? `Assigned to ${selectedManager.name}` : ''} expanded={expanded.assignment} onToggle={() => setExpanded((current) => ({ ...current, assignment: !current.assignment }))}>
              <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2">
                <Field label="Assigned Event Manager (Optional)" icon={UserRound}><Select value={form.assignedEventManager} onValueChange={(value) => update('assignedEventManager', value)}><SelectTrigger className={`${selectClass} pl-8`}><SelectValue placeholder="Select event manager" /></SelectTrigger><SelectContent>{employees.map((employee) => <SelectItem key={employee._id} value={employee._id}>{employee.name}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Internal Booking Notes" icon={NotebookPen}><Textarea className="min-h-12 resize-none pl-8 pr-12 text-[11px] shadow-none" maxLength={500} value={form.internalBookingNotes} onChange={(event) => update('internalBookingNotes', event.target.value)} placeholder="Add internal notes, handover details or special instructions..." /><span className="pointer-events-none absolute bottom-1 right-2 text-[9px] text-muted-foreground">{form.internalBookingNotes.length}/500</span></Field>
              </div>
            </SectionCard>
          </div>
        </form>

        <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/20 px-4 py-2.5 sm:space-x-0">
          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          {!isEditing ? <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => submit('draft')} className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-400/30 dark:text-blue-300">Save Draft</Button> : null}
          <Button type="submit" form="add-booking-form" size="sm" disabled={saving} className="min-w-32 gap-2 bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : booking ? 'Complete Booking' : 'Create Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
