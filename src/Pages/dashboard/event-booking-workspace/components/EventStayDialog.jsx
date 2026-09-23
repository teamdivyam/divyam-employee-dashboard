/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { BedDouble, Loader2, MapPin, Info, ChevronDown, X, CalendarDays, UserRound, UsersRound, Building2, DoorOpen, Clock3, FileText, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@components/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@components/components/ui/avatar';
import { Badge } from '@components/components/ui/badge';
import { Checkbox } from '@components/components/ui/checkbox';
import { Calendar } from '@components/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@components/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';
import { avatarUrl, initials, bookingCode, eventDateLabel } from '../eventBookingDashboard.utils';
import { StatusBadge } from './EventBookingComponents';
const idOf = (value) => String(value?._id || value || '');
const fromItem = (item = {}) => ({ guest: idOf(item.guest), property: idOf(item.property), guestCount: item.guestCount || 1, roomType: item.roomType || '', numberOfRooms: item.numberOfRooms || Math.max(1, item.roomNumbers?.length || 0), checkInDate: String(item.checkInDate || '').slice(0, 10), checkOutDate: String(item.checkOutDate || '').slice(0, 10), checkInTime: item.checkInTime || '', checkOutTime: item.checkOutTime || '', roomNumbers: (item.roomNumbers || []).map(Number), notes: item.notes || '' });
export default function EventStayDialog({ open, onOpenChange, item, booking, guests, properties, allocations = [], saving, onSave }) {
  const [form, setForm] = useState(() => fromItem());
  const [error, setError] = useState('');
  useEffect(() => { if (open) { setForm(fromItem(item || {})); setError(''); } }, [open, item]);
  const guest = guests.find((value) => idOf(value) === form.guest);
  const property = properties.find((value) => idOf(value) === form.property);
  const inventory = property?.roomInventory || [];
  const room = inventory.find((value) => value.roomType === form.roomType);
  const overlapping = allocations.filter((value) => idOf(value) !== idOf(item) && idOf(value.property) === form.property && value.status !== 'Cancelled' && form.checkInDate && form.checkOutDate && String(value.checkInDate).slice(0, 10) < form.checkOutDate && String(value.checkOutDate).slice(0, 10) > form.checkInDate);
  const reserved = new Set(overlapping.flatMap((value) => value.roomNumbers || []).map(Number));
  const changes = overlapping.filter((value) => value.roomType === form.roomType).flatMap((value) => {
    const count = Number(value.numberOfRooms || value.roomNumbers?.length || 0);
    return [{ date: String(value.checkInDate).slice(0, 10), count }, { date: String(value.checkOutDate).slice(0, 10), count: -count }];
  }).sort((a, b) => a.date.localeCompare(b.date) || a.count - b.count);
  let occupied = 0, peakOccupied = 0;
  changes.forEach((change) => { occupied += change.count; peakOccupied = Math.max(peakOccupied, occupied); });
  const availableCount = Math.max(0, Number(room?.roomsBlocked || 0) - peakOccupied);
  const update = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setError(''); };
  const submit = (event) => {
    event.preventDefault();
    if (saving) return;
    const payload = { ...form, guestCount: Number(form.guestCount), numberOfRooms: Number(form.numberOfRooms), notes: form.notes.trim() };
    if (!guest || !property || !room) return setError('Select a guest, property and room type.');
    if (!Number.isInteger(payload.guestCount) || payload.guestCount < 1 || payload.guestCount > Number(guest.memberCount || 1)) return setError('Guests staying must be between 1 and the total members.');
    if (!Number.isInteger(payload.numberOfRooms) || payload.numberOfRooms < 1 || payload.numberOfRooms > availableCount) return setError('Enter a valid number of available rooms.');
    if (payload.guestCount > payload.numberOfRooms * Number(room.maxGuestsPerRoom)) return setError('Increase the room count to accommodate all guests.');
    if (!payload.checkInDate || !payload.checkOutDate || payload.checkOutDate <= payload.checkInDate) return setError('Check-out date must be after check-in date.');
    if (payload.roomNumbers.length > payload.numberOfRooms || payload.roomNumbers.some((number) => reserved.has(number) || !(room.roomNumbers || []).map(Number).includes(number))) return setError('Select available room numbers within the requested room count.');
    if (item?._id) {
      const initial = fromItem(item);
      const changes = Object.fromEntries(Object.entries(payload).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(initial[key])));
      if (!Object.keys(changes).length) return setError('Make a change before saving.');
      onSave(changes);
    } else onSave(Object.fromEntries(Object.entries(payload).filter(([key, value]) => !['checkInTime', 'checkOutTime', 'notes'].includes(key) || value)));
  };
  const name = booking?.customer?.name || booking?.clientName || 'Client';
  const toggleRoom = (number) => update('roomNumbers', form.roomNumbers.includes(number) ? form.roomNumbers.filter((value) => value !== number) : [...form.roomNumbers, number]);
  return <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}><DialogContent className="flex max-h-[94dvh] w-[calc(100vw-1.5rem)] max-w-[840px] flex-col gap-0 overflow-hidden rounded-lg p-0">
    <DialogHeader className="px-4 pb-3 pt-4 pr-12 text-left"><DialogTitle className="text-xl font-bold">{item?._id ? 'Edit Stay Allocation' : 'Allocate Stay'}</DialogTitle><DialogDescription className="text-xs">Assign accommodation to a guest or family for this event.</DialogDescription></DialogHeader>
    <form id="event-stay-form" onSubmit={submit} className="min-h-0 space-y-3 overflow-y-auto px-3 pb-3">
      <div className="flex items-center gap-3 rounded-md border border-primary/10 bg-primary/[0.04] p-3"><Avatar className="h-12 w-12 rounded-md"><AvatarImage src={avatarUrl(booking?.customer)} /><AvatarFallback className="rounded-md bg-primary/10 font-semibold text-primary">{initials(name)}</AvatarFallback></Avatar><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{name}</p>{booking?.bookingStatus && <StatusBadge status={booking.bookingStatus} />}</div><p className="mt-1 text-[11px] text-muted-foreground">{bookingCode(booking || {})} &middot; {booking?.eventType || 'Event'} &middot; {eventDateLabel(booking || {}, { includeWeekday: true })}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" />{[booking?.venue, booking?.city].filter(Boolean).join(', ') || 'Venue pending'}</p></div></div>
      <fieldset disabled={saving} className="space-y-3 [&_input]:h-9 [&_input]:text-xs">
        <Section number="1" title="Guest & Stay Details" description="Select the guest/family and enter stay information."><div className="grid gap-4 sm:grid-cols-3"><Field id="stay-guest" label="Guest / Family" required><Select value={form.guest} disabled={saving} onValueChange={(value) => { const selected = guests.find((entry) => idOf(entry) === value); setForm((current) => ({ ...current, guest: value, guestCount: selected?.memberCount || 1 })); }}><StaySelectTrigger id="stay-guest" icon={UserRound} placeholder="Select guest" /><SelectContent>{guests.map((value) => <SelectItem key={idOf(value)} value={idOf(value)}><span className="block font-medium">{value.name}</span><span className="block text-[10px] text-muted-foreground">{value.memberCount || 1} Members{value.stayRequired ? ' · Stay Required' : ''}</span></SelectItem>)}</SelectContent></Select></Field><Field id="stay-total" label="Total Members"><IconField icon={UsersRound}><Input id="stay-total" readOnly className="bg-muted/50 pl-11" value={guest?.memberCount || ''} /></IconField><Help>From guest list (read-only).</Help></Field><Field id="stay-count" label="Guests Staying" required><StayNumber id="stay-count" icon={UsersRound} label="guests staying" max={guest?.memberCount || 1} disabled={saving} value={form.guestCount} onChange={(value) => update('guestCount', value)} /><Help>Enter number of members who will be staying.</Help></Field></div></Section>
        <Section number="2" title="Accommodation Details" description="Select the property and room allocation details."><div className="grid gap-4 sm:grid-cols-3"><Field id="stay-property" label="Property / Hotel" required><Select value={form.property} disabled={saving} onValueChange={(value) => setForm((current) => ({ ...current, property: value, roomType: '', roomNumbers: [], numberOfRooms: 1 }))}><StaySelectTrigger id="stay-property" icon={Building2} placeholder="Select property" /><SelectContent>{properties.map((value) => <SelectItem key={idOf(value)} value={idOf(value)}><span className="block font-medium">{value.name}</span><span className="block text-[10px] text-muted-foreground">{[value.address, value.city].filter(Boolean).join(', ') || 'Location not provided'}</span></SelectItem>)}</SelectContent></Select></Field><Field id="stay-type" label="Room Type" required><Select value={form.roomType} disabled={saving || !inventory.length} onValueChange={(value) => { const selected = inventory.find((entry) => entry.roomType === value); setForm((current) => ({ ...current, roomType: value, roomNumbers: [], numberOfRooms: Math.max(1, Math.ceil(Number(current.guestCount) / Number(selected.maxGuestsPerRoom))) })); }}><StaySelectTrigger id="stay-type" icon={BedDouble} placeholder="Select room type" /><SelectContent>{inventory.map((value) => <SelectItem key={value.roomType} value={value.roomType}><span className="block font-medium">{value.roomType}</span><span className="block text-[10px] text-muted-foreground">Max {value.maxGuestsPerRoom} guests per room</span></SelectItem>)}</SelectContent></Select></Field><Field id="stay-rooms" label="No. of Rooms" required><StayNumber id="stay-rooms" icon={DoorOpen} label="number of rooms"  disabled={saving} value={form.numberOfRooms} onChange={(value) => update('numberOfRooms', value)} /><Help>{room ? `${availableCount} rooms available for selected dates.` : 'Based on selected room type and guest count.'}</Help></Field></div></Section>
        <Section number="3" title="Stay Schedule" description="Select check-in and check-out dates and add optional details."><div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">{[['checkInDate', 'Check-in Date'], ['checkInTime', 'Check-in Time'], ['checkOutDate', 'Check-out Date'], ['checkOutTime', 'Check-out Time']].map(([key, label]) => <Field key={key} id={'stay-' + key} label={label} required={key.endsWith('Date')} optional={key.endsWith('Time')}>{key.endsWith('Date') ? <StayDate id={'stay-' + key} value={form[key]} disabled={saving} onChange={(value) => update(key, value)} /> : <IconField icon={Clock3}><Input id={'stay-' + key} className="pl-11" type="time" value={form[key]} onChange={(event) => update(key, event.target.value)} /></IconField>}</Field>)}</div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field id="stay-numbers" label="Room Number(s)" optional><div className="flex min-h-9 items-center gap-1 rounded-md border border-input px-2"><BedDouble className="h-4 w-4 shrink-0 text-muted-foreground" /><div className="flex flex-1 flex-wrap gap-1 py-1">{form.roomNumbers.map((number) => <Badge key={number} variant="secondary" className="gap-1 text-[10px]">{number}<Button type="button" variant="ghost" className="h-4 w-4 p-0" aria-label={'Remove room ' + number} onClick={() => toggleRoom(number)}><X className="!h-3 !w-3" /></Button></Badge>)}{!form.roomNumbers.length && <span className="text-[11px] text-muted-foreground">Select room number(s)</span>}</div><Popover modal><PopoverTrigger asChild><Button id="stay-numbers" type="button" variant="ghost" className="h-8 min-w-24 flex-1 justify-end px-2 text-[11px]" disabled={saving} aria-label="Select room numbers"><span>{room ? 'Select rooms' : 'Select room type first'}</span><ChevronDown /></Button></PopoverTrigger><PopoverContent className="max-h-60 w-52 overflow-auto p-3"><div className="space-y-2">{(room?.roomNumbers || []).map(Number).map((number) => <label key={number} className="flex items-center gap-2 text-xs"><Checkbox checked={form.roomNumbers.includes(number)} disabled={saving || reserved.has(number) || (!form.roomNumbers.includes(number) && form.roomNumbers.length >= Number(form.numberOfRooms))} onCheckedChange={() => toggleRoom(number)} />{number}{reserved.has(number) ? ' (Unavailable)' : ''}</label>)}{!room?.roomNumbers?.length && <p className="text-xs text-muted-foreground">{room ? 'No room numbers configured. Leave blank to assign later.' : 'Select a property and room type first.'}</p>}</div></PopoverContent></Popover></div><Help>Select from available rooms, or leave blank to assign later.</Help></Field><Field id="stay-notes" label="Room Preference / Special Requirement" optional><IconField icon={FileText}><Textarea id="stay-notes" rows={2} className="min-h-9 pl-11 text-xs md:text-xs" maxLength={200} value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="e.g. adjacent rooms, ground floor, non-smoking, early check-in" /></IconField><p className="text-right text-[10px] text-muted-foreground">{form.notes.length}/200</p></Field></div></Section>
      </fieldset><p className="flex items-center gap-2 rounded-md border border-primary/10 bg-primary/[0.04] p-3 text-[11px] text-primary"><Info className="h-4 w-4 shrink-0" />Room availability will be checked for the selected dates. Overlapping allocations are not allowed.</p>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </form><DialogFooter className="shrink-0 flex-row justify-between border-t border-border p-3 sm:justify-between"><Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="event-stay-form" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BedDouble className="h-4 w-4" />}{item?._id ? 'Save Changes' : 'Allocate Stay'}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
function Field({ id, label, required, optional, children }) { return <div className="min-w-0 space-y-1"><Label htmlFor={id} className="text-[11px] font-semibold">{label}{required && <span className="text-destructive"> *</span>}{optional && <span className="font-normal text-muted-foreground"> (Optional)</span>}</Label>{children}</div>; }
function Help({ children }) { return <p className="text-[10px] text-muted-foreground">{children}</p>; }
function Section({ number, title, description, children }) { return <section className="overflow-hidden rounded-md border border-primary/10"><div className="flex items-center gap-3 bg-primary/[0.04] px-3 py-2"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">{number}</span><div><h3 className="text-sm font-semibold">{title}</h3><Help>{description}</Help></div></div><div className="p-3">{children}</div></section>; }
function StayDate({ id, value, onChange, disabled }) { const [open, setOpen] = useState(false); const date = value ? parseISO(value) : undefined; return <Popover modal open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button id={id} type="button" variant="outline" disabled={disabled} className="h-9 w-full justify-start gap-2 text-xs"><CalendarDays className="h-4 w-4" />{date ? format(date, 'dd MMM yyyy') : 'Select date'}</Button></PopoverTrigger><PopoverContent align="start" className="w-auto p-0"><Calendar mode="single" selected={date} defaultMonth={date} initialFocus onSelect={(selected) => { onChange(selected ? format(selected, 'yyyy-MM-dd') : ''); setOpen(false); }} /></PopoverContent></Popover>; }

function IconField({ icon: Icon, children }) {
  return <div className="relative"><span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center border-r border-border text-muted-foreground"><Icon aria-hidden="true" className="h-4 w-4" /></span>{children}</div>;
}

function StaySelectTrigger({ id, icon: Icon, placeholder }) {
  return <SelectTrigger id={id} className="h-11 gap-2 pl-0 text-left text-xs [&>span]:line-clamp-none [&>span]:min-w-0 [&>span]:flex-1 [&>span]:whitespace-normal [&>svg]:shrink-0">
    <Icon aria-hidden="true" className="!h-11 !w-9 border-r border-border px-2.5 text-muted-foreground" />
    <SelectValue placeholder={placeholder} />
  </SelectTrigger>;
}

function StayNumber({ id, icon, label, value, max, disabled, onChange }) {
  const inputRef = useRef(null);
  const step = (direction) => {
    const input = inputRef.current;
    if (direction > 0) input.stepUp();
    else input.stepDown();
    onChange(input.value);
  };
  return <IconField icon={icon}>
    <Input ref={inputRef} id={id} type="number" min="1" max={max} step="1" required disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="pl-11 pr-9 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
    <div className="absolute inset-y-0 right-1 flex flex-col justify-center">
      <Button type="button" variant="ghost" className="h-4 w-7 rounded-sm p-0" aria-label={'Increase ' + label} aria-controls={id} disabled={disabled || (max != null && Number(value) >= max)} onClick={() => step(1)}><ChevronUp aria-hidden="true" className="!h-3 !w-3" /></Button>
      <Button type="button" variant="ghost" className="h-4 w-7 rounded-sm p-0" aria-label={'Decrease ' + label} aria-controls={id} disabled={disabled || Number(value) <= 1} onClick={() => step(-1)}><ChevronDown aria-hidden="true" className="!h-3 !w-3" /></Button>
    </div>
  </IconField>;
}

