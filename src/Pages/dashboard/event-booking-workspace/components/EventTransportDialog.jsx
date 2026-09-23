/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { BusFront, Loader2, Minus, Plus, MapPin, Phone, UsersRound } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';
import { eventTransportSchema } from '@/validator/eventTransportSchema';

const idOf = (value) => String(value?._id || value || '');
const fromItem = (item = {}) => ({
  guest: idOf(item.guest), guestTravelling: item.guestTravelling ?? item.guestCount ?? 1,
  movementType: item.movementType ?? item.transferType ?? '', linkedFunction: idOf(item.linkedFunction),
  pickupLocatiion: item.pickupLocatiion ?? item.origin ?? '', dropLocation: item.dropLocation ?? item.destination ?? '',
  date: item.date?.slice(0, 10) || '', time: item.time || '', vehicle: idOf(item.vehicle), transportNote: item.transportNote ?? item.notes ?? '',
});

export default function EventTransportDialog({ open, onOpenChange, item, guests = [], vehicles = [], functions = [], allocations = [], properties = [], saving, onSave }) {
  const [form, setForm] = useState(fromItem);
  const [error, setError] = useState('');
  useEffect(() => { if (open) { setForm(fromItem(item || {})); setError(''); } }, [item, open]);
  const guest = guests.find((entry) => idOf(entry) === form.guest);
  const vehicle = vehicles.find((entry) => idOf(entry) === form.vehicle);
  const stays = allocations.filter((entry) => idOf(entry.guest) === form.guest && entry.status !== 'Cancelled');
  const guestProperties = properties.filter((property) => stays.some((stay) => idOf(stay.property) === idOf(property)));
  const memberCount = Number(guest?.memberCount || 0);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const selectGuest = (guestId) => { const selected = guests.find((entry) => idOf(entry) === guestId); setForm((current) => ({ ...current, guest: guestId, guestTravelling: selected?.memberCount || 1 })); };
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setError('');
    try {
      const payload = await eventTransportSchema.validate({ ...form, vehicle: form.vehicle || null, linkedFunction: form.linkedFunction || null }, { context: { memberCount }, stripUnknown: true });
      if (!guest || (payload.vehicle && !vehicle) || (payload.linkedFunction && !functions.some((fn) => idOf(fn) === payload.linkedFunction))) throw new Error('Select guest, function and vehicle records belonging to this event.');
      await onSave(payload);
    } catch (failure) { setError(failure.response?.data?.message || failure.message || 'Unable to save transport.'); }
  };

  return <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}><DialogContent className="flex max-h-[94dvh] w-[calc(100vw-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-lg p-0">
    <DialogHeader className="px-4 pb-3 pt-4 pr-12 text-left"><DialogTitle className="text-xl font-bold">{item?._id ? 'Edit Transport' : 'Add Transport'}</DialogTitle><DialogDescription className="text-xs">Assign a vehicle for guest pickup, drop or transfer for this event.</DialogDescription></DialogHeader>
    <form id="event-transport-form" onSubmit={submit} className="min-h-0 overflow-y-auto px-4 pb-4">
      <fieldset disabled={saving} className="space-y-3 [&_input]:h-9 [&_input]:text-xs">
        <section className="overflow-hidden rounded-md border border-border lg:grid lg:grid-cols-4">
          <div className="lg:col-span-3"><SectionHeading number="1" title="Guest & Requirement" description="Select the guest and transport details." />
            <div className="grid gap-3 p-3 sm:grid-cols-3">
              <Field id="transport-guest" label="Guest / Family" required><Choice id="transport-guest" value={form.guest} onChange={selectGuest} disabled={saving} placeholder="Select guest / family" options={guests.map((entry) => ({ value: idOf(entry), label: `${entry.name} (${entry.memberCount} Members)` }))} /></Field>
              <Field id="transport-members" label="Total Members"><Input id="transport-members" readOnly className="bg-muted" value={guest ? memberCount : ''} placeholder="ï¿½" /></Field>
              <Field id="transport-count" label="Guests Travelling" required><div className="flex rounded-md border border-input"><Input id="transport-count" className="min-w-0 border-0" type="number" min="1" max={memberCount || undefined} step="1" required value={form.guestTravelling} onChange={(event) => update('guestTravelling', event.target.value)} /><Button type="button" variant="ghost" size="icon" className="h-9 w-8 shrink-0" aria-label="Decrease guests travelling" disabled={!guest || Number(form.guestTravelling) <= 1} onClick={() => update('guestTravelling', Math.max(1, Number(form.guestTravelling) - 1))}><Minus className="h-3 w-3" /></Button><Button type="button" variant="ghost" size="icon" className="h-9 w-8 shrink-0" aria-label="Increase guests travelling" disabled={!guest || Number(form.guestTravelling) >= memberCount} onClick={() => update('guestTravelling', Math.min(memberCount, Number(form.guestTravelling) + 1))}><Plus className="h-3 w-3" /></Button></div><p className="text-[10px] text-muted-foreground">{guest ? `Max ${memberCount} members` : 'Select a guest first.'}</p></Field>
              <Field id="transport-movement" label="Movement Type" required><Choice id="transport-movement" value={form.movementType} placeholder="Select movement type" options={[...new Set(['Pickup', 'Drop', 'Guest Transfer', form.movementType].filter(Boolean))].map((value) => ({ value, label: value }))} disabled={saving} onChange={(value) => update('movementType', value)} /></Field>
              <div className="sm:col-span-2"><Field id="transport-function" label="Linked Function (Optional)"><Choice id="transport-function" value={form.linkedFunction || 'none'} onChange={(value) => update('linkedFunction', value === 'none' ? '' : value)} disabled={saving} options={[{ value: 'none', label: 'No linked function' }, ...functions.map((fn) => ({ value: idOf(fn), label: fn.name }))]} /><p className="text-[10px] text-muted-foreground">Useful for guest transfers between functions / venues.</p></Field></div>
            </div>
          </div>
          <aside className="space-y-3 border-t border-border bg-muted/30 p-3 text-xs lg:border-l lg:border-t-0"><h4 className="text-xs font-semibold">Guest Details</h4>{guest ? <><div className="flex gap-2"><UsersRound className="h-8 w-8 shrink-0 rounded-full bg-primary/10 p-2 text-primary" /><div><p className="font-semibold">{guest.name}</p><p className="text-muted-foreground">{memberCount} Members</p><p className="mt-1 flex items-center gap-1"><Phone className="h-3 w-3" />{guest.contact ? `${guest.countryCode || ''} ${guest.contact}` : 'No contact added'}</p></div></div><div className="space-y-1 border-t border-border pt-2"><p className="text-muted-foreground">Accommodation</p>{guestProperties.length ? guestProperties.map((property) => <div key={idOf(property)}><p className="font-semibold">{property.name}</p><p className="text-muted-foreground">{property.city || property.address}</p></div>) : <p>No accommodation allocated</p>}</div><div><p className="text-muted-foreground">Special Notes (from guest profile)</p><p className="mt-1 whitespace-pre-wrap break-words">{guest.specialRequirements || 'No special notes'}</p></div></> : <p className="text-muted-foreground">Select a guest to see their details.</p>}</aside>
        </section>
        <section className="overflow-hidden rounded-md border border-border"><SectionHeading number="2" title="Route & Schedule" description="Enter pickup and drop locations with date and time." /><div className="lg:grid lg:grid-cols-4"><div className="grid gap-3 p-3 sm:grid-cols-2 lg:col-span-3">
          <Field id="transport-pickup" label="Pickup Location" required><Input id="transport-pickup" required value={form.pickupLocatiion} placeholder="Enter pickup location" onChange={(event) => update('pickupLocatiion', event.target.value)} /></Field>
          <Field id="transport-drop" label="Drop Location" required><Input id="transport-drop" required value={form.dropLocation} placeholder="Enter drop location" onChange={(event) => update('dropLocation', event.target.value)} /></Field>
          <Field id="transport-date" label="Date" required><Input id="transport-date" type="date" min="0001-01-01" max="9999-12-31" required value={form.date} onChange={(event) => update('date', event.target.value)} /></Field>
          <Field id="transport-time" label="Time" required><Input id="transport-time" type="time" step="60" required value={form.time} onChange={(event) => update('time', event.target.value)} /></Field>
        </div><aside className="space-y-3 border-t border-border bg-muted/30 p-3 text-xs lg:border-l lg:border-t-0"><h4 className="font-semibold">Route Summary</h4><div className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><p className="text-[10px] text-muted-foreground">Pickup</p><p className="break-words font-medium">{form.pickupLocatiion.trim() || 'Pickup location pending'}</p></div></div><div className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><p className="text-[10px] text-muted-foreground">Drop</p><p className="break-words font-medium">{form.dropLocation.trim() || 'Drop location pending'}</p></div></div></aside></div></section>
        <section className="overflow-hidden rounded-md border border-border"><SectionHeading number="3" title="Vehicle Assignment" description="Assign a vehicle now or keep it pending for later." /><div className="space-y-3 p-3"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field id="transport-vehicle" label="Vehicle"><Choice id="transport-vehicle" value={form.vehicle || 'none'} onChange={(value) => update('vehicle', value === 'none' ? '' : value)} disabled={saving} options={[{ value: 'none', label: 'Assign Later (Keep Pending)' }, ...vehicles.map((entry) => ({ value: idOf(entry), label: entry.vehicleName ?? entry.name }))]} /></Field>
          <Field id="transport-registration" label="Vehicle Number"><Input id="transport-registration" readOnly className="bg-muted" value={vehicle?.registrationNo ?? vehicle?.registrationNumber ?? ''} placeholder="ï¿½" /></Field>
          <Field id="transport-driver" label="Driver Name"><Input id="transport-driver" readOnly className="bg-muted" value={vehicle?.driverName || ''} placeholder="ï¿½" /></Field>
          <Field id="transport-mobile" label="Driver Mobile"><Input id="transport-mobile" readOnly className="bg-muted" value={vehicle?.driverContactNo ?? vehicle?.driverContact ?? ''} placeholder="ï¿½" /></Field>
          <Field id="transport-alternate" label="Alternate Mobile"><Input id="transport-alternate" readOnly className="bg-muted" value={vehicle?.driverAlternateContactNo || ''} placeholder="ï¿½" /></Field>
        </div><Field id="transport-note" label="Transport Note (Optional)"><Textarea id="transport-note" maxLength={200} value={form.transportNote} onChange={(event) => update('transportNote', event.target.value)} className="min-h-16 text-xs md:text-xs" placeholder="e.g. Flight number, luggage details, special assistance" /><p className="text-right text-[10px] text-muted-foreground">{form.transportNote.length}/200</p></Field></div></section>
      </fieldset>
      {error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
    </form>
    <DialogFooter className="shrink-0 flex-row justify-between border-t border-border p-3 sm:justify-between"><Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="event-transport-form" disabled={saving || !guest}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BusFront className="h-4 w-4" />}{item?._id ? 'Save Changes' : 'Add Transport'}</Button></DialogFooter>
  </DialogContent></Dialog>;
}

function Field({ id, label, required, children }) { return <div className="min-w-0 space-y-1"><Label htmlFor={id} className="text-[11px] font-semibold">{label}{required && <span className="text-destructive"> *</span>}</Label>{children}</div>; }
function Choice({ id, value, options, placeholder, onChange, disabled }) { return <Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger id={id} className="h-9 text-xs"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>; }
function SectionHeading({ number, title, description }) { return <div className="flex items-center gap-3 bg-primary/[0.04] px-3 py-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{number}</span><div><h3 className="text-sm font-semibold">{title}</h3><p className="text-[11px] text-muted-foreground">{description}</p></div></div>; }

