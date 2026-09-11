/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { ConciergeBell, Loader2 } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import { Checkbox } from '@components/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';

const statuses = ['Pending', 'In Planning', 'Finalised', 'Completed', 'Cancelled'];
const dateTimeValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const emptyForm = {
  requirement: '',
  appliesToFunctions: [],
  appliesToLabel: '',
  guestSegment: '',
  serviceStartAt: '',
  serviceWindow: '',
  owner: '',
  status: 'Pending',
  details: '',
};
const idOf = (value) => String(value?._id || value || '');
const formFromItem = (item) => item ? {
  requirement: item.requirement || '',
  appliesToFunctions: (item.appliesToFunctions || []).map(idOf).filter(Boolean),
  appliesToLabel: item.appliesToLabel || '',
  guestSegment: item.guestSegment || '',
  serviceStartAt: dateTimeValue(item.serviceStartAt),
  serviceWindow: item.serviceWindow || '',
  owner: idOf(item.owner),
  status: item.status || 'Pending',
  details: item.details || '',
} : emptyForm;

export default function EventHospitalityDialog({ open, onOpenChange, item, functions, employees, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);
  useEffect(() => { if (open) setForm(formFromItem(item)); }, [item, open]);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleFunction = (functionId, checked) => update('appliesToFunctions', checked ? [...new Set([...form.appliesToFunctions, functionId])] : form.appliesToFunctions.filter((value) => value !== functionId));
  const submit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      requirement: form.requirement.trim(),
      appliesToLabel: form.appliesToLabel.trim() || undefined,
      guestSegment: form.guestSegment.trim() || undefined,
      serviceStartAt: form.serviceStartAt || undefined,
      serviceWindow: form.serviceWindow.trim() || undefined,
      owner: form.owner || null,
      details: form.details.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-border bg-emerald-50/70 px-5 py-4 pr-12 text-left dark:bg-emerald-400/5"><DialogTitle className="flex items-center gap-3 text-lg"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700"><ConciergeBell className="h-4 w-4" /></span>{item?._id ? 'Edit Requirement' : 'Add Requirement'}</DialogTitle><DialogDescription className="text-xs">Assign hospitality work to functions and an accountable owner.</DialogDescription></DialogHeader>
        <form id="event-hospitality-form" onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Requirement" required><Input value={form.requirement} onChange={(event) => update('requirement', event.target.value)} placeholder="e.g. Welcome Desk" required /></Field>
            <Field label="Status"><Select value={form.status} onValueChange={(value) => update('status', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Guest Segment"><Input value={form.guestSegment} onChange={(event) => update('guestSegment', event.target.value)} placeholder="e.g. VIP Guests" /></Field>
            <Field label="Owner"><Select value={form.owner || 'unassigned'} onValueChange={(value) => update('owner', value === 'unassigned' ? '' : value)}><SelectTrigger><SelectValue placeholder="Choose owner" /></SelectTrigger><SelectContent><SelectItem value="unassigned">Team assigned later</SelectItem>{employees.map((employee) => <SelectItem key={employee._id} value={employee._id}>{employee.name}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Service Date & Time"><Input type="datetime-local" value={form.serviceStartAt} onChange={(event) => update('serviceStartAt', event.target.value)} /></Field>
            <Field label="Service Window"><Input value={form.serviceWindow} onChange={(event) => update('serviceWindow', event.target.value)} placeholder="e.g. Onwards or All Day" /></Field>
            <Field label="Custom Function Coverage"><Input value={form.appliesToLabel} onChange={(event) => update('appliesToLabel', event.target.value)} placeholder="e.g. All functions" /></Field>
          </div>
          <Field label="Applies To Functions">{functions.length ? <div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">{functions.map((fn) => { const id = idOf(fn); return <label key={id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-xs hover:bg-muted/60"><Checkbox checked={form.appliesToFunctions.includes(id)} onCheckedChange={(checked) => toggleFunction(id, checked === true)} />{fn.name}</label>; })}</div> : <p className="text-xs text-muted-foreground">No functions available.</p>}</Field>
          <Field label="Details"><Textarea value={form.details} onChange={(event) => update('details', event.target.value)} placeholder="Hospitality instructions" className="min-h-20" /></Field>
        </form>
        <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:space-x-0"><Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="event-hospitality-form" size="sm" disabled={saving || !form.requirement.trim()} className="min-w-28 bg-blue-600 hover:bg-blue-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{item?._id ? 'Save Changes' : 'Add Requirement'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</Label>{children}</div>;
}
