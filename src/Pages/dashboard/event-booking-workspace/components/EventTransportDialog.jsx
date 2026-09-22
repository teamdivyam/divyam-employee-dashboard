/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { BusFront, Loader2 } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';

const transferTypes = ['Airport Pickup', 'Airport Drop', 'Railway Pickup', 'Railway Drop', 'Venue Pickup', 'Venue Drop', 'Guest Transfer', 'Other'];
const idOf = (value) => String(value?._id || value || '');
const dateTimeValue = (value) => { if (!value) return ''; const date = new Date(value); if (Number.isNaN(date.getTime())) return ''; const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); };
const emptyForm = { guest: '', origin: '', destination: '', transferType: '', vehicle: '', scheduledAt: '', guestCount: 1, notes: '' };
const fromItem = (item) => item ? { guest: idOf(item.guest), origin: item.pickupLocatiion || item.origin || '', destination: item.dropLocation || item.destination || '', transferType: item.movementType || item.transferType || '', vehicle: idOf(item.vehicle), scheduledAt: item.date && item.time ? `${String(item.date).slice(0, 10)}T${item.time}` : dateTimeValue(item.scheduledAt), guestCount: item.guestTravelling || item.guestCount || 1, notes: item.transportNote || item.notes || '' } : emptyForm;

export default function EventTransportDialog({ open, onOpenChange, item, guests, vehicles, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);
  useEffect(() => { if (open) setForm(fromItem(item)); }, [item, open]);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const selectGuest = (guestId) => { const guest = guests.find((entry) => idOf(entry) === guestId); setForm((current) => ({ ...current, guest: guestId, guestCount: guest?.memberCount || current.guestCount })); };
  const submit = (event) => {
    event.preventDefault();
    const [date, time] = form.scheduledAt.split('T');
    onSave({
      guest: form.guest,
      guestTravelling: Math.max(1, Number(form.guestCount || 1)),
      movementType: form.transferType,
      pickupLocatiion: form.origin.trim(),
      dropLocation: form.destination.trim(),
      date,
      time,
      vehicle: form.vehicle || null,
      transportNote: form.notes.trim() || undefined,
    });
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl"><DialogHeader className="border-b border-border bg-emerald-50/70 px-5 py-4 pr-12 text-left"><DialogTitle className="flex items-center gap-3 text-lg"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700"><BusFront className="h-4 w-4" /></span>{item?._id ? 'Transport Details' : 'Add Transport'}</DialogTitle><DialogDescription className="text-xs">Assign a route, pickup/drop type, vehicle and schedule to a guest.</DialogDescription></DialogHeader><form id="event-transport-form" onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Guest / Family" required><Select value={form.guest} onValueChange={selectGuest}><SelectTrigger><SelectValue placeholder="Choose guest" /></SelectTrigger><SelectContent>{guests.map((guest) => <SelectItem key={idOf(guest)} value={idOf(guest)}>{guest.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Guests" required><Input type="number" min="1" value={form.guestCount} onChange={(event) => update('guestCount', event.target.value)} required /></Field><Field label="Pickup From" required><Input value={form.origin} onChange={(event) => update('origin', event.target.value)} placeholder="Airport, station, hotel" required /></Field><Field label="Drop At" required><Input value={form.destination} onChange={(event) => update('destination', event.target.value)} placeholder="Hotel or venue" required /></Field><Field label="Pickup / Drop" required><Select value={form.transferType || 'none'} onValueChange={(value) => update('transferType', value === 'none' ? '' : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Select type</SelectItem>{transferTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></Field><Field label="Vehicle"><Select value={form.vehicle || 'pending'} onValueChange={(value) => update('vehicle', value === 'pending' ? '' : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Not assigned</SelectItem>{vehicles.map((vehicle) => <SelectItem key={idOf(vehicle)} value={idOf(vehicle)}>{vehicle.name} {vehicle.registrationNumber ? `(${vehicle.registrationNumber})` : ''}</SelectItem>)}</SelectContent></Select></Field><Field label="Schedule" required><Input type="datetime-local" value={form.scheduledAt} onChange={(event) => update('scheduledAt', event.target.value)} required /></Field></div><Field label="Notes"><Textarea maxLength={200} value={form.notes} onChange={(event) => update('notes', event.target.value)} className="min-h-20" placeholder="Driver or coordination instructions" /></Field></form><DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:space-x-0"><Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="event-transport-form" size="sm" disabled={saving || !form.guest || !form.origin.trim() || !form.destination.trim() || !form.transferType || !form.scheduledAt} className="min-w-28 bg-blue-600 hover:bg-blue-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{item?._id ? 'Save Changes' : 'Add Transport'}</Button></DialogFooter></DialogContent></Dialog>;
}

function Field({ label, required, children }) { return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</Label>{children}</div>; }
