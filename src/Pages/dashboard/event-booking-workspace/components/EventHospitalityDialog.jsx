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
const requirementTypes = ['Gift Hamper', 'Welcome Desk', 'Welcome Kit', 'Guest Assistance', 'VIP Hospitality', 'Refreshments', 'Other'];
const emptyForm = {
  requirementType: '', requirementName: '', functionAppliesTo: [], guestSegments: '',
  quantity: 1, units: '', location: '', serviceWindowFromDate: '', serviceWindowToDate: '',
  serviceWindowFromTime: '', serviceWindowToTime: '', planningOwner: '', planningStatus: 'Pending',
  specification: '', image: '',
};
const idOf = (value) => String(value?._id || value || '');
const formFromItem = (item) => item ? {
  requirementType: item.requirementType || '',
  requirementName: item.requirementName || item.requirement || '',
  functionAppliesTo: (item.functionAppliesTo || item.appliesToFunctions || []).map(idOf).filter(Boolean),
  guestSegments: item.guestSegments || item.guestSegment || '',
  quantity: item.quantity || 1,
  units: item.units || '',
  location: item.location || '',
  serviceWindowFromDate: String(item.serviceWindowFromDate || item.serviceStartAt || '').slice(0, 10),
  serviceWindowToDate: String(item.serviceWindowToDate || '').slice(0, 10),
  serviceWindowFromTime: item.serviceWindowFromTime || '',
  serviceWindowToTime: item.serviceWindowToTime || '',
  planningOwner: idOf(item.planningOwner || item.owner),
  planningStatus: item.planningStatus || item.status || 'Pending',
  specification: item.specification || item.details || '',
  image: item.image || '',
} : emptyForm;

export default function EventHospitalityDialog({ open, onOpenChange, item, functions, employees, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);
  useEffect(() => { if (open) setForm(formFromItem(item)); }, [item, open]);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleFunction = (functionId, checked) => update('functionAppliesTo', checked ? [...new Set([...form.functionAppliesTo, functionId])] : form.functionAppliesTo.filter((value) => value !== functionId));
  const submit = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      requirementName: form.requirementName.trim(),
      guestSegments: form.guestSegments.trim(),
      quantity: Number(form.quantity),
      units: form.units.trim(),
      location: form.location.trim(),
      planningOwner: form.planningOwner || null,
      specification: form.specification.trim(),
      image: form.image.trim(),
    };
    ['serviceWindowFromDate', 'serviceWindowToDate', 'serviceWindowFromTime', 'serviceWindowToTime'].forEach((field) => {
      if (!payload[field]) delete payload[field];
    });
    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-border bg-emerald-50/70 px-5 py-4 pr-12 text-left dark:bg-emerald-400/5"><DialogTitle className="flex items-center gap-3 text-lg"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700"><ConciergeBell className="h-4 w-4" /></span>{item?._id ? 'Edit Requirement' : 'Add Requirement'}</DialogTitle><DialogDescription className="text-xs">Assign hospitality work to functions and an accountable owner.</DialogDescription></DialogHeader>
        <form id="event-hospitality-form" onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Requirement Type" required><Select value={form.requirementType} onValueChange={(value) => update('requirementType', value)}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{requirementTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Requirement Name" required><Input value={form.requirementName} onChange={(event) => update('requirementName', event.target.value)} placeholder="e.g. Welcome Desk" required /></Field>
            <Field label="Guest Segment" required><Input value={form.guestSegments} onChange={(event) => update('guestSegments', event.target.value)} placeholder="e.g. VIP Guests" required /></Field>
            <Field label="Status" required><Select value={form.planningStatus} onValueChange={(value) => update('planningStatus', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Quantity" required><Input type="number" min="1" value={form.quantity} onChange={(event) => update('quantity', event.target.value)} required /></Field>
            <Field label="Units" required><Input value={form.units} onChange={(event) => update('units', event.target.value)} placeholder="Kits, pieces, persons" required /></Field>
            <Field label="Location" required><Input value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="Venue, desk, guest rooms" required /></Field>
            <Field label="Owner"><Select value={form.planningOwner || 'unassigned'} onValueChange={(value) => update('planningOwner', value === 'unassigned' ? '' : value)}><SelectTrigger><SelectValue placeholder="Choose owner" /></SelectTrigger><SelectContent><SelectItem value="unassigned">Team assigned later</SelectItem>{employees.map((employee) => <SelectItem key={employee._id} value={employee._id}>{employee.name}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="From Date"><Input type="date" value={form.serviceWindowFromDate} onChange={(event) => update('serviceWindowFromDate', event.target.value)} /></Field>
            <Field label="From Time"><Input type="time" value={form.serviceWindowFromTime} onChange={(event) => update('serviceWindowFromTime', event.target.value)} /></Field>
            <Field label="To Date"><Input type="date" min={form.serviceWindowFromDate || undefined} value={form.serviceWindowToDate} onChange={(event) => update('serviceWindowToDate', event.target.value)} /></Field>
            <Field label="To Time"><Input type="time" value={form.serviceWindowToTime} onChange={(event) => update('serviceWindowToTime', event.target.value)} /></Field>
          </div>
          <Field label="Applies To Functions" required>{functions.length ? <div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">{functions.map((fn) => { const id = idOf(fn); return <label key={id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-xs hover:bg-muted/60"><Checkbox checked={form.functionAppliesTo.includes(id)} onCheckedChange={(checked) => toggleFunction(id, checked === true)} />{fn.name}</label>; })}</div> : <p className="text-xs text-muted-foreground">No functions available.</p>}</Field>
          <Field label="Specification" required><Textarea maxLength={1000} value={form.specification} onChange={(event) => update('specification', event.target.value)} placeholder="Hospitality instructions" className="min-h-20" required /></Field>
          <Field label="Reference Image URL" required><Input type="url" value={form.image} onChange={(event) => update('image', event.target.value)} placeholder="https://..." required /></Field>
        </form>
        <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:space-x-0"><Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="event-hospitality-form" size="sm" disabled={saving || !form.requirementType || !form.requirementName.trim() || !form.functionAppliesTo.length || !form.guestSegments.trim() || !form.units.trim() || !form.location.trim() || !form.specification.trim() || !form.image.trim()} className="min-w-28 bg-blue-600 hover:bg-blue-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{item?._id ? 'Save Changes' : 'Add Requirement'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</Label>{children}</div>;
}
