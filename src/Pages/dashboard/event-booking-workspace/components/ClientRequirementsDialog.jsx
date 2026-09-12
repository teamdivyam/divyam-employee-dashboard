/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronRight,
  Coffee,
  FileText,
  Heart,
  Info,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

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

import {
  clientCateringPreferences,
  clientDecorPreferences,
} from '../../../../validator/client.validator';

const eventTypes = ['Wedding', 'Reception', 'Engagement', 'Birthday', 'Corporate Event', 'Anniversary', 'Other'];
const budgetOptions = ['Below â‚¹5L', 'â‚¹5L â€“ â‚¹8L', 'â‚¹8L â€“ â‚¹12L', 'â‚¹12L â€“ â‚¹25L', 'â‚¹25L+'];
const styleOptions = ['Luxury / Traditional', 'Royal / Heritage', 'Modern / Minimal', 'Floral / Pastel', 'Custom / To Be Discussed'];
const functionOptions = ['Haldi', 'Mehndi', 'Sangeet', 'Wedding', 'Reception', 'Other'];
const serviceOptions = ['Catering', 'DÃ©cor', 'Hospitality', 'Wedding Planning', 'Complete Wedding Management', 'Service & Presentation', 'Other'];
const functionStatuses = ['Client Confirmed', 'Under Discussion', 'Tentative'];
const serviceLevels = ['Standard', 'Premium', 'Luxury', 'Custom'];

const emptyFunction = {
  name: '', date: '', time: '', venue: '', guests: '', services: [], status: 'Under Discussion',
};
const emptyService = {
  name: '', summary: '', appliesTo: [], status: 'Under Discussion', level: 'Standard', note: '',
};

const sectionOptions = [
  { value: 'event', label: 'Event & Guests', icon: UserRound, tone: 'blue' },
  { value: 'functions', label: 'Functions', icon: Users, tone: 'emerald' },
  { value: 'services', label: 'Services', icon: Coffee, tone: 'orange' },
  { value: 'preferences', label: 'Preferences', icon: Heart, tone: 'pink' },
];

const tones = {
  blue: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-400/40 dark:bg-blue-400/10 dark:text-blue-300',
  emerald: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-300',
  orange: 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-400/40 dark:bg-orange-400/10 dark:text-orange-300',
  pink: 'border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-400/40 dark:bg-pink-400/10 dark:text-pink-300',
};

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const getFunctionDetails = (customer) => {
  const defaultVenue = customer?.venue || '';
  const defaultGuests = customer?.guestRange || (customer?.guests ? String(customer.guests) : '');
  const defaultServices = Array.isArray(customer?.servicesInterested) ? customer.servicesInterested : [];
  const defaultDate = toDateInput(customer?.eventDate);

  if (Array.isArray(customer?.functionDetails) && customer.functionDetails.length) {
    return customer.functionDetails.map((item) => ({
      ...item,
      _id: item._id || undefined,
      name: item.name || '',
      date: toDateInput(item.date) || defaultDate,
      time: item.time || '',
      venue: item.venue || defaultVenue,
      guests: item.guests || defaultGuests,
      services: Array.isArray(item.services) && item.services.length ? item.services : defaultServices,
      status: item.status || 'Under Discussion',
    }));
  }

  return (Array.isArray(customer?.ceremonies) ? customer.ceremonies : []).map((name) => ({
    ...emptyFunction,
    name,
    date: defaultDate,
    venue: defaultVenue,
    guests: defaultGuests,
    services: defaultServices,
  }));
};

const getServiceDetails = (customer) => {
  if (Array.isArray(customer?.serviceDetails) && customer.serviceDetails.length) {
    return customer.serviceDetails.map((item) => ({
      ...emptyService,
      ...item,
      _id: item._id || undefined,
      appliesTo: Array.isArray(item.appliesTo) ? item.appliesTo : [],
    }));
  }

  return (Array.isArray(customer?.servicesInterested) ? customer.servicesInterested : []).map((name) => ({
    ...emptyService,
    name,
    summary: name === 'Catering' ? customer?.cateringPreference || '' : '',
  }));
};

const getForm = (customer) => ({
  eventType: customer?.eventType || '',
  eventDate: toDateInput(customer?.eventDate),
  eventEndDate: toDateInput(customer?.eventEndDate || customer?.eventDate),
  venue: customer?.venue || '',
  eventCity: customer?.eventCity || customer?.city || '',
  guestRange: customer?.guestRange || (customer?.guests ? String(customer.guests) : ''),
  budgetRange: customer?.budgetRange || '',
  preferredStyle: customer?.preferredStyle || '',
  requirementSummary: customer?.requirementSummary || '',
  ceremonies: Array.isArray(customer?.ceremonies) ? customer.ceremonies : [],
  functionDetails: getFunctionDetails(customer),
  servicesInterested: Array.isArray(customer?.servicesInterested) ? customer.servicesInterested : [],
  serviceDetails: getServiceDetails(customer),
  decorPreference: customer?.decorPreference || '',
  cateringPreference: customer?.cateringPreference || '',
  preferenceNotes: Array.isArray(customer?.preferenceNotes) ? customer.preferenceNotes.join('\n') : '',
});

const eventLabel = (customer) => {
  const event = customer?.eventType || customer?.eventTitle || 'Event';
  const date = customer?.eventDate ? new Date(customer.eventDate) : null;
  if (!date || Number.isNaN(date.getTime())) return event;
  return `${event} â€“ ${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
};

function SummaryCard({ icon: Icon, label, value, tone = 'blue' }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tones[tone].split(' ').slice(1).join(' ')}`}>
        <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-xs font-semibold text-foreground">{value || '-'}</p>
      </div>
    </div>
  );
}

function Field({ label, required = false, children, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-[11px] font-semibold text-foreground">
        {label}{required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

function ChoiceChips({ options, value, onChange, compact = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? value.filter((item) => item !== option) : [...value, option])}
            className={`inline-flex items-center rounded-md border font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${compact ? 'h-7 gap-1.5 px-2 text-[10px]' : 'h-9 gap-2 px-3 text-[11px]'} ${selected ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-400/40 dark:bg-violet-400/10 dark:text-violet-300' : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <span className={`grid h-4 w-4 place-items-center rounded border ${selected ? 'border-violet-600 bg-violet-600 text-white' : 'border-input'}`}>
              {selected ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
            </span>
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function ClientRequirementsDialog({ open, onOpenChange, customer, onSubmit, isSaving = false, initialSection = 'event', startAddingFunction = false, startAddingService = false, initialFunctionId, initialFunctionName = '', initialServiceId, initialServiceName = '', functionsAndServicesOnly = false }) {
  const [activeSection, setActiveSection] = useState('event');
  const [form, setForm] = useState(() => getForm(customer));
  const [editingFunctionIndex, setEditingFunctionIndex] = useState(null);
  const [functionDraft, setFunctionDraft] = useState(emptyFunction);
  const [editingServiceIndex, setEditingServiceIndex] = useState(null);
  const [serviceDraft, setServiceDraft] = useState(emptyService);

  useEffect(() => {
    if (!open) return;
    const nextForm = getForm(customer);
    const initialFunctionIndex = initialFunctionId || initialFunctionName
      ? nextForm.functionDetails.findIndex((item) => (
        (initialFunctionId && String(item._id) === String(initialFunctionId))
        || (initialFunctionName && item.name === initialFunctionName)
      ))
      : -1;
    const initialServiceIndex = initialServiceId || initialServiceName
      ? nextForm.serviceDetails.findIndex((item) => (
        (initialServiceId && String(item._id) === String(initialServiceId))
        || (initialServiceName && item.name === initialServiceName)
      ))
      : -1;
    setForm(nextForm);
    setActiveSection(initialSection);
    setEditingFunctionIndex(initialFunctionIndex >= 0 ? initialFunctionIndex : initialSection === 'functions' && startAddingFunction ? -1 : null);
    setFunctionDraft(initialFunctionIndex >= 0 ? { ...nextForm.functionDetails[initialFunctionIndex] } : emptyFunction);
    setEditingServiceIndex(initialServiceIndex >= 0 ? initialServiceIndex : initialSection === 'services' && startAddingService ? -1 : null);
    setServiceDraft(initialServiceIndex >= 0 ? { ...nextForm.serviceDetails[initialServiceIndex] } : emptyService);
  }, [customer, initialFunctionId, initialFunctionName, initialSection, initialServiceId, initialServiceName, open, startAddingFunction, startAddingService]);

  const ownerName = useMemo(() => (
    typeof customer?.assignedEmployee === 'object'
      ? customer.assignedEmployee?.name
      : customer?.assignedEmployee
  ) || 'Unassigned', [customer?.assignedEmployee]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const startFunction = (index = -1) => {
    setEditingFunctionIndex(index);
    setFunctionDraft(index >= 0 ? { ...form.functionDetails[index] } : { ...emptyFunction });
  };

  const updateFunctionDraft = (field, value) => setFunctionDraft((current) => ({ ...current, [field]: value }));

  const saveFunction = () => {
    if (!functionDraft.name) {
      toast.error('Function name is required.');
      return;
    }
    const nextFunction = {
      ...functionDraft,
      date: functionDraft.date || null,
      time: functionDraft.time || null,
      venue: functionDraft.venue.trim(),
      guests: functionDraft.guests.trim(),
    };
    const nextFunctions = editingFunctionIndex >= 0
      ? form.functionDetails.map((item, index) => (index === editingFunctionIndex ? nextFunction : item))
      : [...form.functionDetails, nextFunction];
    update('functionDetails', nextFunctions);
    setEditingFunctionIndex(null);
    setFunctionDraft(emptyFunction);
  };

  const removeFunction = (index) => {
    update('functionDetails', form.functionDetails.filter((_, itemIndex) => itemIndex !== index));
    setEditingFunctionIndex(null);
    setFunctionDraft(emptyFunction);
  };

  const startService = (index = -1) => {
    setEditingServiceIndex(index);
    setServiceDraft(index >= 0 ? { ...form.serviceDetails[index] } : { ...emptyService });
  };

  const updateServiceDraft = (field, value) => setServiceDraft((current) => ({ ...current, [field]: value }));

  const saveService = () => {
    if (!serviceDraft.name) {
      toast.error('Service name is required.');
      return;
    }
    const nextService = {
      ...serviceDraft,
      summary: serviceDraft.summary.trim(),
      note: serviceDraft.note.trim(),
    };
    const nextServices = editingServiceIndex >= 0
      ? form.serviceDetails.map((item, index) => (index === editingServiceIndex ? nextService : item))
      : [...form.serviceDetails, nextService];
    update('serviceDetails', nextServices);
    setEditingServiceIndex(null);
    setServiceDraft(emptyService);
  };

  const removeService = (index) => {
    update('serviceDetails', form.serviceDetails.filter((_, itemIndex) => itemIndex !== index));
    setEditingServiceIndex(null);
    setServiceDraft(emptyService);
  };

  const submit = (requirementsStatus) => {
    if (requirementsStatus === 'Saved' && !form.eventType) {
      toast.error('Event type is required before saving requirements.');
      setActiveSection('event');
      return;
    }
    if (form.eventDate && form.eventEndDate && new Date(form.eventEndDate) < new Date(form.eventDate)) {
      toast.error('Event end date cannot be before the start date.');
      setActiveSection('event');
      return;
    }

    onSubmit({
      eventType: form.eventType || null,
      eventDate: form.eventDate || null,
      eventEndDate: form.eventEndDate || null,
      dateNotFinalised: !form.eventDate,
      venue: form.venue.trim() || null,
      eventCity: form.eventCity.trim() || null,
      guestRange: form.guestRange.trim() || null,
      budgetRange: form.budgetRange || null,
      preferredStyle: form.preferredStyle || null,
      requirementSummary: form.requirementSummary.trim() || null,
      ceremonies: form.functionDetails.map((item) => item.name).filter(Boolean),
      functionDetails: form.functionDetails.map((item) => ({
        ...(item._id ? { _id: item._id } : {}),
        name: item.name,
        date: item.date || null,
        time: item.time || null,
        venue: item.venue?.trim() || null,
        guests: item.guests?.trim() || null,
        services: item.services || [],
        status: item.status || 'Under Discussion',
      })),
      functions: form.functionDetails.length,
      servicesInterested: form.serviceDetails.map((item) => item.name).filter(Boolean),
      serviceDetails: form.serviceDetails.map((item) => ({
        ...(item._id ? { _id: item._id } : {}),
        name: item.name,
        summary: item.summary?.trim() || null,
        appliesTo: item.appliesTo || [],
        status: item.status || 'Under Discussion',
        level: item.level || 'Standard',
        note: item.note?.trim() || null,
      })),
      decorPreference: form.decorPreference || undefined,
      cateringPreference: form.cateringPreference || undefined,
      preferenceNotes: form.preferenceNotes.split('\n').map((note) => note.trim()).filter(Boolean),
      requirementsStatus,
    });
  };

  const inputClass = 'h-9 text-xs';
  const visibleSectionOptions = functionsAndServicesOnly
    ? sectionOptions.filter(({ value }) => value === 'functions' || value === 'services')
    : sectionOptions;
  const contextCards = [
    { label: 'Client', value: customer?.name, icon: UserRound, tone: 'blue' },
    { label: 'Event', value: eventLabel(customer), icon: CalendarDays, tone: 'blue' },
    { label: 'Owner', value: ownerName, icon: UserRound, tone: 'emerald' },
    { label: 'Status', value: customer?.leadStatus || 'New', icon: FileText, tone: 'blue' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12">
          <DialogTitle className="text-xl">Add / Edit Requirements</DialogTitle>
          <DialogDescription className="text-xs">Update event, function, service and preference details for this client.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {contextCards.map((item) => <SummaryCard key={item.label} {...item} />)}
          </div>

          <div role="tablist" aria-label="Requirement sections" className={`mt-4 grid gap-2 sm:grid-cols-2 ${functionsAndServicesOnly ? '' : 'lg:grid-cols-4'}`}>
            {visibleSectionOptions.map(({ value, label, icon: Icon, tone }) => {
              const count = value === 'functions' ? form.functionDetails.length : value === 'services' ? form.serviceDetails.length : null;
              const selected = activeSection === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveSection(value)}
                  className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${selected ? tones[tone] : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  {label}{count !== null ? ` (${count})` : ''}
                </button>
              );
            })}
          </div>

          <section role="tabpanel" className="mt-4 rounded-xl border border-border bg-card p-4">
            {activeSection === 'event' ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Event Type" required>
                  <Select value={form.eventType} onValueChange={(value) => update('eventType', value)}>
                    <SelectTrigger className={inputClass}><SelectValue placeholder="Select event type" /></SelectTrigger>
                    <SelectContent>{eventTypes.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Event Start Date"><Input type="date" className={inputClass} value={form.eventDate} onChange={(event) => update('eventDate', event.target.value)} /></Field>
                  <Field label="Event End Date"><Input type="date" className={inputClass} value={form.eventEndDate} min={form.eventDate || undefined} onChange={(event) => update('eventEndDate', event.target.value)} /></Field>
                </div>
                <Field label="Venue / Location"><Input className={inputClass} value={form.venue} onChange={(event) => update('venue', event.target.value)} placeholder="Venue name" /></Field>
                <Field label="Event City"><Input className={inputClass} value={form.eventCity} onChange={(event) => update('eventCity', event.target.value)} placeholder="City" /></Field>
                <Field label="Estimated Guests"><Input className={inputClass} value={form.guestRange} onChange={(event) => update('guestRange', event.target.value)} placeholder="e.g. 500 â€“ 600" /></Field>
                <Field label="Budget Range">
                  <Select value={form.budgetRange} onValueChange={(value) => update('budgetRange', value)}>
                    <SelectTrigger className={inputClass}><SelectValue placeholder="Select budget range" /></SelectTrigger>
                    <SelectContent>{budgetOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Preferred Style / Theme">
                  <Select value={form.preferredStyle} onValueChange={(value) => update('preferredStyle', value)}>
                    <SelectTrigger className={inputClass}><SelectValue placeholder="Select style" /></SelectTrigger>
                    <SelectContent>{styleOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Requirement Summary" className="md:col-span-2">
                  <div className="relative"><Textarea maxLength={500} className="min-h-20 resize-none pb-6 text-xs" value={form.requirementSummary} onChange={(event) => update('requirementSummary', event.target.value)} placeholder="Summarise the client's event expectations" /><span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">{form.requirementSummary.length}/500</span></div>
                </Field>
              </div>
            ) : null}

            {activeSection === 'functions' ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><h3 className="text-sm font-semibold text-foreground">Functions & Ceremonies</h3><p className="mt-1 text-xs text-muted-foreground">Manage event-wise dates, venues, guests and required services.</p></div>
                  <Button type="button" variant="outline" size="sm" onClick={() => startFunction()} className="h-8 gap-1.5 text-xs text-primary"><Plus className="h-3.5 w-3.5" aria-hidden="true" />Add Function</Button>
                </div>

                {form.functionDetails.length ? (
                  <div className="order-2 divide-y divide-border overflow-hidden rounded-lg border border-border">
                    {form.functionDetails.map((item, index) => (
                      <div key={item._id || `${item.name}-${index}`} className="grid gap-2 px-3 py-2.5 text-xs sm:grid-cols-[minmax(110px,0.8fr)_minmax(140px,1fr)_minmax(120px,0.9fr)_auto] sm:items-center">
                        <div><p className="font-semibold text-foreground">{item.name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{item.status}</p></div>
                        <p className="text-muted-foreground">{item.date || 'Date pending'}{item.time ? ` Â· ${item.time}` : ''}</p>
                        <p className="truncate text-muted-foreground">{item.venue || 'Venue pending'}</p>
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="ghost" size="icon" onClick={() => startFunction(index)} className="h-7 w-7" aria-label={`Edit ${item.name}`}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeFunction(index)} className="h-7 w-7 text-destructive hover:text-destructive" aria-label={`Remove ${item.name}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="order-2 rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">No functions added yet.</p>}

                {editingFunctionIndex !== null ? (
                  <div className="order-1 rounded-lg border border-border p-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Function" required><Select value={functionDraft.name} onValueChange={(value) => updateFunctionDraft('name', value)}><SelectTrigger className={inputClass}><SelectValue placeholder="Select function" /></SelectTrigger><SelectContent>{functionOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></Field>
                      <div className="grid grid-cols-2 gap-2"><Field label="Date"><Input type="date" className={inputClass} value={functionDraft.date || ''} onChange={(event) => updateFunctionDraft('date', event.target.value)} /></Field><Field label="Time"><Input type="time" className={inputClass} value={functionDraft.time || ''} onChange={(event) => updateFunctionDraft('time', event.target.value)} /></Field></div>
                      <Field label="Venue"><Input className={inputClass} value={functionDraft.venue} onChange={(event) => updateFunctionDraft('venue', event.target.value)} placeholder="Function venue" /></Field>
                      <Field label="Guests"><Input className={inputClass} value={functionDraft.guests} onChange={(event) => updateFunctionDraft('guests', event.target.value)} placeholder="e.g. 150 or 500 â€“ 600" /></Field>
                      <Field label="Status"><Select value={functionDraft.status} onValueChange={(value) => updateFunctionDraft('status', value)}><SelectTrigger className={inputClass}><SelectValue /></SelectTrigger><SelectContent>{functionStatuses.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></Field>
                      <Field label="Required Services" className="md:col-span-2"><ChoiceChips options={serviceOptions} value={functionDraft.services} onChange={(value) => updateFunctionDraft('services', value)} /></Field>
                    </div>
                    <div className="mt-3 flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setEditingFunctionIndex(null)}>Cancel</Button><Button type="button" size="sm" onClick={saveFunction}>{editingFunctionIndex >= 0 ? 'Update Function' : 'Add Function'}</Button></div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeSection === 'services' ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-semibold text-foreground">Service Requirements</h3><p className="mt-1 text-xs text-muted-foreground">Manage service-wise requirements, applicable functions and confirmation status.</p></div><Button type="button" variant="outline" size="sm" onClick={() => startService()} className="h-8 gap-1.5 text-xs text-primary"><Plus className="h-3.5 w-3.5" />Add Service</Button></div>

                {form.serviceDetails.length ? (
                  <div className="order-2 divide-y divide-border overflow-hidden rounded-lg border border-border">
                    {form.serviceDetails.map((item, index) => (
                      <div key={item._id || `${item.name}-${index}`} className="grid gap-2 px-3 py-2 text-[11px] sm:grid-cols-[minmax(110px,0.7fr)_minmax(180px,1.4fr)_minmax(120px,0.8fr)_auto] sm:items-center">
                        <div><p className="font-semibold text-foreground">{item.name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{item.level}</p></div>
                        <p className="line-clamp-2 text-muted-foreground">{item.summary || 'Summary pending'}</p>
                        <p className="text-muted-foreground">{item.appliesTo?.length ? item.appliesTo.join(', ') : 'All Functions'}</p>
                        <div className="flex justify-end gap-1"><Button type="button" variant="ghost" size="icon" onClick={() => startService(index)} className="h-7 w-7" aria-label={`Edit ${item.name}`}><Pencil className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" size="icon" onClick={() => removeService(index)} className="h-7 w-7 text-destructive hover:text-destructive" aria-label={`Remove ${item.name}`}><Trash2 className="h-3.5 w-3.5" /></Button></div>
                      </div>
                    ))}
                  </div>
                ) : <p className="order-2 rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">No services added yet.</p>}

                {editingServiceIndex !== null ? (
                  <div className="order-1 rounded-lg border border-border p-2.5">
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                      <Field label="Service Name" required><Select value={serviceDraft.name} onValueChange={(value) => updateServiceDraft('name', value)}><SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="Select service" /></SelectTrigger><SelectContent>{serviceOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></Field>
                      <Field label="Service Status"><Select value={serviceDraft.status} onValueChange={(value) => updateServiceDraft('status', value)}><SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger><SelectContent>{functionStatuses.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></Field>
                      <Field label="Service Level"><Select value={serviceDraft.level} onValueChange={(value) => updateServiceDraft('level', value)}><SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger><SelectContent>{serviceLevels.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></Field>
                      <Field label="Applies To"><ChoiceChips compact options={form.functionDetails.map((item) => item.name).filter(Boolean)} value={serviceDraft.appliesTo} onChange={(value) => updateServiceDraft('appliesTo', value)} /><p className="mt-0.5 text-[9px] text-muted-foreground">Empty means all functions.</p></Field>
                      <Field label="Service Summary" className="md:col-span-2"><Input className="h-8 text-[11px]" maxLength={500} value={serviceDraft.summary} onChange={(event) => updateServiceDraft('summary', event.target.value)} placeholder="Describe the service requirement" /></Field>
                      <Field label="Special Note" className="md:col-span-2"><div className="relative"><Textarea maxLength={500} className="min-h-14 resize-none pb-5 text-[11px]" value={serviceDraft.note} onChange={(event) => updateServiceDraft('note', event.target.value)} placeholder="Add a client-specific service note" /><span className="absolute bottom-1.5 right-2 text-[9px] text-muted-foreground">{serviceDraft.note.length}/500</span></div></Field>
                      {serviceDraft.name === 'Catering' ? <Field label="Catering Preference" className="md:col-span-2"><Select value={form.cateringPreference} onValueChange={(value) => update('cateringPreference', value)}><SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="Select catering preference" /></SelectTrigger><SelectContent>{clientCateringPreferences.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></Field> : null}
                    </div>
                    <div className="mt-2 flex justify-end gap-1.5"><Button type="button" variant="ghost" size="sm" className="h-8 text-[11px]" onClick={() => setEditingServiceIndex(null)}>Cancel</Button><Button type="button" size="sm" className="h-8 text-[11px]" onClick={saveService}>{editingServiceIndex >= 0 ? 'Update Service' : 'Add Service'}</Button></div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeSection === 'preferences' ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Preferred Style / Theme"><Select value={form.preferredStyle} onValueChange={(value) => update('preferredStyle', value)}><SelectTrigger className={inputClass}><SelectValue placeholder="Select style" /></SelectTrigger><SelectContent>{styleOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="DÃ©cor Preference"><Select value={form.decorPreference} onValueChange={(value) => update('decorPreference', value)}><SelectTrigger className={inputClass}><SelectValue placeholder="Select dÃ©cor preference" /></SelectTrigger><SelectContent>{clientDecorPreferences.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Catering Preference"><Select value={form.cateringPreference} onValueChange={(value) => update('cateringPreference', value)}><SelectTrigger className={inputClass}><SelectValue placeholder="Select catering preference" /></SelectTrigger><SelectContent>{clientCateringPreferences.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Preference Notes" className="md:col-span-2"><Textarea className="min-h-24 resize-none text-xs" value={form.preferenceNotes} onChange={(event) => update('preferenceNotes', event.target.value)} placeholder="Add one preference per line" /></Field>
              </div>
            ) : null}
          </section>

          <div className="mt-3 space-y-2">
            {visibleSectionOptions.filter(({ value }) => value !== 'event').map(({ value, label, icon: Icon, tone }) => {
              const summary = value === 'functions' ? `${form.functionDetails.length} functions added` : value === 'services' ? `${form.serviceDetails.length} services selected` : `${form.preferenceNotes.split('\n').filter((note) => note.trim()).length} notes added`;
              return (
                <button key={value} type="button" onClick={() => setActiveSection(value)} className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                  <span className={`grid h-7 w-7 place-items-center rounded-full ${tones[tone].split(' ').slice(1).join(' ')}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
                  <span className="w-24 text-xs font-semibold text-foreground">{label}</span>
                  <span className="flex-1 text-[11px] text-muted-foreground">{summary}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">Manage <ChevronRight className="h-4 w-4" aria-hidden="true" /></span>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter className="flex-row items-center border-t border-border bg-muted/30 px-5 py-3 sm:justify-between sm:space-x-0">
          <p className="hidden items-center gap-2 text-[11px] text-muted-foreground md:flex"><Info className="h-4 w-4" aria-hidden="true" />Changes will update the client requirements timeline.</p>
          <div className="ml-auto flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={() => submit('Draft')} className="border-primary text-primary hover:bg-primary/5">Save as Draft</Button>
            <Button type="button" size="sm" disabled={isSaving} onClick={() => submit('Saved')} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              Save Requirements
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
