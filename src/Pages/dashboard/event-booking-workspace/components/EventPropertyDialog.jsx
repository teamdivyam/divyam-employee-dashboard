/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Textarea } from '@components/components/ui/textarea';

const emptyForm = { name: '', address: '', contact: '', totalRooms: 0, roomTypesText: '', notes: '' };
const fromItem = (item) => item ? { name: item.name || '', address: item.address || '', contact: item.contact || '', totalRooms: item.totalRooms ?? 0, roomTypesText: (item.roomTypes || []).join(', '), notes: item.notes || '' } : emptyForm;

export default function EventPropertyDialog({ open, onOpenChange, item, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);
  useEffect(() => { if (open) setForm(fromItem(item)); }, [item, open]);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event) => {
    event.preventDefault();
    onSave({ name: form.name.trim(), address: form.address.trim() || undefined, contact: form.contact.trim() || undefined, totalRooms: Math.max(0, Number(form.totalRooms || 0)), roomTypes: form.roomTypesText.split(',').map((value) => value.trim()).filter(Boolean), notes: form.notes.trim() || undefined });
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg gap-0 overflow-hidden p-0 sm:rounded-xl"><DialogHeader className="border-b border-border bg-cyan-50/70 px-5 py-4 pr-12 text-left"><DialogTitle className="flex items-center gap-3 text-lg"><span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-100 text-cyan-700"><Building2 className="h-4 w-4" /></span>{item?._id ? 'Edit Property' : 'Add Property'}</DialogTitle><DialogDescription className="text-xs">Keep hotel details and available room types for this event.</DialogDescription></DialogHeader><form id="event-property-form" onSubmit={submit} className="space-y-4 p-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Property Name" required><Input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Hotel name" required /></Field><Field label="Total Rooms"><Input type="number" min="0" value={form.totalRooms} onChange={(event) => update('totalRooms', event.target.value)} /></Field><Field label="Contact"><Input value={form.contact} onChange={(event) => update('contact', event.target.value)} placeholder="Contact number" /></Field><Field label="Room Types"><Input value={form.roomTypesText} onChange={(event) => update('roomTypesText', event.target.value)} placeholder="Deluxe, Premium" /></Field></div><Field label="Address"><Input value={form.address} onChange={(event) => update('address', event.target.value)} placeholder="Property address" /></Field><Field label="Notes"><Textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} className="min-h-20" placeholder="Property instructions" /></Field></form><DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:space-x-0"><Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="event-property-form" size="sm" disabled={saving || !form.name.trim()} className="min-w-28 bg-blue-600 hover:bg-blue-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{item?._id ? 'Save Changes' : 'Add Property'}</Button></DialogFooter></DialogContent></Dialog>;
}

function Field({ label, required, children }) { return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</Label>{children}</div>; }
