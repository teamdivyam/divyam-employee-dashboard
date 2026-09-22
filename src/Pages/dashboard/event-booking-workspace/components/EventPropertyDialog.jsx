/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';

const propertyTypes = ['Hotel', 'Resort', 'Guest House', 'Apartment', 'Homestay', 'Other'];
const emptyForm = { name: '', propertyType: 'Hotel', city: '', address: '', contactPerson: '', contact: '', roomType: 'Deluxe Room', roomsBlocked: 1, maxGuestsPerRoom: 2, roomNumbersText: '' };
const fromItem = (item) => {
  if (!item) return emptyForm;
  const room = item.roomInventory?.[0] || {};
  return { name: item.name || '', propertyType: item.propertyType || 'Hotel', city: item.city || '', address: item.address || '', contactPerson: item.contactPerson || '', contact: item.contact || '', roomType: room.roomType || item.roomTypes?.[0] || 'Deluxe Room', roomsBlocked: room.roomsBlocked || item.totalRooms || 1, maxGuestsPerRoom: room.maxGuestsPerRoom || 2, roomNumbersText: (room.roomNumbers || []).join(', ') };
};

export default function EventPropertyDialog({ open, onOpenChange, item, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);
  useEffect(() => { if (open) setForm(fromItem(item)); }, [item, open]);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event) => {
    event.preventDefault();
    onSave({ name: form.name.trim(), propertyType: form.propertyType, city: form.city.trim(), address: form.address.trim(), contactPerson: form.contactPerson.trim(), contact: form.contact.trim(), roomInventory: [{ roomType: form.roomType.trim(), roomsBlocked: Math.max(1, Number(form.roomsBlocked || 1)), maxGuestsPerRoom: Math.max(1, Number(form.maxGuestsPerRoom || 1)), roomNumbers: form.roomNumbersText.split(',').map((value) => Number(value.trim())).filter(Number.isInteger) }] });
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="w-[calc(100vw-1.5rem)] max-w-xl gap-0 overflow-hidden p-0 sm:rounded-xl"><DialogHeader className="border-b border-border bg-cyan-50/70 px-5 py-4 pr-12 text-left"><DialogTitle className="flex items-center gap-3 text-lg"><span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-100 text-cyan-700"><Building2 className="h-4 w-4" /></span>{item?._id ? 'Edit Property' : 'Add Property'}</DialogTitle><DialogDescription className="text-xs">Keep hotel details and available room inventory for this event.</DialogDescription></DialogHeader><form id="event-property-form" onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto p-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Property Name" required><Input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Hotel name" required /></Field><Field label="Property Type" required><Select value={form.propertyType} onValueChange={(value) => update('propertyType', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{propertyTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></Field><Field label="City / Location" required><Input value={form.city} onChange={(event) => update('city', event.target.value)} required /></Field><Field label="Contact Person"><Input value={form.contactPerson} onChange={(event) => update('contactPerson', event.target.value)} /></Field><Field label="Contact"><Input value={form.contact} onChange={(event) => update('contact', event.target.value)} placeholder="Contact number" /></Field><Field label="Address"><Input value={form.address} onChange={(event) => update('address', event.target.value)} placeholder="Property address" /></Field><Field label="Room Type" required><Input value={form.roomType} onChange={(event) => update('roomType', event.target.value)} required /></Field><Field label="Rooms Blocked" required><Input type="number" min="1" value={form.roomsBlocked} onChange={(event) => update('roomsBlocked', event.target.value)} required /></Field><Field label="Max Guests / Room" required><Input type="number" min="1" value={form.maxGuestsPerRoom} onChange={(event) => update('maxGuestsPerRoom', event.target.value)} required /></Field><Field label="Room Numbers"><Input value={form.roomNumbersText} onChange={(event) => update('roomNumbersText', event.target.value)} placeholder="101, 102, 103" /></Field></div></form><DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:space-x-0"><Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="event-property-form" size="sm" disabled={saving || !form.name.trim() || !form.city.trim() || !form.roomType.trim()} className="min-w-28 bg-blue-600 hover:bg-blue-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{item?._id ? 'Save Changes' : 'Add Property'}</Button></DialogFooter></DialogContent></Dialog>;
}

function Field({ label, required, children }) { return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</Label>{children}</div>; }
