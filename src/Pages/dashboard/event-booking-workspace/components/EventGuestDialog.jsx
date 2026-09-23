/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Loader2, Plus, MapPin } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import { Checkbox } from '@components/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@components/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@components/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';
import { avatarUrl, initials, bookingCode, eventDateLabel } from '../eventBookingDashboard.utils';
import { StatusBadge } from './EventBookingComponents';

const statuses = ['Pending', 'Confirmed', 'Declined', 'Maybe'];
const relations = ['Family', 'Relative', 'Friend', 'Colleague', 'Business Associate', 'Other'];
const emptyForm = { guestType: 'Individual', name: '', countryCode: '+91', contact: '', email: '', comingFrom: '', relationToClient: '', memberCount: 1, functions: [], rsvpStatus: 'Pending', isVip: false, stayRequired: false, transportRequired: false, specialRequirements: '' };
const idOf = (value) => String(value?._id || value || '');
const fromItem = (item = {}) => ({ ...emptyForm, ...Object.fromEntries(Object.keys(emptyForm).filter((key) => item[key] != null).map((key) => [key, item[key]])), guestType: item.guestType || (item.memberCount > 1 ? 'Family' : 'Individual'), functions: (item.functions || []).map(idOf), isVip: item.isVip ?? item.hospitalityNeeds?.includes('VIP') ?? false, stayRequired: item.stayRequired ?? item.hospitalityNeeds?.includes('Stay') ?? false, transportRequired: item.transportRequired ?? item.hospitalityNeeds?.some((need) => /pickup|drop|transport/i.test(need)) ?? false });

export default function EventGuestDialog({ open, onOpenChange, item, booking, functions, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  useEffect(() => { if (open) { setForm(fromItem(item || {})); setError(''); } }, [item, open]);
  const update = (key, value) => { setForm((current) => ({ ...current, [key]: value, ...(key === 'guestType' && value === 'Individual' ? { memberCount: 1 } : {}) })); setError(''); };
  const submit = (event) => {
    event.preventDefault();
    if (saving) return;
    if (!form.functions.length) return setError('Select at least one function.');
    const digits = form.contact.replace(/\D/g, '');
    if (form.countryCode === '+91' ? !(digits.length === 10 || (digits.length === 12 && digits.startsWith('91'))) : digits.length < 7 || digits.length + form.countryCode.length - 1 > 15) return setError('Enter a valid mobile number for the country code.');
    const payload = { ...form, memberCount: form.guestType === 'Individual' ? 1 : Number(form.memberCount) };
    Object.keys(payload).forEach((key) => { if (typeof payload[key] === 'string') payload[key] = payload[key].trim(); });
    if (!payload.name || !/^[+\d\s()-]+$/.test(payload.contact)) return setError('Enter a name and valid mobile number.');
    if (!Number.isInteger(payload.memberCount) || payload.memberCount < 1) return setError('Member count must be a positive integer.');
    if (item?._id) {
      const initial = fromItem(item);
      const changes = Object.fromEntries(Object.entries(payload).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(initial[key])));
      if (!Object.keys(changes).length) return setError('Make a change before saving.');
      onSave(changes);
    } else onSave(payload);
  };
  const clientName = booking?.customer?.name || booking?.clientName || 'Client';
  return <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
    <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-1.5rem)] max-w-[840px] flex-col gap-0 overflow-hidden rounded-lg p-0">
      <DialogHeader className="px-4 pb-3 pt-4 pr-12 text-left"><DialogTitle className="text-xl font-bold">{item?._id ? 'Edit Guest' : 'Add Guest'}</DialogTitle><DialogDescription className="text-xs">Add a guest or family to this event. Guest details will be used for RSVP, hospitality and logistics.</DialogDescription></DialogHeader>
      <form id="event-guest-form" onSubmit={submit} className="min-h-0 space-y-3 overflow-y-auto px-3 pb-3">
        <div className="flex items-center gap-3 rounded-md border border-primary/10 bg-primary/[0.04] p-3"><Avatar className="h-12 w-12 rounded-md"><AvatarImage src={avatarUrl(booking?.customer)} /><AvatarFallback className="rounded-md bg-primary/10 font-semibold text-primary">{initials(clientName)}</AvatarFallback></Avatar><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{clientName}</p>{booking?.bookingStatus && <StatusBadge status={booking.bookingStatus} />}</div><p className="mt-1 text-[11px] text-muted-foreground">{bookingCode(booking || {})} &middot; {booking?.eventType || 'Event'} &middot; {eventDateLabel(booking || {}, { includeWeekday: true })}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" />{[booking?.venue, booking?.city].filter(Boolean).join(', ') || 'Venue pending'}</p></div></div>
        <fieldset disabled={saving} className="space-y-3 [&_input]:h-9 [&_input]:text-xs [&_button[role=combobox]]:h-9 [&_button[role=combobox]]:text-xs">
          <Section number="1" title="Guest Details" description="Enter the basic information of the guest.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="guest-type" label="Guest Type" required><RadioGroup id="guest-type" value={form.guestType} onValueChange={(value) => update('guestType', value)} className="flex h-9 items-center gap-3 rounded-md border border-input px-3">{['Individual', 'Family'].map((value) => <label key={value} className="flex items-center gap-2 text-xs"><RadioGroupItem value={value} disabled={saving} />{value}</label>)}</RadioGroup></Field>
              <Field id="guest-name" label="Full Name" required><Input id="guest-name" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Amit Sharma" required /></Field>
              <Field id="guest-contact" label="Mobile Number" required><div className="flex gap-1"><Input aria-label="Country code" className="w-16 shrink-0" value={form.countryCode} pattern="\+[1-9][0-9]{0,2}" onChange={(event) => update('countryCode', event.target.value)} required /><Input id="guest-contact" type="tel" value={form.contact} onChange={(event) => update('contact', event.target.value)} placeholder="98765 43210" required /></div></Field>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field id="guest-email" label="Email" optional><Input id="guest-email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="e.g. amit.sharma@email.com" /></Field>
              <Field id="guest-from" label="Coming From" optional><Input id="guest-from" value={form.comingFrom} onChange={(event) => update('comingFrom', event.target.value)} placeholder="e.g. Delhi, Mumbai" /></Field>
              <Field id="guest-relation" label="Relation to Client" optional><Select value={form.relationToClient || 'none'} onValueChange={(value) => update('relationToClient', value === 'none' ? '' : value)} disabled={saving}><SelectTrigger id="guest-relation"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Select relation</SelectItem>{[...new Set([...relations, form.relationToClient].filter(Boolean))].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></Field>
              <Field id="guest-vip" label="VIP Guest?" required><RadioGroup id="guest-vip" value={String(form.isVip)} onValueChange={(value) => update('isVip', value === 'true')} className="flex h-9 items-center gap-4 rounded-md border border-input px-3">{[['true', 'Yes'], ['false', 'No']].map(([value, label]) => <label key={value} className="flex items-center gap-2 text-xs"><RadioGroupItem value={value} disabled={saving} />{label}</label>)}</RadioGroup></Field>
            </div>
          </Section>
          <Section number="2" title="Event & RSVP" description="Select the functions the guest will attend and RSVP status.">
            <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr_1fr]">
              <Field id="guest-functions" label="Functions" required><div id="guest-functions" className="grid grid-cols-2 gap-2 rounded-md border border-border p-2">{functions.map((fn) => <label key={idOf(fn)} className="flex items-center gap-2 text-xs"><Checkbox disabled={saving} checked={form.functions.includes(idOf(fn))} onCheckedChange={(checked) => update('functions', checked ? [...form.functions, idOf(fn)] : form.functions.filter((id) => id !== idOf(fn)))} />{fn.name}</label>)}{!functions.length && <p className="col-span-2 text-xs text-muted-foreground">Add a function to this event first.</p>}</div></Field>
              <Field id="guest-rsvp" label="RSVP Status" required><Select value={form.rsvpStatus} onValueChange={(value) => update('rsvpStatus', value)} disabled={saving}><SelectTrigger id="guest-rsvp"><SelectValue /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field>
              <Field id="guest-members" label="No. of Members" required><Input id="guest-members" type="number" min="1" step="1" value={form.memberCount} readOnly={form.guestType === 'Individual'} onChange={(event) => update('memberCount', event.target.value)} required /><p className="text-[10px] text-muted-foreground">For individual guest, this will be 1.</p></Field>
            </div>
          </Section>
          <Section number="3" title="Hospitality Needs" description="Add stay, transport or any specific requirements for this guest."><div className="grid gap-4 sm:grid-cols-[1fr_1fr_1.8fr]">{[['stayRequired', 'Stay Required'], ['transportRequired', 'Transport Required']].map(([key, label]) => <Field key={key} id={'guest-' + key} label={label} required><Select value={String(form[key])} onValueChange={(value) => update(key, value === 'true')} disabled={saving}><SelectTrigger id={'guest-' + key}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="false">No</SelectItem><SelectItem value="true">Yes</SelectItem></SelectContent></Select></Field>)}<Field id="guest-special" label="Special Requirements" optional><Textarea id="guest-special" value={form.specialRequirements} onChange={(event) => update('specialRequirements', event.target.value)} maxLength={200} rows={2} className="min-h-14 text-xs md:text-xs" placeholder="e.g. wheelchair, baby seat, preferred room type, dietary preference" /><p className="text-right text-[10px] text-muted-foreground">{form.specialRequirements.length}/200</p></Field></div></Section>
        </fieldset>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      </form>
      <DialogFooter className="shrink-0 flex-row justify-between border-t border-border p-3 sm:justify-between"><Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="event-guest-form" disabled={saving || !functions.length}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{item?._id ? 'Save Changes' : 'Add Guest'}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
function Field({ id, label, required, optional, children }) { return <div className="min-w-0 space-y-1.5"><Label htmlFor={id} className="text-[11px] font-semibold">{label}{required && <span className="text-destructive"> *</span>}{optional && <span className="font-normal text-muted-foreground"> (Optional)</span>}</Label>{children}</div>; }
function Section({ number, title, description, children }) { return <section className="overflow-hidden rounded-md border border-primary/10"><div className="flex items-center gap-3 bg-primary/[0.04] px-3 py-2"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">{number}</span><div><h3 className="text-sm font-semibold">{title}</h3><p className="text-[11px] text-muted-foreground">{description}</p></div></div><div className="p-3">{children}</div></section>; }

