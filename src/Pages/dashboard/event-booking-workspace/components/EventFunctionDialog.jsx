/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { CalendarPlus, Loader2 } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import { Checkbox } from '@components/components/ui/checkbox';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';

const statuses = ['Planned', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

const emptyForm = {
  name: '',
  date: '',
  startTime: '',
  endTime: '',
  venue: '',
  area: '',
  guestCount: '',
  linkedServices: [],
  status: 'Planned',
  notes: '',
};

const dateValue = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
};

const formFromFunction = (item) => item ? {
  name: item.name || '',
  date: dateValue(item.date),
  startTime: item.startTime || '',
  endTime: item.endTime || '',
  venue: item.venue || '',
  area: item.area || '',
  guestCount: item.guestCount ?? '',
  linkedServices: item.linkedServices || [],
  status: item.status || 'Planned',
  notes: item.notes || '',
} : emptyForm;

export default function EventFunctionDialog({ open, onOpenChange, item, services, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) setForm(formFromFunction(item));
  }, [item, open]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleService = (service, checked) => setForm((current) => ({
    ...current,
    linkedServices: checked
      ? [...new Set([...current.linkedServices, service])]
      : current.linkedServices.filter((value) => value !== service),
  }));

  const submit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      guestCount: Number(form.guestCount || 0),
      endTime: form.endTime || undefined,
      area: form.area || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-border bg-violet-50/60 px-5 py-4 pr-12 text-left dark:bg-violet-400/5">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300">
              <CalendarPlus className="h-4 w-4" />
            </span>
            {item ? 'Edit Function' : 'Add Function'}
          </DialogTitle>
          <DialogDescription className="text-xs">Add the function schedule, venue, guests and linked services.</DialogDescription>
        </DialogHeader>

        <form id="event-function-form" onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Function Name" required><Input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Haldi Ceremony" required /></Field>
            <Field label="Status"><Select value={form.status} onValueChange={(value) => update('status', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Date" required><Input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} required /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Time"><Input type="time" value={form.startTime} onChange={(event) => update('startTime', event.target.value)} /></Field>
              <Field label="End Time"><Input type="time" value={form.endTime} onChange={(event) => update('endTime', event.target.value)} /></Field>
            </div>
            <Field label="Venue"><Input value={form.venue} onChange={(event) => update('venue', event.target.value)} placeholder="Venue name" /></Field>
            <Field label="Area"><Input value={form.area} onChange={(event) => update('area', event.target.value)} placeholder="Lawn, hall, floor..." /></Field>
            <Field label="Expected Guests"><Input min="0" type="number" value={form.guestCount} onChange={(event) => update('guestCount', event.target.value)} placeholder="0" /></Field>
          </div>

          <Field label="Linked Services">
            {services.length ? (
              <div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
                {services.map((service) => (
                  <label key={service} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-xs hover:bg-muted/60">
                    <Checkbox checked={form.linkedServices.includes(service)} onCheckedChange={(checked) => toggleService(service, checked === true)} />
                    <span>{service}</span>
                  </label>
                ))}
              </div>
            ) : <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">Add services to the booking before linking them to a function.</p>}
          </Field>

          <Field label="Notes"><Textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Function-specific instructions" className="min-h-20" /></Field>
        </form>

        <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:space-x-0">
          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="event-function-form" size="sm" disabled={saving || !form.name.trim() || !form.date} className="min-w-28 bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {item ? 'Save Changes' : 'Add Function'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</Label>{children}</div>;
}
