/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Loader2, UserRoundPlus } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import { Checkbox } from '@components/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';

const statuses = ['Pending', 'Confirmed', 'Declined', 'Maybe'];
const commonNeeds = ['VIP', 'Stay', 'Airport Pickup', 'Hotel Drop', 'Wheelchair', 'Elderly Assistance'];
const emptyForm = { name: '', contact: '', email: '', memberCount: 1, functions: [], rsvpStatus: 'Pending', hospitalityNeeds: [], customNeeds: '', notes: '' };
const idOf = (value) => String(value?._id || value || '');
const fromItem = (item) => {
  if (!item) return emptyForm;
  const needs = [...new Set([
    ...(item.hospitalityNeeds || []),
    ...(item.isVip ? ['VIP'] : []),
    ...(item.stayRequired ? ['Stay'] : []),
    ...(item.transportRequired && !(item.hospitalityNeeds || []).some((need) => /pickup|drop|transport|transfer/i.test(need)) ? ['Airport Pickup'] : []),
  ])];
  const customNeeds = [
    ...needs.filter((need) => !commonNeeds.includes(need)),
    item.specialRequirements,
  ].filter(Boolean);
  return {
    name: item.name || '', contact: item.contact || '', email: item.email || '', memberCount: item.memberCount || 1,
    functions: (item.functions || []).map(idOf).filter(Boolean), rsvpStatus: item.rsvpStatus || 'Pending',
    hospitalityNeeds: needs.filter((need) => commonNeeds.includes(need)), customNeeds: [...new Set(customNeeds)].join(', '), notes: item.notes || '',
  };
};

export default function EventGuestDialog({ open, onOpenChange, item, functions, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);
  useEffect(() => { if (open) setForm(fromItem(item)); }, [item, open]);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggle = (field, value, checked) => update(field, checked ? [...new Set([...form[field], value])] : form[field].filter((itemValue) => itemValue !== value));
  const submit = (event) => {
    event.preventDefault();
    const customNeeds = form.customNeeds.split(',').map((value) => value.trim()).filter(Boolean);
    const hospitalityNeeds = [...new Set([...form.hospitalityNeeds, ...customNeeds])];
    onSave({
      name: form.name.trim(), contact: form.contact.trim() || undefined, email: form.email.trim() || undefined,
      memberCount: Math.max(1, Number(form.memberCount || 1)), functions: form.functions, rsvpStatus: form.rsvpStatus,
      hospitalityNeeds, isVip: hospitalityNeeds.includes('VIP'), stayRequired: hospitalityNeeds.includes('Stay'), transportRequired: hospitalityNeeds.some((need) => /pickup|drop|transport|transfer/i.test(need)), specialRequirements: form.customNeeds.trim() || undefined, notes: form.notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-border bg-emerald-50/70 px-5 py-4 pr-12 text-left dark:bg-emerald-400/5"><DialogTitle className="flex items-center gap-3 text-lg"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700"><UserRoundPlus className="h-4 w-4" /></span>{item?._id ? 'Guest Details' : 'Add Guest'}</DialogTitle><DialogDescription className="text-xs">Manage family size, function attendance, RSVP and hospitality needs.</DialogDescription></DialogHeader>
        <form id="event-guest-form" onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Guest / Family Name" required><Input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Sharma Family" required /></Field><Field label="Members" required><Input type="number" min="1" value={form.memberCount} onChange={(event) => update('memberCount', event.target.value)} required /></Field><Field label="Mobile Number"><Input type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} pattern="[0-9]{10}" title="Enter a 10-digit mobile number" value={form.contact} onChange={(event) => update('contact', event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" /></Field><Field label="Email"><Input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="Email address" /></Field><Field label="RSVP Status"><Select value={form.rsvpStatus} onValueChange={(value) => update('rsvpStatus', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field></div>
          <Field label="Attending Functions">{functions.length ? <div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">{functions.map((fn) => { const id = idOf(fn); return <label key={id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-xs hover:bg-muted/60"><Checkbox checked={form.functions.includes(id)} onCheckedChange={(checked) => toggle('functions', id, checked === true)} />{fn.name}</label>; })}</div> : <p className="text-xs text-muted-foreground">No functions available.</p>}</Field>
          <Field label="Hospitality Needs"><div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-3">{commonNeeds.map((need) => <label key={need} className="flex cursor-pointer items-center gap-2 text-xs"><Checkbox checked={form.hospitalityNeeds.includes(need)} onCheckedChange={(checked) => toggle('hospitalityNeeds', need, checked === true)} />{need}</label>)}</div></Field>
          <Field label="Other Needs"><Input value={form.customNeeds} onChange={(event) => update('customNeeds', event.target.value)} placeholder="Comma separated" /></Field>
          <Field label="Notes"><Textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Guest-specific notes" className="min-h-20" /></Field>
        </form>
        <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:space-x-0"><Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="event-guest-form" size="sm" disabled={saving || !form.name.trim()} className="min-w-28 bg-blue-600 hover:bg-blue-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{item?._id ? 'Save Changes' : 'Add Guest'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</Label>{children}</div>;
}
