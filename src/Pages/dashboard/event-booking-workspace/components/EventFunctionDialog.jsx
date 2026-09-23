/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Clock, Heart, Loader2, MapPin, Plus, UserRound } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@components/components/ui/avatar';
import { avatarUrl, bookingCode, eventDateLabel, initials } from '../eventBookingDashboard.utils';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';

import EventNameSelect from './EventNameSelect';
import { StatusBadge } from './EventBookingComponents';

const FUNCTION_NAMES = ['Haldi', 'Mehndi', 'Sangeet', 'Wedding', 'Reception'];

import { FUNCTION_STATUSES, functionFormValues, functionPayload } from '@/validator/event-function.validator';

export default function EventFunctionDialog({ item, booking, services, saving, onClose, onSave }) {
  const client = booking?.customer;
  const clientName = client?.name || booking?.clientName || 'Client not available';
  const editing = Boolean(item?._id);
  const initial = useMemo(() => functionFormValues(item || {}), [item]);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  useEffect(() => { setForm(initial); setErrors({}); }, [initial]);
  const options = [...new Set([...services, ...initial.linkedServices])];
  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  };
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    try {
      const payload = await functionPayload(form, initial, editing);
      if (!Object.keys(payload).length) { setErrors({ form: 'Make a change before saving.' }); return; }
      onSave(payload);
    } catch (error) {
      if (error.name !== 'ValidationError') throw error;
      const issues = error.inner?.length ? error.inner : [error];
      setErrors(Object.fromEntries(issues.map((issue) => [issue.path || 'form', issue.message])));
    }
  };
  const toggleService = (service) => update('linkedServices', form.linkedServices.includes(service) ? form.linkedServices.filter((value) => value !== service) : [...form.linkedServices, service]);
  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent aria-describedby={undefined} className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[700px] flex-col gap-0 overflow-hidden rounded-lg p-0">
        <DialogHeader className="px-4 pb-3 pt-4 pr-12 text-left">
          <DialogTitle className="text-xl font-bold">{editing ? 'Edit Function' : 'Add Function'}</DialogTitle>
        </DialogHeader>
        <form id="event-function-form" onSubmit={submit} noValidate className="min-h-0 space-y-3 overflow-y-auto px-4 pb-3">
          <div className="flex items-center gap-3 rounded-md border border-primary/10 bg-primary/[0.04] p-3">
            <Avatar className="h-14 w-14 shrink-0 rounded-lg"><AvatarImage src={avatarUrl(client)} alt={clientName} /><AvatarFallback className="rounded-lg bg-primary/10 font-semibold text-primary">{initials(clientName)}</AvatarFallback></Avatar>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{clientName}</p>{booking?.bookingStatus && <StatusBadge status={booking.bookingStatus} />}</div>
              <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground"><span>{bookingCode(booking || {})}</span><span aria-hidden="true">&middot;</span><span>{booking?.eventType || 'Event'}</span><span aria-hidden="true">&middot;</span><span>{eventDateLabel(booking || {}, { includeWeekday: true })}</span></div>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" />{[booking?.venue, booking?.city].filter(Boolean).join(', ') || 'Venue pending'}</p>
            </div>
          </div>
          <fieldset disabled={saving} className="grid min-w-0 gap-x-4 gap-y-3 sm:grid-cols-2">
            <Field id="function-name" label="Function Name" required error={errors.name}>
              <EventNameSelect id="function-name" label="Function name" options={FUNCTION_NAMES} value={form.name} initialValue={initial.name} resetKey={item} onChange={(name) => update('name', name)} disabled={saving} error={errors.name} icon={Heart} />
            </Field>
            <Field id="function-status" label="Status" error={errors.status}><Select value={form.status} onValueChange={(value) => update('status', value)} disabled={saving}><SelectTrigger id="function-status" className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{FUNCTION_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field>
            <Field id="function-fromDate" label="From Date" error={errors.fromDate}>
              <NativeScheduleInput label="From Date" id="function-fromDate" type="date" value={form.fromDate} max={form.toDate || undefined} disabled={saving} aria-invalid={Boolean(errors.fromDate)} aria-describedby={errors.fromDate ? "function-fromDate-error" : undefined} onChange={(event) => update('fromDate', event.target.value)} />
            </Field>
            <Field id="function-toDate" label="To Date" optional error={errors.toDate}><NativeScheduleInput label="To Date" id="function-toDate" type="date" value={form.toDate} min={form.fromDate || undefined} disabled={saving} aria-invalid={Boolean(errors.toDate)} aria-describedby={errors.toDate ? "function-toDate-error" : undefined} onChange={(event) => update('toDate', event.target.value)} /></Field>
            {['startTime', 'endTime'].map((key) => <Field key={key} id={'function-' + key} label={key === 'startTime' ? 'Start Time' : 'End Time'} optional={key === 'endTime'} error={errors[key]}>
              <NativeScheduleInput id={'function-' + key} label={key === 'startTime' ? 'Start Time' : 'End Time'} type="time" disabled={saving} value={form[key]} onChange={(event) => update(key, event.target.value)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? 'function-' + key + '-error' : undefined} />
            </Field>)}
            <Field id="function-venue" label="Venue" error={errors.venue}>
              <div className="relative"><MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="function-venue" list="function-venues" className="h-9 pl-9 text-xs font-normal md:text-xs" placeholder="Select or enter venue" value={form.venue} onChange={(event) => update('venue', event.target.value)} aria-invalid={Boolean(errors.venue)} /></div>
              <datalist id="function-venues">{[...new Set([booking?.venue, ...(booking?.functions || []).map((fn) => fn.venue)])].filter((venue) => typeof venue === 'string' && venue.trim()).map((venue) => <option key={venue} value={venue} />)}</datalist>
            </Field>
            <Field id="function-guestCount" label="Expected Guests" error={errors.guestCount}>
              <div className="relative"><UserRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="function-guestCount" type="number" min={0} step="any" className="h-9 pl-9 text-xs font-normal md:text-xs" value={form.guestCount} onChange={(event) => update('guestCount', event.target.value)} aria-invalid={Boolean(errors.guestCount)} /></div>
            </Field>
            <div className="min-w-0 space-y-1.5 sm:col-span-2">
              <Label id="function-services-label" className="text-xs font-semibold">Linked Services</Label>
              <div role="group" aria-labelledby="function-services-label" className="flex flex-wrap gap-2">
                {options.map((service) => {
                  const selected = form.linkedServices.includes(service);
                  return <Button key={service} type="button" variant="outline" size="sm" disabled={saving} aria-pressed={selected} onClick={() => toggleService(service)} className={`inline-flex h-auto min-h-8 max-w-full whitespace-normal break-words px-3 py-1.5 text-xs font-normal ${selected ? 'border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary' : ''}`}>
                    {service}
                  </Button>;
                })}
                {!options.length && <p className="text-xs text-muted-foreground">No event services available.</p>}
              </div>
              {errors.linkedServices && <p role="alert" className="text-xs text-destructive">{errors.linkedServices}</p>}
            </div>
          </fieldset>
          {errors.form && <p role="alert" className="text-xs text-destructive">{errors.form}</p>}
        </form>
        <DialogFooter className="shrink-0 flex-row justify-between border-t border-border px-4 py-3 sm:justify-between">
          <Button variant="outline" className="px-6" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" form="event-function-form" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : !editing && <Plus className="h-4 w-4" />}{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Function'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ id, label, required, optional, error, children }) {
  return <div className="min-w-0 space-y-1.5"><Label htmlFor={id} className="text-xs font-semibold">{label}{required && <span className="text-destructive"> *</span>}{optional && <span className="font-normal text-muted-foreground"> (Optional)</span>}</Label>{children}{error && <p id={id + '-error'} role="alert" className="text-xs text-destructive">{error}</p>}</div>;
}

function NativeScheduleInput({ type, label, disabled, ...props }) {
  const inputRef = useRef(null);
  const Icon = type === 'date' ? CalendarDays : Clock;
  const openPicker = () => {
    const input = inputRef.current;
    if (!input || input.matches(':disabled')) return;
    try { input.showPicker?.(); } catch { input.focus(); }
  };
  return <div className="relative">
    <Input {...props} ref={inputRef} type={type} disabled={disabled} className="h-9 pr-10 text-xs font-normal md:text-xs [&::-webkit-calendar-picker-indicator]:hidden" />
    <Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={'Show ' + label.toLowerCase() + ' picker'} className="absolute right-1 top-0.5 h-8 w-8 text-muted-foreground" onClick={() => { inputRef.current?.focus(); openPicker(); }}><Icon className="h-4 w-4" /></Button>
  </div>;
}

