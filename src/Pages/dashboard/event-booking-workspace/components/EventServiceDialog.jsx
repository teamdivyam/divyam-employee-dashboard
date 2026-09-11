/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { ClipboardPlus, Loader2 } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import { Checkbox } from '@components/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';

const statuses = ['Pending', 'Active', 'In Progress', 'Confirmed', 'Completed', 'Cancelled'];
const emptyForm = { service: '', category: '', status: 'Pending', assignedLead: '', linkedFunctions: [], deliverablesText: '', details: '' };
const itemId = (value) => String(value?._id || value || '');

const formFromService = (item) => item ? {
  service: item.service || '',
  category: item.category || '',
  status: item.status || 'Pending',
  assignedLead: itemId(item.assignedLead),
  linkedFunctions: (item.linkedFunctions || []).map(itemId).filter(Boolean),
  deliverablesText: (item.deliverables || []).join(', '),
  details: item.details || '',
} : emptyForm;

export default function EventServiceDialog({ open, onOpenChange, item, functions, employees, serviceOptions, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) setForm(formFromService(item));
  }, [item, open]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleFunction = (functionId, checked) => setForm((current) => ({
    ...current,
    linkedFunctions: checked
      ? [...new Set([...current.linkedFunctions, functionId])]
      : current.linkedFunctions.filter((value) => value !== functionId),
  }));
  const submit = (event) => {
    event.preventDefault();
    onSave({
      service: form.service,
      category: form.category.trim() || undefined,
      status: form.status,
      assignedLead: form.assignedLead || null,
      linkedFunctions: form.linkedFunctions,
      deliverables: form.deliverablesText.split(',').map((value) => value.trim()).filter(Boolean),
      details: form.details.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-border bg-blue-50/70 px-5 py-4 pr-12 text-left dark:bg-blue-400/5">
          <DialogTitle className="flex items-center gap-3 text-lg"><span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300"><ClipboardPlus className="h-4 w-4" /></span>{item?._id ? 'Edit Service' : 'Add Service'}</DialogTitle>
          <DialogDescription className="text-xs">Set service coverage, deliverables, lead and planning status.</DialogDescription>
        </DialogHeader>

        <form id="event-service-form" onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Service" required><Select value={form.service} onValueChange={(value) => update('service', value)}><SelectTrigger><SelectValue placeholder="Choose service" /></SelectTrigger><SelectContent>{serviceOptions.map((service) => <SelectItem key={service} value={service}>{service}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Planning Status"><Select value={form.status} onValueChange={(value) => update('status', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Category"><Input value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="e.g. Food & Beverage" /></Field>
            <Field label="Service Lead"><Select value={form.assignedLead || 'unassigned'} onValueChange={(value) => update('assignedLead', value === 'unassigned' ? '' : value)}><SelectTrigger><SelectValue placeholder="Choose lead" /></SelectTrigger><SelectContent><SelectItem value="unassigned">Not assigned</SelectItem>{employees.map((employee) => <SelectItem key={employee._id} value={employee._id}>{employee.name}</SelectItem>)}</SelectContent></Select></Field>
          </div>

          <Field label="Applies To Functions">
            {functions.length ? <div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">{functions.map((item) => { const id = itemId(item); return <label key={id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-xs hover:bg-muted/60"><Checkbox checked={form.linkedFunctions.includes(id)} onCheckedChange={(checked) => toggleFunction(id, checked === true)} /><span>{item.name}</span></label>; })}</div> : <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">Add functions before linking service coverage.</p>}
          </Field>
          <Field label="Key Deliverables"><Input value={form.deliverablesText} onChange={(event) => update('deliverablesText', event.target.value)} placeholder="Buffet, beverages, live counters (comma separated)" /></Field>
          <Field label="Scope Details"><Textarea value={form.details} onChange={(event) => update('details', event.target.value)} placeholder="Final scope or special instructions" className="min-h-20" /></Field>
        </form>

        <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:space-x-0">
          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="event-service-form" size="sm" disabled={saving || !form.service} className="min-w-28 bg-blue-600 hover:bg-blue-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{item?._id ? 'Save Changes' : 'Add Service'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</Label>{children}</div>;
}
