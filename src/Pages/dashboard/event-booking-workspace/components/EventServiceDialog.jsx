/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Loader2, MapPin, Plus, UserRound, UtensilsCrossed } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@components/components/ui/avatar';
import { avatarUrl, bookingCode, eventDateLabel, initials } from '../eventBookingDashboard.utils';
import { StatusBadge } from './EventBookingComponents';
import { Button } from '@components/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import EventNameSelect from './EventNameSelect';
import { Label } from '@components/components/ui/label';
import { Textarea } from '@components/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { SERVICE_STATUSES, serviceIdOf, serviceFormValues, servicePayload } from '@/validator/event-service.validator';

export default function EventServiceDialog({ item, booking = {}, functions, leads, leadsLoading, leadsError, retryLeads, saving, onClose, onSave }) {
  const clientName = booking.customer?.name || booking.clientName || 'Client not available';
  const initial = useMemo(() => serviceFormValues(item || {}), [item]);
  const [form, setForm] = useState(initial);
  const serviceOptions = useMemo(() => [...new Set(['Catering', 'D\u00e9cor', 'Hospitality', 'Wedding Planning', 'Complete Wedding Management', 'Service & Presentation', ...(booking.servicesRequired || [])])].filter((name) => typeof name === 'string' && name.trim() && name !== 'Other'), [booking.servicesRequired]);
  const [errors, setErrors] = useState({});
  useEffect(() => { setForm(initial); setErrors({}); }, [initial]);
  const editing = Boolean(item?._id);
  const leadOptions = [...leads];
  if (initial.assignedLead && !leadOptions.some((lead) => serviceIdOf(lead) === initial.assignedLead)) {
    leadOptions.push({ _id: initial.assignedLead, name: item?.assignedLead?.name || 'Current assigned lead' });
  }
  const functionOptions = [...functions];
  initial.linkedFunctions.forEach((id) => {
    if (!functionOptions.some((fn) => serviceIdOf(fn) === id)) functionOptions.push({ _id: id, name: item?.linkedFunctions?.find((fn) => serviceIdOf(fn) === id)?.name || 'Linked function' });
  });
  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  };
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    try {
      const payload = await servicePayload(form, initial, editing);
      if (!Object.keys(payload).length) { setErrors({ form: 'Make a change before saving.' }); return; }
      onSave(payload);
    } catch (error) {
      if (error.name !== 'ValidationError') throw error;
      const issues = error.inner?.length ? error.inner : [error];
      setErrors(Object.fromEntries(issues.map((issue) => [issue.path || 'form', issue.message])));
    }
  };
  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[820px] flex-col gap-0 overflow-hidden rounded-lg p-0">
        <DialogHeader className="px-4 pb-3 pt-4 pr-12 text-left">
          <DialogTitle className="text-xl font-bold">{editing ? 'Edit Service' : 'Add Service'}</DialogTitle>
          <DialogDescription className="text-xs">{editing ? 'Update this service’s details and function links.' : 'Add a new service for this event. Services can be linked with functions and used in planning, costing and execution.'}</DialogDescription>
        </DialogHeader>
        <form id="event-service-form" onSubmit={submit} noValidate className="min-h-0 overflow-y-auto px-3 pb-1">
          <div className="mb-3 flex items-center gap-3 rounded-md border border-primary/10 bg-primary/[0.04] p-3">
<Avatar className="h-12 w-12 shrink-0 rounded-lg"><AvatarImage src={avatarUrl(booking.customer)} alt={clientName} /><AvatarFallback className="rounded-lg bg-primary/10 font-semibold text-primary">{initials(clientName)}</AvatarFallback></Avatar>
<div className="min-w-0 space-y-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{clientName}</p>{booking.bookingStatus && <StatusBadge status={booking.bookingStatus} />}</div><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{bookingCode(booking)}</span><span aria-hidden="true">&middot;</span><span>{booking.eventType || 'Event'}</span><span aria-hidden="true">&middot;</span><span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{eventDateLabel(booking, { includeWeekday: true })}</span></div><p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" />{[booking.venue, booking.city].filter(Boolean).join(', ') || 'Venue pending'}</p></div></div>
<fieldset disabled={saving} className="space-y-3"><section className="overflow-hidden rounded-md border border-primary/10"><SectionHeading number="1" title="Service Details" description="Enter the basic information for this service." /><div className="grid gap-x-5 gap-y-4 p-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs font-semibold" htmlFor="service-name">Service <span className="text-destructive">*</span></Label>
              <EventNameSelect id="service-name" label="Service name" options={serviceOptions} value={form.name} initialValue={initial.name} resetKey={item} onChange={(name) => update('name', name)} disabled={saving} error={errors.name} icon={UtensilsCrossed} />
              <p className="text-[11px] text-muted-foreground">Select the service.</p>
              {errors.name && <p id="service-name-error" role="alert" className="text-xs text-destructive">{errors.name}</p>}
            </div>
<div className="min-w-0 space-y-1.5"><Label id="service-functions-label" className="text-xs font-semibold">Applies To (Functions)</Label>
<div role="group" aria-labelledby="service-functions-label" className="flex flex-wrap gap-2">
  {functionOptions.map((fn) => {
    const id = serviceIdOf(fn);
    const selected = form.linkedFunctions.includes(id);
    return <Button key={id} type="button" variant="outline" size="sm" disabled={saving} aria-pressed={selected} onClick={() => update('linkedFunctions', selected ? form.linkedFunctions.filter((value) => value !== id) : [...form.linkedFunctions, id])} className={`inline-flex h-auto min-h-8 max-w-full whitespace-normal break-words px-3 py-1.5 text-xs font-normal ${selected ? 'border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary' : ''}`}>{fn.name}</Button>;
  })}
  {!functionOptions.length && <p className="text-xs text-muted-foreground">No functions available.</p>}
</div>
<p className="text-[11px] text-muted-foreground">Select the functions where this service will be used.</p>{Object.entries(errors).filter(([key, message]) => key.startsWith('linkedFunctions') && message).map(([key, message]) => <p key={key} role="alert" className="text-xs text-destructive">{message}</p>)}</div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs font-semibold" htmlFor="service-scope">Final Scope / Key Deliverables</Label>
              <Textarea rows={3} placeholder="e.g. 3 course menu, live counters, service staff, equipment, setup, cleanup etc." id="service-scope" className="min-h-16 text-xs font-normal md:text-xs" value={form.scope} onChange={(event) => update('scope', event.target.value)} /><div className="flex justify-between gap-3 text-[11px] text-muted-foreground"><p>Enter the key deliverables or final scope for this service.</p><span className="shrink-0">{form.scope.length} characters</span></div>
            </div>
</div></section><section className="overflow-hidden rounded-md border border-primary/10"><SectionHeading number="2" title="Planning Details" description="Assign a service lead and set the initial planning status." /><div className="grid gap-5 p-3 sm:grid-cols-2">            <div className="space-y-1">
              <Label className="text-xs font-semibold" htmlFor="service-lead">Service Lead <span className="font-normal text-muted-foreground">(Optional)</span></Label>
              <Select value={form.assignedLead || 'none'} disabled={saving} onValueChange={(value) => update('assignedLead', value === 'none' ? '' : value)}>
                <SelectTrigger id="service-lead" className="h-9 gap-2 text-xs font-normal"><UserRound className="h-4 w-4 shrink-0" /><span className="flex-1 text-left"><SelectValue /></span></SelectTrigger>
                <SelectContent><SelectItem value="none">Not assigned</SelectItem>{leadOptions.map((lead) => <SelectItem key={serviceIdOf(lead)} value={serviceIdOf(lead)} className="text-xs">{lead.name}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Select the team member responsible for this service.</p>{leadsLoading && <p className="text-xs text-muted-foreground">Loading leads...</p>}
              {leadsError && <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={retryLeads}>Unable to load leads. Retry</Button>}
              {errors.assignedLead && <p role="alert" className="text-xs text-destructive">{errors.assignedLead}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold" htmlFor="service-status">Planning Status <span className="text-destructive">*</span></Label>
              <Select value={form.status} disabled={saving} onValueChange={(value) => update('status', value)}>
                <SelectTrigger id="service-status" className="h-9 text-xs font-normal"><SelectValue /></SelectTrigger>
                <SelectContent>{SERVICE_STATUSES.map((status) => <SelectItem key={status} value={status} className="text-xs"><span className="inline-flex items-center gap-3"><span className={"h-2.5 w-2.5 rounded-full " + (status === "Client Confirmed" ? "bg-emerald-500" : status === "Under Discussion" ? "bg-amber-500" : "bg-violet-500")} />{status}</span></SelectItem>)}</SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Set the current planning status.</p>{errors.status && <p role="alert" className="text-xs text-destructive">{errors.status}</p>}
            </div>
</div></section></fieldset>
          {errors.form && <p role="alert" className="mt-3 text-xs text-destructive">{errors.form}</p>}
        </form>
        <DialogFooter className="flex-row justify-between gap-3 p-3 sm:justify-between">
          <Button variant="outline" className="h-9 px-6 text-sm" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button className="h-9 text-sm" type="submit" form="event-service-form" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{!saving && !editing && <Plus className="h-4 w-4" />}{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Service'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SectionHeading({ number, title, description }) {
 return <div className="flex items-center gap-3 bg-primary/[0.04] px-3 py-2"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">{number}</span><div><h3 className="text-base font-semibold leading-tight">{title}</h3><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div></div>;
}
