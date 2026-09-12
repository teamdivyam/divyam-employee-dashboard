/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@components/components/ui/button';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';
import { clientCateringPreferences } from '../../../../validator/client.validator';

const bookingServiceOptions = ['Catering', 'D\u00e9cor', 'Hospitality', 'Wedding Planning', 'Complete Wedding Management', 'Service & Presentation', 'Other'];
const bookingFunctionOptions = ['Haldi', 'Mehndi', 'Sangeet', 'Wedding', 'Reception', 'Other'];
const requirementStatuses = ['Client Confirmed', 'Under Discussion', 'Tentative'];
const serviceLevels = ['Standard', 'Premium', 'Luxury', 'Custom'];
const emptyFunction = { name: '', date: '', time: '', venue: '', guests: '', services: [], status: 'Under Discussion' };
const emptyService = { name: '', summary: '', appliesTo: [], status: 'Under Discussion', level: 'Standard', note: '' };

function Field({ label, required, children, className = '' }) {
  return <div className={`space-y-1 ${className}`}><Label className="text-[10px] font-medium">{label}{required ? <span className="text-red-500"> *</span> : null}</Label>{children}</div>;
}

function ChoiceChips({ options, value = [], onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const selected = value.includes(option);
        return <button key={option} type="button" onClick={() => onChange(selected ? value.filter((item) => item !== option) : [...value, option])} className={`inline-flex h-7 items-center gap-1.5 rounded border px-2 text-[10px] font-medium ${selected ? 'border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300' : 'border-border bg-background text-foreground hover:bg-muted'}`}><span className={`grid h-3.5 w-3.5 place-items-center rounded-[3px] border ${selected ? 'border-violet-600 bg-violet-600 text-white' : 'border-input'}`}>{selected ? <Check className="h-2.5 w-2.5" /> : null}</span>{option}</button>;
      })}
    </div>
  );
}

export default function BookingRequirementsEditor({ value, onChange }) {
  const [functionIndex, setFunctionIndex] = useState(null);
  const [functionDraft, setFunctionDraft] = useState(emptyFunction);
  const [serviceIndex, setServiceIndex] = useState(null);
  const [serviceDraft, setServiceDraft] = useState(emptyService);
  const functions = value.functionDetails || [];
  const services = value.serviceDetails || [];

  const startFunction = (index = -1) => {
    setFunctionIndex(index);
    setFunctionDraft(index >= 0 ? { ...emptyFunction, ...functions[index] } : {
      ...emptyFunction,
      date: value.eventStartDate,
      venue: value.venue,
      guests: String(value.estimatedGuests || ''),
      services: value.selectedServices || [],
    });
  };
  const saveFunction = () => {
    if (!functionDraft.name) return toast.error('Function name is required.');
    const item = { ...functionDraft, venue: functionDraft.venue.trim(), guests: String(functionDraft.guests || '').trim() };
    const next = functionIndex >= 0 ? functions.map((entry, index) => index === functionIndex ? item : entry) : [...functions, item];
    onChange((current) => ({ ...current, functionDetails: next, ceremonies: next.map((entry) => entry.name) }));
    setFunctionIndex(null);
  };
  const removeFunction = (index) => {
    const removedName = functions[index]?.name;
    const next = functions.filter((_, itemIndex) => itemIndex !== index);
    onChange((current) => ({
      ...current,
      functionDetails: next,
      ceremonies: next.map((entry) => entry.name),
      serviceDetails: (current.serviceDetails || []).map((service) => ({ ...service, appliesTo: (service.appliesTo || []).filter((name) => name !== removedName) })),
    }));
  };

  const startService = (index = -1) => {
    setServiceIndex(index);
    setServiceDraft(index >= 0 ? { ...emptyService, ...services[index] } : { ...emptyService });
  };
  const saveService = () => {
    if (!serviceDraft.name) return toast.error('Service name is required.');
    const item = { ...serviceDraft, summary: serviceDraft.summary.trim(), note: serviceDraft.note.trim() };
    const next = serviceIndex >= 0 ? services.map((entry, index) => index === serviceIndex ? item : entry) : [...services, item];
    onChange((current) => ({ ...current, serviceDetails: next, selectedServices: Array.from(new Set(next.map((entry) => entry.name))) }));
    setServiceIndex(null);
  };
  const removeService = (index) => {
    const removedName = services[index]?.name;
    const next = services.filter((_, itemIndex) => itemIndex !== index);
    onChange((current) => ({
      ...current,
      serviceDetails: next,
      selectedServices: Array.from(new Set(next.map((entry) => entry.name))),
      functionDetails: (current.functionDetails || []).map((item) => ({ ...item, services: (item.services || []).filter((name) => name !== removedName) })),
    }));
  };

  return (
    <div className="grid gap-3 lg:col-span-4 lg:grid-cols-2">
      <section className="rounded-md border border-emerald-200 p-2.5 dark:border-emerald-400/30">
        <div className="flex items-start justify-between gap-2"><div><h4 className="text-[11px] font-semibold">Functions & Ceremonies</h4><p className="text-[9px] text-muted-foreground">Dates, venue, guests and required services.</p></div><Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-[10px]" onClick={() => startFunction()}><Plus className="h-3 w-3" />Add Function</Button></div>
        {functionIndex !== null ? <div className="mt-2 rounded border border-border bg-muted/10 p-2"><div className="grid gap-2 sm:grid-cols-2"><Field label="Function" required><Select value={functionDraft.name} onValueChange={(name) => setFunctionDraft((current) => ({ ...current, name }))}><SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Select function" /></SelectTrigger><SelectContent>{bookingFunctionOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><div className="grid grid-cols-2 gap-1.5"><Field label="Date"><Input type="date" className="h-7 text-[10px]" value={functionDraft.date || ''} onChange={(event) => setFunctionDraft((current) => ({ ...current, date: event.target.value }))} /></Field><Field label="Time"><Input type="time" className="h-7 text-[10px]" value={functionDraft.time || ''} onChange={(event) => setFunctionDraft((current) => ({ ...current, time: event.target.value }))} /></Field></div><Field label="Venue"><Input className="h-7 text-[10px]" value={functionDraft.venue} onChange={(event) => setFunctionDraft((current) => ({ ...current, venue: event.target.value }))} /></Field><Field label="Guests"><Input className="h-7 text-[10px]" value={functionDraft.guests} onChange={(event) => setFunctionDraft((current) => ({ ...current, guests: event.target.value }))} /></Field><Field label="Status"><Select value={functionDraft.status} onValueChange={(status) => setFunctionDraft((current) => ({ ...current, status }))}><SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger><SelectContent>{requirementStatuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Required Services" className="sm:col-span-2"><ChoiceChips options={bookingServiceOptions} value={functionDraft.services} onChange={(next) => setFunctionDraft((current) => ({ ...current, services: next }))} /></Field></div><div className="mt-2 flex justify-end gap-1"><Button type="button" variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setFunctionIndex(null)}>Cancel</Button><Button type="button" size="sm" className="h-7 text-[10px]" onClick={saveFunction}>{functionIndex >= 0 ? 'Update' : 'Add'}</Button></div></div> : null}
        <div className="mt-2 space-y-1">{functions.length ? functions.map((item, index) => <div key={item._id || `${item.name}-${index}`} className="flex items-center gap-2 rounded border border-border px-2 py-1.5"><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-semibold">{item.name}</p><p className="truncate text-[9px] text-muted-foreground">{item.date || 'Date pending'} Â· {item.venue || 'Venue pending'} Â· {item.guests || 0} guests</p></div><Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => startFunction(index)}><Pencil className="h-3 w-3" /></Button><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFunction(index)}><Trash2 className="h-3 w-3" /></Button></div>) : <p className="rounded border border-dashed p-3 text-center text-[10px] text-muted-foreground">No functions added.</p>}</div>
      </section>

      <section className="rounded-md border border-orange-200 p-2.5 dark:border-orange-400/30">
        <div className="flex items-start justify-between gap-2"><div><h4 className="text-[11px] font-semibold">Service Requirements</h4><p className="text-[9px] text-muted-foreground">Requirement, applicability, level and status.</p></div><Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-[10px]" onClick={() => startService()}><Plus className="h-3 w-3" />Add Service</Button></div>
        {serviceIndex !== null ? <div className="mt-2 rounded border border-border bg-muted/10 p-2"><div className="grid gap-2 sm:grid-cols-2"><Field label="Service" required><Select value={serviceDraft.name} onValueChange={(name) => setServiceDraft((current) => ({ ...current, name }))}><SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Select service" /></SelectTrigger><SelectContent>{bookingServiceOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Status"><Select value={serviceDraft.status} onValueChange={(status) => setServiceDraft((current) => ({ ...current, status }))}><SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger><SelectContent>{requirementStatuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Level"><Select value={serviceDraft.level} onValueChange={(level) => setServiceDraft((current) => ({ ...current, level }))}><SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger><SelectContent>{serviceLevels.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Applies To"><ChoiceChips options={functions.map((item) => item.name).filter(Boolean)} value={serviceDraft.appliesTo} onChange={(next) => setServiceDraft((current) => ({ ...current, appliesTo: next }))} /><p className="mt-0.5 text-[9px] text-muted-foreground">Empty means all functions.</p></Field><Field label="Summary" className="sm:col-span-2"><Input className="h-7 text-[10px]" maxLength={500} value={serviceDraft.summary} onChange={(event) => setServiceDraft((current) => ({ ...current, summary: event.target.value }))} /></Field><Field label="Special Note" className="sm:col-span-2"><Textarea className="min-h-12 text-[10px]" maxLength={500} value={serviceDraft.note} onChange={(event) => setServiceDraft((current) => ({ ...current, note: event.target.value }))} /></Field>{serviceDraft.name === 'Catering' ? <Field label="Catering Preference" className="sm:col-span-2"><Select value={value.cateringPreference || ''} onValueChange={(cateringPreference) => onChange((current) => ({ ...current, cateringPreference }))}><SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Select catering preference" /></SelectTrigger><SelectContent>{clientCateringPreferences.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field> : null}</div><div className="mt-2 flex justify-end gap-1"><Button type="button" variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setServiceIndex(null)}>Cancel</Button><Button type="button" size="sm" className="h-7 text-[10px]" onClick={saveService}>{serviceIndex >= 0 ? 'Update' : 'Add'}</Button></div></div> : null}
        <div className="mt-2 space-y-1">{services.length ? services.map((item, index) => <div key={item._id || `${item.name}-${index}`} className="flex items-center gap-2 rounded border border-border px-2 py-1.5"><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-semibold">{item.name} Â· {item.level}</p><p className="truncate text-[9px] text-muted-foreground">{item.summary || 'Summary pending'} Â· {item.appliesTo?.length ? item.appliesTo.join(', ') : 'All functions'}</p></div><Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => startService(index)}><Pencil className="h-3 w-3" /></Button><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeService(index)}><Trash2 className="h-3 w-3" /></Button></div>) : <p className="rounded border border-dashed p-3 text-center text-[10px] text-muted-foreground">No services added.</p>}</div>
      </section>
    </div>
  );
}
